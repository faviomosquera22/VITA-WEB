insert into public.institutions (name, code, is_active)
values ('EcotecClinic', 'ECOTECCLINIC', true)
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  updated_at = now();
