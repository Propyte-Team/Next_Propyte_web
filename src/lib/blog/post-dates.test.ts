import { describe, it, expect } from 'vitest';
import { resolvePostDates } from './post-dates';

describe('resolvePostDates', () => {
  it('aplana updated_at anterior a published_at (caso real de prod)', () => {
    // tulum-correccion-2025-2026: publicado 2026-07-20, updated_at 2026-07-14.
    const d = resolvePostDates({
      published_at: '2026-07-20T12:00:00.000Z',
      updated_at: '2026-07-14T09:00:00.000Z',
      created_at: '2026-07-10T00:00:00.000Z',
    });
    expect(d.modified).toBe('2026-07-20T12:00:00.000Z');
    expect(d.showModified).toBe(false);
  });

  it('muestra la actualización cuando cae un día después', () => {
    const d = resolvePostDates({
      published_at: '2026-07-20T12:00:00.000Z',
      updated_at: '2026-07-25T08:00:00.000Z',
      created_at: '2026-07-10T00:00:00.000Z',
    });
    expect(d.modified).toBe('2026-07-25T08:00:00.000Z');
    expect(d.showModified).toBe(true);
  });

  it('no muestra actualización el mismo día calendario', () => {
    const d = resolvePostDates({
      published_at: '2026-07-20T06:00:00.000Z',
      updated_at: '2026-07-20T23:30:00.000Z',
      created_at: '2026-07-10T00:00:00.000Z',
    });
    expect(d.showModified).toBe(false);
    expect(d.modified).toBe('2026-07-20T23:30:00.000Z');
  });

  it('cae a created_at cuando falta published_at', () => {
    const d = resolvePostDates({
      published_at: null,
      updated_at: null,
      created_at: '2026-06-01T00:00:00.000Z',
    });
    expect(d.published).toBe('2026-06-01T00:00:00.000Z');
    expect(d.modified).toBe('2026-06-01T00:00:00.000Z');
    expect(d.showModified).toBe(false);
  });

  it('dateModified nunca queda antes de datePublished', () => {
    const cases = [
      { published_at: '2026-01-02T00:00:00.000Z', updated_at: '2025-12-31T00:00:00.000Z', created_at: '2025-12-01T00:00:00.000Z' },
      { published_at: '2026-07-24T00:00:00.000Z', updated_at: '2026-07-21T00:00:00.000Z', created_at: '2026-07-01T00:00:00.000Z' },
    ];
    for (const c of cases) {
      const d = resolvePostDates(c);
      expect(new Date(d.modified).getTime()).toBeGreaterThanOrEqual(new Date(d.published).getTime());
    }
  });
});
