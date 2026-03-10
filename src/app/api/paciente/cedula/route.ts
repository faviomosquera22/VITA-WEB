import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendCedulaAuditLog } from "@/lib/cedula-audit-log";
import { findRegisteredPatientByDocument } from "@/lib/patient-intake-store";
import { consumeRateLimit } from "@/lib/rate-limit";
import { mockPatients } from "@/app/portal/professional/_data/clinical-mock-data";
import type {
  CedulaAuditResult,
  CedulaBusquedaErrorCode,
  CedulaLookupErrorResponse,
  CedulaLookupResponse,
  RegistroCivilPaciente,
} from "@/types/paciente-cedula";
import { normalizarCedula, validarCedula } from "@/utils/validarCedula";

const WEBSERVICES_EC_URL = "https://webservices.ec/api/cedula";
const RATE_LIMIT_PER_MINUTE = 10;
const REQUEST_TIMEOUT_MS = 12_000;

class CedulaLookupError extends Error {
  status: number;
  code: CedulaBusquedaErrorCode;
  auditResult: CedulaAuditResult;

  constructor(
    status: number,
    code: CedulaBusquedaErrorCode,
    message: string,
    auditResult: CedulaAuditResult
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.auditResult = auditResult;
  }
}

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const url = new URL(request.url);
  const cedula = normalizarCedula(url.searchParams.get("cedula") ?? "");
  const clientIp = getClientIp(request);
  const rate = consumeRateLimit(clientIp);
  const headers = buildRateLimitHeaders(rate.remaining, rate.retryAfterSeconds);

  if (!rate.allowed) {
    appendCedulaAuditLog({
      cedula_consultada: cedula || "N/A",
      profesional_id: session.id,
      resultado: "RATE_LIMIT",
    });

    return NextResponse.json<CedulaLookupErrorResponse>(
      {
        error: "Ha superado el limite de 10 consultas por minuto. Intente nuevamente en breve.",
        code: "RATE_LIMIT",
      },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(rate.retryAfterSeconds),
        },
      }
    );
  }

  if (!validarCedula(cedula)) {
    appendCedulaAuditLog({
      cedula_consultada: cedula || "N/A",
      profesional_id: session.id,
      resultado: "INVALID_CEDULA",
    });

    return NextResponse.json<CedulaLookupErrorResponse>(
      {
        error:
          "Cedula invalida. Verifique provincia, longitud y digito verificador (modulo 10).",
        code: "INVALID_CEDULA",
      },
      { status: 400, headers }
    );
  }

  const registeredPatient = findRegisteredPatientByDocument(cedula);
  if (registeredPatient) {
    appendCedulaAuditLog({
      cedula_consultada: cedula,
      profesional_id: session.id,
      resultado: "FOUND_INTERNAL",
    });

    const primaryDiagnosis =
      registeredPatient.diagnostics.find((diag) => diag.condition === "principal") ??
      registeredPatient.diagnostics[0];

    const response: CedulaLookupResponse = {
      estado: "found",
      esNuevo: false,
      paciente: {
        id: registeredPatient.id,
        cedula,
        nombreCompleto: `${registeredPatient.identification.firstNames} ${registeredPatient.identification.lastNames}`.trim(),
        edad: registeredPatient.identification.age,
        historiaClinicaNumero: registeredPatient.medicalRecordNumber,
        ultimoDiagnostico:
          primaryDiagnosis?.description ?? "Sin diagnostico registrado",
        ultimoControl: formatLabelDate(registeredPatient.updatedAt),
        fichaUrl: `/portal/professional/patients/ingreso/${registeredPatient.id}`,
      },
      historiaClinica: registeredPatient as unknown as Record<string, unknown>,
    };

    return NextResponse.json(response, { status: 200, headers });
  }

  const mockPatient = mockPatients.find(
    (patient) => normalizarCedula(patient.identification) === cedula
  );
  if (mockPatient) {
    appendCedulaAuditLog({
      cedula_consultada: cedula,
      profesional_id: session.id,
      resultado: "FOUND_INTERNAL",
    });

    const response: CedulaLookupResponse = {
      estado: "found",
      esNuevo: false,
      paciente: {
        id: mockPatient.id,
        cedula,
        nombreCompleto: mockPatient.fullName,
        edad: mockPatient.age,
        historiaClinicaNumero: mockPatient.medicalRecordNumber,
        ultimoDiagnostico: mockPatient.primaryDiagnosis,
        ultimoControl: mockPatient.lastControlAt,
        fichaUrl: `/portal/professional/patients/${mockPatient.id}`,
      },
      historiaClinica: mockPatient as unknown as Record<string, unknown>,
    };

    return NextResponse.json(response, { status: 200, headers });
  }

  const token = process.env.WEBSERVICES_EC_TOKEN;
  if (!token) {
    appendCedulaAuditLog({
      cedula_consultada: cedula,
      profesional_id: session.id,
      resultado: "INTERNAL_ERROR",
    });

    return NextResponse.json<CedulaLookupErrorResponse>(
      {
        error:
          "Configuracion incompleta: falta WEBSERVICES_EC_TOKEN en variables de entorno.",
        code: "MISSING_TOKEN",
      },
      { status: 500, headers }
    );
  }

  try {
    const registroCivil = await fetchRegistroCivilByCedula(cedula, token);

    appendCedulaAuditLog({
      cedula_consultada: cedula,
      profesional_id: session.id,
      resultado: "NEW_FROM_RC",
    });

    const response: CedulaLookupResponse = {
      estado: "new",
      esNuevo: true,
      registroCivil,
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    if (error instanceof CedulaLookupError) {
      appendCedulaAuditLog({
        cedula_consultada: cedula,
        profesional_id: session.id,
        resultado: error.auditResult,
      });

      return NextResponse.json<CedulaLookupErrorResponse>(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status, headers }
      );
    }

    appendCedulaAuditLog({
      cedula_consultada: cedula,
      profesional_id: session.id,
      resultado: "INTERNAL_ERROR",
    });

    return NextResponse.json<CedulaLookupErrorResponse>(
      {
        error: "No fue posible completar la consulta de cedula por un error interno.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers }
    );
  }
}

