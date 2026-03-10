"use client";

import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import {
  getPatientServiceArea,
  mockPatients,
  type ExamRecord,
  type PatientRecord,
  type ServiceArea,
} from "../_data/clinical-mock-data";

type LabTrendPoint = {
  date: string;
  hemoglobin: number;
  glucose: number;
  creatinine: number;
};

const examProfiles = [
  {
    id: "profile-1",
    name: "Perfil metabolico",
    tests: ["Glucosa", "Urea", "Creatinina", "Electrolitos"],
    estimatedTurnaround: "2 horas",
  },
  {
    id: "profile-2",
    name: "Perfil hepatico",
    tests: ["AST", "ALT", "Bilirrubina", "Fosfatasa alcalina"],
    estimatedTurnaround: "3 horas",
  },
  {
    id: "profile-3",
    name: "Perfil cardiovascular",
    tests: ["Troponina", "CK-MB", "BNP", "ECG"],
    estimatedTurnaround: "90 min",
  },
];

export default function LisRisPage() {
  const [areaFilter, setAreaFilter] = useState<"all" | ServiceArea>("all");

  const patientsByArea = useMemo(
    () =>
      areaFilter === "all"
        ? mockPatients
        : mockPatients.filter((patient) => getPatientServiceArea(patient) === areaFilter),
    [areaFilter]
  );

  const {
    search,
    setSearch,
    selectedPatientId,
    setSelectedPatientId,
    filteredPatients,
    selectedPatient,
  } = usePatientSelection(patientsByArea);

  const examRows = useMemo(
    () =>
      patientsByArea.flatMap((patient) =>
        patient.exams.map((exam) => ({ patient, exam }))
      ),
    [patientsByArea]
  );
  const pending = examRows.filter((row) => row.exam.status === "Pendiente");
  const critical = examRows.filter((row) => isCriticalExam(row.exam));
  const imaging = examRows.filter((row) => row.exam.category === "Imagenologia");
  const selectedPatientExams = selectedPatient?.exams ?? [];
  const selectedPatientCritical = selectedPatientExams.filter((exam) => isCriticalExam(exam));
  const selectedPatientImaging = selectedPatientExams.filter(
    (exam) => exam.category === "Imagenologia"
  );
  const selectedTrend = useMemo(
    () => (selectedPatient ? buildPatientTrend(selectedPatient) : []),
    [selectedPatient]
  );

  return (
    <ModulePage
      title="LIS / RIS"
      subtitle="Seleccion por sala/paciente para solicitudes, resultados, criticidad y tendencias de laboratorio e imagenes."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Sala / area asistencial
        </label>
        <select
          value={areaFilter}
          onChange={(event) => setAreaFilter(event.target.value as "all" | ServiceArea)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none sm:max-w-sm"
        >
          <option value="all">Todas las areas</option>
          <option value="Emergencia">Emergencia</option>
          <option value="Observacion">Observacion</option>
          <option value="Hospitalizacion">Hospitalizacion</option>
          <option value="Consulta externa">Consulta externa</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Examenes totales" value={examRows.length} hint="Laboratorio e imagenologia" />
        <StatCard label="Pendientes" value={pending.length} hint="Sin resultado validado" />
        <StatCard label="Criticos" value={critical.length} hint="Requieren notificacion inmediata" />
        <StatCard label="Imagenes" value={imaging.length} hint="Integradas con referencia PACS" />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : patientsByArea}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Seleccion de paciente para LIS/RIS"
        subtitle="Elige el paciente de la sala/area para ver sus examenes, resultados y tendencias."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Solicitud por perfiles" subtitle="Ordenes estandarizadas para reducir errores y acelerar tiempos">
          <div className="space-y-2">
            {examProfiles.map((profile) => (
              <article key={profile.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{profile.name}</p>
                <p className="text-[11px] text-slate-600">{profile.tests.join(", ")}</p>
                <p className="text-[11px] text-slate-500">Tiempo esperado: {profile.estimatedTurnaround}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Resultados criticos del paciente seleccionado"
          subtitle="Marcadores de alarma con notificacion inmediata al medico tratante"
        >
          <div className="space-y-2">
            {!selectedPatient ? (
              <p className="text-xs text-slate-500">Selecciona un paciente para ver resultados criticos.</p>
            ) : selectedPatientCritical.length === 0 ? (
              <p className="text-xs text-slate-500">
                {selectedPatient.fullName} no tiene resultados criticos en este momento.
              </p>
            ) : (
              selectedPatientCritical.map((exam) => (
                <article key={exam.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{selectedPatient.fullName}</p>
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      Critico
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {exam.name} · {exam.category} · Estado {exam.status}
                  </p>
                  <p className="text-[11px] text-slate-600">{exam.summary}</p>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Tendencia de laboratorio del paciente" subtitle="Evolucion temporal de Hb, glucosa y creatinina">
          <div className="space-y-2">
            {!selectedPatient ? (
              <p className="text-xs text-slate-500">Selecciona un paciente para visualizar tendencia.</p>
            ) : (
              selectedTrend.map((point) => (
                <article key={point.date} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-900">{point.date}</p>
                  <p className="text-[11px] text-slate-500">
                    Hemoglobina: {point.hemoglobin} g/dL (ref 12-16) · Glucosa: {point.glucose} mg/dL (ref 70-110)
                  </p>
                  <p className="text-[11px] text-slate-600">Creatinina: {point.creatinine} mg/dL (ref 0.6-1.2)</p>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Imagenes y RIS/PACS del paciente" subtitle="Estado de estudios, informe radiologico y acceso al visor">
          <div className="space-y-2">
            {!selectedPatient ? (
              <p className="text-xs text-slate-500">Selecciona un paciente para ver estudios de imagen.</p>
            ) : selectedPatientImaging.length === 0 ? (
              <p className="text-xs text-slate-500">
                {selectedPatient.fullName} no tiene imagenes registradas en esta jornada.
              </p>
            ) : (
              selectedPatientImaging.map((study) => (
                <article key={study.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{selectedPatient.fullName}</p>
                    <span
                      className={[
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        study.status === "Validado"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {study.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{study.name}</p>
                  <p className="text-[11px] text-slate-600">{study.summary}</p>
                  <p className="text-[11px] text-slate-500">
                    PACS interno / estudio {study.id.toUpperCase()}
                  </p>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function isCriticalExam(exam: ExamRecord) {
  const text = `${exam.name} ${exam.summary} ${exam.observations}`.toLowerCase();
  const keywords = ["critico", "elevad", "hiper", "alarma", "urgente", "alto riesgo"];

  return keywords.some((keyword) => text.includes(keyword));
}

function buildPatientTrend(patient: PatientRecord): LabTrendPoint[] {
  const latest = patient.vitalSigns[0];
  const glucoseBase = latest?.glucose ?? 110;

  return [
    { date: "2026-03-07", hemoglobin: 13.2, glucose: Math.max(glucoseBase + 30, 80), creatinine: 0.92 },
    { date: "2026-03-08", hemoglobin: 12.8, glucose: Math.max(glucoseBase + 20, 80), creatinine: 0.98 },
    { date: "2026-03-09", hemoglobin: 12.5, glucose: Math.max(glucoseBase + 10, 80), creatinine: 1.03 },
    { date: "2026-03-10", hemoglobin: 12.2, glucose: glucoseBase, creatinine: 1.08 },
  ];
}

