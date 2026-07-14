import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { parseBanxicoPayload, fetchUsdMxnRate, FALLBACK } from './fetchUsdMxnRate';

// Mocked by exact specifier — Vitest substitutes this module wherever it's
// imported (this test file and fetchUsdMxnRate.ts) without needing real
// on-disk alias resolution for '@/lib/supabase/public'.
vi.mock('@/lib/supabase/public', () => ({
  createPublicSupabaseClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createPublicSupabaseClient);

/** Builds a Supabase client stub matching the .from().select().eq().order().limit() chain. */
function makeSupabaseStub(rows: Array<{ rate: number; date: string }> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe('parseBanxicoPayload', () => {
  it('parses a valid Banxico payload', () => {
    const json = {
      bmx: { series: [{ datos: [{ fecha: '10/07/2026', dato: '18.55' }] }] },
    };
    expect(parseBanxicoPayload(json)).toEqual({ rate: 18.55, date: '2026-07-10' });
  });

  it('returns null for an empty series', () => {
    const json = { bmx: { series: [] } };
    expect(parseBanxicoPayload(json)).toBeNull();
  });

  it('returns null for a non-numeric dato', () => {
    const json = {
      bmx: { series: [{ datos: [{ fecha: '10/07/2026', dato: 'N/E' }] }] },
    };
    expect(parseBanxicoPayload(json)).toBeNull();
  });
});

describe('fetchUsdMxnRate fallback order', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockedCreateClient.mockReset();
  });

  it('falls back to the stored Supabase rate when Banxico fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    mockedCreateClient.mockReturnValue(
      makeSupabaseStub([{ rate: 18.9, date: '2026-07-13' }]) as unknown as ReturnType<
        typeof createPublicSupabaseClient
      >
    );

    const result = await fetchUsdMxnRate();
    expect(result).toEqual({ rate: 18.9, date: '2026-07-13', fresh: false });
  });

  it('falls back to the hardcoded FALLBACK when Banxico fails and no stored rate exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    mockedCreateClient.mockReturnValue(
      makeSupabaseStub(null) as unknown as ReturnType<typeof createPublicSupabaseClient>
    );

    const result = await fetchUsdMxnRate();
    expect(result).toEqual(FALLBACK);
    expect(result).toEqual({ rate: 17.24, date: '2026-04-01', fresh: false });
  });
});
