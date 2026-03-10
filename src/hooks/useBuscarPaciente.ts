"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type {
  CedulaLookupErrorResponse,
  CedulaLookupResponse,
  CedulaBusquedaErrorCode,
} from "@/types/paciente-cedula";
import { normalizarCedula, validarCedula } from "@/utils/validarCedula";

export type BuscarPacienteEstado = "idle" | "loading" | "found" | "new" | "error";

class CedulaApiError extends Error {
  status: number;
  code: CedulaBusquedaErrorCode;

  constructor(
    message: string,
    code: CedulaBusquedaErrorCode,
    status: number
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function useBuscarPaciente(initialCedula = "") {
  const [cedulaInput, setCedulaInput] = useState(() => normalizarCedula(initialCedula));
  const cedula = normalizarCedula(cedulaInput);
  const cedulaDebounced = useDebouncedValue(cedula, 500);
  const esCedulaCompleta = cedula.length === 10;
  const esCedulaValida = esCedulaCompleta && validarCedula(cedula);

  const query = useQuery<CedulaLookupResponse, CedulaApiError>({
    queryKey: ["buscar-paciente-cedula", cedulaDebounced],
    enabled: cedulaDebounced.length === 10 && validarCedula(cedulaDebounced),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: () => buscarPacientePorCedula(cedulaDebounced),
    retry: false,
  });

  const estado: BuscarPacienteEstado = useMemo(() => {
    if (!cedulaDebounced || cedulaDebounced.length < 10) {
      return "idle";
    }

    if (query.isFetching) {
      return "loading";
    }

    if (query.isError) {
      return "error";
    }

    if (!query.data) {
      return "idle";
    }

    return query.data.esNuevo ? "new" : "found";
  }, [cedulaDebounced, query.data, query.isError, query.isFetching]);

  return {
    cedula,
    setCedula: (value: string) => setCedulaInput(normalizarCedula(value)),
    esCedulaCompleta,
    esCedulaValida,
    estado,
    data: query.data ?? null,
    isLoading: query.isFetching,
    error: query.error ?? null,
    mensajeError: query.error ? getErrorMessage(query.error.code) : null,
    refetch: query.refetch,
  };
}

async function buscarPacientePorCedula(cedula: string): Promise<CedulaLookupResponse> {
  const response = await fetch(`/api/paciente/cedula?cedula=${encodeURIComponent(cedula)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: CedulaLookupErrorResponse | null = null;

    try {
      payload = (await response.json()) as CedulaLookupErrorResponse;
    } catch {
      payload = null;
    }

    throw new CedulaApiError(
      payload?.error ?? "No fue posible completar la consulta de cédula.",
      payload?.code ?? (response.status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
      response.status
    );
  }

  return (await response.json()) as CedulaLookupResponse;
}

function getErrorMessage(code: CedulaBusquedaErrorCode) {
  switch (code) {
    case "INVALID_CEDULA":
      return "La cédula ingresada no es válida según el algoritmo oficial.";
    case "NOT_FOUND":
      return "La cédula no fue encontrada en el Registro Civil.";
    case "INVALID_TOKEN":
      return "El token de integración es inválido o no tiene permisos.";
    case "SERVICE_UNAVAILABLE":
      return "El servicio de identificación está temporalmente caído.";
    case "RATE_LIMIT":
      return "Demasiadas consultas en poco tiempo. Intenta nuevamente en 1 minuto.";
    case "UNAUTHORIZED":
      return "Debes iniciar sesión como profesional para consultar cédulas.";
    case "MISSING_TOKEN":
      return "Falta configurar WEBSERVICES_EC_TOKEN en el servidor.";
    case "INTERNAL_ERROR":
    default:
      return "Se produjo un error inesperado al consultar la cédula.";
  }
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debouncedValue;
}
