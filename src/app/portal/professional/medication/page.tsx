"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ModulePage } from "../_components/clinical-ui";
import { usePatientSelection } from "../_components/patient-workspace";
import {
  medicationCatalogTotal,
} from "../_data/medication-catalog";
import {
  medicationKnowledgeBase,
  medicationKnowledgeGroups,
  resolveMedicationKnowledgeEntry,
  type MedicationDoseRegimen,
  type MedicationKnowledgeEntry,
} from "../_data/medication-knowledge-base";
import {
  getPatientServiceArea,
  mockPatients,
  type MedicationRecord,
  type PatientRecord,
} from "../_data/clinical-mock-data";

type MedicationViewMode = "detail" | "schedule" | "prn";
type MedicationFilter = "all" | "pending" | "high_risk" | "administered" | "blocked";
type CardStatus = "Pendiente" | "Administrada" | "Omitida" | "Bloqueada";

type MedicationPageRecord = MedicationRecord & {
  presentation?: string;
  formulaApplied?: string;
  sourceStatus?: string;
};

type MedicationDraft = {
  name: string;
  presentation: string;
  dose: string;
  route: string;
  durationDays: string;
  quantity: string;
  frequency: string;
  schedule: string;
  indication: string;
  notes: string;
  formulaApplied: string;
};

type RuntimeMedicationState = {
  status?: MedicationRecord["administrationStatus"];
  lastAdministration?: string;
  omissionReason?: string;
  transferredToShift?: string;
  notifiedMedical?: boolean;
};

type MedicationCardModel = {
  record: MedicationPageRecord;
  knowledge: MedicationKnowledgeEntry | undefined;
  displayName: string;
  status: CardStatus;
  blockedReason?: string;
  presentation: string;
  adherencePct: number;
  dosesGiven: number;
  omissions7d: number;
  nextDoseLabel: string;
  progressTone: "emerald" | "amber" | "rose";
  section: "pending" | "administered" | "blocked";
  last7Pattern: Array<"done" | "missed" | "pending">;
  highRisk: boolean;
  specialWarning?: string;
  warningTone?: "warning" | "danger" | "info";
};

const defaultDraft: MedicationDraft = {
  name: "",
  presentation: "",
  dose: "",
  route: "",
  durationDays: "7",
  quantity: "1",
  frequency: "",
  schedule: "",
  indication: "",
  notes: "",
  formulaApplied: "",
};

