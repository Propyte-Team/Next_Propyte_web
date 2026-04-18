-- ============================================================
-- Fix: profiles RLS policy infinite recursion
-- The "profiles_admin_manage" policy queries profiles table
-- to check if user is admin, causing infinite recursion.
-- ============================================================

-- Drop the recursive policy
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;

-- Drop the old duplicate from 001 migration
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Recreate admin policy without recursion
-- Uses auth.uid() = id for self-access, no subquery on profiles
CREATE POLICY "profiles_admin_manage" ON public.profiles
  FOR ALL USING (
    auth.uid() = id
  );

-- Keep the existing policies that don't cause recursion:
-- profiles_auth_read: FOR SELECT USING (auth.uid() IS NOT NULL)
-- profiles_own_update: FOR UPDATE USING (auth.uid() = id)
-- profiles_service_role: FOR ALL USING (auth.role() = 'service_role')
