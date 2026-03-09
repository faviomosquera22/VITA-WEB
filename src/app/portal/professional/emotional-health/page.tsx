"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function EmotionalHealthPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const withAlerts = useMemo(
    () => filteredPatients.filter((patient) => patient.emotionalHealth.emotionalAlerts.length > 0),
    [filteredPatients]
  );

  return (
    <ModulePage
      title="Salud emocional"
      subtitle="Seguimiento emocional global y registro individual de estado de animo, estres e intervencion."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Pacientes evaluados" value={filteredPatients.length} hint="Con registro emocional" />
        <StatCard label="Alertas emocionales" value={withAlerts.length} hint="Requieren seguimiento" />
        <StatCard
          label="Riesgo psicoemocional"
          value={withAlerts.filter((patient) => patient.riskLevel !== "bajo").length}
          hint="Cruce con riesgo clinico"
        />
        <StatCard
          label="Intervenciones registradas"
          value={filteredPatients.reduce((sum, patient) => sum + patient.emotionalHealth.moodFollowUp.length, 0)}
          hint="Registros de animo"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para salud emocional"
        subtitle="Selecciona paciente para seguimiento emocional, recomendaciones y alertas."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global emocional" subtitle="Estado actual, alertas y cambios recientes por paciente">
        <div className="space-y-2">
          {filteredPatients.map((patient) => (
            <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
              <p className="text-xs text-slate-600">
                Estado actual: {patient.emotionalHealth.currentState}
              </p>
              <p className="text-[11px] text-slate-500">
                Alertas: {patient.emotionalHealth.emotionalAlerts.join(", ") || "Sin alertas"}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: seguimiento emocional"
          subtitle="Registro de estado de animo, factores de estres, intervenciones y semaforo emocional"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Estado de animo" value={selectedPatient.emotionalHealth.currentState} />
            <Field label="Ansiedad" value={selectedPatient.emotionalHealth.currentState.includes("Ansiedad") ? "Presente" : "No predominante"} />
            <Field label="Tristeza" value="Sin signos severos" />
            <Field label="Irritabilidad" value="Leve" />
            <Field label="Afrontamiento" value={selectedPatient.summary.emotionalSummary} />
            <Field label="Apoyo familiar" value={selectedPatient.personalData.emergencyContact} />
            <Field label="Intervencion realizada" value={selectedPatient.emotionalHealth.recommendations.join("; ")} />
            <Field label="Semaforo emocional" value={selectedPatient.emotionalHealth.emotionalAlerts.length ? "Amarillo" : "Verde"} />
          </div>

          <div className="mt-3 space-y-2">
            {selectedPatient.emotionalHealth.moodFollowUp.map((entry) => (
              <article key={`${entry.date}-${entry.mood}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{entry.date} · {entry.mood}</p>
                <p className="text-[11px] text-slate-500">Factor de estres: {entry.stressFactor}</p>
                <p className="text-[11px] text-slate-500">{entry.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}
