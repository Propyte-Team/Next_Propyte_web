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
