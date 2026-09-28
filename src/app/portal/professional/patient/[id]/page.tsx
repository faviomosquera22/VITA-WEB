"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
type PatientDetailTab =
  | "summary"
  | "medical_history"
  | "nursing_history"
  | "medications"
  | "alerts";

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
  origin: "app" | "web";
  status?: "pendiente" | "en_atencion" | "finalizado";
  room?: string;
}

interface PatientClinicalDetail {
  summary: string;
  medicalHistory: string[];
  nursingHistory: { time: string; note: string; nurse: string }[];
  medications: string[];
  alerts: string[];
}

const patientDetailTabs: { id: PatientDetailTab; label: string }[] = [
  { id: "summary", label: "Resumen" },
  { id: "medical_history", label: "Historial médico" },
  { id: "nursing_history", label: "Enfermería" },
  { id: "medications", label: "Medicación" },
  { id: "alerts", label: "Alertas" },
];

const isPatientDetailTab = (value: string | null): value is PatientDetailTab =>
  value === "summary" ||
  value === "medical_history" ||
  value === "nursing_history" ||
  value === "medications" ||
  value === "alerts";

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

const defaultPatientClinicalDetail: PatientClinicalDetail = {
  summary: "No hay un resumen clínico registrado para este paciente.",
  medicalHistory: [],
  nursingHistory: [],
  medications: [],
  alerts: [],
};

export default function ProfessionalPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const patientId = params?.id as string;

  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<PatientDetailTab>(
    isPatientDetailTab(requestedTab) ? requestedTab : "summary"
  );
  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(isPatientDetailTab(requestedTab) ? requestedTab : "summary");
  }, [requestedTab]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [patientsRes, casesRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/cases"),
        ]);

        const patientsData = (await patientsRes.json()) as PatientItem[];
        const casesData = (await casesRes.json()) as CaseItem[];

        const foundPatient =
          patientsData.find((entry) => entry.id === patientId) ?? null;
        setPatient(foundPatient);

        if (foundPatient) {
          const relatedCases = casesData.filter(
            (entry) => entry.patientName === foundPatient.name
          );
          setCases(relatedCases);
        } else {
          setCases([]);
        }
      } catch (error) {
        console.error("Error cargando paciente profesional:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      load();
    }
  }, [patientId]);

  const clinicalDetail = useMemo(() => {
    if (!patient) {
      return defaultPatientClinicalDetail;
    }
    return defaultPatientClinicalDetail;
  }, [patient]);

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
                  Vita · Paciente del profesional
                </p>
                <p className="text-xs text-slate-500">
                  Cargando información del paciente…
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

  if (!patient) {
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
                  Vita · Paciente del profesional
                </p>
                <p className="text-xs text-slate-500">
                  No se encontró este paciente.
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
            No se encontró este paciente.
          </p>
          <p className="mt-1 text-xs text-slate-600 max-w-md">
            Puede que el registro haya sido eliminado o no esté disponible para
            tu cuenta. Vuelve al portal y selecciona otro paciente.
          </p>
        </section>
      </main>
    );
  }

  const triage = patient.lastTriage;

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
                Vita · Paciente del profesional
              </p>
              <p className="text-xs text-slate-500">
                Panel clínico del paciente con historial médico y de enfermería.
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

      <section className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

          <div className="flex flex-col items-start gap-2 md:items-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${triageBadge[triage]}`}
            >
              <span className="h-2 w-2 rounded-full bg-current/70" />
              {triage.toUpperCase()} · {triageLabel[triage]}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600">
              {cases.length} {cases.length === 1 ? "caso asociado" : "casos asociados"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {patientDetailTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "rounded-full border px-3 py-1 text-xs transition",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600">
              Opciones rápidas del paciente
            </p>
            <Link
              href={`/portal/professional/patient/${patient.id}?tab=summary`}
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
            >
              Ver resumen clínico
            </Link>
            <Link
              href={`/portal/professional/patient/${patient.id}?tab=medical_history`}
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
            >
              Revisar historial médico
            </Link>
            <Link
              href={`/portal/professional/patient/${patient.id}?tab=nursing_history`}
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
            >
              Revisar historial de enfermería
            </Link>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-600">
                Casos recientes
              </p>
              {cases.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Sin casos relacionados en este momento.
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                  {cases.slice(0, 3).map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/portal/professional/case/${entry.id}`}
                        className="hover:text-sky-700 hover:underline"
                      >
                        {entry.date} · {entry.reason}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {activeTab === "summary" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Resumen clínico
                </h2>
                <p className="text-xs leading-relaxed text-slate-700">
                  {clinicalDetail.summary}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold text-slate-600">
                      Último triage
                    </p>
                    <p className="mt-1 text-xs text-slate-700 capitalize">
                      {patient.lastTriage}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold text-slate-600">
                      Estado de seguimiento
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      Sin seguimiento registrado
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "medical_history" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Historial médico
                </h2>
                {clinicalDetail.medicalHistory.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No hay antecedentes médicos registrados.
                  </p>
                )}
                <ul className="space-y-2 text-xs text-slate-700">
                  {clinicalDetail.medicalHistory.map((entry) => (
                    <li
                      key={entry}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "nursing_history" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Historial de enfermería
                </h2>
                {clinicalDetail.nursingHistory.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No hay notas de enfermería registradas.
                  </p>
                )}
                <ul className="space-y-2 text-xs text-slate-700">
                  {clinicalDetail.nursingHistory.map((entry) => (
                    <li
                      key={`${entry.time}-${entry.note}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <p className="font-semibold text-slate-800">
                        {entry.time} · {entry.nurse}
                      </p>
                      <p className="mt-0.5 text-slate-600">{entry.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "medications" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Medicación activa
                </h2>
                {clinicalDetail.medications.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No hay medicación activa registrada.
                  </p>
                )}
                <ul className="space-y-2 text-xs text-slate-700">
                  {clinicalDetail.medications.map((entry) => (
                    <li
                      key={entry}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Alertas y seguridad
                </h2>
                {clinicalDetail.alerts.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No hay alertas clínicas registradas.
                  </p>
                )}
                <ul className="space-y-2 text-xs text-amber-800">
                  {clinicalDetail.alerts.map((entry) => (
                    <li
                      key={entry}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Información clínica registrada en VITA · EcotecClinic.
        </p>
      </section>
    </main>
  );
}
