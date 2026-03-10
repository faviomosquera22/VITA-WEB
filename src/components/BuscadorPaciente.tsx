"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useBuscarPaciente } from "@/hooks/useBuscarPaciente";
import type { RegisteredPatientRecord } from "@/types/patient-intake";

const bloodGroups = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
];

export default function BuscadorPaciente() {
  const { cedula, setCedula, esCedulaCompleta, esCedulaValida, estado, data, mensajeError } =
    useBuscarPaciente();

  const [grupoSanguineo, setGrupoSanguineo] = useState("");
  const [alergias, setAlergias] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [registroMensaje, setRegistroMensaje] = useState<string | null>(null);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [isRegistrando, setIsRegistrando] = useState(false);
  const [registroCreado, setRegistroCreado] = useState<RegisteredPatientRecord | null>(null);

  const inputClassName = useMemo(() => {
    if (cedula.length === 0) {
      return "border-slate-200 focus:border-sky-500";
    }

    if (esCedulaCompleta && esCedulaValida) {
      return "border-emerald-400 focus:border-emerald-500";
    }

    if (esCedulaCompleta && !esCedulaValida) {
      return "border-red-400 focus:border-red-500";
    }

    return "border-slate-300 focus:border-sky-500";
  }, [cedula.length, esCedulaCompleta, esCedulaValida]);

  const handleRegistrarPaciente = async () => {
    if (estado !== "new" || !data || data.estado !== "new") {
      return;
    }

    setRegistroMensaje(null);
    setRegistroError(null);
    setRegistroCreado(null);

    if (!grupoSanguineo || !motivoConsulta.trim()) {
      setRegistroError(
        "Completa al menos grupo sanguineo y motivo de consulta para registrar."
      );
      return;
    }

    setIsRegistrando(true);

    try {
      const response = await fetch("/api/paciente/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "registro_civil",
          identification: {
            documentType: "cedula",
            documentNumber: data.registroCivil.cedula,
            firstNames: data.registroCivil.nombres,
            lastNames: data.registroCivil.apellidos,
            birthDate: data.registroCivil.fecha_nacimiento,
            sexBiological: data.registroCivil.sexo ?? "",
            gender: data.registroCivil.sexo ?? "",
          },
          antecedentes: {
            allergies: {
              medications: alergias ? [alergias] : [],
              visualAlertActive: Boolean(alergias.trim()),
            },
          },
          consultation: {
            literalReason: motivoConsulta.trim(),
            mainSymptom: motivoConsulta.trim(),
            currentIllnessNarrative: motivoConsulta.trim(),
          },
          indicatorsContext: {
            administrative: `Grupo sanguineo: ${grupoSanguineo}`,
          },
        }),
      });

      const payload = (await response.json()) as {
        data?: RegisteredPatientRecord;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "No se pudo registrar el paciente.");
      }

      setRegistroCreado(payload.data);
      setRegistroMensaje(
        `Paciente registrado: HC ${payload.data.medicalRecordNumber}.`
      );
    } catch (error) {
      setRegistroError(
        error instanceof Error
          ? error.message
          : "Error inesperado al registrar paciente."
      );
    } finally {
      setIsRegistrando(false);
    }
  };

  const intakeUrl = useMemo(() => {
    if (estado !== "new" || !data || data.estado !== "new") {
      return "/portal/professional/patients/ingreso";
    }

    const params = new URLSearchParams({
      cedula: data.registroCivil.cedula,
      nombres: data.registroCivil.nombres,
      apellidos: data.registroCivil.apellidos,
      fechaNacimiento: data.registroCivil.fecha_nacimiento ?? "",
      sexo: data.registroCivil.sexo ?? "",
    });

    return `/portal/professional/patients/ingreso?${params.toString()}`;
  }, [data, estado]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Busqueda por cédula (Registro Civil)
        </h2>
        <p className="text-xs text-slate-500">
          Consulta server-side con webservices.ec y cruce con base interna de Vita.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-sm">
          <input
            value={cedula}
            onChange={(event) => setCedula(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            placeholder="Ingrese cédula (10 dígitos)"
            className={[
              "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none",
              inputClassName,
            ].join(" ")}
          />
        </div>

        <span className="text-xs text-slate-500">
          {esCedulaCompleta
            ? esCedulaValida
              ? "Cédula válida"
              : "Cédula inválida"
            : `Faltan ${Math.max(0, 10 - cedula.length)} dígitos`}
        </span>

        {estado === "loading" ? (
          <span className="inline-flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
            Consultando...
          </span>
        ) : null}
      </div>

      {estado === "found" && data?.estado === "found" ? (
        <article className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-900">Paciente encontrado en Vita</p>
          <p className="text-sm font-semibold text-slate-900">{data.paciente.nombreCompleto}</p>
          <p className="text-[11px] text-slate-600">
            Edad: {data.paciente.edad ?? "No registrada"} · HC: {data.paciente.historiaClinicaNumero}
          </p>
          <p className="text-[11px] text-slate-600">
            Último diagnóstico: {data.paciente.ultimoDiagnostico}
          </p>
          <div className="mt-2">
            <Link
              href={data.paciente.fichaUrl ?? `/portal/professional/patients/${data.paciente.id}`}
              className="inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Abrir ficha completa
            </Link>
          </div>
        </article>
      ) : null}

      {estado === "new" && data?.estado === "new" ? (
        <article className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs font-semibold text-sky-900">
            Cédula válida en Registro Civil, paciente nuevo en Vita
          </p>

          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <ReadField
              label="Nombres"
              value={data.registroCivil.nombres}
            />
            <ReadField
              label="Apellidos"
              value={data.registroCivil.apellidos}
            />
            <ReadField
              label="Fecha nacimiento"
              value={data.registroCivil.fecha_nacimiento ?? "No disponible"}
            />
            <ReadField
              label="Sexo"
              value={data.registroCivil.sexo ?? "No disponible"}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="text-[11px] font-semibold text-slate-600">
              Grupo sanguíneo
              <select
                value={grupoSanguineo}
                onChange={(event) => setGrupoSanguineo(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
              >
                <option value="">Seleccione...</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[11px] font-semibold text-slate-600">
              Alergias
              <input
                value={alergias}
                onChange={(event) => setAlergias(event.target.value)}
                placeholder="Ej. Penicilina"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
              />
            </label>

            <label className="text-[11px] font-semibold text-slate-600">
              Motivo de consulta
              <input
                value={motivoConsulta}
                onChange={(event) => setMotivoConsulta(event.target.value)}
                placeholder="Ej. Dolor torácico"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
              />
            </label>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRegistrarPaciente}
                disabled={isRegistrando}
                className="rounded-full border border-sky-300 bg-white px-3 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegistrando ? "Registrando..." : "Registrar paciente"}
              </button>
              <Link
                href={intakeUrl}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Completar ingreso clinico
              </Link>
            </div>
          </div>

          {registroMensaje ? (
            <p className="mt-2 text-[11px] text-emerald-700">{registroMensaje}</p>
          ) : null}
          {registroError ? (
            <p className="mt-2 text-[11px] text-red-700">{registroError}</p>
          ) : null}
          {registroCreado ? (
            <div className="mt-2">
              <Link
                href={`/portal/professional/patients/ingreso/${registroCreado.id}`}
                className="text-[11px] font-semibold text-sky-700 underline"
              >
                Ver ficha de ingreso registrada
              </Link>
            </div>
          ) : null}
        </article>
      ) : null}

      {estado === "error" ? (
        <article className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-800">No se pudo completar la búsqueda</p>
          <p className="text-[11px] text-red-700">
            {mensajeError ?? "Error no identificado al consultar cédula."}
          </p>
        </article>
      ) : null}
    </section>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xs text-slate-700">{value}</p>
    </div>
  );
}
