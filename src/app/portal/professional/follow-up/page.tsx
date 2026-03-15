"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { ModulePage } from "../_components/clinical-ui";
import {
  examRequestCatalog,
  examRequestProfiles,
  type ExamCatalogOption,
  type ExamRequestPriority,
} from "../_data/exam-request-catalog";
import {
  getPatientServiceArea,
  mockPatients,
  type PatientRecord,
  type TriageColor,
} from "../_data/clinical-mock-data";

type QuickFilter = "all" | "pending" | "risk" | "discharge";
type QuickActionMode = "control" | "lab";

type FollowUpTask = {
  id: string;
  title: string;
  detail: string;
  urgency: "critical" | "warning" | "normal";
};

type TimelineItem = {
  id: string;
  datetime: string;
  category: string;
  detail: string;
  tone: "critical" | "warning" | "info" | "neutral";
};

type ScheduledControl = {
  id: string;
  patientId: string;
  datetime: string;
  controlType: string;
  note: string;
};

type RequestedLab = {
  id: string;
  patientId: string;
  name: string;
  category: string;
  group: string;
  requestedAt: string;
  priority: ExamRequestPriority;
  note: string;
};

type LabDraftItem = {
  catalogId: string;
  priority: ExamRequestPriority;
};

type FollowUpPatient = {
  patient: PatientRecord;
  pendingCount: number;
  controlLabel: string;
  controlCountdown: string;
  followUpStatus: "Requiere seguimiento" | "Adecuada" | "En revision" | "Alta hoy";
  pendingLabs: number;
  stayHours: number;
  protocolLabel: string;
  timelineItems: TimelineItem[];
  pendingTasks: FollowUpTask[];
};

const followUpReferenceNow = "2026-03-15 11:26";

const quickFilters: Array<{ id: QuickFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "risk", label: "En riesgo" },
  { id: "discharge", label: "Alta hoy" },
];

