-- Security foundation: prevent self-service privilege escalation.
-- Apply through the project's reviewed migration process; do not run against
-- production until the coordinated release has been tested.

drop policy if exists "profiles: self insert" on public.profiles;
drop policy if exists "profiles: self update" on public.profiles;

-- New authenticated users may create only their own ordinary vendor profile.
-- Platform-admin roles must be assigned through a trusted administrative path.
create policy "profiles: self insert vendor only"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and role = 'vendor'
  );

-- Intentionally do not grant users a direct UPDATE policy on profiles.
-- No profile-editing feature currently requires this permission. Privileged
-- role maintenance must use a trusted server-side process or SQL migration.
