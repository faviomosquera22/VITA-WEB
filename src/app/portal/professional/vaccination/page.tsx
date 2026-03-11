"use client";

import { useMemo, useRef, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import {
  currentClinicalContext,
  healthCenters,
  mockPatients,
  vaccineInventory,
  type PatientRecord,
  type VaccineInventoryRecord,
} from "../_data/clinical-mock-data";

type VaccinationActivity = {
  id: string;
  kind: "Aplicacion" | "Stock";
  detail: string;
  timestamp: string;
};

type VaccinationFeedback = {
  tone: "success" | "error";
  message: string;
};

type MspSchemeRow = {
  stage: string;
  ageRange: string;
  vaccines: string;
  notes: string;
};

const mspNationalScheme: MspSchemeRow[] = [
  {
    stage: "Recien nacido",
    ageRange: "0 dias",
    vaccines: "BCG, Hepatitis B",
    notes: "Aplicacion en sala de parto / neonatologia.",
  },
  {
    stage: "Lactante",
    ageRange: "2, 4 y 6 meses",
    vaccines: "Pentavalente, Polio, Rotavirus, Neumococo",
    notes: "Control pediatrico y verificacion de carnet.",
  },
  {
    stage: "Infancia",
    ageRange: "12 y 18 meses",
    vaccines: "SRP, Fiebre amarilla, Refuerzos DPT/polio",
    notes: "Refuerzo segun antecedentes del nino.",
  },
  {
    stage: "Escolar y adolescente",
    ageRange: "5 a 15 anios",
    vaccines: "Refuerzos Td / VPH (segun cohorte vigente)",
    notes: "Campanias escolares MSP.",
  },
  {
    stage: "Adultos y grupos de riesgo",
    ageRange: ">= 18 anios",
    vaccines: "Influenza, Td, Hepatitis B, Neumococo",
    notes: "Priorizacion por comorbilidades y embarazo.",
  },
];

export default function VaccinationPage() {
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(mockPatients);
  const [inventoryRecords, setInventoryRecords] = useState<VaccineInventoryRecord[]>(vaccineInventory);
  const [centerId, setCenterId] = useState(currentClinicalContext.centerId);
  const [campaignFilter, setCampaignFilter] = useState<"all" | string>("all");
  const [showMspScheme, setShowMspScheme] = useState(false);
  const [showVaccineHistory, setShowVaccineHistory] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [selectedPendingKey, setSelectedPendingKey] = useState<string | null>(null);
  const [highlightRegistration, setHighlightRegistration] = useState(false);
  const [feedback, setFeedback] = useState<VaccinationFeedback | null>(null);
  const [activityLog, setActivityLog] = useState<VaccinationActivity[]>([]);
  const [applicationForm, setApplicationForm] = useState({
    vaccineName: mockPatients[0]?.vaccination.pending[0]?.vaccine ?? "",
    doseType: "Refuerzo",
    date: getTodayDate(),
    lot: "L-2026-00X",
    route: "Intramuscular",
    site: "Deltoides",
    adverseEvents: "",
    observations: "Paciente informado sobre vigilancia post vacuna.",
  });
  const [stockForm, setStockForm] = useState({
    inventoryId: "",
    delta: "",
    note: "",
  });
  const {
    search,
    setSearch,
    selectedPatientId,
    setSelectedPatientId,
    filteredPatients,
    selectedPatient,
  } = usePatientSelection(patientRecords);

  const pendingCount = patientRecords.reduce(
    (count, patient) => count + patient.vaccination.pending.length,
    0
  );
  const appliedCount = patientRecords.reduce(
    (count, patient) => count + patient.vaccination.applied.length,
    0
  );

  const currentCenterInventory = useMemo(() => {
    const rows = inventoryRecords.filter((item) => item.centerId === centerId);
    if (campaignFilter === "all") {
      return rows;
    }
    return rows.filter((item) => item.campaign === campaignFilter);
  }, [campaignFilter, centerId, inventoryRecords]);

  const campaignOptions = useMemo(
    () => Array.from(new Set(inventoryRecords.map((item) => item.campaign))),
    [inventoryRecords]
  );

  const currentCenterName =
    healthCenters.find((center) => center.id === centerId)?.name ?? centerId;

  const suggestedVaccine = selectedPatient?.vaccination.pending[0]?.vaccine ?? "";
  const stockMatchForApplication = useMemo(() => {
    if (!applicationForm.vaccineName.trim()) {
      return null;
    }
    return (
      currentCenterInventory.find((item) =>
        isSameVaccineName(item.vaccine, applicationForm.vaccineName)
      ) ?? null
    );
  }, [applicationForm.vaccineName, currentCenterInventory]);
  const activeInventoryId = stockForm.inventoryId || currentCenterInventory[0]?.id || "";
  const stockRowSelected =
    currentCenterInventory.find((item) => item.id === activeInventoryId) ?? null;
  const registrationPanelRef = useRef<HTMLDivElement | null>(null);
  const pendingVaccinesOrdered = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return [...selectedPatient.vaccination.pending].sort((a, b) =>
      a.suggestedDate.localeCompare(b.suggestedDate)
    );
  }, [selectedPatient]);
  const vaccinationHistoryRows = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return [...selectedPatient.vaccination.applied]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((entry) => ({
        vaccine: entry.vaccine,
        date: entry.date,
        dose:
          extractVaccinationTag(entry.observations, "Dosis")?.split("·")[0].trim() ??
          "No registrada",
        center: extractVaccinationTag(entry.observations, "Centro") ?? "No registrado",
        lot: entry.lot ?? "No registrado",
        observations: entry.observations,
      }));
  }, [selectedPatient]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = patientRecords.find((entry) => entry.id === patientId);
    const nextSuggested = patient?.vaccination.pending[0]?.vaccine ?? "";
    setApplicationForm((prev) => ({
      ...prev,
      vaccineName: nextSuggested || prev.vaccineName,
    }));
    setSelectedPendingKey(null);
    setSelectionNotice(null);
    setHighlightRegistration(false);
    setShowVaccineHistory(false);
    setFeedback(null);
  };

  const selectPendingForApplication = (entry: {
    vaccine: string;
    suggestedDate: string;
    availability: string;
  }) => {
    const pendingKey = `${entry.vaccine}-${entry.suggestedDate}`;
    setSelectedPendingKey(pendingKey);
    setSelectionNotice(
      `Vacuna ${entry.vaccine} cargada en el formulario. Revisa dosis/fecha y confirma registro.`
    );
    setFeedback(null);
    setApplicationForm((prev) => ({
      ...prev,
      vaccineName: entry.vaccine,
      date: normalizeDateInput(entry.suggestedDate) ?? prev.date,
      doseType: inferDoseType(entry.vaccine, prev.doseType),
    }));

    const stockCandidate = currentCenterInventory.find((item) =>
      isSameVaccineName(item.vaccine, entry.vaccine)
    );
    if (stockCandidate) {
      setStockForm((prev) => ({ ...prev, inventoryId: stockCandidate.id }));
    }

    setHighlightRegistration(true);
    window.setTimeout(() => setHighlightRegistration(false), 1400);
    registrationPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const registerVaccine = () => {
    setFeedback(null);

    if (!selectedPatient) {
      setFeedback({
        tone: "error",
        message: "Selecciona un paciente para registrar la vacuna.",
      });
      return;
    }

    const vaccineName = applicationForm.vaccineName.trim();
    if (!vaccineName) {
      setFeedback({
        tone: "error",
        message: "Indica la vacuna a registrar.",
      });
      return;
    }

    if (stockMatchForApplication && stockMatchForApplication.stock <= 0) {
      setFeedback({
        tone: "error",
        message: `No hay stock disponible de ${stockMatchForApplication.vaccine} en ${currentCenterName}.`,
      });
      return;
    }

    const appliedDate = applicationForm.date || getTodayDate();
    const timelineTime = getCurrentTimeOnly();
    const observationSummary = [
      applicationForm.observations.trim(),
      applicationForm.adverseEvents.trim()
        ? `Eventos adversos: ${applicationForm.adverseEvents.trim()}`
        : "",
      `Dosis: ${applicationForm.doseType} · Via: ${applicationForm.route} · Sitio: ${applicationForm.site}`,
      `Centro: ${currentCenterName}`,
    ]
      .filter(Boolean)
      .join(" | ");

    setPatientRecords((prev) =>
      prev.map((patient) => {
        if (patient.id !== selectedPatient.id) {
          return patient;
        }

        const pendingIndex = patient.vaccination.pending.findIndex((entry) =>
          isSameVaccineName(entry.vaccine, vaccineName)
        );
        const pendingNext =
          pendingIndex >= 0
            ? patient.vaccination.pending.filter((_, index) => index !== pendingIndex)
            : patient.vaccination.pending;

        return {
          ...patient,
          vaccination: {
            applied: [
              {
                vaccine: vaccineName,
                date: appliedDate,
                lot: applicationForm.lot.trim() || undefined,
                observations: observationSummary,
              },
              ...patient.vaccination.applied,
            ],
            pending: pendingNext,
          },
          summary: {
            ...patient.summary,
            vaccinationPendingSummary: pendingNext.map((entry) => entry.vaccine),
          },
          timeline: [
            {
              id: `tl-vac-${patient.id}-${Date.now()}`,
              datetime: `${appliedDate} ${timelineTime}`,
              category: "Procedimiento",
              detail: `Vacuna aplicada: ${vaccineName} (${applicationForm.doseType}) en ${currentCenterName}.`,
            },
            ...patient.timeline,
          ],
        };
      })
    );

    if (stockMatchForApplication) {
      setInventoryRecords((prev) =>
        prev.map((item) => {
          if (item.id !== stockMatchForApplication.id) {
            return item;
          }

          const stockNext = Math.max(0, item.stock - 1);
          return {
            ...item,
            stock: stockNext,
            status: getStockStatus(stockNext),
            updatedAt: getCurrentTimestamp(),
          };
        })
      );
    }

    const successMessage = `Vacuna ${vaccineName} registrada para ${selectedPatient.fullName}.`;
    setFeedback({ tone: "success", message: successMessage });
    setSelectionNotice(null);
    setSelectedPendingKey(null);
    setActivityLog((prev) =>
      [
        {
          id: `vac-${Date.now()}`,
          kind: "Aplicacion" as const,
          detail: `${successMessage} Centro: ${currentCenterName}.`,
          timestamp: getCurrentTimestamp(),
        },
        ...prev,
      ].slice(0, 8)
    );
  };

  const updateStock = () => {
    setFeedback(null);

    const delta = Math.trunc(Number(stockForm.delta));
    if (!Number.isFinite(delta) || delta === 0) {
      setFeedback({
        tone: "error",
        message: "Ingresa un ajuste de stock valido (positivo o negativo).",
      });
      return;
    }

    if (!activeInventoryId) {
      setFeedback({
        tone: "error",
        message: "Selecciona una vacuna del centro para actualizar stock.",
      });
      return;
    }

    let updatedName = "";
    let updatedStock = 0;

    setInventoryRecords((prev) =>
      prev.map((item) => {
        if (item.id !== activeInventoryId) {
          return item;
        }

        const stockNext = Math.max(0, item.stock + delta);
        updatedName = item.vaccine;
        updatedStock = stockNext;

        return {
          ...item,
          stock: stockNext,
          status: getStockStatus(stockNext),
          updatedAt: getCurrentTimestamp(),
          notes: stockForm.note.trim() || item.notes,
        };
      })
    );

    if (!updatedName) {
      setFeedback({
        tone: "error",
        message: "No se pudo actualizar el stock seleccionado.",
      });
      return;
    }

    const successMessage = `Stock actualizado: ${updatedName} ahora en ${updatedStock} dosis.`;
    setFeedback({ tone: "success", message: successMessage });
    setActivityLog((prev) =>
      [
        {
          id: `stock-${Date.now()}`,
          kind: "Stock" as const,
          detail: `${successMessage} Ajuste: ${delta > 0 ? `+${delta}` : delta}.`,
          timestamp: getCurrentTimestamp(),
        },
        ...prev,
      ].slice(0, 8)
    );
    setStockForm((prev) => ({ ...prev, delta: "", note: "" }));
  };

  return (
    <ModulePage
      title="Vacunacion"
      subtitle="Busqueda por paciente, registro de dosis aplicada y control de disponibilidad por centro."
      actions={
        <button
          type="button"
          onClick={() => setShowMspScheme((prev) => !prev)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          {showMspScheme ? "Ocultar esquema MSP" : "Ver esquema MSP"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Vacunas aplicadas" value={appliedCount} hint="Historial administrado" />
        <StatCard label="Vacunas pendientes" value={pendingCount} hint="Esquema por completar" />
        <StatCard
          label="Con esquemas incompletos"
          value={patientRecords.filter((patient) => patient.vaccination.pending.length > 0).length}
          hint="Pacientes con seguimiento"
        />
        <StatCard
          label="Stock agotado"
          value={currentCenterInventory.filter((item) => item.status === "Agotada").length}
          hint="Vacunas no disponibles"
        />
      </div>

      {showMspScheme ? (
        <Panel
          title="Esquema nacional de vacunacion MSP (referencial)"
          subtitle="Consulta rapida por etapa de vida para apoyo en decision clinica"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Etapa</th>
                  <th className="px-3 py-2 font-semibold">Edad / rango</th>
                  <th className="px-3 py-2 font-semibold">Vacunas sugeridas</th>
                  <th className="px-3 py-2 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mspNationalScheme.map((row) => (
                  <tr key={`${row.stage}-${row.ageRange}`}>
                    <td className="px-3 py-2 text-slate-800">{row.stage}</td>
                    <td className="px-3 py-2 text-slate-700">{row.ageRange}</td>
                    <td className="px-3 py-2 text-slate-700">{row.vaccines}</td>
                    <td className="px-3 py-2 text-slate-600">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

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
        patients={filteredPatients.length ? filteredPatients : patientRecords}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        title="Busqueda de paciente para vacunacion"
        subtitle="Selecciona paciente para ver esquema, pendientes y registrar nueva aplicacion."
        showQuickChips={false}
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}
      {selectedPatient ? (
        <Panel
          title="Vacunas faltantes del paciente seleccionado"
          subtitle="Pendientes ordenadas por fecha sugerida para priorizar aplicacion"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Field
                label="Total faltantes"
                value={`${pendingVaccinesOrdered.length}`}
              />
              <Field
                label="Proxima sugerida"
                value={pendingVaccinesOrdered[0]?.vaccine ?? "No aplica"}
              />
              <Field
                label="Fecha proxima"
                value={pendingVaccinesOrdered[0]?.suggestedDate ?? "No aplica"}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowVaccineHistory((prev) => !prev)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {showVaccineHistory ? "Ocultar historial de vacunas" : "Ver historial de vacunas"}
            </button>
          </div>

          {pendingVaccinesOrdered.length === 0 ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              El paciente no tiene vacunas pendientes registradas.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingVaccinesOrdered.map((entry, index) => (
                <article
                  key={`${entry.vaccine}-${entry.suggestedDate}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {index + 1}. {entry.vaccine}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Fecha sugerida: {entry.suggestedDate} · Lugar sugerido: {entry.availability}
                      </p>
                      <p className="text-[11px] text-slate-500">{entry.observations}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectPendingForApplication(entry)}
                      className={[
                        "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                        selectedPendingKey === `${entry.vaccine}-${entry.suggestedDate}`
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
                      ].join(" ")}
                    >
                      {selectedPendingKey === `${entry.vaccine}-${entry.suggestedDate}`
                        ? "Cargada en formulario"
                        : "Seleccionar para aplicar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {selectionNotice ? (
            <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {selectionNotice}
            </p>
          ) : null}

          {showVaccineHistory ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Historial de vacunas aplicadas
              </p>
              {vaccinationHistoryRows.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">No hay vacunas aplicadas registradas.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Vacuna</th>
                        <th className="px-3 py-2 font-semibold">Dosis</th>
                        <th className="px-3 py-2 font-semibold">Fecha</th>
                        <th className="px-3 py-2 font-semibold">Lugar</th>
                        <th className="px-3 py-2 font-semibold">Lote</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vaccinationHistoryRows.map((row) => (
                        <tr key={`${row.vaccine}-${row.date}-${row.lot}`}>
                          <td className="px-3 py-2 text-slate-800">{row.vaccine}</td>
                          <td className="px-3 py-2 text-slate-700">{row.dose}</td>
                          <td className="px-3 py-2 text-slate-700">{row.date}</td>
                          <td className="px-3 py-2 text-slate-700">{row.center}</td>
                          <td className="px-3 py-2 text-slate-600">{row.lot}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {selectedPatient ? (
        <div ref={registrationPanelRef}>
          <Panel
            title="Registro de vacuna aplicada y ajuste de stock"
            subtitle="Flujo operativo: seleccion de vacuna, aplicacion inmediata y control de inventario en el centro"
          >
            <div
              className={[
                "rounded-xl transition",
                highlightRegistration ? "ring-2 ring-sky-300 ring-offset-2" : "",
              ].join(" ")}
            >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Registro de aplicacion
              </p>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                <EditableField label="Paciente" value={selectedPatient.fullName} readOnly />
                <label className="text-[11px] font-semibold text-slate-600">
                  Vacuna
                  <input
                    value={applicationForm.vaccineName}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        vaccineName: event.target.value,
                      }))
                    }
                    placeholder={suggestedVaccine || "Ej. Influenza 2026"}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="text-[11px] font-semibold text-slate-600">
                  Tipo de dosis
                  <select
                    value={applicationForm.doseType}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        doseType: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Primera">Primera</option>
                    <option value="Refuerzo">Refuerzo</option>
                    <option value="Dosis anual">Dosis anual</option>
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-slate-600">
                  Fecha de aplicacion
                  <input
                    type="date"
                    value={applicationForm.date}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <EditableField
                  label="Lote"
                  value={applicationForm.lot}
                  onChange={(value) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      lot: value,
                    }))
                  }
                />
                <EditableField
                  label="Via"
                  value={applicationForm.route}
                  onChange={(value) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      route: value,
                    }))
                  }
                />
                <EditableField
                  label="Sitio de aplicacion"
                  value={applicationForm.site}
                  onChange={(value) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      site: value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <TextAreaField
                  label="Eventos adversos inmediatos"
                  value={applicationForm.adverseEvents}
                  onChange={(value) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      adverseEvents: value,
                    }))
                  }
                />
                <TextAreaField
                  label="Observaciones"
                  value={applicationForm.observations}
                  onChange={(value) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      observations: value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">
                  Centro: {currentCenterName}
                  {stockMatchForApplication
                    ? ` · Stock actual ${stockMatchForApplication.stock}`
                    : " · Sin coincidencia exacta de inventario"}
                </p>
                <button
                  type="button"
                  onClick={registerVaccine}
                  className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                >
                  Registrar vacuna aplicada
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Actualizacion de stock
              </p>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-[11px] font-semibold text-slate-600 md:col-span-2">
                  Vacuna del centro
                  <select
                    value={activeInventoryId}
                    onChange={(event) =>
                      setStockForm((prev) => ({
                        ...prev,
                        inventoryId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                  >
                    {currentCenterInventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.vaccine} · stock {item.stock}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-slate-600">
                  Ajuste de dosis (+/-)
                  <input
                    value={stockForm.delta}
                    onChange={(event) =>
                      setStockForm((prev) => ({
                        ...prev,
                        delta: event.target.value,
                      }))
                    }
                    placeholder="Ej. 12 o -3"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <EditableField label="Stock actual" value={`${stockRowSelected?.stock ?? 0}`} readOnly />
                <TextAreaField
                  label="Nota de stock"
                  value={stockForm.note}
                  onChange={(value) =>
                    setStockForm((prev) => ({
                      ...prev,
                      note: value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">
                  Estado: {stockRowSelected?.status ?? "Sin seleccion"}
                </p>
                <button
                  type="button"
                  onClick={updateStock}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Actualizar stock del centro
                </button>
              </div>
            </section>
          </div>
            </div>

          {feedback ? (
            <p
              className={[
                "mt-3 rounded-lg border px-3 py-2 text-xs",
                feedback.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Movimientos recientes
            </p>
            {activityLog.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                Aun no hay movimientos en esta sesion.
              </p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {activityLog.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">
                      {entry.kind} · {entry.timestamp}
                    </p>
                    <p className="text-[11px] text-slate-600">{entry.detail}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
          </Panel>
        </div>
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

function EditableField({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        className={[
          "mt-1 w-full rounded-lg border px-2.5 py-2 text-xs",
          readOnly
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-slate-200 bg-white text-slate-700 focus:border-sky-500 focus:outline-none",
        ].join(" ")}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
      />
    </label>
  );
}

function getStockStatus(stock: number): VaccineInventoryRecord["status"] {
  if (stock <= 0) {
    return "Agotada";
  }
  if (stock <= 10) {
    return "Baja disponibilidad";
  }
  return "Disponible";
}

function normalizeVaccineName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isSameVaccineName(left: string, right: string) {
  const leftNormalized = normalizeVaccineName(left);
  const rightNormalized = normalizeVaccineName(right);

  if (!leftNormalized || !rightNormalized) {
    return false;
  }
  return (
    leftNormalized === rightNormalized ||
    leftNormalized.includes(rightNormalized) ||
    rightNormalized.includes(leftNormalized)
  );
}

function extractVaccinationTag(observations: string, tag: "Dosis" | "Centro") {
  const matcher = new RegExp(`${tag}:\\s*([^|]+)`, "i");
  const match = observations.match(matcher);
  return match?.[1]?.trim();
}

function inferDoseType(vaccineName: string, fallback: string) {
  const normalized = normalizeVaccineName(vaccineName);
  if (normalized.includes("refuerzo")) {
    return "Refuerzo";
  }
  if (normalized.includes("primera") || normalized.includes("1ra")) {
    return "Primera";
  }
  if (normalized.includes("influenza") || normalized.includes("anual")) {
    return "Dosis anual";
  }
  return fallback;
}

function normalizeDateInput(value: string) {
  if (!value.trim()) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const slashFormat = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!slashFormat) {
    return null;
  }

  const [, day, month, year] = slashFormat;
  return `${year}-${month}-${day}`;
}

function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getCurrentTimeOnly() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
