"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { getFollowUpQueue, mockPatients } from "../_data/clinical-mock-data";

export default function FollowUpPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const queue = getFollowUpQueue();

  const queueFiltered = useMemo(() => {
    const allowedIds = new Set(filteredPatients.map((patient) => patient.id));
    return queue.filter((item) => allowedIds.has(item.id));
  }, [filteredPatients, queue]);

  return (
    <ModulePage
      title="Seguimiento"
      subtitle="Vista longitudinal global y monitoreo por paciente con controles pendientes y adherencia."
      actions={
        <Link
          href="/portal/professional/reports"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Ir a reportes
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pacientes en seguimiento" value={queueFiltered.length} hint="Con trazabilidad activa" />
        <StatCard
          label="Adherencia adecuada"
          value={queueFiltered.filter((item) => item.adherence === "Adecuada").length}
          hint="Sin eventos pendientes"
        />
        <StatCard
          label="Controles pendientes"
          value={queueFiltered.filter((item) => item.nextControl.includes("24h")).length}
          hint="Requieren accion prioritaria"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para seguimiento"
        subtitle="Selecciona un paciente y revisa evolucion, intervenciones y cumplimiento terapeutico."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de seguimiento" subtitle="Evolucion diagnostica, adherencia y cambios recientes">
        <div className="space-y-2">
          {queueFiltered.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.patientName} · {item.code}
                  </p>
                  <p className="text-xs text-slate-600">{item.diagnosis}</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-slate-500">
                    {item.changes.map((change) => (
                      <li key={change}>• {change}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>Adherencia: {item.adherence}</p>
                  <p>Proximo control: {item.nextControl}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente"
          subtitle="Evolucion cronologica, pendientes del plan y respuesta al tratamiento"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 lg:grid-cols-2">
            <FollowUpField label="Diagnostico principal" value={selectedPatient.primaryDiagnosis} />
            <FollowUpField label="Estado actual" value={selectedPatient.currentStatus} />
            <FollowUpField
              label="Cumplimiento terapeutico"
              value={
                selectedPatient.medicationRecords.every((record) => record.administrationStatus === "Administrado")
                  ? "Adecuado"
                  : "Requiere seguimiento"
              }
            />
            <FollowUpField label="Cambios signos vitales" value={selectedPatient.vitalSigns[0]?.outOfRangeFlags.join(", ") || "Sin cambios criticos"} />
            <FollowUpField label="Cambios nutricionales" value={selectedPatient.nutrition.evolution} />
            <FollowUpField label="Cambios emocionales" value={selectedPatient.emotionalHealth.currentState} />
            <FollowUpField label="Alertas clinicas" value={selectedPatient.activeAlerts.join(", ") || "Sin alertas"} />
            <FollowUpField label="Pendientes del plan" value={selectedPatient.summary.vaccinationPendingSummary.join(", ") || "Sin pendientes"} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Registrar control de seguimiento
            </button>
            <Link
              href={`/portal/professional/patients/${selectedPatient.id}?tab=timeline`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Abrir historial completo
            </Link>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function FollowUpField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}
