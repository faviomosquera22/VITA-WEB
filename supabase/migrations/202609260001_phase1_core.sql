create extension if not exists pgcrypto;

do $$ begin
  create type public.vita_account_role as enum ('patient', 'professional', 'institution');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.vita_triage_color as enum ('rojo', 'naranja', 'amarillo', 'verde', 'azul');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.vita_case_status as enum ('pendiente', 'en_atencion', 'finalizado');
exception when duplicate_object then null;
end $$;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.vita_account_role not null default 'patient',
  institution_id uuid references public.institutions(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique check (length(token_hash) = 64),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists user_sessions_user_id_idx on public.user_sessions(user_id);
create index if not exists user_sessions_active_idx on public.user_sessions(token_hash, expires_at)
  where revoked_at is null;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  institution_id uuid references public.institutions(id) on delete set null,
  document_type text not null default 'cedula',
  document_number text,
  full_name text not null,
  birth_date date,
  age_years integer check (age_years between 0 and 130),
  sex text,
  phone text,
  last_triage_color public.vita_triage_color,
  last_triage_reason text,
  last_triage_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, document_type, document_number)
);
create index if not exists patients_owner_idx on public.patients(owner_user_id);
create index if not exists patients_institution_idx on public.patients(institution_id);

create table if not exists public.triage_cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  institution_id uuid references public.institutions(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  patient_name text not null,
  age_years integer not null check (age_years between 0 and 130),
  reason text not null,
  origin text not null check (origin in ('app', 'web')),
  status public.vita_case_status not null default 'pendiente',
  triage_color public.vita_triage_color not null,
  triage_priority integer check (triage_priority between 1 and 5),
  room text,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  engine_version text not null default 'legacy-v1',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, idempotency_key)
);
create index if not exists triage_cases_patient_idx on public.triage_cases(patient_id, created_at desc);
create index if not exists triage_cases_institution_idx on public.triage_cases(institution_id, created_at desc);
create index if not exists triage_cases_priority_idx on public.triage_cases(triage_color, status, created_at);

create table if not exists public.triage_events (
  id uuid primary key default gen_random_uuid(),
  triage_case_id uuid not null references public.triage_cases(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null,
  from_status public.vita_case_status,
  to_status public.vita_case_status,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists triage_events_case_idx on public.triage_events(triage_case_id, created_at);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  actor_role public.vita_account_role not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  detail text not null,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_institution_idx on public.audit_events(institution_id, created_at desc);
create index if not exists audit_events_actor_idx on public.audit_events(actor_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists institutions_set_updated_at on public.institutions;
create trigger institutions_set_updated_at before update on public.institutions
for each row execute function public.set_updated_at();
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at before update on public.patients
for each row execute function public.set_updated_at();
drop trigger if exists triage_cases_set_updated_at on public.triage_cases;
create trigger triage_cases_set_updated_at before update on public.triage_cases
for each row execute function public.set_updated_at();

create or replace function public.handle_new_vita_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'Usuario'), '@', 1)),
    'patient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_vita_user();

create or replace function public.current_vita_role()
returns public.vita_account_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;
create or replace function public.current_vita_institution_id()
returns uuid language sql stable security definer set search_path = public as $$
  select institution_id from public.profiles where id = auth.uid() and is_active = true;
$$;

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_sessions enable row level security;
alter table public.patients enable row level security;
alter table public.triage_cases enable row level security;
alter table public.triage_events enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.institutions, public.profiles, public.user_sessions,
  public.patients, public.triage_cases, public.triage_events, public.audit_events
from anon, authenticated;
grant all on table public.institutions, public.profiles, public.user_sessions,
  public.patients, public.triage_cases, public.triage_events, public.audit_events
to service_role;
grant select on table public.institutions, public.profiles, public.patients,
  public.triage_cases, public.triage_events, public.audit_events to authenticated;
grant insert, update on table public.patients, public.triage_cases to authenticated;

drop policy if exists institutions_visible_to_members on public.institutions;
create policy institutions_visible_to_members on public.institutions for select to authenticated
using (id = public.current_vita_institution_id());

drop policy if exists profiles_visible_to_owner_or_institution on public.profiles;
create policy profiles_visible_to_owner_or_institution on public.profiles for select to authenticated
using (
  id = auth.uid() or (
    institution_id is not null
    and institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
);

drop policy if exists patients_visible_to_owner_or_institution on public.patients;
create policy patients_visible_to_owner_or_institution on public.patients for select to authenticated
using (
  owner_user_id = auth.uid() or (
    institution_id is not null
    and institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
);
drop policy if exists patients_insert_by_owner_or_institution on public.patients;
create policy patients_insert_by_owner_or_institution on public.patients for insert to authenticated
with check (
  owner_user_id = auth.uid() or (
    institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
);
drop policy if exists patients_update_by_owner_or_institution on public.patients;
create policy patients_update_by_owner_or_institution on public.patients for update to authenticated
using (
  owner_user_id = auth.uid() or (
    institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
)
with check (
  owner_user_id = auth.uid() or (
    institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
);

drop policy if exists triage_cases_visible_to_patient_or_institution on public.triage_cases;
create policy triage_cases_visible_to_patient_or_institution on public.triage_cases for select to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.patients p
    where p.id = patient_id and p.owner_user_id = auth.uid()
  )
  or (
    institution_id is not null
    and institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
);
drop policy if exists triage_cases_insert_by_authenticated_owner on public.triage_cases;
create policy triage_cases_insert_by_authenticated_owner on public.triage_cases for insert to authenticated
with check (
  created_by = auth.uid()
  and (institution_id is null or institution_id = public.current_vita_institution_id())
);
drop policy if exists triage_cases_update_by_institution on public.triage_cases;
create policy triage_cases_update_by_institution on public.triage_cases for update to authenticated
using (
  institution_id = public.current_vita_institution_id()
  and public.current_vita_role() in ('professional', 'institution')
)
with check (
  institution_id = public.current_vita_institution_id()
  and public.current_vita_role() in ('professional', 'institution')
);

drop policy if exists triage_events_visible_with_case on public.triage_events;
create policy triage_events_visible_with_case on public.triage_events for select to authenticated
using (
  exists (
    select 1 from public.triage_cases c
    where c.id = triage_case_id and (
      c.created_by = auth.uid()
      or exists (
        select 1 from public.patients p
        where p.id = c.patient_id and p.owner_user_id = auth.uid()
      )
      or (
        c.institution_id = public.current_vita_institution_id()
        and public.current_vita_role() in ('professional', 'institution')
      )
    )
  )
);

drop policy if exists audit_events_visible_to_actor_or_institution on public.audit_events;
create policy audit_events_visible_to_actor_or_institution on public.audit_events for select to authenticated
using (
  actor_id = auth.uid() or (
    institution_id = public.current_vita_institution_id()
    and public.current_vita_role() in ('professional', 'institution')
  )
);
