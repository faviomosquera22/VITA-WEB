import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export type SessionRole = "professional" | "institution";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  centerName: string;
}

interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  centerName: string;
  exp: number;
}

interface DemoUser extends SessionUser {
  password: string;
}

export const SESSION_COOKIE_NAME = "vita_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12h

const demoUsers: DemoUser[] = [
  {
    id: "u-prof-1",
    email: "profesional@vita.local",
    password: "VitaDemo2026!",
    name: "Lic. Daniela Naranjo",
    role: "professional",
    centerName: "Hospital General Norte",
  },
  {
    id: "u-inst-1",
    email: "institucion@vita.local",
    password: "VitaDemo2026!",
    name: "Coordinacion Operativa",
    role: "institution",
    centerName: "Hospital General Norte",
  },
];

function getSessionSecret() {
  return process.env.VITA_SESSION_SECRET ?? "vita-dev-secret-change-me";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function toSessionPayload(user: SessionUser): SessionPayload {
  return {
    ...user,
    exp: Date.now() + SESSION_DURATION_MS,
  };
}

function toSessionUser(payload: SessionPayload): SessionUser {
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    centerName: payload.centerName,
  };
}

export function authenticateUser(
  email: string,
  password: string,
  role: SessionRole
): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = demoUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail &&
      candidate.password === password &&
      candidate.role === role
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    centerName: user.centerName,
  };
}

export function createSessionToken(user: SessionUser) {
  const payload = encodeBase64Url(JSON.stringify(toSessionPayload(user)));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = sign(payloadPart);
  if (signaturePart !== expectedSignature) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = decodeBase64Url<SessionPayload>(payloadPart);
  } catch {
    return null;
  }

  if (payload.exp < Date.now()) {
    return null;
  }

  return toSessionUser(payload);
}

export function withSessionCookie(response: NextResponse, user: SessionUser) {
  const token = createSessionToken(user);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
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

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function getRequestSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
