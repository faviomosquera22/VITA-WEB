export type CedulaBusquedaEstado = "found" | "new";

export type CedulaBusquedaErrorCode =
  | "INVALID_CEDULA"
  | "NOT_FOUND"
  | "INVALID_TOKEN"
  | "SERVICE_UNAVAILABLE"
  | "RATE_LIMIT"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR"
  | "MISSING_TOKEN";

export interface RegistroCivilPaciente {
  cedula: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  sexo: string | null;
}

export interface PacienteInternoResumen {
  id: string;
  nombreCompleto: string;
  edad: number | null;
  cedula: string;
  historiaClinicaNumero: string;
  ultimoDiagnostico: string;
  ultimoControl: string;
  fichaUrl?: string;
}

export interface CedulaFoundResponse {
  estado: "found";
  esNuevo: false;
  paciente: PacienteInternoResumen;
  historiaClinica: Record<string, unknown>;
}

export interface CedulaNewResponse {
  estado: "new";
  esNuevo: true;
  registroCivil: RegistroCivilPaciente;
}

export type CedulaLookupResponse = CedulaFoundResponse | CedulaNewResponse;

export interface CedulaLookupErrorResponse {
  error: string;
  code: CedulaBusquedaErrorCode;
}

export type CedulaAuditResult =
  | "FOUND_INTERNAL"
  | "NEW_FROM_RC"
  | "INVALID_CEDULA"
  | "NOT_FOUND"
  | "INVALID_TOKEN"
  | "SERVICE_UNAVAILABLE"
  | "RATE_LIMIT"
  | "INTERNAL_ERROR";
