import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseEnvironment {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
}

let serviceClient: SupabaseClient | null = null;

function readEnvironment(): SupabaseEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !publishableKey || !serviceRoleKey) {
    throw new Error(
      "Supabase no esta configurado. Defina NEXT_PUBLIC_SUPABASE_URL, " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY y SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, publishableKey, serviceRoleKey };
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
      ) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function createSupabaseAuthClient() {
  const environment = readEnvironment();
  return createClient(environment.url, environment.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function getSupabaseServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  const environment = readEnvironment();
  serviceClient = createClient(environment.url, environment.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return serviceClient;
}

export async function checkSupabaseConnection() {
  const client = getSupabaseServiceClient();
  const startedAt = Date.now();
  const { error } = await client.from("institutions").select("id").limit(1);

  if (error) {
    throw new Error(`No se pudo consultar la base VITA: ${error.message}`);
  }

  return { latencyMs: Math.max(1, Date.now() - startedAt) };
}
