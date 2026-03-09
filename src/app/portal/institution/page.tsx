"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TriageColor = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

interface PatientItem {
  id: string;
  name: string;
  age: number;
  lastTriage: TriageColor;
  lastReason: string;
}
interface CaseItem {
  id: string;
  triage: TriageColor;
  patientName: string;
  age: number;
  reason: string;
  date: string;
  origin?: "app" | "web" | "otro";
  status?: "pendiente" | "en_atencion" | "finalizado";
  room?: string;
}
const triageDot: Record<TriageColor, string> = {
  rojo: "bg-red-500",
  naranja: "bg-orange-500",
  amarillo: "bg-amber-400",
  verde: "bg-emerald-500",
  azul: "bg-sky-500",
};

export default function InstitutionHomePage() {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [triageFilter, setTriageFilter] = useState<TriageColor | "todos">(
    "todos"
  );
  const [priorityMode, setPriorityMode] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientTriageFilter, setPatientTriageFilter] = useState<
    TriageColor | "todos"
  >("todos");

  const filteredCases =
    triageFilter === "todos"
      ? cases
      : cases.filter((c) => c.triage === triageFilter);

  // Orden de prioridad de colores: rojo > naranja > amarillo > verde > azul
  const triagePriority: Record<TriageColor, number> = {
    rojo: 5,
    naranja: 4,
    amarillo: 3,
    verde: 2,
    azul: 1,
  };

  const visibleCases = priorityMode
    ? [...cases].sort(
        (a, b) => triagePriority[b.triage] - triagePriority[a.triage]
      )
    : filteredCases;

  const triageStats = cases.reduce(
    (acc, c) => {
      acc[c.triage] = (acc[c.triage] ?? 0) + 1;
      return acc;
    },
    {
      rojo: 0,
      naranja: 0,
      amarillo: 0,
      verde: 0,
      azul: 0,
    } as Record<TriageColor, number>
  );
  const statusStats = cases.reduce(
  (acc, c) => {
    const status = c.status ?? "pendiente";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  },
  {
    pendiente: 0,
    en_atencion: 0,
    finalizado: 0,
  } as Record<"pendiente" | "en_atencion" | "finalizado", number>
);

