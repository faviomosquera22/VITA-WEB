"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { educationResources, mockPatients } from "../_data/clinical-mock-data";

export default function HealthEducationPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const assignedTopics = useMemo(
    () => [
      "Medicacion",
      "Nutricion",
      "Vacunacion",
      "Autocuidado",
      "Signos de alarma",
    ],
    []
  );

  return (
    <ModulePage
      title="Educacion en salud"
      subtitle="Biblioteca educativa global y registro de educacion brindada por paciente."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Recursos activos" value={educationResources.length} hint="Material validado" />
        <StatCard
          label="Campanias"
          value={educationResources.filter((resource) => resource.condition.toLowerCase().includes("salud")).length + 2}
          hint="Prevencion y autocuidado"
        />
        <StatCard label="Temas disponibles" value={assignedTopics.length} hint="Para educacion por paciente" />
        <StatCard label="Pacientes en filtro" value={filteredPatients.length} hint="Listos para asociar educacion" />
      </div>

      <Panel title="Vista global" subtitle="Materiales educativos por condicion y formato">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {educationResources.map((resource) => (
            <article key={resource.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
              <p className="text-xs text-slate-600">{resource.condition}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Formato: {resource.format} · Actualizado: {resource.updatedAt}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para educacion"
        subtitle="Asocia material educativo entregado y registra comprension de paciente/familia."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: educacion brindada"
          subtitle="Tema, fecha, profesional y comprension reportada"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Paciente" value={selectedPatient.fullName} />
            <Field label="Tema" value="Autocuidado y signos de alarma" />
            <Field label="Fecha" value="2026-03-08" />
            <Field label="Profesional" value={selectedPatient.assignedProfessional} />
            <Field label="Comprension" value="Adecuada con apoyo familiar" />
            <Field label="Refuerzo" value="Entregar guia impresa al alta" />
            <Field label="Condicion" value={selectedPatient.primaryDiagnosis} />
            <Field label="Canal" value="Explicacion + material digital" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {assignedTopics.map((topic) => (
              <span key={topic} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                {topic}
              </span>
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
