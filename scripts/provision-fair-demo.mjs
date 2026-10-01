// Run with: node --env-file=.env.local --env-file=.env.demo.local scripts/provision-fair-demo.mjs
// DEMO_PASSWORD is supplied locally; credentials are never checked into the repository.
import { createClient } from "@supabase/supabase-js";
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 8)
  throw new Error("Set DEMO_PASSWORD (at least 8 characters)");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data: institution, error: institutionError } = await db
  .from("institutions")
  .upsert(
    {
      code: "VITA-FERIA-2026",
      name: "VITA · Feria 2026 (demostración)",
      is_active: true,
    },
    { onConflict: "code" },
  )
  .select("id")
  .single();
if (institutionError) throw institutionError;
for (const account of [
  {
    email: "fabio.mosquera@demo.vita.test",
    name: "Fabio Mosquera",
    role: "professional",
  },
  {
    email: "pantalla@demo.vita.test",
    name: "Pantalla institucional · Feria",
    role: "institution",
  },
]) {
  const { data: profile, error: lookupError } = await db
    .from("profiles")
    .select("id,institution_id,role")
    .eq("email", account.email)
    .maybeSingle();
  if (lookupError) throw lookupError;
  let userId = profile?.id;
  if (
    profile &&
    (profile.institution_id !== institution.id || profile.role !== account.role)
  )
    throw new Error("Existing account does not belong to this demo; stopped");
  if (!userId) {
    const { data, error } = await db.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.name, demo: true },
    });
    if (error) throw error;
    userId = data.user.id;
  }
  const { error } = await db
    .from("profiles")
    .update({
      full_name: account.name,
      role: account.role,
      institution_id: institution.id,
      is_active: true,
    })
    .eq("id", userId);
  if (error) throw error;
  console.log(`Ready: ${account.role} ${account.email}`);
}
