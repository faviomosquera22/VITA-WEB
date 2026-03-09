"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function MedicationPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const medicationRows = useMemo(
    () =>
      filteredPatients.flatMap((patient) =>
        patient.medicationRecords.map((record) => ({
          patient,
          record,
        }))
      ),
    [filteredPatients]
  );

  const pending = medicationRows.filter((item) => item.record.administrationStatus === "Pendiente");
  const omissions = medicationRows.filter((item) => item.record.administrationStatus === "Omitido");

  return (
    <ModulePage
      title="Medicacion"
      subtitle="Gestion de tratamientos activos, administraciones pendientes y seguridad farmacologica."
      actions={
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Agregar medicamento
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Ordenes activas" value={medicationRows.length} hint="Registros farmacologicos vigentes" />
        <StatCard label="Pendientes" value={pending.length} hint="Por administrar" />
        <StatCard label="Omisiones" value={omissions.length} hint="Requieren seguimiento" />
        <StatCard
          label="Alto riesgo"
          value={medicationRows.filter((item) => item.record.name.toLowerCase().includes("insulina")).length}
          hint="Medicamentos con vigilancia reforzada"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para medicacion"
        subtitle="Selecciona paciente para registrar dosis, horario, via y adherencia."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de medicacion" subtitle="Pendientes, cambios recientes y estados de administracion">
        <div className="space-y-2">
          {medicationRows.map(({ patient, record }) => (
            <article key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {record.name} · {record.dose}
                  </p>
                  <p className="text-xs text-slate-600">
                    {patient.fullName} · {record.frequency} · Via {record.route}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Horario: {record.schedule} · Inicio: {record.startDate}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Indicacion: {record.indication} · Prescribe: {record.prescriber}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-1 text-[11px] md:items-end">
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 font-semibold",
                      record.administrationStatus === "Pendiente"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : record.administrationStatus === "Administrado"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    ].join(" ")}
                  >
                    {record.administrationStatus}
                  </span>
                  <span className="text-slate-600">Adherencia: {record.adherence}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: plan farmacologico"
          subtitle="Edicion de dosis/frecuencia/via, registro de administracion y observaciones"
        >
          <div className="space-y-2">
            {selectedPatient.medicationRecords.map((record) => (
              <article key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <MedicationField label="Farmaco" value={record.name} />
                  <MedicationField label="Presentacion / dosis" value={record.dose} />
                  <MedicationField label="Frecuencia" value={record.frequency} />
                  <MedicationField label="Via" value={record.route} />
                  <MedicationField label="Horario" value={record.schedule} />
                  <MedicationField label="Indicacion" value={record.indication} />
                  <MedicationField label="Estado" value={record.administrationStatus} />
                  <MedicationField label="Adherencia" value={record.adherence} />
                  <MedicationField label="Prescriptor" value={record.prescriber} />
                  <MedicationField label="Inicio" value={record.startDate} />
                  <MedicationField label="Suspension" value={record.endDate ?? "Activa"} />
                  <MedicationField label="Observaciones" value={record.notes} />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-slate-700 md:grid-cols-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              Alertas de medicacion pendiente o vencida.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Historial de administracion por turno.
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              Vigilancia de reacciones adversas y alergias.
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Marcar administracion
            </button>
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Registrar reaccion adversa
            </button>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function MedicationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}
