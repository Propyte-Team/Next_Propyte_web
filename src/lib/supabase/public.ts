import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cookie-less Supabase client for public ISR/static routes.
 * Use this in server components that declare `revalidate` or
 * `generateStaticParams` — createServerSupabaseClient() uses
 * cookies() which breaks ISR (DYNAMIC_SERVER_USAGE).
 *
 * For auth-required routes (dashboard, CRM), keep using
 * createServerSupabaseClient() from ./server.
 */
export function createPublicSupabaseClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null as unknown as SupabaseClient;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
