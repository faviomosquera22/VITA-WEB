"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function ExamsPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const examRows = useMemo(
    () =>
      filteredPatients.flatMap((patient) =>
        patient.exams.map((exam) => ({
          patient,
          exam,
        }))
      ),
    [filteredPatients]
  );

  const criticalExams = examRows.filter(
    (row) => row.exam.summary.toLowerCase().includes("elevacion") || row.exam.status === "Pendiente"
  );

  return (
    <ModulePage
      title="Examenes"
      subtitle="Vista global y por paciente para solicitud, resultado y criticidad de examenes."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Examenes pendientes" value={examRows.filter((row) => row.exam.status === "Pendiente").length} hint="Sin resultado validado" />
        <StatCard label="Examenes recientes" value={examRows.length} hint="Total en filtros activos" />
        <StatCard label="Examenes criticos" value={criticalExams.length} hint="Alterados o de alto riesgo" />
        <StatCard label="Sin revisar" value={examRows.filter((row) => row.exam.status !== "Validado").length} hint="Requieren seguimiento" />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para examenes"
        subtitle="Selecciona paciente para registrar solicitud, resultado y estado del examen."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de examenes" subtitle="Pendientes, criticos y resultados recientes">
        <div className="space-y-2">
          {examRows.map(({ patient, exam }) => (
            <article key={exam.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{exam.name}</p>
                  <p className="text-xs text-slate-600">{patient.fullName} · {exam.category}</p>
                  <p className="text-[11px] text-slate-500">
                    Solicitado: {exam.requestedAt} · Resultado: {exam.resultAt ?? "Pendiente"}
                  </p>
                  <p className="text-[11px] text-slate-500">{exam.summary}</p>
                </div>
                <span
                  className={[
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    exam.status === "Validado"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : exam.status === "Procesado"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {exam.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: registro de examenes"
          subtitle="Laboratorio, imagenologia, microbiologia, pruebas rapidas, ECG y otros"
        >
          {selectedPatient.exams.length === 0 ? (
            <p className="text-xs text-slate-500">No hay examenes registrados para este paciente.</p>
          ) : (
            <div className="space-y-2">
              {selectedPatient.exams.map((exam) => (
                <article key={exam.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Tipo" value={exam.category} />
                    <Field label="Nombre" value={exam.name} />
                    <Field label="Fecha solicitud" value={exam.requestedAt} />
                    <Field label="Fecha resultado" value={exam.resultAt ?? "Pendiente"} />
                    <Field label="Estado" value={exam.status} />
                    <Field label="Resultado resumido" value={exam.summary} />
                    <Field label="Observaciones" value={exam.observations} />
                    <Field label="Solicitante" value={exam.requestedBy} />
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Registrar examen
            </button>
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Marcar resultado critico
            </button>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}
