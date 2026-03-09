import { NextResponse } from "next/server";

import {
  authenticateUser,
  type SessionRole,
  withSessionCookie,
} from "@/lib/auth";
import { appendAuditEvent } from "@/lib/clinical-store";

interface LoginPayload {
  email: string;
  password: string;
  role: SessionRole;
}

export async function POST(request: Request) {
  let body: LoginPayload;

  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  if (!body?.email || !body?.password || !body?.role) {
    return NextResponse.json({ error: "Credenciales incompletas" }, { status: 400 });
  }

  const user = authenticateUser(body.email, body.password, body.role);

  if (!user) {
    return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  }

  appendAuditEvent({
    actorName: user.name,
    actorRole: user.role,
    action: "LOGIN_SUCCESS",
    targetType: "auth",
    targetId: user.id,
    detail: "Inicio de sesion exitoso.",
  });

  const destination = user.role === "institution" ? "/portal/institution" : "/portal/professional";
  const response = NextResponse.json({
    ok: true,
    user,
    redirectTo: destination,
  });

  return withSessionCookie(response, user);
}