export default function FollowUpPage() {
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [scheduledControlsByPatient, setScheduledControlsByPatient] = useState<
    Record<string, ScheduledControl[]>
  >({});
  const [requestedLabsByPatient, setRequestedLabsByPatient] = useState<
    Record<string, RequestedLab[]>
  >({});
  const [quickActionPanel, setQuickActionPanel] = useState<{
    patientId: string;
    mode: QuickActionMode;
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [controlForm, setControlForm] = useState({
    datetime: "",
    controlType: "Control clinico",
    note: "",
  });
  const [labForm, setLabForm] = useState<{
    catalogId: string;
    priority: ExamRequestPriority;
    note: string;
    selectedItems: LabDraftItem[];
  }>({
    catalogId: "",
    priority: "urgente",
    note: "",
    selectedItems: [],
  });
  const deferredSearch = useDeferredValue(search);

  const followUpPatients = useMemo(
    () =>
      mockPatients.map((patient) =>
        buildFollowUpPatient(patient, {
          scheduledControls: scheduledControlsByPatient[patient.id] ?? [],
          requestedLabs: requestedLabsByPatient[patient.id] ?? [],
        })
      ),
    [requestedLabsByPatient, scheduledControlsByPatient]
  );

  const filteredPatients = useMemo(() => {
    const query = normalize(deferredSearch);

    return followUpPatients.filter((item) => {
      if (query && !matchesFollowUpSearch(item.patient, query)) {
        return false;
      }

      if (quickFilter === "pending" && item.pendingCount === 0) {
        return false;
      }

      if (
        quickFilter === "risk" &&
        item.patient.riskLevel !== "alto" &&
        item.patient.triageColor !== "naranja" &&
        item.patient.triageColor !== "rojo"
      ) {
        return false;
      }

      if (quickFilter === "discharge" && item.followUpStatus !== "Alta hoy") {
        return false;
      }

      return true;
    });
  }, [deferredSearch, followUpPatients, quickFilter]);

  const selectedEntry =
    filteredPatients.find((item) => item.patient.id === selectedPatientId) ??
    followUpPatients.find((item) => item.patient.id === selectedPatientId) ??
    filteredPatients[0] ??
    followUpPatients[0] ??
    null;

  const selectedPatient = selectedEntry?.patient ?? null;
  const latestVital = selectedPatient?.vitalSigns[0] ?? null;
  const previousVital = selectedPatient?.vitalSigns[1] ?? null;
  const selectedPatientWorkspaceHref = selectedEntry
    ? `/portal/professional/patients/${selectedEntry.patient.id}`
    : "/portal/professional/patients";

  const metrics = useMemo(
    () => ({
      active: followUpPatients.length,
      pending: followUpPatients.filter((item) => item.pendingCount > 0).length,
      risk: followUpPatients.filter(
        (item) => item.patient.riskLevel === "alto" || item.patient.triageColor === "rojo"
      ).length,
      adequate: followUpPatients.filter((item) => item.followUpStatus === "Adecuada").length,
      critical: followUpPatients.filter((item) =>
        item.pendingTasks.some((task) => task.urgency === "critical")
      ).length,
    }),
    [followUpPatients]
  );
  const labCatalogGroups = useMemo(() => {
    const groups = new Map<string, ExamCatalogOption[]>();

    for (const item of examRequestCatalog) {
      const current = groups.get(item.group) ?? [];
      current.push(item);
      groups.set(item.group, current);
    }

    return Array.from(groups.entries());
  }, []);
  const selectedLabOption =
    examRequestCatalog.find((item) => item.id === labForm.catalogId) ?? null;
  const selectedLabEntries = useMemo(
    () =>
      labForm.selectedItems
        .map((item) => {
          const option = examRequestCatalog.find((entry) => entry.id === item.catalogId);
          return option ? { item, option } : null;
        })
        .filter((entry): entry is { item: LabDraftItem; option: ExamCatalogOption } => entry !== null),
    [labForm.selectedItems]
  );

  const openQuickActionPanel = (mode: QuickActionMode, patient: PatientRecord) => {
    setQuickActionPanel({ mode, patientId: patient.id });
    setActionFeedback(null);

    if (mode === "control") {
      setControlForm({
        datetime: getSuggestedControlDateTime(patient),
        controlType:
          patient.triageColor === "rojo" ? "Control cardiaco" : "Control de seguimiento",
        note: "",
      });
      return;
    }

    setLabForm({
      catalogId: getSuggestedLabOptionId(patient),
      priority: patient.triageColor === "rojo" ? "critico" : "urgente",
      note: "",
      selectedItems: [],
    });
  };

  const handleAddLabSelection = () => {
    if (!selectedLabOption) {
      return;
    }

    setLabForm((prev) => {
      if (prev.selectedItems.some((item) => item.catalogId === selectedLabOption.id)) {
        return prev;
      }

      return {
        ...prev,
        catalogId: "",
        priority: selectedLabOption.defaultPriority,
        selectedItems: [
          ...prev.selectedItems,
          {
            catalogId: selectedLabOption.id,
            priority: prev.priority,
          },
        ],
      };
    });
  };

  const handleAddLabProfile = (optionIds: string[]) => {
    setLabForm((prev) => {
      const nextSelected = [...prev.selectedItems];

      optionIds.forEach((optionId) => {
        const option = examRequestCatalog.find((item) => item.id === optionId);
        if (!option || nextSelected.some((item) => item.catalogId === optionId)) {
          return;
        }

        nextSelected.push({
          catalogId: optionId,
          priority: option.defaultPriority,
        });
      });

      return {
        ...prev,
        selectedItems: nextSelected,
      };
    });
  };

  const handleRemoveLabSelection = (catalogId: string) => {
    setLabForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((item) => item.catalogId !== catalogId),
    }));
  };

  const handleLabItemPriorityChange = (catalogId: string, priority: ExamRequestPriority) => {
    setLabForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.map((item) =>
        item.catalogId === catalogId ? { ...item, priority } : item
      ),
    }));
  };

  const handleScheduleControl = () => {
    if (!quickActionPanel || quickActionPanel.mode !== "control") {
      return;
    }

    if (!controlForm.datetime || !controlForm.controlType.trim()) {
      return;
    }

    const patient = mockPatients.find((item) => item.id === quickActionPanel.patientId);
    if (!patient) {
      return;
    }

    const record: ScheduledControl = {
      id: `ctrl-${quickActionPanel.patientId}-${Date.now()}`,
      patientId: quickActionPanel.patientId,
      datetime: toStorageDateTime(controlForm.datetime),
      controlType: controlForm.controlType.trim(),
      note: controlForm.note.trim(),
    };

    setScheduledControlsByPatient((prev) => ({
      ...prev,
      [quickActionPanel.patientId]: [record, ...(prev[quickActionPanel.patientId] ?? [])].sort((left, right) =>
        left.datetime.localeCompare(right.datetime)
      ),
    }));
    setQuickActionPanel(null);
    setActionFeedback(
      `${record.controlType} programado para ${patient.fullName} el ${formatCompactDateTime(record.datetime)}.`
    );
  };

  const handleRequestLab = () => {
    if (!quickActionPanel || quickActionPanel.mode !== "lab") {
      return;
    }

    const patient = mockPatients.find((item) => item.id === quickActionPanel.patientId);
    if (!patient) {
      return;
    }

    if (selectedLabEntries.length === 0) {
      return;
    }

    const records: RequestedLab[] = selectedLabEntries.map(({ item, option }, index) => ({
      id: `lab-${quickActionPanel.patientId}-${Date.now()}-${index}`,
      patientId: quickActionPanel.patientId,
      name: option.name,
      category: option.category,
      group: option.group,
      requestedAt: followUpReferenceNow,
      priority: item.priority,
      note: labForm.note.trim(),
    }));

    setRequestedLabsByPatient((prev) => ({
      ...prev,
      [quickActionPanel.patientId]: [...records, ...(prev[quickActionPanel.patientId] ?? [])],
    }));
    setQuickActionPanel(null);
    setActionFeedback(
      `${records.length} examen${records.length === 1 ? "" : "es"} solicitado${
        records.length === 1 ? "" : "s"
      } para ${patient.fullName}: ${summarizeLabNames(records)}.`
    );
  };

  return (
    <ModulePage
      title="Seguimiento clinico longitudinal"
      subtitle="Vista por paciente con controles pendientes, adherencia, evolucion y alertas activas."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={
              selectedEntry
                ? `/portal/professional/reports?patientId=${selectedEntry.patient.id}`
                : "/portal/professional/reports"
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Ir a reportes
          </Link>
          <button
            type="button"
            onClick={() => {
              if (selectedEntry) {
                openQuickActionPanel("control", selectedEntry.patient);
              }
            }}
            disabled={!selectedEntry}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Nuevo control
          </button>
        </div>
      }
    >
      <section className="rounded-[34px] border border-stone-200 bg-[#f6f3ec] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardMetric label="En seguimiento" value={metrics.active} hint="Trazabilidad activa" />
          <DashboardMetric
            label="Controles en riesgo"
            value={metrics.pending}
            hint="Accion prioritaria hoy"
            tone="critical"
          />
          <DashboardMetric
            label="Adherencia en riesgo"
            value={followUpPatients.filter((item) => item.followUpStatus === "Requiere seguimiento").length}
            hint="Requieren contacto"
            tone="warning"
          />
          <DashboardMetric
            label="Adherencia adecuada"
            value={metrics.adequate}
            hint="Sin eventos pendientes"
            tone="success"
          />
          <DashboardMetric
            label="Alerta critica"
            value={metrics.critical}
            hint="Nivel I en observacion"
            tone="critical"
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-stone-200 bg-white p-4 xl:sticky xl:top-4 xl:self-start">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                  Pacientes en seguimiento
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {filteredPatients.length} activos
                </p>
              </div>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
                {quickFilters.find((item) => item.id === quickFilter)?.label}
              </span>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <span className="text-stone-400">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, CI o HC..."
                className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setQuickFilter(filter.id)}
                  className={[
                    "rounded-2xl border px-3 py-2 text-sm transition",
                    quickFilter === filter.id
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredPatients.map((item) => (
                <button
                  key={item.patient.id}
                  type="button"
                  onClick={() => setSelectedPatientId(item.patient.id)}
                  className={[
                    "w-full rounded-[24px] border px-4 py-4 text-left transition",
                    selectedEntry?.patient.id === item.patient.id
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-stone-200 bg-[#fcfbf8] hover:bg-stone-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-stone-900">
                        {item.patient.fullName}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {item.patient.age} a · {item.patient.sex.slice(0, 1)} · {item.patient.code}
                      </p>
                      <p className="text-sm text-stone-500">
                        {item.patient.primaryDiagnosis}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={[
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          getTriageBadgeTone(item.patient.triageColor),
                        ].join(" ")}
                      >
                        {item.patient.triageColor.toUpperCase()}
                      </span>
                      <span
                        className={[
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          item.followUpStatus === "Requiere seguimiento"
                            ? "bg-red-100 text-red-700"
                            : item.followUpStatus === "En revision"
                            ? "bg-amber-100 text-amber-700"
                            : item.followUpStatus === "Alta hoy"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-emerald-100 text-emerald-700",
                        ].join(" ")}
                      >
                        {item.followUpStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    {item.patient.activeAlerts.length > 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">
                        Alertas {item.patient.activeAlerts.length}
                      </span>
                    ) : null}
                    <span>Prox. control: {item.controlLabel}</span>
                    <span>{item.controlCountdown}</span>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div className={["h-full rounded-full", getTriageBarTone(item.patient.triageColor)].join(" ")} />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            {selectedEntry ? (
              <>
                <section className="rounded-[30px] border border-stone-200 bg-white p-5">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xl font-semibold text-rose-700">
                        {getInitials(selectedEntry.patient.fullName)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                            {selectedEntry.patient.fullName}
                          </h2>
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-xs font-semibold",
                              getTriageBadgeTone(selectedEntry.patient.triageColor),
                            ].join(" ")}
                          >
                            {selectedEntry.patient.triageColor.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          {selectedEntry.patient.age} anios · {selectedEntry.patient.sex} · {selectedEntry.patient.identification}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          HC {selectedEntry.patient.medicalRecordNumber} · {selectedEntry.patient.personalData.bloodType} · {selectedEntry.patient.personalData.insurance}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedEntry.patient.activeAlerts.map((alert) => (
                            <span
                              key={alert}
                              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                            >
                              {alert}
                            </span>
                          ))}
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            {selectedEntry.protocolLabel}
                          </span>
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                            {getPatientServiceArea(selectedEntry.patient)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <HeaderKpi
                        value={selectedEntry.patient.activeAlerts.length}
                        label="Alertas activas"
                        tone="critical"
                      />
                      <HeaderKpi
                        value={selectedEntry.pendingLabs}
                        label="Labs pendientes"
                        tone="warning"
                      />
                      <HeaderKpi
                        value={`${selectedEntry.stayHours}h`}
                        label="Tiempo de estancia"
                      />
                      <HeaderKpi
                        value={selectedEntry.pendingCount}
                        label="Pendientes"
                        tone={selectedEntry.pendingCount > 0 ? "critical" : "success"}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                    <ActionButton
                      label="Registrar evolucion"
                      href={`${selectedPatientWorkspaceHref}?tab=medical_notes`}
                    />
                    <ActionButton
                      label="Actualizar signos"
                      href={`/portal/professional/vitals?patientId=${selectedEntry.patient.id}`}
                    />
                    <ActionButton
                      label="Prescribir"
                      href={`/portal/professional/medication?patientId=${selectedEntry.patient.id}`}
                    />
                    <ActionButton
                      label="Solicitar lab"
                      onClick={() => openQuickActionPanel("lab", selectedEntry.patient)}
                    />
                    <ActionButton
                      label="Programar control"
                      onClick={() => openQuickActionPanel("control", selectedEntry.patient)}
                    />
                    <ActionButton
                      label="Re-triaje"
                      href={`${selectedPatientWorkspaceHref}?tab=triage`}
                      tone="critical"
                    />
                  </div>

                  {actionFeedback ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {actionFeedback}
                    </div>
                  ) : null}

                  {quickActionPanel?.patientId === selectedEntry.patient.id ? (
                    <section className="mt-4 rounded-[24px] border border-stone-200 bg-[#fcfbf8] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                            {quickActionPanel.mode === "control"
                              ? "Programacion rapida de control"
                              : "Solicitud rapida de laboratorio"}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {quickActionPanel.mode === "control"
                              ? "Agenda un nuevo control sin salir de seguimiento."
                              : "Registra un examen pendiente y dejalo visible en la trazabilidad del paciente."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuickActionPanel(null)}
                          className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:bg-stone-100"
                        >
                          Cerrar
                        </button>
                      </div>

                      {quickActionPanel.mode === "control" ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <label className="text-sm text-stone-600">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Fecha y hora
                            </span>
                            <input
                              type="datetime-local"
                              value={controlForm.datetime}
                              onChange={(event) =>
                                setControlForm((prev) => ({
                                  ...prev,
                                  datetime: event.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
                            />
                          </label>
                          <label className="text-sm text-stone-600">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Tipo de control
                            </span>
                            <input
                              value={controlForm.controlType}
                              onChange={(event) =>
                                setControlForm((prev) => ({
                                  ...prev,
                                  controlType: event.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
                              placeholder="Control clinico"
                            />
                          </label>
                          <label className="text-sm text-stone-600 md:col-span-3">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Observacion
                            </span>
                            <textarea
                              value={controlForm.note}
                              onChange={(event) =>
                                setControlForm((prev) => ({
                                  ...prev,
                                  note: event.target.value,
                                }))
                              }
                              className="min-h-[96px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
                              placeholder="Indicaciones para el siguiente control..."
                            />
                          </label>
                          <div className="md:col-span-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleScheduleControl}
                              className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
                            >
                              Guardar control
                            </button>
                            <Link
                              href={`${selectedPatientWorkspaceHref}?tab=medical_notes`}
                              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
                            >
                              Abrir reporte medico
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <label className="text-sm text-stone-600 md:col-span-2">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Examen
                            </span>
                            <select
                              value={labForm.catalogId}
                              onChange={(event) => {
                                const option =
                                  examRequestCatalog.find((item) => item.id === event.target.value) ?? null;

                                setLabForm((prev) => ({
                                  ...prev,
                                  catalogId: event.target.value,
                                  priority: option?.defaultPriority ?? prev.priority,
                                }));
                              }}
                              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
                            >
                              <option value="">Seleccionar examen</option>
                              {labCatalogGroups.map(([group, items]) => (
                                <optgroup key={group} label={group}>
                                  {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm text-stone-600">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Prioridad
                            </span>
                            <select
                              value={labForm.priority}
                              onChange={(event) =>
                                setLabForm((prev) => ({
                                  ...prev,
                                  priority: event.target.value as ExamRequestPriority,
                                }))
                              }
                              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
                            >
                              <option value="rutina">Rutina</option>
                              <option value="urgente">Urgente</option>
                              <option value="critico">Critico</option>
                            </select>
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={handleAddLabSelection}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              <span className="text-lg leading-none">+</span>
                              Agregar examen
                            </button>
                          </div>
                          <div className="md:col-span-4 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Perfiles frecuentes
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {examRequestProfiles.map((profile) => (
                                <button
                                  key={profile.id}
                                  type="button"
                                  onClick={() => handleAddLabProfile(profile.optionIds)}
                                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-100"
                                >
                                  + {profile.label}
                                </button>
                              ))}
                            </div>
                            {selectedLabOption ? (
                              <p className="mt-3 text-sm text-stone-500">
                                Seleccionado: <span className="font-medium text-stone-900">{selectedLabOption.name}</span>
                                {" · "}
                                {selectedLabOption.group}
                              </p>
                            ) : (
                              <p className="mt-3 text-sm text-stone-500">
                                Elige un examen del listado para registrarlo.
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-4 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                                Examenes agregados
                              </p>
                              <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600">
                                {selectedLabEntries.length}
                              </span>
                            </div>

                            {selectedLabEntries.length === 0 ? (
                              <p className="mt-3 text-sm text-stone-500">
                                Agrega uno o varios examenes con `+` antes de registrar la solicitud.
                              </p>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {selectedLabEntries.map(({ item, option }) => (
                                  <div
                                    key={option.id}
                                    className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-[#fcfbf8] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-stone-900">{option.name}</p>
                                      <p className="text-xs text-stone-500">
                                        {option.group} · {option.category}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <select
                                        value={item.priority}
                                        onChange={(event) =>
                                          handleLabItemPriorityChange(
                                            option.id,
                                            event.target.value as ExamRequestPriority
                                          )
                                        }
                                        className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none focus:border-emerald-300"
                                      >
                                        <option value="rutina">Rutina</option>
                                        <option value="urgente">Urgente</option>
                                        <option value="critico">Critico</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLabSelection(option.id)}
                                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                                      >
                                        Quitar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <label className="text-sm text-stone-600 md:col-span-4">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              Indicacion
                            </span>
                            <textarea
                              value={labForm.note}
                              onChange={(event) =>
                                setLabForm((prev) => ({
                                  ...prev,
                                  note: event.target.value,
                                }))
                              }
                              className="min-h-[96px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
                              placeholder="Motivo clinico de la solicitud..."
                            />
                          </label>
                          <div className="md:col-span-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleRequestLab}
                              className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
                            >
                              Registrar solicitud
                            </button>
                            <Link
                              href={`/portal/professional/lis-ris?patientId=${selectedEntry.patient.id}`}
                              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
                            >
                              Abrir LIS / RIS
                            </Link>
                          </div>
                        </div>
                      )}
                    </section>
                  ) : null}
                </section>

                {selectedEntry.pendingTasks[0] ? (
                  <section className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-red-700">
                    <p className="text-sm font-semibold">
                      {selectedEntry.pendingTasks[0].title}
                    </p>
                    <p className="mt-1 text-sm leading-6">
                      {selectedEntry.pendingTasks[0].detail}
                    </p>
                  </section>
                ) : null}

                <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
                  <section className="rounded-[28px] border border-stone-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                          Signos vitales - evolucion
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          Tendencia frente al control previo
                        </p>
                      </div>
                      <Link
                        href={`/portal/professional/vitals?patientId=${selectedEntry.patient.id}`}
                        className="text-sm font-medium text-emerald-700"
                      >
                        Ver todos
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                      <VitalTrendCard
                        label="PA"
                        value={latestVital?.bloodPressure ?? "--"}
                        detail={comparePressure(latestVital?.bloodPressure, previousVital?.bloodPressure)}
                        tone="critical"
                      />
                      <VitalTrendCard
                        label="FC"
                        value={latestVital ? `${latestVital.heartRate} lpm` : "--"}
                        detail={compareNumber(latestVital?.heartRate, previousVital?.heartRate, "mejora")}
                        tone="warning"
                      />
                      <VitalTrendCard
                        label="Temp."
                        value={latestVital ? `${latestVital.temperature} C` : "--"}
                        detail={compareNumber(latestVital?.temperature, previousVital?.temperature, "estable")}
                        tone="success"
                      />
                      <VitalTrendCard
                        label="Glucosa"
                        value={latestVital ? `${latestVital.glucose} mg/dL` : "--"}
                        detail={compareNumber(latestVital?.glucose, previousVital?.glucose, "control")}
                        tone="critical"
                      />
                    </div>

                    <p className="mt-4 text-xs text-stone-500">
                      Ultimo registro: {latestVital?.recordedAt ?? "Sin control"} · {latestVital?.professional ?? "Sin profesional"}
                    </p>
                  </section>

                  <section className="rounded-[28px] border border-stone-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                          Medicacion activa y adherencia
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          Estado por farmaco y seguimiento del plan
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedEntry.patient.medicationRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-2xl border border-stone-200 bg-[#fcfbf8] px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-stone-900">
                                {record.name} {record.dose}
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                {record.frequency} · {record.route} · {record.schedule}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={[
                                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                  record.administrationStatus === "Administrado"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700",
                                ].join(" ")}
                              >
                                {record.administrationStatus}
                              </span>
                              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] text-stone-600">
                                {record.adherence}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_340px]">
                  <section className="rounded-[28px] border border-stone-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                          Linea de tiempo clinica longitudinal
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          Eventos en orden cronologico con responsable y numero de evento
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedEntry.timelineItems.map((event, index) => (
                        <TimelineEventCard
                          key={event.id}
                          event={event}
                          index={index + 1}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-stone-200 bg-white p-4">
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                        Controles y acciones pendientes
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Prioridad temporal visible para los mas criticos
                      </p>
                    </div>

                    <div className="space-y-3">
                      {selectedEntry.pendingTasks.map((task) => (
                        <PendingTaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <section className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
                <p className="text-lg font-semibold text-stone-900">
                  No hay pacientes visibles en seguimiento
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  Ajusta la busqueda o el filtro rapido para seguir trabajando.
                </p>
              </section>
            )}
          </div>
        </div>
      </section>
    </ModulePage>
  );
}

function DashboardMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "critical" | "warning" | "success";
}) {
  const toneClassName =
    tone === "critical"
      ? "text-red-600"
      : tone === "warning"
      ? "text-amber-600"
      : tone === "success"
      ? "text-emerald-600"
      : "text-stone-900";

  return (
    <article className="rounded-[24px] border border-stone-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">{label}</p>
      <p className={["mt-3 text-4xl font-semibold tracking-tight", toneClassName].join(" ")}>{value}</p>
      <p className="mt-2 text-sm text-stone-500">{hint}</p>
    </article>
  );
}

function HeaderKpi({
  value,
  label,
  tone = "default",
}: {
  value: string | number;
  label: string;
  tone?: "default" | "critical" | "warning" | "success";
}) {
  const toneClassName =
    tone === "critical"
      ? "text-red-600"
      : tone === "warning"
      ? "text-amber-600"
      : tone === "success"
      ? "text-emerald-600"
      : "text-stone-900";

  return (
    <div className="rounded-[22px] border border-stone-200 bg-[#fcfbf8] px-4 py-4">
      <p className={["text-3xl font-semibold", toneClassName].join(" ")}>{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  );
}

function ActionButton({
  label,
  tone = "default",
  href,
  onClick,
}: {
  label: string;
  tone?: "default" | "critical";
  href?: string;
  onClick?: () => void;
}) {
  const className = [
    "rounded-2xl border px-4 py-3 text-center text-sm font-medium transition",
    tone === "critical"
      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

function VitalTrendCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "critical" | "warning" | "success";
}) {
  const toneClassName =
    tone === "critical"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={["rounded-[22px] border p-4", toneClassName].join(" ")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5">{detail}</p>
    </div>
  );
}

function TimelineEventCard({
  event,
  index,
}: {
  event: TimelineItem;
  index: number;
}) {
  return (
    <article className="flex gap-4 rounded-[24px] border border-stone-200 bg-[#fcfbf8] p-4">
      <div className="flex w-14 shrink-0 flex-col items-center">
        <span
          className={[
            "mt-1 h-3 w-3 rounded-full",
            event.tone === "critical"
              ? "bg-red-500"
              : event.tone === "warning"
              ? "bg-amber-500"
              : event.tone === "info"
              ? "bg-sky-500"
              : "bg-stone-400",
          ].join(" ")}
        />
        <span className="mt-3 text-[11px] text-stone-400">#{index}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>{event.datetime}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5">{event.category}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-700">{event.detail}</p>
      </div>
    </article>
  );
}

function PendingTaskCard({ task }: { task: FollowUpTask }) {
  const toneClassName =
    task.urgency === "critical"
      ? "border-red-200 bg-red-50"
      : task.urgency === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-stone-200 bg-[#fcfbf8]";

  return (
    <article className={["rounded-[22px] border px-4 py-4", toneClassName].join(" ")}>
      <p className="text-sm font-semibold text-stone-900">{task.title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{task.detail}</p>
    </article>
  );
}

function buildFollowUpPatient(
  patient: PatientRecord,
  extras: {
    scheduledControls: ScheduledControl[];
    requestedLabs: RequestedLab[];
  }
): FollowUpPatient {
  const timelineItems = buildTimelineItems(patient, extras);
  const pendingTasks = buildPendingTasks(patient, extras);
  const pendingLabs =
    patient.exams.filter((exam) => exam.status === "Pendiente").length + extras.requestedLabs.length;
  const stayHours = getStayHours(patient);
  const followUpStatus = getFollowUpStatus(patient, pendingTasks.length);

  return {
    patient,
    pendingCount: pendingTasks.length,
    controlLabel: getControlLabel(patient, extras.scheduledControls),
    controlCountdown: getControlCountdown(patient, extras.scheduledControls),
    followUpStatus,
    pendingLabs,
    stayHours,
    protocolLabel: getProtocolLabel(patient),
    timelineItems,
    pendingTasks,
  };
}

function buildTimelineItems(
  patient: PatientRecord,
  extras: {
    scheduledControls: ScheduledControl[];
    requestedLabs: RequestedLab[];
  }
): TimelineItem[] {
  const timelineEvents = patient.timeline.map((event) => ({
    id: event.id,
    datetime: event.datetime,
    category: event.category,
    detail: event.detail,
    tone: getTimelineTone(event.category, event.detail),
  }));

  const noteEvents = [...patient.nursingNotes, ...patient.medicalNotes].map((note) => ({
    id: note.id,
    datetime: note.datetime,
    category: note.specialty,
    detail: note.note,
    tone: "info" as const,
  }));

  const examEvents = patient.exams.map((exam) => ({
    id: exam.id,
    datetime: exam.resultAt ?? exam.requestedAt,
    category: exam.category,
    detail: `${exam.name}: ${exam.summary}`,
    tone: exam.status === "Pendiente" ? ("warning" as const) : ("neutral" as const),
  }));

  const scheduledEvents = extras.scheduledControls.map((control) => ({
    id: control.id,
    datetime: control.datetime,
    category: "Control programado",
    detail: `${control.controlType}${control.note ? ` · ${control.note}` : ""}`,
    tone: "info" as const,
  }));

  const requestedLabEvents = extras.requestedLabs.map((exam) => ({
    id: exam.id,
    datetime: exam.requestedAt,
    category: "Solicitud laboratorio",
    detail: `${exam.name} · ${exam.group} · ${exam.category} · Prioridad ${exam.priority}${exam.note ? ` · ${exam.note}` : ""}`,
    tone: exam.priority === "critico" ? ("critical" as const) : ("warning" as const),
  }));

  return [...timelineEvents, ...noteEvents, ...examEvents, ...scheduledEvents, ...requestedLabEvents]
    .sort((left, right) => right.datetime.localeCompare(left.datetime))
    .slice(0, 7);
}

function buildPendingTasks(
  patient: PatientRecord,
  extras: {
    scheduledControls: ScheduledControl[];
    requestedLabs: RequestedLab[];
  }
): FollowUpTask[] {
  const tasks: FollowUpTask[] = [];
  const nextControl = getNextScheduledControl(extras.scheduledControls);

  if (nextControl) {
    tasks.push({
      id: nextControl.id,
      title: nextControl.controlType,
      detail: `${formatCompactDateTime(nextControl.datetime)} · ${getCountdownLabel(nextControl.datetime)}${
        nextControl.note ? ` · ${nextControl.note}` : ""
      }`,
      urgency: getScheduledControlUrgency(nextControl.datetime),
    });
  }

  if (patient.triageColor === "rojo") {
    tasks.push({
      id: `${patient.id}-control-cardiaco`,
      title: "Control cardiaco intensivo",
      detail: `Hoy ${getControlLabel(patient)} · vence en 45 min`,
      urgency: "critical",
    });
  }

  patient.exams
    .filter((exam) => exam.status === "Pendiente")
    .forEach((exam) => {
      tasks.push({
        id: exam.id,
        title: `Resultado pendiente: ${exam.name}`,
        detail: `Solicitado ${exam.requestedAt} · seguimiento con laboratorio`,
        urgency: "warning",
      });
    });

  patient.medicationRecords
    .filter((record) => record.administrationStatus !== "Administrado")
    .forEach((record) => {
      tasks.push({
        id: record.id,
        title: `Pendiente: ${record.name}`,
        detail: `${record.frequency} · ${record.schedule} · ${record.notes}`,
        urgency: record.administrationStatus === "Pendiente" ? "critical" : "warning",
      });
    });

  extras.requestedLabs.forEach((exam) => {
    tasks.push({
      id: exam.id,
      title: `Solicitud de laboratorio: ${exam.name}`,
      detail: `${exam.group} · registrado ${formatCompactDateTime(exam.requestedAt)} · prioridad ${exam.priority}${
        exam.note ? ` · ${exam.note}` : ""
      }`,
      urgency: exam.priority === "critico" ? "critical" : "warning",
    });
  });

  if (patient.currentStatus === "Alta proxima" || patient.careMode === "Ambulatorio") {
    tasks.push({
      id: `${patient.id}-discharge`,
      title: "Evaluacion de alta",
      detail: `Programado ${getControlLabel(patient)} · revisar plan ambulatorio`,
      urgency: "normal",
    });
  }

  return tasks.slice(0, 4);
}

function getFollowUpStatus(patient: PatientRecord, pendingCount: number) {
  if (patient.currentStatus === "Alta proxima") {
    return "Alta hoy";
  }

  if (patient.riskLevel === "alto" || pendingCount >= 2) {
    return "Requiere seguimiento";
  }

  if (pendingCount === 1) {
    return "En revision";
  }

  return "Adecuada";
}

function getControlLabel(patient: PatientRecord, scheduledControls: ScheduledControl[] = []) {
  const nextControl = getNextScheduledControl(scheduledControls);

  if (nextControl) {
    return formatControlSlot(nextControl.datetime);
  }

  if (patient.triageColor === "rojo") {
    return "hoy 12:00";
  }
  if (patient.triageColor === "naranja") {
    return "hoy 14:00";
  }
  if (patient.currentStatus === "Alta proxima") {
    return "hoy 18:00";
  }
  if (patient.careMode === "Hospitalizacion") {
    return "hoy 16:00";
  }
  return "manana 09:00";
}

function getControlCountdown(patient: PatientRecord, scheduledControls: ScheduledControl[] = []) {
  const nextControl = getNextScheduledControl(scheduledControls);

  if (nextControl) {
    return getCountdownLabel(nextControl.datetime);
  }

  if (patient.triageColor === "rojo") {
    return "Vence en 45 min";
  }
  if (patient.triageColor === "naranja") {
    return "Prioridad alta";
  }
  if (patient.currentStatus === "Alta proxima") {
    return "Alta programada";
  }
  return patient.careMode === "Hospitalizacion" ? "En vigilancia" : "Seguimiento ambulatorio";
}

function getProtocolLabel(patient: PatientRecord) {
  const diagnosis = patient.primaryDiagnosis.toLowerCase();

  if (diagnosis.includes("coronario") || diagnosis.includes("toracico")) {
    return "Protocolo SCA activo";
  }
  if (diagnosis.includes("trauma")) {
    return "Protocolo trauma";
  }
  if (diagnosis.includes("hiperglucemia")) {
    return "Control metabolico";
  }

  return "Seguimiento general";
}

function getStayHours(patient: PatientRecord) {
  const latest = patient.vitalSigns[0]?.recordedAt ?? `${patient.admissionDate} 08:00`;
  const admitted = `${patient.admissionDate} 08:00`;
  const hours = Math.max(
    Math.round((parseFollowUpDateTime(latest).getTime() - parseFollowUpDateTime(admitted).getTime()) / 36e5),
    6
  );
  return hours;
}

function compareNumber(
  current: number | undefined,
  previous: number | undefined,
  stableLabel: string
) {
  if (typeof current !== "number") {
    return "Sin dato previo";
  }
  if (typeof previous !== "number") {
    return "Primer control registrado";
  }

  if (current === previous) {
    return `Sin cambio · ${stableLabel}`;
  }

  const delta = current - previous;
  return `${delta > 0 ? "↑" : "↓"} ${Math.abs(delta)} vs previo`;
}

function comparePressure(current?: string, previous?: string) {
  if (!current || !previous) {
    return "Primer control registrado";
  }

  return current === previous ? "Sin cambio" : `${previous} -> ${current}`;
}

function matchesFollowUpSearch(patient: PatientRecord, query: string) {
  const haystack = [
    patient.fullName,
    patient.identification,
    patient.medicalRecordNumber,
    patient.code,
    patient.primaryDiagnosis,
    getPatientServiceArea(patient),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getTimelineTone(category: string, detail: string) {
  const terms = `${category} ${detail}`.toLowerCase();

  if (terms.includes("alerta") || terms.includes("rojo") || terms.includes("critic")) {
    return "critical" as const;
  }
  if (terms.includes("pendiente") || terms.includes("triage") || terms.includes("control")) {
    return "warning" as const;
  }
  if (terms.includes("consulta") || terms.includes("nota")) {
    return "info" as const;
  }

  return "neutral" as const;
}

function getTriageBadgeTone(color: TriageColor) {
  const map: Record<TriageColor, string> = {
    rojo: "border-red-200 bg-red-50 text-red-700",
    naranja: "border-orange-200 bg-orange-50 text-orange-700",
    amarillo: "border-amber-200 bg-amber-50 text-amber-700",
    verde: "border-emerald-200 bg-emerald-50 text-emerald-700",
    azul: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return map[color];
}

function getTriageBarTone(color: TriageColor) {
  const map: Record<TriageColor, string> = {
    rojo: "w-full bg-red-500",
    naranja: "w-4/5 bg-orange-500",
    amarillo: "w-3/5 bg-amber-500",
    verde: "w-2/5 bg-emerald-500",
    azul: "w-1/3 bg-sky-500",
  };

  return map[color];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0] ?? "")
    .join("")
    .toUpperCase();
}

function summarizeLabNames(records: RequestedLab[]) {
  const names = records.map((record) => record.name);

  if (names.length <= 3) {
    return names.join(", ");
  }

  return `${names.slice(0, 3).join(", ")} y ${names.length - 3} mas`;
}

function getSuggestedControlDateTime(patient: PatientRecord) {
  if (patient.triageColor === "rojo") {
    return "2026-03-15T12:00";
  }
  if (patient.triageColor === "naranja") {
    return "2026-03-15T14:00";
  }
  if (patient.currentStatus === "Alta proxima") {
    return "2026-03-15T18:00";
  }
  return patient.careMode === "Hospitalizacion" ? "2026-03-15T16:00" : "2026-03-16T09:00";
}

function getSuggestedLabOptionId(patient: PatientRecord) {
  const diagnosis = patient.primaryDiagnosis.toLowerCase();

  if (patient.triageColor === "rojo" || diagnosis.includes("coronario") || diagnosis.includes("toracico")) {
    return "troponina_i";
  }

  if (diagnosis.includes("hiperglucemia") || diagnosis.includes("diabetes")) {
    return "glucosa";
  }

  if (diagnosis.includes("infeccion") || diagnosis.includes("fiebre")) {
    return "hemograma";
  }

  return "hemograma";
}

function getNextScheduledControl(controls: ScheduledControl[]) {
  if (controls.length === 0) {
    return null;
  }

  return [...controls].sort((left, right) => left.datetime.localeCompare(right.datetime))[0] ?? null;
}

function getScheduledControlUrgency(datetime: string): FollowUpTask["urgency"] {
  const diffMinutes = Math.round(
    (parseFollowUpDateTime(datetime).getTime() - parseFollowUpDateTime(followUpReferenceNow).getTime()) / 6e4
  );

  if (diffMinutes <= 60) {
    return "critical";
  }

  if (diffMinutes <= 180) {
    return "warning";
  }

  return "normal";
}

function getCountdownLabel(datetime: string) {
  const diffMinutes = Math.round(
    (parseFollowUpDateTime(datetime).getTime() - parseFollowUpDateTime(followUpReferenceNow).getTime()) / 6e4
  );

  if (diffMinutes < 0) {
    return `Vencido hace ${Math.abs(diffMinutes)} min`;
  }

  if (diffMinutes < 60) {
    return `Vence en ${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes === 0 ? `Vence en ${hours} h` : `Vence en ${hours} h ${minutes} min`;
}

function formatControlSlot(datetime: string) {
  const date = parseFollowUpDateTime(datetime);
  const reference = parseFollowUpDateTime(followUpReferenceNow);
  const sameDay = date.toDateString() === reference.toDateString();

  if (sameDay) {
    return `hoy ${formatHour(date)}`;
  }

  const tomorrow = new Date(reference);
  tomorrow.setDate(reference.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `manana ${formatHour(date)}`;
  }

  return formatCompactDateTime(datetime);
}

function formatCompactDateTime(datetime: string) {
  const date = parseFollowUpDateTime(datetime);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month} ${formatHour(date)}`;
}

function formatHour(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toStorageDateTime(value: string) {
  return value.replace("T", " ");
}

function parseFollowUpDateTime(value: string) {
  return new Date(value.replace(" ", "T"));
}
