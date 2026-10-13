-- Provision the vendor profile and business atomically after Supabase Auth signup.
-- Only the server-side service role may call this function. Never grant it to anon/authenticated.

create or replace function public.provision_vendor_account(
  p_user_id uuid,
  p_business_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vendor_id uuid;
begin
  if p_user_id is null then
    raise exception 'Invalid account.';
  end if;

  if p_business_name is null
     or length(btrim(p_business_name)) < 1
     or length(btrim(p_business_name)) > 120 then
    raise exception 'Business name must be between 1 and 120 characters.';
  end if;

  if p_slug is null
     or length(p_slug) < 1
     or length(p_slug) > 80
     or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid business URL.';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'Account not found.';
  end if;

  -- Fixed role and platform-controlled defaults: caller cannot choose privileges.
  insert into public.profiles (id, role, full_name)
  values (p_user_id, 'vendor', btrim(p_business_name))
  on conflict (id) do nothing;

  -- Never attach a vendor business to a privileged or otherwise non-vendor profile.
  if exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.role <> 'vendor'
  ) then
    raise exception 'This account cannot be registered as a vendor.';
  end if;

  -- Do not silently attach a second business or overwrite an existing account.
  if exists (select 1 from public.vendors v where v.owner_id = p_user_id) then
    raise exception 'A business is already registered for this account.';
  end if;

  insert into public.vendors (owner_id, name, slug, status, plan, platform_fee_percent)
  values (p_user_id, btrim(p_business_name), p_slug, 'active', 'free', 5.00)
  returning id into v_vendor_id;

  return v_vendor_id;
end;
$$;

revoke all on function public.provision_vendor_account(uuid, text, text) from public;
revoke all on function public.provision_vendor_account(uuid, text, text) from anon, authenticated;
grant execute on function public.provision_vendor_account(uuid, text, text) to service_role;
