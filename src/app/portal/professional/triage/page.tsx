"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage, Panel, RiskBadge, StatCard, TriageBadge } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients, type TriageColor } from "../_data/clinical-mock-data";

export default function TriagePage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);
  const [triageFilter, setTriageFilter] = useState<"all" | TriageColor>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "alto" | "medio" | "bajo">("all");

  const triageQueue = useMemo(() => {
    return filteredPatients.filter((patient) => {
      if (triageFilter !== "all" && patient.triageColor !== triageFilter) {
        return false;
      }
      if (riskFilter !== "all" && patient.riskLevel !== riskFilter) {
        return false;
      }
      return true;
    });
  }, [filteredPatients, riskFilter, triageFilter]);

  const urgent = triageQueue.filter(
    (patient) => patient.triageColor === "rojo" || patient.triageColor === "naranja"
  );

  return (
    <ModulePage
      title="Triaje"
      subtitle="Clasificacion global y registro orientativo por paciente con seguimiento de reevaluaciones."
      actions={
        <Link
          href="/portal/professional/patients"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Ver pacientes
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pacientes clasificados" value={triageQueue.length} hint="Cola segun filtros activos" />
        <StatCard label="Urgencia alta" value={urgent.length} hint="Triage rojo y naranja" />
        <StatCard
          label="No reevaluados"
          value={triageQueue.filter((patient) => patient.currentStatus === "En observacion").length}
          hint="Priorizar reevaluacion"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        rightSlot={
          <div className="flex gap-2">
            <select
              value={triageFilter}
              onChange={(event) => setTriageFilter(event.target.value as "all" | TriageColor)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700"
            >
              <option value="all">Todo color</option>
              <option value="rojo">Rojo</option>
              <option value="naranja">Naranja</option>
              <option value="amarillo">Amarillo</option>
              <option value="verde">Verde</option>
              <option value="azul">Azul</option>
            </select>
            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value as "all" | "alto" | "medio" | "bajo")
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700"
            >
              <option value="all">Todo riesgo</option>
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </div>
        }
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de clasificacion" subtitle="Pacientes ordenados por prioridad y estado de reevaluacion">
        <div className="space-y-2">
          {triageQueue.map((patient) => (
            <article
              key={patient.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-xs text-slate-600">{patient.triageAssessment.consultationReason}</p>
                  <p className="text-[11px] text-slate-500">
                    Clasificado: {patient.triageAssessment.evaluatedAt} · Profesional: {patient.assignedProfessional}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Conducta sugerida: {patient.triageAssessment.suggestedConduct}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge risk={patient.riskLevel} />
                  <TriageBadge triage={patient.triageColor} />
                  {patient.currentStatus === "En observacion" ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Requiere reevaluacion
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: evaluacion y reevaluacion"
          subtitle="Registro estructurado de triaje inicial, reclasificacion y conducta"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 lg:grid-cols-2">
            <Field label="Motivo de consulta" value={selectedPatient.triageAssessment.consultationReason} />
            <Field label="Sintomas actuales" value={selectedPatient.triageAssessment.symptoms.join(", ")} />
            <Field label="Signos de alarma" value={selectedPatient.triageAssessment.warningSigns.join(", ")} />
            <Field label="Tiempo de evolucion" value={selectedPatient.triageAssessment.evolutionTime} />
            <Field label="Nivel de prioridad" value={selectedPatient.triageAssessment.riskClassification} />
            <Field label="Color de triaje" value={selectedPatient.triageAssessment.triageColor} />
            <Field label="Conducta sugerida" value={selectedPatient.triageAssessment.suggestedConduct} />
            <Field label="Derivacion" value={selectedPatient.triageAssessment.referral} />
            <Field label="Observaciones" value={selectedPatient.triageAssessment.professionalObservations} />
            <Field label="Hora clasificacion" value={selectedPatient.triageAssessment.evaluatedAt} />
            <Field label="Tiempo desde ultima evaluacion" value="< 24 horas (estimado)" />
            <Field label="Historial de reclasificacion" value="2 registros en linea de tiempo" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Registrar reevaluacion
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Guardar clasificacion
            </button>
            <Link
              href={`/portal/professional/patients/${selectedPatient.id}?tab=triage`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Abrir ficha completa
            </Link>
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