const totalCases = cases.length;
  useEffect(() => {
    const load = async () => {
      try {
        const [patientsRes, casesRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/cases"),
        ]);

        const patientsData: PatientItem[] = await patientsRes.json();
        const casesData: CaseItem[] = await casesRes.json();

        setPatients(patientsData);
        setCases(casesData);
      } catch (error) {
        console.error("Error cargando datos institucionales:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);
  const filteredPatientsByTriage =
    patientTriageFilter === "todos"
      ? patients
      : patients.filter((p) => p.lastTriage === patientTriageFilter);

  const visiblePatients =
    patientQuery.trim().length === 0
      ? filteredPatientsByTriage
      : filteredPatientsByTriage.filter((p) => {
          const q = patientQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.lastReason.toLowerCase().includes(q)
          );
        });

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
              <p className="text-sm font-semibold">Vita · Portal institucional</p>
              <p className="text-xs text-slate-500">
                Vista demo para supervisar pacientes y triajes desde la institución.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Resumen institucional rápido */}
      <section className="mx-auto max-w-5xl px-4 pt-3">
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="font-semibold">{totalCases}</span>
            <span className="text-slate-600">casos totales</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">{statusStats.en_atencion}</span>
            <span>en atención</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="font-semibold">{statusStats.pendiente}</span>
            <span>pendientes</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="font-semibold">{statusStats.finalizado}</span>
            <span>finalizados</span>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Casos recientes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Casos recientes
                </h2>
                <p className="text-xs text-slate-500">
                  Últimos casos triados en la institución (demo).
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {cases.length} {cases.length === 1 ? "caso" : "casos"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] mt-1">
              <button
                type="button"
                onClick={() => setTriageFilter("todos")}
                className={`rounded-full border px-2 py-0.5 ${
                  triageFilter === "todos"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTriageFilter("rojo")}
                className={`rounded-full border px-2 py-0.5 ${
                  triageFilter === "rojo"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Rojo
              </button>
              <button
                type="button"
                onClick={() => setTriageFilter("naranja")}
                className={`rounded-full border px-2 py-0.5 ${
                  triageFilter === "naranja"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Naranja
              </button>
              <button
                type="button"
                onClick={() => setTriageFilter("amarillo")}
                className={`rounded-full border px-2 py-0.5 ${
                  triageFilter === "amarillo"
                    ? "bg-amber-400 text-white border-amber-400"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Amarillo
              </button>
              <button
                type="button"
                onClick={() => setTriageFilter("verde")}
                className={`rounded-full border px-2 py-0.5 ${
                  triageFilter === "verde"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Verde
              </button>
              <button
                type="button"
                onClick={() => setTriageFilter("azul")}
                className={`rounded-full border px-2 py-0.5 ${
                  triageFilter === "azul"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Azul
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setPriorityMode((prev) => !prev)}
                className={`rounded-full border px-3 py-0.5 text-[11px] ${
                  priorityMode
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {priorityMode ? "Prioridad activada" : "Ver por prioridad"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] mt-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Rojo: {triageStats.rojo}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-orange-700">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Naranja: {triageStats.naranja}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Amarillo: {triageStats.amarillo}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Verde: {triageStats.verde}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Azul: {triageStats.azul}
              </span>
            </div>
            {loading && (
              <p className="text-xs text-slate-500">Cargando casos…</p>
            )}

            {!loading && cases.length === 0 && (
              <p className="text-xs text-slate-500">
                No hay casos en este demo.
              </p>
            )}

            <div className="space-y-2">
              {visibleCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/portal/institution/case/${c.id}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 hover:bg-slate-100"
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      triageDot[c.triage]
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900">
                      {c.patientName} · {c.age} años
                    </p>
                    <p className="text-[11px] text-slate-500">{c.reason}</p>
                    {c.status === "en_atencion" && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        En atención · Sala {c.room ?? "—"}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {c.date} · Origen: {c.origin ?? "demo"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {/* Pacientes recientes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Pacientes recientes
                </h2>
                <p className="text-xs text-slate-500">
                  Últimos pacientes con actividad registrada en Vita (demo).
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {patients.length}{" "}
                {patients.length === 1 ? "paciente" : "pacientes"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] mt-1">
              <button
                type="button"
                onClick={() => setPatientTriageFilter("todos")}
                className={`rounded-full border px-2 py-0.5 ${
                  patientTriageFilter === "todos"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setPatientTriageFilter("rojo")}
                className={`rounded-full border px-2 py-0.5 ${
                  patientTriageFilter === "rojo"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Rojo
              </button>
              <button
                type="button"
                onClick={() => setPatientTriageFilter("naranja")}
                className={`rounded-full border px-2 py-0.5 ${
                  patientTriageFilter === "naranja"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Naranja
              </button>
              <button
                type="button"
                onClick={() => setPatientTriageFilter("amarillo")}
                className={`rounded-full border px-2 py-0.5 ${
                  patientTriageFilter === "amarillo"
                    ? "bg-amber-400 text-white border-amber-400"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Amarillo
              </button>
              <button
                type="button"
                onClick={() => setPatientTriageFilter("verde")}
                className={`rounded-full border px-2 py-0.5 ${
                  patientTriageFilter === "verde"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Verde
              </button>
              <button
                type="button"
                onClick={() => setPatientTriageFilter("azul")}
                className={`rounded-full border px-2 py-0.5 ${
                  patientTriageFilter === "azul"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Azul
              </button>
            </div>
            <div className="mt-1">
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="Buscar por nombre o motivo…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {loading && (
              <p className="text-xs text-slate-500">Cargando pacientes…</p>
            )}

            {!loading && patients.length === 0 && (
              <p className="text-xs text-slate-500">
                No hay pacientes cargados en este demo.
              </p>
            )}

            <div className="divide-y divide-slate-100">
            {visiblePatients.map((p) => (
            <Link
           key={p.id}
           href={`/portal/institution/patient/${p.id}`}
            className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-slate-50"
           >
            <div className="flex items-center gap-3">
            <span
           className={`h-2.5 w-2.5 rounded-full ${
            triageDot[p.lastTriage]
           }`}
            />
           <div>
           <p className="text-xs font-semibold text-slate-900">
              {p.name} · {p.age} años
            </p>
           <p className="text-[11px] text-slate-500">
              Último motivo: {p.lastReason}
          </p>
         </div>
            </div>
             <span className="text-[11px] text-slate-400 underline-offset-2">
           Ver ficha institucional
           </span>
           </Link>
           ))}
        </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Portal institucional demo de Vita · Datos ficticios para mostrar cómo
          la institución puede revisar rápidamente los pacientes triados desde
          la app móvil y el portal profesional.
        </p>
      </section>
    </main>
  );
}