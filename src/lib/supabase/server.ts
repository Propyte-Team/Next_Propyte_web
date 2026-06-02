import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type ServerClient = ReturnType<typeof createServerClient>;

export async function createServerSupabaseClient(): Promise<ServerClient> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null as unknown as ServerClient; // Supabase not configured — callers must handle null
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
    },
  );
}

/**
 * Crea un cliente Supabase con la **service role key** — BYPASS de RLS.
 *
 * ⚠️ SEGURIDAD — leer antes de usar:
 *   - SOLO en código server-side (route handlers / cron). Nunca importar desde
 *     componentes con `"use client"` ni desde código que se evalúe en el browser.
 *   - **NO** lo uses para `SELECT` filtrado por input del usuario sin validación
 *     adicional — esquiva todas las policies RLS. Para lecturas user-driven usa
 *     `createServerSupabaseClient()` (anon + RLS).
 *   - Casos de uso aceptados: `INSERT` a `leads` (RLS bloquea anon), retries de
 *     `propyte_sync_log` desde el cron, y endpoints internos con secret guard.
 *   - Cada llamada nueva debe pasar revisión de código explícita.
 *
 * Ref: Cyber Neo audit 2026-05-25, finding CN-010.
 */
export async function createServiceRoleClient() {
  const { createClient } = await import('@supabase/supabase-js');
  type SbClient = ReturnType<typeof createClient>;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null as unknown as SbClient;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
