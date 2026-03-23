create table if not exists clinical_surveillance_observations (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null,
  patient_id text not null,
  patient_name text not null,
  priority text not null check (priority in ('critical', 'high', 'medium', 'informative')),
  title text not null,
  description text not null,
  source_modules jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'acknowledged', 'dismissed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  narrative_source text not null default 'rules' check (narrative_source in ('rules', 'ai_adapter'))
);

create index if not exists clinical_surveillance_observations_patient_idx
  on clinical_surveillance_observations (patient_id, status, priority);

create index if not exists clinical_surveillance_observations_dedupe_idx
  on clinical_surveillance_observations (dedupe_key, status);

create table if not exists clinical_surveillance_triggered_rules (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references clinical_surveillance_observations(id) on delete cascade,
  rule_id text not null,
  rule_name text not null,
  priority text not null check (priority in ('critical', 'high', 'medium', 'informative')),
  description text not null,
  source_modules jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  triggered_at timestamptz not null
);

create index if not exists clinical_surveillance_triggered_rules_observation_idx
  on clinical_surveillance_triggered_rules (observation_id);

create table if not exists clinical_surveillance_audit_log (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references clinical_surveillance_observations(id) on delete cascade,
  action text not null check (action in ('generated', 'regenerated', 'acknowledged', 'dismissed', 'resolved')),
  actor_name text not null,
  actor_role text not null,
  detail text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists clinical_surveillance_audit_log_observation_idx
  on clinical_surveillance_audit_log (observation_id, created_at desc);
