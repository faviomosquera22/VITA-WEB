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
  origin: "app" | "web";
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

export default function ProfessionalCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id as string;

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/cases");
        const data = (await res.json()) as CaseItem[];
        const found = data.find((c) => c.id === caseId) ?? null;
        setCaseItem(found);
      } catch (error) {
        console.error("Error cargando caso profesional:", error);
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
      <main className="min-h-screen bg-slate-100">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
                V
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Vita · Caso del profesional
                </p>
                <p className="text-xs text-slate-500">
                  Cargando información del caso…
                </p>
              </div>
            </div>
            <Link
              href="/portal/professional"
              className="text-xs text-sky-700 hover:underline"
            >
              ← Volver al portal profesional
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="h-40 rounded-2xl bg-slate-200/60 animate-pulse" />
        </section>
      </main>
    );
  }

  if (!caseItem) {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
                V
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Vita · Caso del profesional
                </p>
                <p className="text-xs text-slate-500">
                  No se encontró este caso en el demo.
                </p>
              </div>
            </div>
            <Link
              href="/portal/professional"
              className="text-xs text-sky-700 hover:underline"
            >
              ← Volver al portal profesional
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-sm text-red-600 font-semibold">
            No se encontró este caso.
          </p>
          <p className="mt-1 text-xs text-slate-600 max-w-md">
            Es posible que el demo se haya reiniciado. Vuelve al portal y
            selecciona un caso reciente desde la lista.
          </p>
        </section>
      </main>
    );
  }

  const originLabel =
    caseItem.origin === "app" ? "App móvil del paciente" : "Portal web profesional";

  const status = caseItem.status ?? "pendiente";

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Barra superior */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
              V
            </div>
            <div>
              <p className="text-sm font-semibold">
                Vita · Caso del profesional
              </p>
              <p className="text-xs text-slate-500">
                Vista clínica del caso triado.
              </p>
            </div>
          </div>
          <Link
            href="/portal/professional"
            className="text-xs text-sky-700 hover:underline"
          >
            ← Volver al portal profesional
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <section className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {/* Encabezado del caso */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">
              {caseItem.patientName} · {caseItem.age} años
            </h1>
            <p className="text-xs text-slate-500">
              Motivo principal:{" "}
              <span className="font-medium text-slate-800">
                {caseItem.reason}
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              {caseItem.date} · {originLabel}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${triageBadge[caseItem.triage]}`}
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
                  · Sala <span className="font-semibold">{caseItem.room}</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Bloques de información */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Resumen clínico del caso (demo)
            </p>
            <p className="text-[13px] text-slate-700 leading-relaxed">
              Esta pantalla representa cómo el profesional podría revisar
              rápidamente la información clave del caso: motivo principal,
              color de triaje, estado y origen (si llegó desde la app del
              paciente o se creó en el portal).
            </p>
            <p className="text-[11px] text-slate-500">
              En una versión real, aquí se integrarían signos vitales,
              resultados de exámenes y evolución del paciente.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Plan / notas clínicas (demo)
            </p>
            <ul className="mt-1 space-y-1.5 text-[13px] text-slate-700">
              <li>• Confirmar estabilidad hemodinámica y saturación de O₂.</li>
              <li>• Priorizar atención según color de triaje y comorbilidades.</li>
              <li>• Registrar intervenciones realizadas y respuesta clínica.</li>
            </ul>
            <p className="text-[11px] text-slate-500 mt-2">
              Este bloque ilustra cómo Vita sirve de apoyo a la continuidad de
              la atención, dejando un registro estructurado para el equipo.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Caso demo de Vita · Datos simulados para fines académicos.
        </p>
      </section>
    </main>
  );
}