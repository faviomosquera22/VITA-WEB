"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

interface PatientItem {
  id: string;
  name: string;
  age: number;
  lastTriage: TriageKey;
  lastReason: string;
  lastDate?: string;
}

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

export default function InstitutionPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [patientsRes, casesRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/cases"),
        ]);

        const patientsData = (await patientsRes.json()) as PatientItem[];
        const casesData = (await casesRes.json()) as CaseItem[];

        const foundPatient =
          patientsData.find((p) => p.id === patientId) ?? null;
        setPatient(foundPatient);

        if (foundPatient) {
          const related = casesData.filter(
            (c) => c.patientName === foundPatient.name
          );
          setCases(related);
        } else {
          setCases([]);
        }
      } catch (error) {
        console.error("Error cargando paciente institucional:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      load();
    }
  }, [patientId]);

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
                  Vita · Paciente institucional
                </p>
                <p className="text-xs text-slate-500">
                  Cargando información del paciente…
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

  if (!patient) {
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
                  Vita · Paciente institucional
                </p>
                <p className="text-xs text-slate-500">
                  No se encontró este paciente en el demo.
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
            No se encontró este paciente.
          </p>
          <p className="mt-1 text-xs text-slate-600 max-w-md">
            Es posible que el demo se haya reiniciado. Vuelve al portal y
            selecciona un paciente desde la lista.
          </p>
        </section>
      </main>
    );
  }

  const triage = patient.lastTriage;

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
                Vita · Paciente institucional
              </p>
              <p className="text-xs text-slate-500">
                Vista del paciente desde la perspectiva de la institución.
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
              {patient.name} · {patient.age} años
            </h1>
            <p className="text-xs text-slate-500">
              Último motivo registrado:{" "}
              <span className="font-medium text-slate-800">
                {patient.lastReason}
              </span>
            </p>
            {patient.lastDate && (
              <p className="text-[11px] text-slate-500">
                Última atención: {patient.lastDate}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${triageBadge[triage]}`}
            >
              <span className="h-2 w-2 rounded-full bg-current/70" />
              {triage.toUpperCase()} · {triageLabel[triage]}
            </span>
          </div>
        </div>

        {/* Bloques institucionales */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Uso institucional del paciente (demo)
            </p>
            <p className="text-[13px] text-slate-700 leading-relaxed">
              Desde el portal institucional, este paciente forma parte de la
              población atendida en la guardia. Su triaje y motivos de consulta
              contribuyen a entender la demanda y priorizar recursos.
            </p>
            <p className="text-[11px] text-slate-500">
              En una implementación real, aquí se podrían vincular episodios
              de atención, reingresos y derivaciones.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Casos asociados a este paciente (demo)
            </p>
            {cases.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Este paciente aún no tiene casos registrados en el demo.
              </p>
            ) : (
              <ul className="mt-1 space-y-1.5 text-[13px] text-slate-700">
                {cases.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-2 border border-slate-100 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          c.triage === "rojo"
                            ? "bg-red-500"
                            : c.triage === "naranja"
                            ? "bg-orange-500"
                            : c.triage === "amarillo"
                            ? "bg-amber-400"
                            : c.triage === "verde"
                            ? "bg-emerald-500"
                            : "bg-sky-500"
                        }`}
                      />
                      <div>
                        <p className="text-[12px] font-semibold">
                          {c.reason}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {c.date} · Origen:{" "}
                          <span className="font-medium">
                            {c.origin === "app"
                              ? "App móvil"
                              : c.origin === "web"
                              ? "Portal profesional"
                              : "Otro"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/portal/institution/case/${c.id}`}
                      className="text-[11px] text-sky-700 hover:underline"
                    >
                      Ver caso
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Paciente institucional demo de Vita · Datos ficticios para fines
          académicos.
        </p>
      </section>
    </main>
  );
}