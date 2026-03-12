"use client";

import { useCallback, useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients, type MedicationRecord, type PatientRecord } from "../_data/clinical-mock-data";

type MedicationDraft = {
  name: string;
  dose: string;
  route: string;
  days: string;
  quantity: string;
  schedule: string;
  frequency: string;
  indication: string;
  notes: string;
};

type MedicationCatalogItem = {
  name: string;
  presentations: string[];
};

const defaultDraft: MedicationDraft = {
  name: "",
  dose: "",
  route: "",
  days: "",
  quantity: "",
  schedule: "",
  frequency: "",
  indication: "",
  notes: "",
};

const routeOptions = ["Oral", "IV", "IM", "SC", "Topica", "Inhalada", "Sublingual", "Rectal"];

export default function MedicationPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState<MedicationDraft>(defaultDraft);
  const [addedByPatient, setAddedByPatient] = useState<Record<string, MedicationRecord[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");

  const medicationCatalog = useMemo<MedicationCatalogItem[]>(() => {
    const fromRecords = mockPatients.flatMap((patient) =>
      patient.medicationRecords.map((record) => ({
        name: record.name.trim(),
        presentation: record.dose.trim(),
      }))
    );
    const extras: Array<{ name: string; presentation: string }> = [
      { name: "Paracetamol", presentation: "500 mg tableta" },
      { name: "Ibuprofeno", presentation: "400 mg tableta" },
      { name: "Omeprazol", presentation: "20 mg capsula" },
      { name: "Ceftriaxona", presentation: "1 g vial" },
      { name: "Metamizol", presentation: "1 g ampolla" },
      { name: "Insulina regular", presentation: "100 UI/mL frasco" },
      { name: "Enoxaparina", presentation: "40 mg/0.4 mL jeringa" },
      { name: "Losartan", presentation: "50 mg tableta" },
      { name: "Metformina", presentation: "850 mg tableta" },
      { name: "Salbutamol", presentation: "100 mcg inhalador" },
    ];

    const index = new Map<string, Set<string>>();
    [...fromRecords, ...extras].forEach((entry) => {
      if (!index.has(entry.name)) {
        index.set(entry.name, new Set<string>());
      }
      if (entry.presentation) {
        index.get(entry.name)?.add(entry.presentation);
      }
    });

    return Array.from(index.entries())
      .map(([name, presentations]) => ({
        name,
        presentations: Array.from(presentations).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredMedicationCatalog = useMemo(() => {
    const normalized = catalogSearch.trim().toLowerCase();
    if (!normalized) {
      return medicationCatalog;
    }

    return medicationCatalog.filter((item) => {
      const terms = `${item.name} ${item.presentations.join(" ")}`.toLowerCase();
      return terms.includes(normalized);
    });
  }, [catalogSearch, medicationCatalog]);

  const getMedicationForPatient = useCallback(
    (patient: PatientRecord) => [
      ...(addedByPatient[patient.id] ?? []),
      ...patient.medicationRecords,
    ],
    [addedByPatient]
  );

  const medicationRows = useMemo(
    () =>
      filteredPatients.flatMap((patient) =>
        getMedicationForPatient(patient).map((record) => ({
          patient,
          record,
        }))
      ),
    [filteredPatients, getMedicationForPatient]
  );

  const selectedPatientMedication = useMemo(() => {
    if (!selectedPatient) {
      return [] as MedicationRecord[];
    }

    return getMedicationForPatient(selectedPatient);
  }, [selectedPatient, getMedicationForPatient]);

  const pending = medicationRows.filter((item) => item.record.administrationStatus === "Pendiente");
  const omissions = medicationRows.filter((item) => item.record.administrationStatus === "Omitido");

  const medicationSelected = draft.name.trim().length > 0;
  const selectedCatalogItem = useMemo(
    () => medicationCatalog.find((item) => item.name === draft.name.trim()) ?? null,
    [medicationCatalog, draft.name]
  );

  const handleAddMedication = () => {
    setFormError(null);
    setFormSuccess(null);

    if (!selectedPatient) {
      setFormError("Selecciona un paciente antes de agregar medicacion.");
      return;
    }

    if (!draft.name.trim()) {
      setFormError("Primero selecciona el medicamento.");
      return;
    }

    if (!draft.dose.trim() || !draft.route.trim() || !draft.days.trim() || !draft.quantity.trim() || !draft.schedule.trim()) {
      setFormError("Completa dosis, via, dias, cantidad y horario.");
      return;
    }

    const days = Number(draft.days);
    const quantity = Number(draft.quantity);

    if (!Number.isFinite(days) || days <= 0) {
      setFormError("Dias debe ser un numero mayor a 0.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Cantidad debe ser un numero mayor a 0.");
      return;
    }

    const startDate = formatDate(new Date());
    const endDate = formatDate(addDays(new Date(), days));

    const newRecord: MedicationRecord = {
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: draft.name.trim(),
      dose: draft.dose.trim(),
      frequency: draft.frequency.trim() || `Durante ${days} dias`,
      route: draft.route.trim(),
      schedule: draft.schedule.trim(),
      startDate,
      endDate,
      indication: draft.indication.trim() || "Indicacion clinica registrada en modulo de medicacion.",
      prescriber: selectedPatient.assignedProfessional,
      adherence: "En seguimiento",
      administrationStatus: "Pendiente",
      notes: [
        `Cantidad prescrita: ${quantity}.`,
        draft.notes.trim() || "Sin observaciones adicionales.",
      ].join(" "),
    };

    setAddedByPatient((prev) => ({
      ...prev,
      [selectedPatient.id]: [newRecord, ...(prev[selectedPatient.id] ?? [])],
    }));

    setDraft(defaultDraft);
    setFormSuccess(`Medicamento agregado para ${selectedPatient.fullName}: ${newRecord.name}.`);
  };

  return (
    <ModulePage
      title="Medicacion"
      subtitle="Gestion de tratamientos activos, administraciones pendientes y seguridad farmacologica."
      actions={
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          {showAddForm ? "Ocultar formulario" : "Agregar medicamento"}
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

      {showAddForm ? (
        <Panel
          title="Nuevo medicamento"
          subtitle="Flujo sugerido: 1) selecciona el medicamento 2) completa dosis, via, dias, cantidad y horario"
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Paso 1</p>
              <p className="mb-2 text-sm font-semibold text-slate-900">Selecciona el medicamento</p>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Buscar medicamento
                </span>
                <input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Ej. paracetamol, 500 mg, vial..."
                />
              </label>

              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-lg border border-sky-100 bg-white p-2">
                {filteredMedicationCatalog.length === 0 ? (
                  <p className="px-2 py-1 text-[11px] text-slate-500">No se encontraron medicamentos.</p>
                ) : (
                  filteredMedicationCatalog.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          name: item.name,
                          dose: prev.dose || item.presentations[0] || "",
                        }))
                      }
                      className={[
                        "w-full rounded-lg border px-2 py-2 text-left transition",
                        draft.name === item.name
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-600">
                        Presentacion: {item.presentations.join(" · ")}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {medicationCatalog.slice(0, 8).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        name: item.name,
                        dose: prev.dose || item.presentations[0] || "",
                      }))
                    }
                    className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] text-sky-700 hover:bg-sky-100"
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {selectedCatalogItem ? (
                <div className="mt-2 rounded-lg border border-sky-200 bg-sky-100 p-2">
                  <p className="text-[11px] font-semibold text-sky-800">
                    Seleccionado: {selectedCatalogItem.name}
                  </p>
                  {selectedCatalogItem.presentations.length > 1 ? (
                    <label className="mt-1 block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                        Presentacion
                      </span>
                      <select
                        value={draft.dose}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            dose: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">Seleccionar presentacion</option>
                        {selectedCatalogItem.presentations.map((presentation) => (
                          <option key={presentation} value={presentation}>
                            {presentation}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-700">
                      Presentacion: {selectedCatalogItem.presentations[0] ?? "No registrada"}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {medicationSelected ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paso 2</p>
                <p className="mb-2 text-sm font-semibold text-slate-900">Completa la prescripcion</p>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <MedicationInput
                    label="Presentacion / dosis"
                    value={draft.dose}
                    onChange={(value) => setDraft((prev) => ({ ...prev, dose: value }))}
                    placeholder="Ej. 500 mg"
                  />

                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Via de administracion
                    </span>
                    <select
                      value={draft.route}
                      onChange={(event) => setDraft((prev) => ({ ...prev, route: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="">Seleccionar</option>
                      {routeOptions.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                  </label>

                  <MedicationInput
                    label="Dias"
                    value={draft.days}
                    onChange={(value) => setDraft((prev) => ({ ...prev, days: value }))}
                    placeholder="Ej. 5"
                    type="number"
                  />

                  <MedicationInput
                    label="Cantidad"
                    value={draft.quantity}
                    onChange={(value) => setDraft((prev) => ({ ...prev, quantity: value }))}
                    placeholder="Ej. 10"
                    type="number"
                  />

                  <MedicationInput
                    label="Horario"
                    value={draft.schedule}
                    onChange={(value) => setDraft((prev) => ({ ...prev, schedule: value }))}
                    placeholder="Ej. 08:00 - 20:00"
                  />

                  <MedicationInput
                    label="Frecuencia (opcional)"
                    value={draft.frequency}
                    onChange={(value) => setDraft((prev) => ({ ...prev, frequency: value }))}
                    placeholder="Ej. Cada 12 horas"
                  />

                  <MedicationInput
                    label="Indicacion (opcional)"
                    value={draft.indication}
                    onChange={(value) => setDraft((prev) => ({ ...prev, indication: value }))}
                    placeholder="Ej. Analgesia"
                  />
                </div>

                <label className="mt-2 block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Observaciones (opcional)
                  </span>
                  <textarea
                    value={draft.notes}
                    onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                    className="min-h-[74px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
                    placeholder="Notas adicionales"
                  />
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Guardar medicamento
                  </button>

                  {selectedPatient ? (
                    <span className="text-[11px] text-slate-500">Paciente actual: {selectedPatient.fullName}</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Selecciona primero el medicamento para continuar al paso 2.
              </p>
            )}

            {formError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
            ) : null}
            {formSuccess ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {formSuccess}
              </p>
            ) : null}
          </div>
        </Panel>
      ) : null}

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
            {selectedPatientMedication.map((record) => (
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

function MedicationInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      />
    </label>
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

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}