function buildRateLimitHeaders(remaining: number, retryAfterSeconds: number) {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_PER_MINUTE),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(retryAfterSeconds),
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return "unknown";
}

/**
 * Consulta los datos básicos de identificación del Registro Civil a través
 * de webservices.ec usando token server-side.
 */
async function fetchRegistroCivilByCedula(
  cedula: string,
  token: string
): Promise<RegistroCivilPaciente> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${WEBSERVICES_EC_URL}/${cedula}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await safeParseJson(response);

    if (response.status === 401) {
      throw new CedulaLookupError(
        401,
        "INVALID_TOKEN",
        "Token inválido o sin permisos en webservices.ec.",
        "INVALID_TOKEN"
      );
    }

    if (response.status === 404) {
      throw new CedulaLookupError(
        404,
        "NOT_FOUND",
        "La cedula consultada no fue encontrada en el Registro Civil.",
        "NOT_FOUND"
      );
    }

    if (!response.ok) {
      throw new CedulaLookupError(
        503,
        "SERVICE_UNAVAILABLE",
        "El servicio de identificacion se encuentra temporalmente no disponible.",
        "SERVICE_UNAVAILABLE"
      );
    }

    if (looksLikeNotFoundPayload(payload)) {
      throw new CedulaLookupError(
        404,
        "NOT_FOUND",
        "La cedula consultada no fue encontrada en el Registro Civil.",
        "NOT_FOUND"
      );
    }

    const registroCivil = extractRegistroCivilData(payload, cedula);
    if (!registroCivil) {
      throw new CedulaLookupError(
        503,
        "SERVICE_UNAVAILABLE",
        "Respuesta no valida del servicio de identificacion.",
        "SERVICE_UNAVAILABLE"
      );
    }

    return registroCivil;
  } catch (error) {
    if (error instanceof CedulaLookupError) {
      throw error;
    }

    throw new CedulaLookupError(
      503,
      "SERVICE_UNAVAILABLE",
      "No se pudo establecer conexion con webservices.ec.",
      "SERVICE_UNAVAILABLE"
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Extrae campos mínimos requeridos de identificación desde distintos formatos
 * de respuesta del proveedor externo.
 */
function extractRegistroCivilData(
  payload: unknown,
  cedula: string
): RegistroCivilPaciente | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const envelope = payload as Record<string, unknown>;
  const candidate =
    getFirstRecord(envelope.data) ??
    getFirstRecord(envelope.result) ??
    getFirstRecord(envelope.response) ??
    getFirstRecord(envelope);

  if (!candidate) {
    return null;
  }

  const nombres =
    asString(candidate.nombres) ??
    asString(candidate.nombre) ??
    joinNameParts(
      asString(candidate.nombres1),
      asString(candidate.nombres2),
      asString(candidate.primer_nombre),
      asString(candidate.segundo_nombre)
    );

  const apellidos =
    asString(candidate.apellidos) ??
    asString(candidate.apellido) ??
    joinNameParts(
      asString(candidate.apellido_paterno),
      asString(candidate.apellido_materno),
      asString(candidate.primer_apellido),
      asString(candidate.segundo_apellido)
    );

  if (!nombres || !apellidos) {
    return null;
  }

  return {
    cedula,
    nombres,
    apellidos,
    fecha_nacimiento:
      asString(candidate.fecha_nacimiento) ??
      asString(candidate.fechaNacimiento) ??
      asString(candidate.nacimiento) ??
      null,
    sexo: asString(candidate.sexo) ?? asString(candidate.genero) ?? null,
  };
}

function getFirstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
    return null;
  }

  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function joinNameParts(...parts: Array<string | null>) {
  const name = parts.filter(Boolean).join(" ").trim();
  return name.length ? name : null;
}

function looksLikeNotFoundPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const envelope = payload as Record<string, unknown>;
  const description =
    asString(envelope.message) ??
    asString(envelope.mensaje) ??
    asString(envelope.detail) ??
    asString(envelope.error);

  if (!description) {
    return false;
  }

  const normalized = description.toLowerCase();
  return normalized.includes("no encontrado") || normalized.includes("not found");
}

function formatLabelDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
