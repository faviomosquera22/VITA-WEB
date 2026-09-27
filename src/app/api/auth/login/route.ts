import { type NextRequest, NextResponse } from "next/server";

import {
  authenticateUser,
  type SessionRole,
  withSessionCookie,
} from "@/lib/auth";
import { recordAuditEvent } from "@/lib/repositories/audit-repository";
import { consumeRateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface LoginPayload {
  email: string;
  password: string;
  role: SessionRole;
  client?: "web" | "ios";
}

function isSessionRole(value: string): value is SessionRole {
  return value === "patient" || value === "professional" || value === "institution";
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rateLimit = consumeRateLimit(`auth:${forwardedFor || "unknown"}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intente nuevamente en unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  let body: LoginPayload;

  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  if (!body?.email || !body?.password || !body?.role || !isSessionRole(body.role)) {
    return NextResponse.json({ error: "Credenciales incompletas" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "El servicio de identidad VITA aun no esta configurado." },
      { status: 503 }
    );
  }

  try {
    const authenticated = await authenticateUser(body.email, body.password, body.role);

    if (!authenticated) {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    const { user, sessionToken, expiresAt } = authenticated;
    await recordAuditEvent(user, {
      action: "LOGIN_SUCCESS",
      targetType: "auth",
      targetId: user.id,
      detail: "Inicio de sesion exitoso.",
    });

    const destination =
      user.role === "institution"
        ? "/portal/institution"
        : user.role === "professional"
          ? "/portal/professional"
          : "/";
    const response = NextResponse.json({
      ok: true,
      user,
      ...(body.client === "ios" ? { sessionToken } : {}),
      expiresAt,
      redirectTo: destination,
    });

    return withSessionCookie(response, sessionToken, expiresAt);
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar sesion en VITA." },
      { status: 503 }
    );
  }
}
