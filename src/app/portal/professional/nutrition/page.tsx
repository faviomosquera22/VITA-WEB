"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function NutritionPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const highRisk = useMemo(
    () =>
      filteredPatients.filter((patient) =>
        patient.nutrition.nutritionalRisk.toLowerCase().includes("alto")
      ),
    [filteredPatients]
  );

  const underOrOverWeight = useMemo(
    () =>
      filteredPatients.filter((patient) => {
        const bmi = patient.vitalSigns[0]?.bmi ?? 0;
        return bmi < 18.5 || bmi >= 25;
      }),
    [filteredPatients]
  );

  return (
    <ModulePage
      title="Nutricion"
      subtitle="Riesgo nutricional global y plan de intervencion por paciente."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Pacientes evaluados" value={filteredPatients.length} hint="Con registro nutricional" />
        <StatCard label="Riesgo alto" value={highRisk.length} hint="Prioridad para intervencion" />
        <StatCard label="Bajo peso / sobrepeso" value={underOrOverWeight.length} hint="Desviacion antropometrica" />
        <StatCard
          label="Dieta especial"
          value={filteredPatients.filter((patient) => patient.nutrition.diet !== "Regular").length}
          hint="Con indicacion especifica"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para nutricion"
        subtitle="Selecciona paciente para registrar dieta, tolerancia e ingesta clinica."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global nutricional" subtitle="Riesgo y evolucion por paciente">
        <div className="space-y-2">
          {filteredPatients.map((patient) => (
            <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
              <p className="text-xs text-slate-600">{patient.nutrition.nutritionalStatus}</p>
              <p className="text-[11px] text-slate-500">Dieta: {patient.nutrition.diet}</p>
              <p className="text-[11px] text-slate-500">
                Riesgo: {patient.nutrition.nutritionalRisk} · Ingesta: {patient.nutrition.estimatedIntake}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: control nutricional"
          subtitle="Peso, talla, IMC y plan de alimentacion sin duplicar datos del perfil"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Peso actual" value={`${selectedPatient.vitalSigns[0]?.weightKg ?? "-"} kg`} />
            <Field label="Talla" value={`${selectedPatient.vitalSigns[0]?.heightCm ?? "-"} cm`} />
            <Field label="IMC" value={`${selectedPatient.vitalSigns[0]?.bmi ?? "-"}`} />
            <Field label="Diagnostico nutricional" value={selectedPatient.nutrition.nutritionalStatus} />
            <Field label="Dieta indicada" value={selectedPatient.nutrition.diet} />
            <Field label="Via de alimentacion" value="Oral" />
            <Field label="Tolerancia oral/enteral" value={selectedPatient.nutrition.oralTolerance} />
            <Field label="Apetito / ingesta" value={selectedPatient.nutrition.estimatedIntake} />
            <Field label="Riesgo nutricional" value={selectedPatient.nutrition.nutritionalRisk} />
            <Field label="Observaciones" value={selectedPatient.nutrition.evolution} />
            <Field label="Profesional responsable" value={selectedPatient.assignedProfessional} />
            <Field label="Feedback nutricional" value={selectedPatient.nutrition.recommendations.join("; ")} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Registrar evolucion nutricional
            </button>
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
