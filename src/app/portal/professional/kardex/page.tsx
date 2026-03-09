"use client";

import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import {
  getKardexAdministrations,
  mockPatients,
  type KardexAdministrationRecord,
} from "../_data/clinical-mock-data";

type KardexFormState = {
  type: "Infusion" | "Medicacion";
  itemName: string;
  route: string;
  totalVolumeMl: string;
  volumePerHourMl: string;
  durationHours: string;
  startedAt: string;
  responsible: string;
  status: "Activa" | "Completada" | "Suspendida";
  notes: string;
};

const emptyForm: KardexFormState = {
  type: "Infusion",
  itemName: "",
  route: "IV",
  totalVolumeMl: "",
  volumePerHourMl: "",
  durationHours: "",
  startedAt: "",
  responsible: "",
  status: "Activa",
  notes: "",
};

export default function KardexPage() {
  const {
    search,
    setSearch,
    selectedPatientId,
    setSelectedPatientId,
    filteredPatients,
    selectedPatient,
  } = usePatientSelection(mockPatients);

  const [localAdministrationsByPatient, setLocalAdministrationsByPatient] = useState<
    Record<string, KardexAdministrationRecord[]>
  >({});
  const [form, setForm] = useState<KardexFormState>(emptyForm);

  const administrationRows = useMemo(() => {
    return filteredPatients.flatMap((patient) => {
      const base = getKardexAdministrations(patient);
      const local = localAdministrationsByPatient[patient.id] ?? [];

      return [...base, ...local].map((entry) => ({
        patient,
        entry,
      }));
    });
  }, [filteredPatients, localAdministrationsByPatient]);

  const alteredFlowRows = administrationRows.filter(({ entry }) => {
    const administered = Math.min(entry.totalVolumeMl, entry.volumePerHourMl * entry.durationHours);
    return Math.abs(entry.totalVolumeMl - administered) > 300;
  });

  const selectedAdministrations = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return [
      ...getKardexAdministrations(selectedPatient),
      ...(localAdministrationsByPatient[selectedPatient.id] ?? []),
    ];
  }, [localAdministrationsByPatient, selectedPatient]);

  const addAdministration = () => {
    if (!selectedPatient) {
      return;
    }

    if (
      !form.itemName.trim() ||
      !form.totalVolumeMl ||
      !form.volumePerHourMl ||
      !form.durationHours ||
      !form.startedAt.trim() ||
      !form.responsible.trim()
    ) {
      return;
    }

    const newRecord: KardexAdministrationRecord = {
      id: `ka-local-${selectedPatient.id}-${Date.now()}`,
      type: form.type,
      itemName: form.itemName.trim(),
      route: form.route.trim(),
      totalVolumeMl: Number(form.totalVolumeMl),
      volumePerHourMl: Number(form.volumePerHourMl),
      durationHours: Number(form.durationHours),
      startedAt: form.startedAt.trim(),
      responsible: form.responsible.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };

    setLocalAdministrationsByPatient((prev) => ({
      ...prev,
      [selectedPatient.id]: [...(prev[selectedPatient.id] ?? []), newRecord],
    }));

    setForm((prev) => ({
      ...emptyForm,
      route: prev.type === "Infusion" ? "IV" : "SC",
      responsible: prev.responsible,
    }));
  };

  return (
    <ModulePage
      title="Kardex"
      subtitle="Control de infusiones y medicacion administrada por paciente con detalle de volumen, ritmo, horas y responsable."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Registros de administracion" value={administrationRows.length} hint="Infusiones y medicaciones activas" />
        <StatCard
          label="Pacientes con kardex"
          value={new Set(administrationRows.map((row) => row.patient.id)).size}
          hint="Cobertura por turno"
        />
        <StatCard
          label="Flujos por vigilar"
          value={alteredFlowRows.length}
          hint="Diferencia alta entre volumen total y administrado"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para kardex"
        subtitle="Selecciona paciente para revisar y registrar infusiones/medicacion administrada."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel
        title="Vista global de infusiones y medicacion"
        subtitle="Detalle de volumen total, volumen por hora, horas de infusion, via, hora de inicio y responsable"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Volumen total</th>
                <th className="px-3 py-2">Volumen/hora</th>
                <th className="px-3 py-2">Horas</th>
                <th className="px-3 py-2">Via</th>
                <th className="px-3 py-2">Hora colocacion</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {administrationRows.map(({ patient, entry }) => (
                <tr key={`${patient.id}-${entry.id}`}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="text-[11px] text-slate-500">{patient.primaryDiagnosis}</p>
                  </td>
                  <td className="px-3 py-2">{entry.type}</td>
                  <td className="px-3 py-2">{entry.itemName}</td>
                  <td className="px-3 py-2">{entry.totalVolumeMl} ml</td>
                  <td className="px-3 py-2">{entry.volumePerHourMl} ml/h</td>
                  <td className="px-3 py-2">{entry.durationHours} h</td>
                  <td className="px-3 py-2">{entry.route}</td>
                  <td className="px-3 py-2">{entry.startedAt}</td>
                  <td className="px-3 py-2">{entry.responsible}</td>
                  <td className="px-3 py-2">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: kardex de administraciones"
          subtitle="Incluye volumen administrado estimado, tiempo total, via y responsable"
        >
          {selectedAdministrations.length === 0 ? (
            <p className="text-xs text-slate-500">No hay administraciones registradas para este paciente.</p>
          ) : (
            <div className="space-y-2">
              {selectedAdministrations.map((entry) => {
                const administered = Math.min(
                  entry.totalVolumeMl,
                  entry.volumePerHourMl * entry.durationHours
                );

                return (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                  >
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                      <Field label="Tipo" value={entry.type} />
                      <Field label="Item" value={entry.itemName} />
                      <Field label="Volumen total" value={`${entry.totalVolumeMl} ml`} />
                      <Field label="Volumen por hora" value={`${entry.volumePerHourMl} ml/h`} />
                      <Field label="Duracion" value={`${entry.durationHours} horas`} />
                      <Field label="Volumen administrado" value={`${administered} ml`} />
                      <Field label="Via" value={entry.route} />
                      <Field label="Hora de colocacion" value={entry.startedAt} />
                      <Field label="Responsable" value={entry.responsible} />
                      <Field label="Estado" value={entry.status} />
                    </div>
                    {entry.notes ? (
                      <p className="mt-2 text-[11px] text-slate-500">Observacion: {entry.notes}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-900">Registrar administracion en Kardex</p>
            <p className="text-[11px] text-slate-500">
              Completa datos de infusion o medicacion: volumen total, volumen por hora, horas, via, hora y responsable.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <InputSelect
                label="Tipo"
                value={form.type}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value as KardexFormState["type"],
                    route: value === "Infusion" ? "IV" : "SC",
                  }))
                }
                options={["Infusion", "Medicacion"]}
              />
              <InputText
                label="Item"
                value={form.itemName}
                onChange={(value) => setForm((prev) => ({ ...prev, itemName: value }))}
                placeholder="Ej. SSN 0.9% / Insulina regular"
              />
              <InputText
                label="Volumen total (ml)"
                value={form.totalVolumeMl}
                onChange={(value) => setForm((prev) => ({ ...prev, totalVolumeMl: value }))}
                placeholder="1000"
              />
              <InputText
                label="Volumen por hora (ml/h)"
                value={form.volumePerHourMl}
                onChange={(value) => setForm((prev) => ({ ...prev, volumePerHourMl: value }))}
                placeholder="80"
              />
              <InputText
                label="Duracion (horas)"
                value={form.durationHours}
                onChange={(value) => setForm((prev) => ({ ...prev, durationHours: value }))}
                placeholder="12"
              />
              <InputText
                label="Via"
                value={form.route}
                onChange={(value) => setForm((prev) => ({ ...prev, route: value }))}
                placeholder="IV / VO / SC"
              />
              <InputText
                label="Hora de colocacion"
                value={form.startedAt}
                onChange={(value) => setForm((prev) => ({ ...prev, startedAt: value }))}
                placeholder="2026-03-08 14:00"
              />
              <InputText
                label="Responsable"
                value={form.responsible}
                onChange={(value) => setForm((prev) => ({ ...prev, responsible: value }))}
                placeholder="Nombre de enfermeria"
              />
              <InputSelect
                label="Estado"
                value={form.status}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, status: value as KardexFormState["status"] }))
                }
                options={["Activa", "Completada", "Suspendida"]}
              />
              <InputText
                label="Observacion"
                value={form.notes}
                onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                placeholder="Comentarios clinicos"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                onClick={addAdministration}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
              >
                Registrar en kardex
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
              >
                Imprimir kardex
              </button>
            </div>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function InputText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
      />
    </div>
  );
}

function InputSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
