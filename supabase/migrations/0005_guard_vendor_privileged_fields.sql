-- Vendor owners may edit business presentation details, but cannot transfer
-- ownership or change platform-controlled account/fee fields through the
-- ordinary authenticated table API. Service-role maintenance remains trusted.
create or replace function public.guard_vendor_privileged_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Trusted server/service-role operations have no end-user auth.uid().
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.owner_id is distinct from auth.uid()
       or new.status is distinct from 'active'
       or new.plan is distinct from 'free'
       or new.platform_fee_percent is distinct from 5.00 then
      raise exception 'Vendor ownership, status, plan and platform fee are managed by the platform.';
    end if;
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id
     or new.status is distinct from old.status
     or new.plan is distinct from old.plan
     or new.platform_fee_percent is distinct from old.platform_fee_percent then
    raise exception 'Vendor ownership, status, plan and platform fee are managed by the platform.';
  end if;

  return new;
end;
$$;

drop trigger if exists vendors_guard_privileged_fields on public.vendors;
create trigger vendors_guard_privileged_fields
before insert or update on public.vendors
for each row execute function public.guard_vendor_privileged_fields();
