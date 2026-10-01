import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import {
  createSupabaseAuthClient,
  getSupabaseServiceClient,
} from "@/lib/supabase/server";

export type SessionRole = "patient" | "professional" | "institution";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  centerName: string;
  institutionId: string | null;
}

interface StoredProfile {
  id: string;
  email: string;
  full_name: string;
  role: SessionRole;
  institution_id: string | null;
  is_active: boolean;
}

export interface AuthenticatedUser {
  user: SessionUser;
  sessionToken: string;
  expiresAt: string;
}

export const SESSION_COOKIE_NAME = "vita_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function makeSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function loadProfile(userId: string): Promise<SessionUser | null> {
  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("id,email,full_name,role,institution_id,is_active")
    .eq("id", userId)
    .maybeSingle<StoredProfile>();

  if (error) {
    throw new Error(`No se pudo consultar el perfil: ${error.message}`);
  }
  if (!data || !data.is_active) {
    return null;
  }

  let centerName = "VITA";
  if (data.institution_id) {
    const { data: institution } = await service
      .from("institutions")
      .select("name")
      .eq("id", data.institution_id)
      .maybeSingle<{ name: string }>();
    centerName = institution?.name ?? centerName;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.full_name,
    role: data.role,
    centerName,
    institutionId: data.institution_id,
  };
}

async function createApplicationSession(user: SessionUser): Promise<AuthenticatedUser> {
  const service = getSupabaseServiceClient();
  const sessionToken = makeSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const { error } = await service.from("user_sessions").insert({
    user_id: user.id,
    token_hash: hashSessionToken(sessionToken),
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`No se pudo crear la sesion: ${error.message}`);
  }

  return { user, sessionToken, expiresAt };
}

export async function authenticateUser(
  email: string,
  password: string,
  expectedRole: SessionRole
): Promise<AuthenticatedUser | null> {
  const authClient = createSupabaseAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return null;
  }

  const profile = await loadProfile(data.user.id);
  if (!profile || profile.role !== expectedRole) {
    return null;
  }

  return createApplicationSession(profile);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  const service = getSupabaseServiceClient();
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();
  const { data, error } = await service
    .from("user_sessions")
    .select("user_id,expires_at,revoked_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle<{ user_id: string; expires_at: string; revoked_at: string | null }>();

  if (error || !data) {
    return null;
  }

  void service
    .from("user_sessions")
    .update({ last_seen_at: now })
    .eq("token_hash", tokenHash);

  return loadProfile(data.user_id);
}

function requestSessionToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getRequestSession(request: NextRequest) {
  const token = requestSessionToken(request);
  if (!token) {
    return null;
  }
  try {
    const session = await verifySessionToken(token);
    const institutionRoutes = ["/api/institution/monitor", "/api/auth/session", "/api/auth/logout"];
    if (session?.role === "institution" && !institutionRoutes.includes(request.nextUrl.pathname)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function revokeRequestSession(request: NextRequest) {
  const token = requestSessionToken(request);
  if (!token) {
    return;
  }

  try {
    const service = getSupabaseServiceClient();
    await service
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashSessionToken(token));
  } catch {
    // The cookie is still cleared locally if the identity service is unavailable.
  }
}

export function withSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: string
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
