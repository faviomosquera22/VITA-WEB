"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

interface CaseItem {
  id: string;
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  date: string;
  origin?: "app" | "web" | "otro";
  status?: "pendiente" | "en_atencion" | "finalizado";
  room?: string;
}

const triageLabel: Record<TriageKey, string> = {
  rojo: "Emergencia · riesgo vital inmediato",
  naranja: "Urgente · alta prioridad",
  amarillo: "Urgencia moderada",
  verde: "Consulta diferida",
  azul: "No urgente",
};

const triageBadge: Record<TriageKey, string> = {
  rojo: "bg-red-100 text-red-800 border-red-200",
  naranja: "bg-orange-100 text-orange-800 border-orange-200",
  amarillo: "bg-amber-100 text-amber-800 border-amber-200",
  verde: "bg-emerald-100 text-emerald-800 border-emerald-200",
  azul: "bg-sky-100 text-sky-800 border-sky-200",
};

const statusLabel: Record<
  NonNullable<CaseItem["status"]>,
  string
> = {
  pendiente: "Pendiente de atención",
  en_atencion: "En atención",
  finalizado: "Caso finalizado",
};

export default function InstitutionCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id as string;

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cases");
        const data = (await res.json()) as CaseItem[];
        const found = data.find((c) => c.id === caseId) ?? null;
        setCaseItem(found);
      } catch (error) {
        console.error("Error cargando caso institucional:", error);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      load();
    }
  }, [caseId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
                V
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Vita · Caso institucional
                </p>
                <p className="text-xs text-slate-500">
                  Cargando información del caso…
                </p>
              </div>
            </div>
            <Link
              href="/portal/institution"
              className="text-xs text-sky-700 hover:underline"
            >
              ← Volver al portal institucional
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-6">
          <div className="h-40 rounded-2xl bg-slate-200/60 animate-pulse" />
        </section>
      </main>
    );
  }

  if (!caseItem) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
                V
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Vita · Caso institucional
                </p>
                <p className="text-xs text-slate-500">
                  No se encontró este caso.
                </p>
              </div>
            </div>
            <Link
              href="/portal/institution"
              className="text-xs text-sky-700 hover:underline"
            >
              ← Volver al portal institucional
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-sm text-red-600 font-semibold">
            No se encontró este caso.
          </p>
          <p className="mt-1 text-xs text-slate-600 max-w-md">
            Puede que el registro haya sido eliminado o no pertenezca a esta
            institución. Vuelve al portal y selecciona otro caso.
          </p>
        </section>
      </main>
    );
  }

  const originLabel =
    caseItem.origin === "app"
      ? "App móvil del paciente"
      : caseItem.origin === "web"
      ? "Portal profesional"
      : "Otro origen / cargado por sistema";

  const status = caseItem.status ?? "pendiente";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Barra superior */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
              V
            </div>
            <div>
              <p className="text-sm font-semibold">
                Vita · Caso institucional
              </p>
              <p className="text-xs text-slate-500">
                Vista del caso desde la perspectiva de la institución.
              </p>
            </div>
          </div>
          <Link
            href="/portal/institution"
            className="text-xs text-sky-700 hover:underline"
          >
            ← Volver al portal institucional
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <section className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">
              {caseItem.patientName} · {caseItem.age} años
            </h1>
            <p className="text-xs text-slate-500">
              Motivo de consulta:{" "}
              <span className="font-medium text-slate-800">
                {caseItem.reason}
              </span>
              .
            </p>
            <p className="text-[11px] text-slate-500">
              {caseItem.date} · {originLabel}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${
                triageBadge[caseItem.triage]
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current/70" />
              {caseItem.triage.toUpperCase()} ·{" "}
              {triageLabel[caseItem.triage]}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              {statusLabel[status]}
              {status === "en_atencion" && caseItem.room && (
                <span className="text-slate-500">
                  · Sala{" "}
                  <span className="font-semibold">{caseItem.room}</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Bloques institucionales */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Datos operativos del caso
            </p>
            <p className="text-[13px] text-slate-700 leading-relaxed">
              Clasificación: {triageLabel[caseItem.triage]}. Estado:{" "}
              {statusLabel[status].toLowerCase()}.
            </p>
            <p className="text-[11px] text-slate-500">
              Origen: {originLabel}. Fecha de registro: {caseItem.date}.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Seguimiento institucional
            </p>
            <p className="text-[13px] text-slate-700 leading-relaxed">
              Este caso forma parte de los indicadores consolidados de triaje y
              carga asistencial de EcotecClinic.
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Los indicadores se calculan únicamente con casos registrados en
              la institución.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Caso institucional registrado en VITA · EcotecClinic.
        </p>
      </section>
    </main>
  );
}
