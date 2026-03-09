"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function CarePlanPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const rows = useMemo(
    () =>
      filteredPatients.flatMap((patient) =>
        patient.carePlan.map((plan) => ({
          patient,
          plan,
        }))
      ),
    [filteredPatients]
  );

  return (
    <ModulePage
      title="Plan de cuidados"
      subtitle="Diagnosticos de enfermeria, objetivos, intervenciones y evaluacion longitudinal."
      actions={
        <Link
          href="/portal/professional/nursing-report"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Abrir PAE NANDA/NIC/NOC
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Planes activos" value={rows.length} hint="Registros de enfermeria" />
        <StatCard label="Pacientes con plan" value={new Set(rows.map((row) => row.patient.id)).size} hint="Cobertura actual" />
        <StatCard
          label="Sin plan"
          value={filteredPatients.filter((patient) => patient.carePlan.length === 0).length}
          hint="Pendiente de formulacion"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para plan de cuidados"
        subtitle="Selecciona paciente para definir diagnosticos, objetivos, intervenciones y evaluacion."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de planes de cuidados" subtitle="Estado de objetivos e intervenciones por paciente">
        <div className="space-y-2">
          {rows.map(({ patient, plan }) => (
            <article key={plan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
              <p className="text-xs text-slate-600">{plan.nursingDiagnosis}</p>
              <p className="text-[11px] text-slate-500">Objetivo: {plan.objective}</p>
              <p className="text-[11px] text-slate-500">Evaluacion: {plan.evaluation}</p>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: plan de cuidados"
          subtitle="Preparado para NANDA/NIC/NOC con observacion estructurada"
        >
          {selectedPatient.carePlan.length === 0 ? (
            <p className="text-xs text-slate-500">No hay plan de cuidados registrado.</p>
          ) : (
            <div className="space-y-2">
              {selectedPatient.carePlan.map((plan) => (
                <article key={plan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p className="text-sm font-semibold text-slate-900">{plan.nursingDiagnosis}</p>
                  <p className="text-[11px] text-slate-500">Objetivo: {plan.objective}</p>
                  <p className="text-[11px] text-slate-500">Intervenciones: {plan.interventions.join("; ")}</p>
                  <p className="text-[11px] text-slate-500">Evaluacion: {plan.evaluation}</p>
                  <p className="text-[11px] text-slate-500">Observaciones: {plan.observations}</p>
                </article>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Agregar plan de cuidados
            </button>
            <Link
              href="/portal/professional/nursing-report"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Vincular con PAE
            </Link>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}
