# VITA phase 1: persistent backend setup

This phase replaces hard-coded portal accounts and the temporary case store with
Supabase Auth and PostgreSQL. Do not use real patient information until the
production privacy, legal, backup, and incident-response controls are approved.

## 1. Create the Supabase project

Create one project for production and a separate project for development. Keep
the service-role key server-side only. It must never be added to the iOS app or
to browser JavaScript.

## 2. Apply the database migration

Run the SQL in:

`supabase/migrations/202609260001_phase1_core.sql`

The migration creates institutions, profiles, revocable sessions, patients,
triage cases, case events, and audit events. It enables row-level security and
does not grant anonymous access.

## 3. Configure environment variables

Copy the names from `.env.example` into `.env.local` for development and
into the Vercel project settings for production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

After deployment, `GET /api/health` must return:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## 4. Create the institution and authorized accounts

Create users in Supabase Auth. New accounts are always created as patients to
prevent role escalation. A database administrator must explicitly assign a
professional or institution role and its institution.

Example, replacing every placeholder:

```sql
insert into public.institutions (name, code)
values ('Hospital autorizado', 'HOSPITAL-001')
returning id;

update public.profiles
set
  role = 'professional',
  institution_id = 'INSTITUTION_UUID',
  full_name = 'Nombre del profesional'
where id = 'AUTH_USER_UUID';
```

Use `role = 'institution'` only for the institutional administrator. Never
share one account between multiple professionals.

## 5. Validate the flow

1. Log in through `/portal/login`.
2. Confirm that `/api/auth/session` returns the authenticated profile.
3. Create a case with `POST /api/cases`.
4. Confirm that it remains available after a new deployment.
5. Confirm that another institution cannot list the case.
6. Log out and confirm the session token can no longer access `/api/cases`.

When the login request declares `client: "ios"`, the response includes an
opaque `sessionToken`. The iOS app will store it in Keychain and send it as
`Authorization: Bearer <token>`. Web logins receive only the protected cookie,
and only token hashes are stored in PostgreSQL.
