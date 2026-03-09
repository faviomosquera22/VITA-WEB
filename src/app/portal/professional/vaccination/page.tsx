"use client";

import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import {
  currentClinicalContext,
  getCenterVaccineInventory,
  getTotalPendingVaccines,
  healthCenters,
  mockPatients,
  vaccineInventory,
} from "../_data/clinical-mock-data";

export default function VaccinationPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);
  const [centerId, setCenterId] = useState(currentClinicalContext.centerId);
  const [campaignFilter, setCampaignFilter] = useState<"all" | string>("all");

  const pendingCount = getTotalPendingVaccines();
  const appliedCount = mockPatients.reduce(
    (count, patient) => count + patient.vaccination.applied.length,
    0
  );

  const currentCenterInventory = useMemo(() => {
    const rows = getCenterVaccineInventory(centerId);
    if (campaignFilter === "all") {
      return rows;
    }
    return rows.filter((item) => item.campaign === campaignFilter);
  }, [centerId, campaignFilter]);

  const campaignOptions = useMemo(
    () => Array.from(new Set(vaccineInventory.map((item) => item.campaign))),
    []
  );

  return (
    <ModulePage
      title="Vacunacion"
      subtitle="Busqueda por paciente, registro de dosis aplicada y control de disponibilidad por centro."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Vacunas aplicadas" value={appliedCount} hint="Historial administrado" />
        <StatCard label="Vacunas pendientes" value={pendingCount} hint="Esquema por completar" />
        <StatCard
          label="Con esquemas incompletos"
          value={mockPatients.filter((patient) => patient.vaccination.pending.length > 0).length}
          hint="Pacientes con seguimiento"
        />
        <StatCard
          label="Stock agotado"
          value={currentCenterInventory.filter((item) => item.status === "Agotada").length}
          hint="Vacunas no disponibles"
        />
      </div>

      <Panel
        title="Disponibilidad por centro de salud"
        subtitle="Selecciona centro y revisa stock actualizado de vacunas"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">Centro de salud</label>
            <select
              value={centerId}
              onChange={(event) => setCenterId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              {healthCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">Campania / grupo</label>
            <select
              value={campaignFilter}
              onChange={(event) => setCampaignFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              <option value="all">Todas</option>
              {campaignOptions.map((campaign) => (
                <option key={campaign} value={campaign}>
                  {campaign}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actualizacion</p>
            <p className="mt-0.5">{currentCenterInventory[0]?.updatedAt ?? "Sin datos"}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {currentCenterInventory.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.vaccine}</p>
                  <p className="text-xs text-slate-600">
                    Campania: {item.campaign} · Grupo: {item.targetGroup}
                  </p>
                  <p className="text-[11px] text-slate-500">Observaciones: {item.notes}</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>Stock: {item.stock}</p>
                  <span
                    className={[
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      item.status === "Disponible"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.status === "Baja disponibilidad"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    ].join(" ")}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
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
        title="Busqueda de paciente para vacunacion"
        subtitle="Selecciona paciente para ver esquema, pendientes y registrar nueva aplicacion."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global por paciente" subtitle="Esquemas completos/incompletos y alertas de atraso">
        <div className="space-y-2">
          {filteredPatients.map((patient) => (
            <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
              <p className="text-xs text-slate-600">
                Aplicadas: {patient.vaccination.applied.length} · Pendientes: {patient.vaccination.pending.length}
              </p>
              <div className="mt-1 space-y-1 text-[11px] text-slate-500">
                {patient.vaccination.pending.length === 0 ? (
                  <p>Sin pendientes de vacunacion.</p>
                ) : (
                  patient.vaccination.pending.map((entry) => (
                    <p key={`${entry.vaccine}-${entry.suggestedDate}`}>
                      {entry.vaccine} · {entry.suggestedDate} · {entry.availability}
                    </p>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: registro de vacuna aplicada"
          subtitle="Formulario estructurado para aplicacion, lote, via, responsable y eventos adversos"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Paciente" value={selectedPatient.fullName} />
            <Field label="Vacuna sugerida" value={selectedPatient.vaccination.pending[0]?.vaccine ?? "Sin pendientes"} />
            <Field label="Dosis" value="Primera / Refuerzo" />
            <Field label="Fecha aplicacion" value="2026-03-08" />
            <Field label="Lote" value="L-2026-00X" />
            <Field label="Via" value="Intramuscular" />
            <Field label="Sitio aplicacion" value="Deltoides" />
            <Field label="Responsable" value={currentClinicalContext.professionalName} />
            <Field
              label="Centro de salud"
              value={healthCenters.find((center) => center.id === centerId)?.name ?? centerId}
            />
            <Field label="Eventos adversos" value="Sin eventos inmediatos" />
            <Field label="Observaciones" value="Paciente informado sobre vigilancia post vacuna." />
            <Field
              label="Alerta stock"
              value={
                currentCenterInventory.some((item) => item.status === "Agotada")
                  ? "Hay vacunas indicadas sin stock"
                  : "Stock disponible"
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Registrar vacuna aplicada
            </button>
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Actualizar stock del centro
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
