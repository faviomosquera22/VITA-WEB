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
  summary:
    "Paciente en seguimiento de medicina general. Se recomienda control de signos vitales y reevaluación clínica al cierre de turno.",
  medicalHistory: [
    "Antecedentes clínicos en proceso de carga.",
    "Completar historia estructurada y factores de riesgo.",
  ],
  nursingHistory: [
    {
      time: "Hoy · 08:20",
      note: "Control inicial realizado sin novedades clínicas mayores.",
      nurse: "Lic. Enfermería",
    },
  ],
  medications: [
    "Sin medicación activa registrada.",
    "Pendiente conciliación farmacológica.",
  ],
  alerts: [
    "Sin alertas críticas registradas.",
    "Actualizar alergias medicamentosas en la próxima consulta.",
  ],
};

const patientClinicalDetails: Record<string, PatientClinicalDetail> = {
  c1: {
    summary:
      "Paciente de alto riesgo cardiovascular, en monitorización continua y con prioridad clínica inmediata.",
    medicalHistory: [
      "Hipertensión arterial crónica.",
      "Diabetes mellitus tipo 2 en control ambulatorio.",
      "Antecedente de angina estable.",
    ],
    nursingHistory: [
      {
        time: "Hoy · 10:05",
        note: "Paciente hemodinámicamente estable. Dolor torácico disminuyó tras manejo inicial.",
        nurse: "Lic. Andrade",
      },
      {
        time: "Hoy · 08:10",
        note: "Ingreso a sala de reanimación. Se inicia protocolo de vigilancia estrecha.",
        nurse: "Lic. Mendoza",
      },
    ],
    medications: [
      "AAS 100 mg VO cada 24 h.",
      "Enalapril 10 mg VO cada 12 h.",
      "Metformina 850 mg VO cada 12 h.",
    ],
    alerts: [
      "Riesgo cardiovascular alto.",
      "Vigilar glucemia capilar y dolor torácico recurrente.",
    ],
  },
  c2: {
    summary:
      "Paciente con cuadro respiratorio febril en seguimiento evolutivo y control de signos de alarma.",
    medicalHistory: [
      "Antecedente de asma intermitente en infancia.",
      "Sin cirugías previas reportadas.",
      "Sin comorbilidades mayores conocidas.",
    ],
    nursingHistory: [
      {
        time: "Hoy · 11:30",
        note: "Persisten episodios febriles leves. Se mantiene hidratación oral.",
        nurse: "Lic. Luna",
      },
      {
        time: "Ayer · 18:40",
        note: "Se educa sobre signos de alarma respiratoria y plan de reconsulta.",
        nurse: "Lic. Paredes",
      },
    ],
    medications: [
      "Paracetamol 500 mg VO según fiebre.",
      "Salbutamol inhalado según necesidad.",
    ],
    alerts: [
      "Controlar saturación de O2 durante episodio febril.",
      "Acudir de inmediato si presenta disnea progresiva.",
    ],
  },
  c3: {
    summary:
      "Paciente con disnea moderada en observación, pendiente de respuesta a broncodilatadores.",
    medicalHistory: [
      "EPOC leve-moderado.",
      "Exposición tabáquica previa importante.",
    ],
    nursingHistory: [
      {
        time: "Hoy · 09:25",
        note: "Disnea leve al esfuerzo. Se refuerzan técnicas respiratorias.",
        nurse: "Lic. Salazar",
      },
      {
        time: "Hoy · 07:45",
        note: "Ingreso a observación con saturación conservada en reposo.",
        nurse: "Lic. Torres",
      },
    ],
    medications: [
      "Budesonida/formoterol inhalado cada 12 h.",
      "Ipratropio inhalado PRN.",
    ],
    alerts: [
      "Evaluar necesidad de ajuste de terapia inhalada.",
      "Control de frecuencia respiratoria cada 4 h.",
    ],
  },
  c4: {
    summary:
      "Paciente con cefalea tensional en manejo ambulatorio con evolución favorable.",
    medicalHistory: [
      "Antecedente de migraña episódica sin aura.",
      "Sin enfermedad cardiovascular documentada.",
    ],
    nursingHistory: [
      {
        time: "Hoy · 12:00",
        note: "Refiere mejoría parcial del dolor. Sin nuevos síntomas neurológicos.",
        nurse: "Lic. Vera",
      },
      {
        time: "Hoy · 09:05",
        note: "Se indica ambiente de baja estimulación y control de dolor.",
        nurse: "Lic. Cabrera",
      },
    ],
    medications: [
      "Ibuprofeno 400 mg VO cada 8 h con alimentos.",
      "Omeprazol 20 mg VO cada 24 h.",
    ],
    alerts: [
      "Consultar de inmediato ante cefalea súbita intensa.",
      "Seguimiento en consulta externa en 72 h.",
    ],
  },
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
    return patientClinicalDetails[patient.id] ?? defaultPatientClinicalDetail;
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
                  No se encontró este paciente en el demo.
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
            Es posible que el demo se haya reiniciado. Vuelve al portal y
            selecciona un paciente desde la lista.
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
                      Vigilancia clínica activa
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
          Panel clínico demo de Vita · Datos ficticios para diseño y validación de UX.
        </p>
      </section>
    </main>
  );
}
