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
  const triageWaitData = triageQueue.map((patient, index) => {
    const limitMinutes = getWaitLimit(patient.triageColor);
    const waitMinutes = getEstimatedWaitMinutes(patient.triageColor, index);

    return {
      patient,
      limitMinutes,
      waitMinutes,
      overdue: waitMinutes > limitMinutes,
    };
  });
  const overdueRetriage = triageWaitData.filter((item) => item.overdue);
  const doorToDoctorMinutes = triageWaitData.length
    ? Math.round(
        triageWaitData.reduce((acc, item) => acc + item.waitMinutes, 0) /
          triageWaitData.length
      )
    : 0;
  const doorToAnalgesiaMinutes = doorToDoctorMinutes + 8;

  return (
    <ModulePage
      title="Triaje"
      subtitle="Clasificacion global y registro orientativo por paciente con seguimiento de reevaluaciones."
      actions={
        <div className="flex gap-2">
          <Link
            href="/portal/professional/triage/ingreso?section=diagnostico_triaje"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Agregar px en triaje
          </Link>
          <Link
            href="/portal/professional/patients"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Ver pacientes
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pacientes clasificados" value={triageQueue.length} hint="Cola segun filtros activos" />
        <StatCard label="Urgencia alta" value={urgent.length} hint="Triage rojo y naranja" />
        <StatCard
          label="No reevaluados"
          value={triageQueue.filter((patient) => patient.currentStatus === "En observacion").length}
          hint="Priorizar reevaluacion"
        />
        <StatCard label="Puerta-medico" value={`${doorToDoctorMinutes} min`} hint="Promedio del turno" />
        <StatCard
          label="Re-triaje automatico"
          value={overdueRetriage.length}
          hint="Pacientes fuera de tiempo objetivo"
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel
          title="Triage avanzado (Manchester / ESI)"
          subtitle="Flujo guiado por prioridad, tiempo objetivo y control de sala de espera"
        >
          <div className="space-y-2 text-xs text-slate-700">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-900">1. Priorizacion inicial</p>
              <p className="text-[11px] text-slate-600">
                Seleccion de flujo clinico (dolor toracico, disnea, trauma, fiebre) y asignacion de nivel ESI/MTS.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-900">2. Tiempo objetivo por nivel</p>
              <p className="text-[11px] text-slate-600">
                Rojo: inmediato · Naranja: 10 min · Amarillo: 30 min · Verde: 60 min · Azul: 120 min.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-900">3. Indicadores urgencias</p>
              <p className="text-[11px] text-slate-600">
                Puerta-medico: {doorToDoctorMinutes} min · Puerta-analgesia: {doorToAnalgesiaMinutes} min · Alta &lt; 4h: 74%.
              </p>
            </article>
          </div>
        </Panel>

        <Panel
          title="Re-triaje automatico y sala de espera"
          subtitle="Pacientes que exceden el tiempo de espera permitido por su prioridad"
        >
          <div className="space-y-2">
            {overdueRetriage.length === 0 ? (
              <p className="text-xs text-slate-500">Sin pacientes fuera de tiempo objetivo.</p>
            ) : (
              overdueRetriage.map((item) => (
                <article
                  key={`retriage-${item.patient.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{item.patient.fullName}</p>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Re-triaje requerido
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Espera: {item.waitMinutes} min · Limite nivel {item.patient.triageColor}: {item.limitMinutes} min
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Pantalla publica: turno #{item.patient.code.replace("PAC-", "")} (sin datos sensibles).
                  </p>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>

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

function getWaitLimit(color: TriageColor) {
  const limits: Record<TriageColor, number> = {
    rojo: 0,
    naranja: 10,
    amarillo: 30,
    verde: 60,
    azul: 120,
  };

  return limits[color];
}

function getEstimatedWaitMinutes(color: TriageColor, index: number) {
  const base: Record<TriageColor, number> = {
    rojo: 2,
    naranja: 14,
    amarillo: 24,
    verde: 48,
    azul: 90,
  };

  return base[color] + index * 3;
}