export default function MedicationPage() {
  const searchParams = useSearchParams();
  const requestedPatientId = searchParams.get("patientId") ?? "";
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const [viewMode, setViewMode] = useState<MedicationViewMode>("detail");
  const [statusFilter, setStatusFilter] = useState<MedicationFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogGroup, setCatalogGroup] = useState("todos");
  const [draft, setDraft] = useState<MedicationDraft>(defaultDraft);
  const [addedByPatient, setAddedByPatient] = useState<Record<string, MedicationPageRecord[]>>({});
  const [runtimeByRecord, setRuntimeByRecord] = useState<Record<string, RuntimeMedicationState>>({});
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedKnowledgeName, setSelectedKnowledgeName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!requestedPatientId) {
      return;
    }

    if (mockPatients.some((patient) => patient.id === requestedPatientId)) {
      setSelectedPatientId(requestedPatientId);
    }
  }, [requestedPatientId, setSelectedPatientId]);

  const patientWeight = selectedPatient?.vitalSigns[0]?.weightKg ?? null;
  const patientService = selectedPatient ? getPatientServiceArea(selectedPatient) : "";

  const selectedPatientRecords = useMemo<MedicationPageRecord[]>(() => {
    if (!selectedPatient) {
      return [];
    }

    const baseRecords = selectedPatient.medicationRecords.map((record) => {
      const knowledge = resolveMedicationKnowledgeEntry(record.name);
      return {
        ...record,
        presentation: knowledge?.presentations.find((item) =>
          normalizeText(item).includes(normalizeText(record.dose))
        ) ?? knowledge?.presentations[0],
        formulaApplied: knowledge?.formulaGuide,
        sourceStatus: knowledge?.sourceStatus,
      };
    });

    return [...(addedByPatient[selectedPatient.id] ?? []), ...baseRecords];
  }, [addedByPatient, selectedPatient]);

  const medicationCards = useMemo(() => {
    if (!selectedPatient) {
      return [] as MedicationCardModel[];
    }

    return selectedPatientRecords
      .map((record) => buildMedicationCardModel(record, selectedPatient, runtimeByRecord[record.id]))
      .sort((a, b) => {
        const statusOrder: Record<CardStatus, number> = {
          Bloqueada: 0,
          Pendiente: 1,
          Omitida: 2,
          Administrada: 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });
  }, [runtimeByRecord, selectedPatient, selectedPatientRecords]);

  const visibleCards = useMemo(() => {
    let items = medicationCards;

    if (statusFilter === "pending") {
      items = items.filter((card) => card.status === "Pendiente");
    }
    if (statusFilter === "high_risk") {
      items = items.filter((card) => card.highRisk);
    }
    if (statusFilter === "administered") {
      items = items.filter((card) => card.status === "Administrada");
    }
    if (statusFilter === "blocked") {
      items = items.filter((card) => card.status === "Bloqueada");
    }

    if (viewMode === "prn") {
      items = items.filter((card) => isPrnMedication(card.record));
    }

    return items;
  }, [medicationCards, statusFilter, viewMode]);

  const closeAddForm = () => {
    setShowAddForm(false);
    setSelectedKnowledgeName(null);
    setDraft(defaultDraft);
    setCatalogSearch("");
    setCatalogGroup("todos");
    setFormError(null);
  };

  const openAddForm = () => {
    setShowAddForm(true);
    setFormError(null);
    setFeedback(null);
  };

  const selectedCard =
    visibleCards.find((card) => card.record.id === selectedRecordId) ??
    medicationCards.find((card) => card.record.id === selectedRecordId) ??
    medicationCards[0] ??
    null;

  const activeKnowledge =
    (selectedKnowledgeName ? resolveMedicationKnowledgeEntry(selectedKnowledgeName) : undefined) ??
    (selectedCard ? selectedCard.knowledge : undefined);

  const catalogEntries = useMemo(() => {
    const normalizedSearch = normalizeText(catalogSearch);
    return medicationKnowledgeBase.filter((entry) => {
      const matchesGroup = catalogGroup === "todos" || entry.therapeuticGroup === catalogGroup;
      if (!matchesGroup) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      return normalizeText(
        `${entry.name} ${entry.therapeuticGroup} ${entry.presentations.join(" ")} ${entry.pharmacologicClass}`
      ).includes(normalizedSearch);
    });
  }, [catalogGroup, catalogSearch]);

  const patientContraindications = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return buildContraindications(selectedPatient, medicationCards);
  }, [medicationCards, selectedPatient]);

  const globalAdherence = medicationCards.length
    ? Math.round(
        medicationCards.reduce((accumulator, card) => accumulator + card.adherencePct, 0) /
          medicationCards.length
      )
    : 0;

  const pendingCount = medicationCards.filter((card) => card.status === "Pendiente").length;
  const omissionCount = medicationCards.filter((card) => card.status === "Omitida").length;
  const highRiskCount = medicationCards.filter((card) => card.highRisk).length;

  const pendingCards = visibleCards.filter((card) => card.section === "pending");
  const administeredCards = visibleCards.filter((card) => card.section === "administered");
  const blockedCards = visibleCards.filter((card) => card.section === "blocked");

  const selectedKnowledgeBlockedReason =
    selectedPatient && draft.name ? getMedicationBlockReason(draft.name, selectedPatient) : null;

  const applyKnowledgeSelection = (entry: MedicationKnowledgeEntry) => {
    setSelectedKnowledgeName(entry.name);
    setDraft((current) => ({
      ...current,
      name: entry.name,
      presentation: current.presentation || entry.presentations[0] || "",
      route: current.route || entry.routeOptions[0] || "",
      formulaApplied: current.formulaApplied || entry.formulaGuide,
      indication: current.indication || inferIndication(entry),
    }));
    setFormError(null);
    setFeedback(null);
  };

  const applyRegimen = (entry: MedicationKnowledgeEntry, regimen: MedicationDoseRegimen) => {
    const computedDose = computeRegimenDose(regimen, patientWeight);

    setSelectedKnowledgeName(entry.name);
    setDraft((current) => ({
      ...current,
      name: entry.name,
      presentation: current.presentation || entry.presentations[0] || "",
      dose: computedDose,
      route: regimen.route,
      frequency: regimen.frequency,
      schedule: current.schedule || inferScheduleFromFrequency(regimen.frequency),
      indication: current.indication || regimen.label,
      formulaApplied: regimen.formula,
      notes: current.notes || regimen.notes || "",
    }));
    setFormError(null);
    setFeedback(null);
  };

  const handleRegisterAdministration = (recordId: string) => {
    setRuntimeByRecord((current) => ({
      ...current,
      [recordId]: {
        ...(current[recordId] ?? {}),
        status: "Administrado",
        lastAdministration: currentClockLabel(),
        omissionReason: undefined,
      },
    }));
    setFeedback("Administracion registrada en el turno actual.");
  };

  const handleOmitMedication = (recordId: string) => {
    const reason =
      typeof window !== "undefined"
        ? window.prompt("Justificacion de la omision", "Paciente en procedimiento / contraindicado / no disponible")
        : "Omitido por justificacion clinica";

    if (!reason) {
      return;
    }

    setRuntimeByRecord((current) => ({
      ...current,
      [recordId]: {
        ...(current[recordId] ?? {}),
        status: "Omitido",
        omissionReason: reason,
      },
    }));
    setFeedback("Omisión registrada con justificacion clinica.");
  };

  const handleResumeMedication = (recordId: string) => {
    setRuntimeByRecord((current) => ({
      ...current,
      [recordId]: {
        ...(current[recordId] ?? {}),
        status: "Pendiente",
        omissionReason: undefined,
      },
    }));
    setFeedback("La orden quedo nuevamente pendiente para el turno actual.");
  };

  const handleTransferToShift = (recordId: string) => {
    const nextShift =
      typeof window !== "undefined" ? window.prompt("Transferir a turno", "Turno noche") : "Turno siguiente";

    if (!nextShift) {
      return;
    }

    setRuntimeByRecord((current) => ({
      ...current,
      [recordId]: {
        ...(current[recordId] ?? {}),
        transferredToShift: nextShift,
      },
    }));
    setFeedback(`Orden transferida a ${nextShift}.`);
  };

  const handleNotifyMedical = (recordId: string) => {
    setRuntimeByRecord((current) => ({
      ...current,
      [recordId]: {
        ...(current[recordId] ?? {}),
        notifiedMedical: true,
      },
    }));
    setFeedback("Notificacion registrada para el medico responsable.");
  };

  const handleAddMedication = () => {
    setFormError(null);
    setFeedback(null);

    if (!selectedPatient) {
      setFormError("Selecciona un paciente antes de agregar un medicamento.");
      return;
    }

    if (!draft.name.trim()) {
      setFormError("Selecciona un medicamento del catalogo.");
      return;
    }

    if (selectedKnowledgeBlockedReason) {
      setFormError(selectedKnowledgeBlockedReason);
      return;
    }

    if (
      !draft.presentation.trim() ||
      !draft.dose.trim() ||
      !draft.route.trim() ||
      !draft.frequency.trim() ||
      !draft.schedule.trim()
    ) {
      setFormError("Completa presentacion, dosis, via, frecuencia y horario.");
      return;
    }

    const duration = Number(draft.durationDays);
    const quantity = Number(draft.quantity);

    if (!Number.isFinite(duration) || duration <= 0) {
      setFormError("La duracion debe ser mayor a 0 dias.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("La cantidad debe ser mayor a 0.");
      return;
    }

    const startDate = formatDate(new Date());
    const endDate = formatDate(addDays(new Date(), duration));
    const knowledge = resolveMedicationKnowledgeEntry(draft.name);

    const newRecord: MedicationPageRecord = {
      id: `med-runtime-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: draft.name.trim(),
      dose: draft.dose.trim(),
      frequency: draft.frequency.trim(),
      route: draft.route.trim(),
      schedule: draft.schedule.trim(),
      startDate,
      endDate,
      indication: draft.indication.trim() || inferIndication(knowledge),
      prescriber: selectedPatient.assignedProfessional,
      adherence: "En seguimiento",
      administrationStatus: "Pendiente",
      notes: buildMedicationNotes(draft),
      presentation: draft.presentation.trim(),
      formulaApplied: draft.formulaApplied.trim(),
      sourceStatus: knowledge?.sourceStatus,
    };

    setAddedByPatient((current) => ({
      ...current,
      [selectedPatient.id]: [newRecord, ...(current[selectedPatient.id] ?? [])],
    }));
    setSelectedRecordId(newRecord.id);
    setFeedback(`Medicamento agregado para ${selectedPatient.fullName}: ${newRecord.name}.`);
    closeAddForm();
  };

  const historyHref = selectedPatient
    ? `/portal/professional/patients/${selectedPatient.id}?tab=medication`
    : "/portal/professional/patients";

  return (
    <ModulePage
      title="Medicacion - administracion y adherencia"
      subtitle="Horarios de dosis, registro de administracion, omisiones y vigilancia farmacologica por paciente."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={historyHref}
            className="rounded-[22px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Historial completo
          </Link>
          <button
            type="button"
            onClick={() => {
              if (showAddForm) {
                closeAddForm();
                return;
              }
              openAddForm();
            }}
            className="rounded-[22px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {showAddForm ? "Cerrar formulario" : "+ Agregar medicamento"}
          </button>
        </div>
      }
    >
      <section className="space-y-4">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Buscar paciente
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Maria Lopez, 1722334412, HC-2026-0001"
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Paciente activo
              </span>
              <select
                value={selectedPatientId}
                onChange={(event) => {
                  setSelectedPatientId(event.target.value);
                  setFeedback(null);
                  setFormError(null);
                }}
                className={fieldClassName}
              >
                {(filteredPatients.length ? filteredPatients : mockPatients).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName} - {patient.medicalRecordNumber}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>

        {!selectedPatient ? (
          <EmptyState message="Selecciona un paciente para abrir la estacion de medicacion." />
        ) : (
          <>
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-rose-50 text-2xl font-semibold text-rose-600">
                    {initialsOf(selectedPatient.fullName)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-3xl font-semibold text-slate-950">{selectedPatient.fullName}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedPatient.age} a - {selectedPatient.primaryDiagnosis}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedPatient.identification} - {selectedPatient.medicalRecordNumber} - {patientService}
                    </p>
                    <p className="text-sm text-slate-500">
                      Ingreso: {selectedPatient.admissionDate} - Peso: {patientWeight ?? "-"} kg - Profesional:{" "}
                      {selectedPatient.assignedProfessional}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Tag tone="danger">Alergias: {formatAllergies(selectedPatient)}</Tag>
                  <Tag tone={selectedPatient.riskLevel === "alto" ? "danger" : selectedPatient.riskLevel === "medio" ? "warning" : "success"}>
                    Riesgo {titleCase(selectedPatient.riskLevel)}
                  </Tag>
                  <Tag tone="info">Nivel {selectedPatient.triageColor.toUpperCase()}</Tag>
                  <Tag tone="neutral">{selectedPatient.currentStatus}</Tag>
                </div>
              </div>
            </article>

            <article
              className={[
                "rounded-[28px] border px-5 py-4 shadow-sm",
                patientContraindications.length > 0
                  ? "border-rose-200 bg-rose-50"
                  : "border-emerald-200 bg-emerald-50",
              ].join(" ")}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">
                {patientContraindications.length > 0
                  ? "Contraindicaciones activas"
                  : "Seguridad farmacologica sin bloqueos activos"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(patientContraindications.length > 0
                  ? patientContraindications
                  : ["No se detectaron medicamentos bloqueados por alergias en la orden actual."]
                ).map((item) => (
                  <Tag key={item} tone={patientContraindications.length > 0 ? "danger" : "success"}>
                    {item}
                  </Tag>
                ))}
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Ordenes activas" value={medicationCards.length} hint="Turno actual" />
              <MetricCard label="Pendientes hoy" value={pendingCount} hint="Por administrar" tone="warning" />
              <MetricCard label="Alto riesgo" value={highRiskCount} hint="Vigilancia reforzada" tone="danger" />
              <MetricCard label="Omisiones" value={omissionCount} hint="Con justificacion" tone={omissionCount > 0 ? "warning" : "success"} />
              <MetricCard label="Adherencia global" value={`${globalAdherence}%`} hint="Ultimos 7 dias" tone={globalAdherence >= 90 ? "success" : globalAdherence >= 80 ? "warning" : "danger"} />
            </div>

            {feedback ? (
              <FeedbackBanner tone="success">{feedback}</FeedbackBanner>
            ) : null}
            {formError ? (
              <FeedbackBanner tone="danger">{formError}</FeedbackBanner>
            ) : null}

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <SegmentedButton
                        active={viewMode === "detail"}
                        onClick={() => setViewMode("detail")}
                        label="Tarjetas detalle"
                      />
                      <SegmentedButton
                        active={viewMode === "schedule"}
                        onClick={() => setViewMode("schedule")}
                        label="Grilla de horarios"
                      />
                      <SegmentedButton
                        active={viewMode === "prn"}
                        onClick={() => setViewMode("prn")}
                        label="SOS / PRN"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <SegmentedButton
                        active={statusFilter === "all"}
                        onClick={() => setStatusFilter("all")}
                        label="Todos"
                      />
                      <SegmentedButton
                        active={statusFilter === "pending"}
                        onClick={() => setStatusFilter("pending")}
                        label="Pendientes"
                      />
                      <SegmentedButton
                        active={statusFilter === "high_risk"}
                        onClick={() => setStatusFilter("high_risk")}
                        label="Alto riesgo"
                      />
                      <SegmentedButton
                        active={statusFilter === "administered"}
                        onClick={() => setStatusFilter("administered")}
                        label="Administrados"
                      />
                      <SegmentedButton
                        active={statusFilter === "blocked"}
                        onClick={() => setStatusFilter("blocked")}
                        label="Bloqueados"
                      />
                    </div>
                  </div>
                </article>

                {viewMode === "detail" ? (
                  <div className="space-y-4">
                    <MedicationSection
                      title="Por administrar - hoy turno"
                      caption={`${pendingCards.length} pendientes`}
                      cards={pendingCards}
                      selectedRecordId={selectedRecordId}
                      onSelect={setSelectedRecordId}
                      onRegister={handleRegisterAdministration}
                      onOmit={handleOmitMedication}
                      onResume={handleResumeMedication}
                      onTransfer={handleTransferToShift}
                      onNotify={handleNotifyMedical}
                      patientId={selectedPatient.id}
                    />
                    <MedicationSection
                      title="Administrados / seguimiento"
                      caption={`${administeredCards.length} registros`}
                      cards={administeredCards}
                      selectedRecordId={selectedRecordId}
                      onSelect={setSelectedRecordId}
                      onRegister={handleRegisterAdministration}
                      onOmit={handleOmitMedication}
                      onResume={handleResumeMedication}
                      onTransfer={handleTransferToShift}
                      onNotify={handleNotifyMedical}
                      patientId={selectedPatient.id}
                    />
                    <MedicationSection
                      title="Bloqueados / vigilancia"
                      caption={`${blockedCards.length} alertas`}
                      cards={blockedCards}
                      selectedRecordId={selectedRecordId}
                      onSelect={setSelectedRecordId}
                      onRegister={handleRegisterAdministration}
                      onOmit={handleOmitMedication}
                      onResume={handleResumeMedication}
                      onTransfer={handleTransferToShift}
                      onNotify={handleNotifyMedical}
                      patientId={selectedPatient.id}
                    />
                  </div>
                ) : null}

                {viewMode === "schedule" ? (
                  <ScheduleGrid cards={visibleCards} />
                ) : null}

                {viewMode === "prn" ? (
                  <PrnBoard cards={visibleCards} />
                ) : null}
              </div>

              <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {showAddForm ? "Nuevo medicamento" : "Resumen farmacologico"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {showAddForm
                          ? `Catalogo activo: ${medicationCatalogTotal} medicamentos con presentaciones.`
                          : "Selecciona una orden para ver formula, alertas y recomendaciones."}
                      </p>
                    </div>
                    {!showAddForm ? (
                      <button
                        type="button"
                        onClick={openAddForm}
                        className="rounded-[18px] border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        + Agregar
                      </button>
                    ) : null}
                  </div>

                  {showAddForm ? (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Buscar medicamento
                        </span>
                        <input
                          value={catalogSearch}
                          onChange={(event) => setCatalogSearch(event.target.value)}
                          placeholder="Metformina, ceftriaxona, enoxaparina..."
                          className={fieldClassName}
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <CatalogChip
                          active={catalogGroup === "todos"}
                          label="Todos"
                          onClick={() => setCatalogGroup("todos")}
                        />
                        {medicationKnowledgeGroups.slice(0, 10).map((group) => (
                          <CatalogChip
                            key={group}
                            active={catalogGroup === group}
                            label={titleCase(group)}
                            onClick={() => setCatalogGroup(group)}
                          />
                        ))}
                      </div>

                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {catalogEntries.slice(0, 18).map((entry) => (
                          <button
                            key={entry.name}
                            type="button"
                            onClick={() => applyKnowledgeSelection(entry)}
                            className={[
                              "w-full rounded-[22px] border px-3 py-3 text-left transition",
                              selectedKnowledgeName === entry.name
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                            ].join(" ")}
                          >
                            <p className="text-sm font-semibold text-slate-950">{entry.name}</p>
                            <p className="text-xs text-slate-500">
                              {titleCase(entry.therapeuticGroup)} · {entry.presentations[0]}
                            </p>
                          </button>
                        ))}
                      </div>

                      {activeKnowledge ? (
                        <KnowledgePanel
                          entry={activeKnowledge}
                          patientWeight={patientWeight}
                          onApplyRegimen={applyRegimen}
                          blockedReason={selectedKnowledgeBlockedReason}
                        />
                      ) : (
                        <EmptyState message="Selecciona un medicamento del catalogo para cargar su ficha farmacologica." />
                      )}

                      <div className="grid gap-3">
                        <Field
                          label="Presentacion"
                          value={draft.presentation}
                          onChange={(value) => setDraft((current) => ({ ...current, presentation: value }))}
                          placeholder="Ej. 500 mg tableta"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Dosis"
                            value={draft.dose}
                            onChange={(value) => setDraft((current) => ({ ...current, dose: value }))}
                            placeholder="Ej. 40 mg"
                          />
                          <Field
                            label="Via"
                            value={draft.route}
                            onChange={(value) => setDraft((current) => ({ ...current, route: value }))}
                            placeholder="Oral / IV / SC"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Frecuencia"
                            value={draft.frequency}
                            onChange={(value) => setDraft((current) => ({ ...current, frequency: value }))}
                            placeholder="Cada 12 h"
                          />
                          <Field
                            label="Horario"
                            value={draft.schedule}
                            onChange={(value) => setDraft((current) => ({ ...current, schedule: value }))}
                            placeholder="08:00 - 20:00"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Duracion (dias)"
                            value={draft.durationDays}
                            onChange={(value) => setDraft((current) => ({ ...current, durationDays: value }))}
                            placeholder="7"
                            type="number"
                          />
                          <Field
                            label="Cantidad"
                            value={draft.quantity}
                            onChange={(value) => setDraft((current) => ({ ...current, quantity: value }))}
                            placeholder="1"
                            type="number"
                          />
                        </div>
                        <Field
                          label="Indicacion"
                          value={draft.indication}
                          onChange={(value) => setDraft((current) => ({ ...current, indication: value }))}
                          placeholder="Proteccion gastrica, control glucemico, etc."
                        />
                        <Field
                          label="Formula aplicada"
                          value={draft.formulaApplied}
                          onChange={(value) => setDraft((current) => ({ ...current, formulaApplied: value }))}
                          placeholder="Peso x 0.2 UI/kg/dia"
                        />
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Observaciones
                          </span>
                          <textarea
                            rows={4}
                            value={draft.notes}
                            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                            placeholder="Dilucion, monitorizacion, comentarios de seguridad..."
                            className={fieldClassName}
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="rounded-[20px] bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Guardar medicamento
                        </button>
                        <button
                          type="button"
                          onClick={closeAddForm}
                          className="rounded-[20px] border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : selectedCard ? (
                    <KnowledgeSummary card={selectedCard} patientWeight={patientWeight} />
                  ) : (
                    <div className="mt-4">
                      <EmptyState message="No hay ordenes de medicacion para el paciente seleccionado." />
                    </div>
                  )}
                </article>
              </div>
            </section>
          </>
        )}
      </section>
    </ModulePage>
  );
}

function MedicationSection({
  title,
  caption,
  cards,
  selectedRecordId,
  onSelect,
  onRegister,
  onOmit,
  onResume,
  onTransfer,
  onNotify,
  patientId,
}: {
  title: string;
  caption: string;
  cards: MedicationCardModel[];
  selectedRecordId: string | null;
  onSelect: (value: string) => void;
  onRegister: (recordId: string) => void;
  onOmit: (recordId: string) => void;
  onResume: (recordId: string) => void;
  onTransfer: (recordId: string) => void;
  onNotify: (recordId: string) => void;
  patientId: string;
}) {
  if (cards.length === 0) {
    return (
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            <p className="text-sm text-slate-500">{caption}</p>
          </div>
        </div>
        <div className="mt-4">
          <EmptyState message="Sin ordenes visibles para este filtro." />
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">{caption}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <MedicationOrderCard
            key={card.record.id}
            card={card}
            selected={selectedRecordId === card.record.id}
            onSelect={() => onSelect(card.record.id)}
            onRegister={() => onRegister(card.record.id)}
            onOmit={() => onOmit(card.record.id)}
            onResume={() => onResume(card.record.id)}
            onTransfer={() => onTransfer(card.record.id)}
            onNotify={() => onNotify(card.record.id)}
            patientId={patientId}
          />
        ))}
      </div>
    </article>
  );
}

function MedicationOrderCard({
  card,
  selected,
  onSelect,
  onRegister,
  onOmit,
  onResume,
  onTransfer,
  onNotify,
  patientId,
}: {
  card: MedicationCardModel;
  selected: boolean;
  onSelect: () => void;
  onRegister: () => void;
  onOmit: () => void;
  onResume: () => void;
  onTransfer: () => void;
  onNotify: () => void;
  patientId: string;
}) {
  const accentClass =
    card.status === "Bloqueada"
      ? "border-l-4 border-l-rose-500"
      : card.status === "Pendiente"
      ? "border-l-4 border-l-amber-500"
      : card.status === "Administrada"
      ? "border-l-4 border-l-emerald-500"
      : "border-l-4 border-l-slate-300";

  const statusTone =
    card.status === "Bloqueada"
      ? "danger"
      : card.status === "Pendiente"
      ? "warning"
      : card.status === "Administrada"
      ? "success"
      : "neutral";

  return (
    <article
      className={[
        "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition",
        accentClass,
        selected ? "ring-2 ring-emerald-200" : "",
      ].join(" ")}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-base text-amber-600">
              ◉
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={[
                    "text-xl font-semibold text-slate-950",
                    card.status === "Bloqueada" ? "line-through decoration-rose-400" : "",
                  ].join(" ")}
                >
                  {card.displayName} - {card.record.dose}
                </p>
                {card.highRisk ? <Tag tone="danger">Alto riesgo</Tag> : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {card.record.route} - {card.record.frequency} - {card.record.indication}
              </p>
              <p className="text-xs text-slate-500">
                Presentacion: {card.presentation} - Prescriptor: {card.record.prescriber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={statusTone}>{card.status}</Tag>
            <Tag tone={card.progressTone === "emerald" ? "success" : card.progressTone === "amber" ? "warning" : "danger"}>
              {card.nextDoseLabel}
            </Tag>
          </div>
        </div>
      </button>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <MetricInline label="Adherencia" value={`${card.adherencePct}%`} />
        <MetricInline label="Prox. dosis" value={summarizeSchedule(card.record.schedule)} />
        <MetricInline label="Dosis dadas" value={String(card.dosesGiven)} />
        <MetricInline label="Omisiones" value={String(card.omissions7d)} />
      </div>

      {card.specialWarning ? (
        <div
          className={[
            "mt-4 rounded-[20px] border px-4 py-3 text-sm",
            card.warningTone === "danger"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : card.warningTone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-sky-200 bg-sky-50 text-sky-800",
          ].join(" ")}
        >
          {card.specialWarning}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Ultimas 7 dosis</span>
          <span>{card.adherencePct}%</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {card.last7Pattern.map((state, index) => (
            <span
              key={`${card.record.id}-${index}`}
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                state === "done"
                  ? "bg-emerald-100 text-emerald-700"
                  : state === "missed"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {state === "done" ? "✓" : state === "missed" ? "×" : "•"}
            </span>
          ))}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={[
              "h-full rounded-full",
              card.progressTone === "emerald"
                ? "bg-emerald-500"
                : card.progressTone === "amber"
                ? "bg-amber-500"
                : "bg-rose-500",
            ].join(" ")}
            style={{ width: `${Math.max(card.adherencePct, 5)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.status === "Pendiente" ? (
          <>
            <button type="button" onClick={onRegister} className={primaryActionClassName}>
              Registrar administracion
            </button>
            <button type="button" onClick={onOmit} className={secondaryActionClassName}>
              Omitir con justificacion
            </button>
            <button type="button" onClick={onTransfer} className={secondaryActionClassName}>
              Transferir a turno
            </button>
          </>
        ) : null}

        {card.status === "Administrada" ? (
          <>
            <button type="button" onClick={onRegister} className={primaryActionClassName}>
              Re-registrar horario
            </button>
            <button type="button" onClick={onOmit} className={secondaryActionClassName}>
              Ver omisiones
            </button>
          </>
        ) : null}

        {card.status === "Omitida" ? (
          <>
            <button type="button" onClick={onResume} className={primaryActionClassName}>
              Rehabilitar orden
            </button>
            <button type="button" onClick={onNotify} className={secondaryActionClassName}>
              Notificar medico
            </button>
          </>
        ) : null}

        {card.status === "Bloqueada" ? (
          <>
            <button type="button" onClick={onNotify} className={primaryActionClassName}>
              Notificar prescriptor
            </button>
            <button type="button" onClick={onResume} className={secondaryActionClassName}>
              Revaluar orden
            </button>
          </>
        ) : null}

        <Link href={`/portal/professional/patients/${patientId}?tab=kardex`} className={secondaryActionClassName}>
          Ver kardex
        </Link>
      </div>
    </article>
  );
}

function KnowledgePanel({
  entry,
  patientWeight,
  onApplyRegimen,
  blockedReason,
}: {
  entry: MedicationKnowledgeEntry;
  patientWeight: number | null;
  onApplyRegimen: (entry: MedicationKnowledgeEntry, regimen: MedicationDoseRegimen) => void;
  blockedReason: string | null;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-950">{entry.name}</p>
          <p className="text-sm text-slate-500">
            {entry.pharmacologicClass} - {titleCase(entry.therapeuticGroup)}
          </p>
        </div>
        <Tag tone={entry.sourceStatus === "Fuente oficial" ? "success" : "warning"}>
          {entry.sourceStatus}
        </Tag>
      </div>

      {blockedReason ? (
        <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
          {blockedReason}
        </div>
      ) : null}

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <InfoLine label="Dosis adulto" value={entry.adultDoseGuide} />
        <InfoLine label="Dosis pediatrica" value={entry.pediatricDoseGuide ?? "Sin pauta pediatrica estructurada."} />
        <InfoLine label="Formula" value={entry.formulaGuide} />
        {entry.renalGuide ? <InfoLine label="Ajuste renal" value={entry.renalGuide} /> : null}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Regimenes sugeridos</p>
        <div className="mt-2 space-y-2">
          {entry.regimens.map((regimen) => {
            const suggestion = computeRegimenDose(regimen, patientWeight);
            return (
              <button
                key={regimen.id}
                type="button"
                onClick={() => onApplyRegimen(entry, regimen)}
                className="w-full rounded-[20px] border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{regimen.label}</p>
                    <p className="text-xs text-slate-600">
                      {regimen.route} - {suggestion} - {regimen.frequency}
                    </p>
                  </div>
                  <Tag tone={regimen.population === "Pediatrico" ? "info" : "neutral"}>
                    {regimen.population}
                  </Tag>
                </div>
                <p className="mt-2 text-xs text-slate-500">{regimen.formula}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Vias</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.routeOptions.map((route) => (
              <Tag key={route} tone="neutral">
                {route}
              </Tag>
            ))}
          </div>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Presentaciones</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.presentations.slice(0, 4).map((presentation) => (
              <Tag key={presentation} tone="neutral">
                {presentation}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <InfoList title="Contraindicaciones" items={entry.contraindicationNotes} tone="danger" />
        <InfoList title="Tips de administracion" items={entry.administrationTips} tone="info" />
      </div>

      {entry.sources?.length ? (
        <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Fuentes</p>
          <div className="mt-2 space-y-1">
            {entry.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                {source.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KnowledgeSummary({
  card,
  patientWeight,
}: {
  card: MedicationCardModel;
  patientWeight: number | null;
}) {
  const entry = card.knowledge;

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-950">{card.displayName}</p>
            <p className="text-sm text-slate-500">
              {card.presentation} - {card.record.route} - {card.record.frequency}
            </p>
          </div>
          <Tag tone={card.status === "Bloqueada" ? "danger" : card.status === "Pendiente" ? "warning" : "success"}>
            {card.status}
          </Tag>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricInline label="Prox. dosis" value={card.nextDoseLabel} />
          <MetricInline label="Adherencia" value={`${card.adherencePct}%`} />
          <MetricInline label="Dosis" value={card.record.dose} />
          <MetricInline label="Horario" value={card.record.schedule} />
        </div>
      </div>

      {entry ? (
        <KnowledgePanel
          entry={entry}
          patientWeight={patientWeight}
          onApplyRegimen={() => {
            // Read-only in summary mode.
          }}
          blockedReason={card.blockedReason ?? null}
        />
      ) : (
        <EmptyState message="El medicamento no tiene ficha farmacologica ampliada en el catalogo actual." />
      )}
    </div>
  );
}

function ScheduleGrid({ cards }: { cards: MedicationCardModel[] }) {
  const grouped = groupCardsBySchedule(cards);

  if (grouped.length === 0) {
    return <EmptyState message="No hay horarios estructurados para mostrar en grilla." />;
  }

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((slot) => (
          <div key={slot.hour} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-lg font-semibold text-slate-950">{slot.hour}</p>
            <div className="mt-3 space-y-2">
              {slot.cards.map((card) => (
                <article key={card.record.id} className="rounded-[18px] border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{card.displayName}</p>
                    <Tag tone={card.status === "Bloqueada" ? "danger" : card.status === "Pendiente" ? "warning" : "success"}>
                      {card.status}
                    </Tag>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {card.record.route} - {card.record.dose}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PrnBoard({ cards }: { cards: MedicationCardModel[] }) {
  if (cards.length === 0) {
    return <EmptyState message="No hay medicamentos tipo SOS / PRN con el filtro actual." />;
  }

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {cards.map((card) => (
          <article key={card.record.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">{card.displayName}</p>
                <p className="text-sm text-slate-600">
                  {card.record.indication} - {card.record.route} - {card.record.dose}
                </p>
              </div>
              <Tag tone={card.status === "Pendiente" ? "warning" : "success"}>{card.status}</Tag>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              {card.record.notes || "Medicacion de rescate sin observaciones adicionales."}
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p
        className={[
          "mt-3 text-4xl font-semibold",
          tone === "danger"
            ? "text-rose-600"
            : tone === "warning"
            ? "text-amber-600"
            : tone === "success"
            ? "text-emerald-600"
            : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[18px] border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function CatalogChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClassName}
      />
    </label>
  );
}

function FeedbackBanner({
  children,
  tone,
}: {
  children: string;
  tone: "success" | "danger";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border px-4 py-3 text-sm shadow-sm",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Tag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function InfoList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "danger" | "info";
}) {
  return (
    <div
      className={[
        "rounded-[20px] border p-3",
        tone === "danger" ? "border-rose-200 bg-rose-50" : "border-sky-200 bg-sky-50",
      ].join(" ")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm text-slate-700">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <article className="rounded-[28px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500 shadow-sm">
      {message}
    </article>
  );
}

function buildMedicationCardModel(
  record: MedicationPageRecord,
  patient: PatientRecord,
  runtime?: RuntimeMedicationState
): MedicationCardModel {
  const knowledge = resolveMedicationKnowledgeEntry(record.name);
  const displayName = knowledge?.name ?? record.name;
  const blockedReason = getMedicationBlockReason(displayName, patient) ?? undefined;
  const status = blockedReason
    ? "Bloqueada"
    : runtime?.status === "Administrado"
    ? "Administrada"
    : runtime?.status === "Omitido"
    ? "Omitida"
    : record.administrationStatus === "Administrado"
    ? "Administrada"
    : record.administrationStatus === "Omitido"
    ? "Omitida"
    : "Pendiente";
  const highRisk = knowledge?.highAlert ?? false;
  const adherencePct = inferAdherence(record, status, highRisk);
  const omissions7d = status === "Omitida" ? 1 : adherencePct < 80 ? 2 : 0;
  const dosesGiven = inferDoseCount(record, status);
  const last7Pattern = buildDosePattern(adherencePct, status);
  const nextDoseLabel = buildNextDoseLabel(record, status, runtime);
  const progressTone = adherencePct >= 90 ? "emerald" : adherencePct >= 80 ? "amber" : "rose";
  const section =
    status === "Bloqueada" ? "blocked" : status === "Administrada" ? "administered" : "pending";

  return {
    record,
    knowledge,
    displayName,
    status,
    blockedReason,
    presentation: record.presentation ?? knowledge?.presentations[0] ?? record.dose,
    adherencePct,
    dosesGiven,
    omissions7d,
    nextDoseLabel,
    progressTone,
    section,
    last7Pattern,
    highRisk,
    specialWarning: blockedReason ?? buildSpecialWarning(displayName, status, patient, record, runtime),
    warningTone: blockedReason
      ? "danger"
      : displayName.includes("Insulina")
      ? "danger"
      : displayName.includes("Enoxaparina") || displayName.includes("Warfarina")
      ? "warning"
      : status === "Omitida"
      ? "warning"
      : "info",
  };
}

function buildContraindications(patient: PatientRecord, cards: MedicationCardModel[]) {
  const results = new Set<string>();
  const allergies = patient.antecedentes.allergies.filter((item) => !isNoKnownAllergy(item));

  allergies.forEach((allergy) => {
    if (normalizeText(allergy).includes("penicilin")) {
      results.add("Penicilina y betalactamicos deben validarse antes de administrar.");
    }
    if (normalizeText(allergy).includes("ibuprofeno") || normalizeText(allergy).includes("aine")) {
      results.add("AINE contraindicados o con validacion reforzada segun antecedente alergico.");
    }
  });

  cards.forEach((card) => {
    if (card.blockedReason) {
      results.add(card.blockedReason);
    }
  });

  return Array.from(results);
}

function getMedicationBlockReason(name: string, patient: PatientRecord) {
  const normalizedName = normalizeText(name);
  const allergies = patient.antecedentes.allergies.map(normalizeText);

  const hasPenicillinAllergy = allergies.some((item) => item.includes("penicilin"));
  const hasAineAllergy = allergies.some(
    (item) => item.includes("ibuprofeno") || item.includes("aine")
  );

  if (
    hasPenicillinAllergy &&
    [
      "amoxicilina",
      "ampicilina",
      "penicilina",
      "oxacilina",
      "dicloxacilina",
      "amoxicilina/acido clavulanico",
    ].some((token) => normalizedName.includes(token))
  ) {
    return `${name} bloqueada por antecedente de anafilaxia o alergia confirmada a penicilina.`;
  }

  if (
    hasAineAllergy &&
    ["ibuprofeno", "naproxeno", "diclofenaco", "ketorolaco", "meloxicam", "celecoxib"].some(
      (token) => normalizedName.includes(token)
    )
  ) {
    return `${name} requiere validacion medica por antecedente alergico a AINE.`;
  }

  return null;
}

function computeRegimenDose(regimen: MedicationDoseRegimen, patientWeight: number | null) {
  if (!regimen.calculation || !patientWeight) {
    return regimen.dose;
  }

  const rawValue = patientWeight * regimen.calculation.amountPerKg;
  const roundedValue = roundDose(rawValue, regimen.calculation.roundTo ?? 1);
  const limitedValue =
    regimen.calculation.maxDose !== undefined
      ? Math.min(roundedValue, regimen.calculation.maxDose)
      : roundedValue;

  return `${formatNumericDose(limitedValue)} ${regimen.calculation.unit}`;
}

function buildMedicationNotes(draft: MedicationDraft) {
  const sections = [
    draft.presentation ? `Presentacion: ${draft.presentation}.` : "",
    draft.formulaApplied ? `Formula aplicada: ${draft.formulaApplied}.` : "",
    draft.notes ? draft.notes : "",
  ].filter(Boolean);

  return sections.join(" ");
}

function buildNextDoseLabel(
  record: MedicationPageRecord,
  status: CardStatus,
  runtime?: RuntimeMedicationState
) {
  if (status === "Bloqueada") {
    return "Bloqueada";
  }

  if (status === "Omitida") {
    return "Omitida";
  }

  if (status === "Administrada") {
    return `Administrada ${runtime?.lastAdministration ?? firstScheduleTime(record.schedule) ?? "hoy"}`;
  }

  const nextTime = firstScheduleTime(record.schedule);
  return `Pendiente - ${nextTime ?? "sin hora"} h`;
}

function inferAdherence(record: MedicationRecord, status: CardStatus, highRisk: boolean) {
  const name = normalizeText(record.name);

  if (status === "Bloqueada") {
    return 0;
  }
  if (status === "Omitida") {
    return 68;
  }
  if (name.includes("metformina")) {
    return 72;
  }
  if (name.includes("enalapril")) {
    return 95;
  }
  if (name.includes("enoxaparina") || name.includes("aas") || name.includes("acido acetilsalicilico")) {
    return 100;
  }
  if (name.includes("insulina")) {
    return 100;
  }
  if (status === "Administrada") {
    return highRisk ? 100 : 94;
  }
  return highRisk ? 84 : 88;
}

function inferDoseCount(record: MedicationRecord, status: CardStatus) {
  if (status === "Bloqueada") {
    return 0;
  }

  const slots = extractScheduleTimes(record.schedule).length;

  if (status === "Administrada") {
    return Math.max(slots, 1);
  }

  if (status === "Omitida") {
    return Math.max(slots - 1, 0);
  }

  return Math.max(slots - 1, 0);
}

function buildDosePattern(
  adherencePct: number,
  status: CardStatus
): Array<"done" | "missed" | "pending"> {
  if (status === "Bloqueada") {
    return ["missed", "missed", "pending", "pending", "pending", "pending", "pending"];
  }

  if (status === "Omitida") {
    return ["done", "missed", "done", "pending", "missed", "done", "pending"];
  }

  if (adherencePct >= 95) {
    return ["done", "done", "done", "done", "done", "done", "done"];
  }

  if (adherencePct >= 80) {
    return ["done", "done", "done", "pending", "done", "done", "pending"];
  }

  return ["done", "missed", "done", "done", "missed", "done", "pending"];
}

function buildSpecialWarning(
  displayName: string,
  status: CardStatus,
  patient: PatientRecord,
  record: MedicationPageRecord,
  runtime?: RuntimeMedicationState
) {
  if (status === "Omitida" && runtime?.omissionReason) {
    return `Omitida con justificacion: ${runtime.omissionReason}`;
  }

  if (displayName.includes("Insulina glargina")) {
    const glucose = patient.vitalSigns[0]?.glucose;
    return `Dosis en ajuste por titulacion. Glucosa actual ${glucose ?? "-"} mg/dL. Verificar glucemia capilar antes de cada dosis.`;
  }

  if (displayName.includes("Insulina regular")) {
    return "Administrar solo con glucemia capilar reciente y de acuerdo con escala institucional.";
  }

  if (displayName.includes("Enoxaparina")) {
    const hasWarfarin = patient.medicationRecords.some((item) => normalizeText(item.name).includes("warfarina"));
    return hasWarfarin
      ? "Alto riesgo de sangrado por combinacion anticoagulante. Monitorizar signos de hemorragia."
      : "Verificar sitio de inyeccion rotatorio y sangrado activo antes de administrar.";
  }

  if (displayName.includes("Warfarina")) {
    return "No administrar hasta disponer de INR basal y plan de control documentado.";
  }

  if (displayName.includes("Metformina")) {
    return "Adherencia por debajo del 80%. Reforzar educacion y revisar tolerancia gastrointestinal.";
  }

  if (status === "Pendiente") {
    return `Por administrar en el turno actual. Horario programado: ${record.schedule}.`;
  }

  return undefined;
}

function groupCardsBySchedule(cards: MedicationCardModel[]) {
  const slots = new Map<string, MedicationCardModel[]>();

  cards.forEach((card) => {
    const hours = extractScheduleTimes(card.record.schedule);
    if (hours.length === 0) {
      const fallback = "Sin hora";
      slots.set(fallback, [...(slots.get(fallback) ?? []), card]);
      return;
    }
    hours.forEach((hour) => {
      slots.set(hour, [...(slots.get(hour) ?? []), card]);
    });
  });

  return Array.from(slots.entries())
    .map(([hour, items]) => ({ hour, cards: items }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

function inferScheduleFromFrequency(frequency: string) {
  const normalized = normalizeText(frequency);

  if (normalized.includes("24")) {
    return "08:00";
  }
  if (normalized.includes("12")) {
    return "08:00 - 20:00";
  }
  if (normalized.includes("8")) {
    return "06:00 - 14:00 - 22:00";
  }
  if (normalized.includes("6")) {
    return "06:00 - 12:00 - 18:00 - 00:00";
  }

  return "08:00";
}

function inferIndication(entry?: MedicationKnowledgeEntry) {
  if (!entry) {
    return "Indicacion clinica";
  }

  if (entry.therapeuticGroup === "cardiovasculares") {
    return "Cobertura cardiovascular";
  }
  if (entry.therapeuticGroup === "endocrinos") {
    return "Control metabolico";
  }
  if (entry.therapeuticGroup === "antibioticos") {
    return "Cobertura antimicrobiana";
  }
  if (entry.therapeuticGroup === "gastrointestinal") {
    return "Control digestivo";
  }
  return "Indicacion clinica";
}

function formatAllergies(patient: PatientRecord) {
  const allergies = patient.antecedentes.allergies.filter((item) => !isNoKnownAllergy(item));
  return allergies.length > 0 ? allergies.join(" - ") : "Sin alergias medicamentosas";
}

function isNoKnownAllergy(value: string) {
  return /(ninguna|sin alergia|no conocida|no registra)/i.test(value);
}

function isPrnMedication(record: MedicationRecord) {
  const terms = normalizeText(`${record.frequency} ${record.notes} ${record.indication}`);
  return terms.includes("prn") || terms.includes("sos") || terms.includes("rescate");
}

function summarizeSchedule(value: string) {
  const times = extractScheduleTimes(value);
  return times[0] ?? value;
}

function firstScheduleTime(value: string) {
  return extractScheduleTimes(value)[0] ?? null;
}

function extractScheduleTimes(value: string) {
  return value.match(/\b\d{2}:\d{2}\b/g) ?? [];
}

function currentClockLabel() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function initialsOf(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0] ?? "")
    .join("");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function roundDose(value: number, roundTo: number) {
  return Math.round(value / roundTo) * roundTo;
}

function formatNumericDose(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
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

const fieldClassName =
  "w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none";

const primaryActionClassName =
  "rounded-[18px] bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700";

const secondaryActionClassName =
  "rounded-[18px] border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
