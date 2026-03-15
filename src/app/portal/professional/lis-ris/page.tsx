"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ModulePage } from "../_components/clinical-ui";
import {
  examRequestCatalog,
  type ExamCatalogOption,
  type ExamRequestPriority,
} from "../_data/exam-request-catalog";
import { getPatientServiceArea, mockPatients, type ExamRecord, type PatientRecord } from "../_data/clinical-mock-data";

type LisRisTab = "lis" | "ris" | "trend";
type RequestMode = "lis" | "ris";
type QueueStatus = "critical" | "pending" | "completed";
type OrderSystem = "LIS" | "RIS";
type OrderKind = "lab" | "image" | "ecg";
type ResultTone = "critical" | "high" | "low" | "normal" | "pending";
type TrendDirection = "up" | "down" | "same";
type TrendTone = "critical" | "warning" | "good" | "neutral";

type CriticalNotification = {
  notifiedTo: string;
  notifiedAt: string;
  confirmedBy: string;
  confirmedAt: string;
  note: string;
};

type ResultRow = {
  id: string;
  label: string;
  value: string;
  reference: string;
  tone: ResultTone;
  previous?: string;
  trend: TrendDirection;
};

type ImagingViewer = {
  modality: string;
  previewTitle: string;
  previewHint: string;
  report: string;
  cardiologyReport?: string;
  viewerButtonLabel: string;
  studyStatus: string;
};

type TrendMetric = {
  id: string;
  label: string;
  current: string;
  previous: string;
  direction: TrendDirection;
  tone: TrendTone;
  clinicalMeaning: string;
};

type TimelineEvent = {
  id: string;
  datetime: string;
  title: string;
  detail: string;
  tone: TrendTone;
  owner: string;
};

type LisRisOrder = {
  id: string;
  catalogId?: string;
  system: OrderSystem;
  kind: OrderKind;
  queueStatus: QueueStatus;
  priority: ExamRequestPriority;
  name: string;
  discipline: string;
  requestedAt: string;
  resultAt?: string;
  requestedBy: string;
  etaLabel: string;
  summary: string;
  observation: string;
  resultRows?: ResultRow[];
  viewer?: ImagingViewer;
  criticalNotification?: CriticalNotification;
  linkedTrendIds: string[];
};

type RequestDraftItem = {
  catalogId: string;
  priority: ExamRequestPriority;
};

type PatientWorkspace = {
  orders: LisRisOrder[];
  defaultRequestIds: string[];
  trendMetrics: TrendMetric[];
  timeline: TimelineEvent[];
  averageTurnaroundLabel: string;
};

const referenceNow = "15 mar 2026 12:45";
const queueStatusOrder: Record<QueueStatus, number> = {
  critical: 0,
  pending: 1,
  completed: 2,
};

const tabDefinitions: Array<{ id: LisRisTab; label: string; detail: string }> = [
  { id: "lis", label: "Laboratorio (LIS)", detail: "Resultados, criticidad y validacion" },
  { id: "ris", label: "Imagen / Radiologia (RIS)", detail: "DICOM, informes y ECG" },
  { id: "trend", label: "Tendencia diagnostica", detail: "Comparativos y evolucion longitudinal" },
];

export default function LisRisPage() {
  const searchParams = useSearchParams();
  const requestedPatientId = searchParams.get("patientId") ?? "";
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() =>
    mockPatients.some((patient) => patient.id === requestedPatientId)
      ? requestedPatientId
      : mockPatients[0]?.id ?? ""
  );
  const [activeTab, setActiveTab] = useState<LisRisTab>("lis");
  const [requestMode, setRequestMode] = useState<RequestMode>("lis");
  const [selectedOrderIdsByScope, setSelectedOrderIdsByScope] = useState<Record<string, string>>({});
  const [requestQuery, setRequestQuery] = useState("");
  const [requestItemsByPatient, setRequestItemsByPatient] = useState<Record<string, RequestDraftItem[]>>({});
  const [requestNotesByPatient, setRequestNotesByPatient] = useState<Record<string, string>>({});
  const [requestFeedbackByPatient, setRequestFeedbackByPatient] = useState<
    Record<string, string | null>
  >({});
  const [createdOrdersByPatient, setCreatedOrdersByPatient] = useState<Record<string, LisRisOrder[]>>({});

  const selectedPatient =
    mockPatients.find((patient) => patient.id === selectedPatientId) ?? mockPatients[0] ?? null;

  const workspace = useMemo(
    () => (selectedPatient ? buildPatientWorkspace(selectedPatient) : null),
    [selectedPatient]
  );

  const allOrders = useMemo(
    () =>
      sortOrders([
        ...((selectedPatient ? createdOrdersByPatient[selectedPatient.id] ?? [] : []) as LisRisOrder[]),
        ...(workspace?.orders ?? []),
      ]),
    [createdOrdersByPatient, selectedPatient, workspace]
  );

  const lisOrders = useMemo(() => allOrders.filter((order) => order.system === "LIS"), [allOrders]);
  const risOrders = useMemo(() => allOrders.filter((order) => order.system === "RIS"), [allOrders]);
  const filteredOrders = useMemo(() => {
    if (activeTab === "lis") {
      return lisOrders;
    }

    if (activeTab === "ris") {
      return risOrders;
    }

    return allOrders.filter(
      (order) => order.linkedTrendIds.length > 0 || order.queueStatus !== "pending"
    );
  }, [activeTab, allOrders, lisOrders, risOrders]);

  const requestItems = useMemo(() => {
    if (!selectedPatient || !workspace) {
      return [];
    }

    return requestItemsByPatient[selectedPatient.id] ?? buildDefaultRequestItems(workspace.defaultRequestIds);
  }, [requestItemsByPatient, selectedPatient, workspace]);
  const requestNote = selectedPatient ? requestNotesByPatient[selectedPatient.id] ?? "" : "";
  const requestFeedback = selectedPatient ? requestFeedbackByPatient[selectedPatient.id] ?? null : null;
  const selectedOrderScope = selectedPatient ? `${selectedPatient.id}-${activeTab}` : activeTab;
  const selectedOrderId = selectedOrderIdsByScope[selectedOrderScope] ?? filteredOrders[0]?.id ?? "";
  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null;
  const selectedRequestEntries = useMemo(
    () =>
      requestItems
        .map((item) => {
          const option = examRequestCatalog.find((entry) => entry.id === item.catalogId);
          return option ? { item, option } : null;
        })
        .filter((entry): entry is { item: RequestDraftItem; option: ExamCatalogOption } => entry !== null),
    [requestItems]
  );
  const activeCatalogIds = useMemo(
    () =>
      new Set(
        allOrders
          .filter((order) => order.queueStatus !== "completed")
          .map((order) => order.catalogId)
          .filter((catalogId): catalogId is string => Boolean(catalogId))
      ),
    [allOrders]
  );
  const requestOptions = useMemo(
    () =>
      examRequestCatalog.filter((option) => {
        const matchesMode = requestMode === "lis" ? isLisCatalogOption(option) : isRisCatalogOption(option);
        const matchesQuery = !requestQuery || normalizeText(option.name).includes(normalizeText(requestQuery));
        return matchesMode && matchesQuery;
      }),
    [requestMode, requestQuery]
  );
  const requestGroups = useMemo(() => groupExamCatalogByGroup(requestOptions), [requestOptions]);
  const topMetrics = useMemo(
    () => ({
      critical: allOrders.filter((order) => order.queueStatus === "critical").length,
      pending: allOrders.filter((order) => order.queueStatus === "pending").length,
      completed: allOrders.filter((order) => order.queueStatus === "completed").length,
      dicom: risOrders.length,
      averageTurnaround: workspace?.averageTurnaroundLabel ?? "-",
    }),
    [allOrders, risOrders.length, workspace]
  );
  const tabBadges = useMemo(
    () => ({
      lis: `${lisOrders.filter((order) => order.queueStatus === "critical").length} criticos`,
      ris: `${risOrders.filter((order) => order.queueStatus === "pending").length} pendientes`,
      trend: `${workspace?.trendMetrics.filter((metric) => metric.tone !== "neutral").length ?? 0} cambios`,
    }),
    [lisOrders, risOrders, workspace]
  );
  const companionImagingOrder = useMemo(
    () => risOrders.find((order) => Boolean(order.viewer)) ?? risOrders[0] ?? null,
    [risOrders]
  );
  const companionLabOrder = useMemo(
    () => lisOrders.find((order) => Boolean(order.resultRows?.length)) ?? lisOrders[0] ?? null,
    [lisOrders]
  );

  const openRequestPanel = (mode: RequestMode, nextTab: LisRisTab) => {
    setRequestMode(mode);
    setActiveTab(nextTab);
    if (selectedPatient) {
      setRequestFeedbackByPatient((current) => ({
        ...current,
        [selectedPatient.id]: null,
      }));
    }
    document.getElementById("lis-ris-request-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const toggleRequestItem = (option: ExamCatalogOption) => {
    if (!selectedPatient) {
      return;
    }

    setRequestItemsByPatient((current) => {
      const patientItems =
        current[selectedPatient.id] ?? buildDefaultRequestItems(workspace?.defaultRequestIds ?? []);

      if (patientItems.some((item) => item.catalogId === option.id)) {
        return {
          ...current,
          [selectedPatient.id]: patientItems.filter((item) => item.catalogId !== option.id),
        };
      }

      return {
        ...current,
        [selectedPatient.id]: [
          ...patientItems,
          {
            catalogId: option.id,
            priority: option.defaultPriority,
          },
        ],
      };
    });
  };

  const updateRequestPriority = (catalogId: string, priority: ExamRequestPriority) => {
    if (!selectedPatient) {
      return;
    }

    setRequestItemsByPatient((current) => {
      const patientItems =
        current[selectedPatient.id] ?? buildDefaultRequestItems(workspace?.defaultRequestIds ?? []);

      return {
        ...current,
        [selectedPatient.id]: patientItems.map((item) =>
          item.catalogId === catalogId ? { ...item, priority } : item
        ),
      };
    });
  };

  const saveRequests = () => {
    if (!selectedPatient || selectedRequestEntries.length === 0) {
      return;
    }

    const newRequests = selectedRequestEntries.filter(
      (entry) => !activeCatalogIds.has(entry.option.id)
    );

    if (newRequests.length === 0) {
      setRequestFeedbackByPatient((current) => ({
        ...current,
        [selectedPatient.id]: "Las solicitudes seleccionadas ya estan activas en la cola del paciente.",
      }));
      return;
    }

    const createdAt = "2026-03-15 12:45";
    const generatedOrders = newRequests.map(({ item, option }, index) =>
      buildRequestedOrder(selectedPatient, option, item.priority, requestNote, createdAt, index)
    );

    setCreatedOrdersByPatient((current) => ({
      ...current,
      [selectedPatient.id]: [...generatedOrders, ...(current[selectedPatient.id] ?? [])],
    }));
    setSelectedOrderIdsByScope((current) => ({
      ...current,
      [`${selectedPatient.id}-${activeTab}`]: generatedOrders[0]?.id ?? current[`${selectedPatient.id}-${activeTab}`] ?? "",
    }));
    setRequestFeedbackByPatient((current) => ({
      ...current,
      [selectedPatient.id]: `${generatedOrders.length} solicitud${generatedOrders.length > 1 ? "es" : ""} registrada${generatedOrders.length > 1 ? "s" : ""} para ${selectedPatient.fullName}.`,
    }));
  };

  if (!selectedPatient || !workspace) {
    return (
      <ModulePage
        title="Laboratorio e imagen - LIS / RIS"
        subtitle="No hay pacientes disponibles para cargar el modulo."
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No se encontro informacion clinica para mostrar en LIS/RIS.
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title="Laboratorio e imagen - LIS / RIS"
      subtitle="Solicitudes, resultados, valores criticos y estudios DICOM en una sola estacion clinica."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/portal/professional/patients/${selectedPatient.id}`}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Historial completo
          </Link>
          <button
            type="button"
            onClick={() => openRequestPanel("ris", "ris")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Solicitar imagen
          </button>
          <button
            type="button"
            onClick={() => openRequestPanel("lis", "lis")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            + Solicitar laboratorio
          </button>
        </div>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-xl font-semibold text-red-600">
                {initialsOf(selectedPatient.fullName)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-slate-900">{selectedPatient.fullName}</h2>
                  <StatusChip tone={getTriageTone(selectedPatient.triageColor)}>
                    {selectedPatient.triageColor.toUpperCase()}
                  </StatusChip>
                </div>
                <p className="text-sm text-slate-600">
                  {selectedPatient.age} a. - {selectedPatient.sex} - {selectedPatient.identification}
                </p>
                <p className="text-sm text-slate-500">
                  HC {selectedPatient.medicalRecordNumber} - {selectedPatient.personalData.bloodType} - {selectedPatient.personalData.insurance}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusChip tone="danger">Alergias: {selectedPatient.antecedentes.allergies.length}</StatusChip>
              {selectedPatient.secondaryDiagnoses.slice(0, 2).map((diagnosis) => (
                <StatusChip key={diagnosis} tone="warning">
                  {diagnosis}
                </StatusChip>
              ))}
              <StatusChip tone="info">{getPatientServiceArea(selectedPatient)}</StatusChip>
              <StatusChip tone="neutral">{selectedPatient.primaryDiagnosis}</StatusChip>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Cambiar paciente
            </label>
            <select
              value={selectedPatient.id}
              onChange={(event) => {
                setSelectedPatientId(event.target.value);
                setRequestQuery("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              {mockPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName} - {patient.medicalRecordNumber}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Referencia operativa: {referenceNow}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-3">
          {tabDefinitions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "rounded-[24px] border px-4 py-4 text-left transition",
                activeTab === tab.id
                  ? "border-emerald-200 bg-emerald-50 shadow-sm"
                  : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tab.label}</p>
                  <p className="text-xs text-slate-500">{tab.detail}</p>
                </div>
                <StatusChip tone={activeTab === tab.id ? "success" : "warning"}>
                  {tab.id === "lis" ? tabBadges.lis : tab.id === "ris" ? tabBadges.ris : tabBadges.trend}
                </StatusChip>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TopMetricCard
          label="Resultados criticos"
          value={topMetrics.critical}
          hint="Accion inmediata"
          tone="danger"
        />
        <TopMetricCard
          label="Pendientes"
          value={topMetrics.pending}
          hint="En proceso"
          tone="warning"
        />
        <TopMetricCard
          label="Resultados listos"
          value={topMetrics.completed}
          hint="Disponibles hoy"
          tone="success"
        />
        <TopMetricCard
          label="Estudios DICOM"
          value={topMetrics.dicom}
          hint="RIS / ECG"
          tone="info"
        />
        <TopMetricCard
          label="Tiempo promedio"
          value={topMetrics.averageTurnaround}
          hint="Lab -> resultado"
          tone="neutral"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Cola de ordenes
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Ordenes del paciente</h3>
                <p className="text-xs text-slate-500">Criticos, pendientes y completados en una sola lista.</p>
              </div>
              <button
                type="button"
                onClick={() => openRequestPanel(activeTab === "ris" ? "ris" : "lis", activeTab === "ris" ? "ris" : "lis")}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                + Nueva
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <QueueGroup
                title="Resultados criticos"
                tone="danger"
                orders={filteredOrders.filter((order) => order.queueStatus === "critical")}
                selectedOrderId={selectedOrder?.id ?? ""}
                onSelect={(orderId) =>
                  setSelectedOrderIdsByScope((current) => ({
                    ...current,
                    [selectedOrderScope]: orderId,
                  }))
                }
              />
              <QueueGroup
                title="Pendientes"
                tone="warning"
                orders={filteredOrders.filter((order) => order.queueStatus === "pending")}
                selectedOrderId={selectedOrder?.id ?? ""}
                onSelect={(orderId) =>
                  setSelectedOrderIdsByScope((current) => ({
                    ...current,
                    [selectedOrderScope]: orderId,
                  }))
                }
              />
              <QueueGroup
                title="Completados"
                tone="success"
                orders={filteredOrders.filter((order) => order.queueStatus === "completed")}
                selectedOrderId={selectedOrder?.id ?? ""}
                onSelect={(orderId) =>
                  setSelectedOrderIdsByScope((current) => ({
                    ...current,
                    [selectedOrderScope]: orderId,
                  }))
                }
              />
            </div>
          </article>
        </div>

        <div className="space-y-4">
          {selectedOrder?.criticalNotification ? (
            <article className="rounded-[28px] border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-red-800">
                    Resultado critico - {selectedOrder.name}
                  </p>
                  <p className="mt-1 text-sm text-red-700">{selectedOrder.summary}</p>
                </div>
                <StatusChip tone="danger">Notificacion automatica</StatusChip>
              </div>
              <p className="mt-3 text-sm text-red-700">
                Notificado a {selectedOrder.criticalNotification.notifiedTo} a las {selectedOrder.criticalNotification.notifiedAt}. Confirmado por {selectedOrder.criticalNotification.confirmedBy} a las {selectedOrder.criticalNotification.confirmedAt}.
              </p>
              <p className="mt-2 text-xs text-red-600">{selectedOrder.criticalNotification.note}</p>
            </article>
          ) : null}

          {activeTab === "trend" ? (
            <>
              <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Tendencia diagnostica
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">Indicadores con comparativo previo</h3>
                  </div>
                  <StatusChip tone="info">
                    {workspace.trendMetrics.filter((metric) => metric.tone !== "neutral").length} cambios
                  </StatusChip>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {workspace.trendMetrics.map((metric) => (
                    <TrendMetricCard key={metric.id} metric={metric} />
                  ))}
                </div>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Linea de tiempo clinica
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">Eventos longitudinales</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {workspace.timeline.map((event) => (
                    <TimelineCard key={event.id} event={event} />
                  ))}
                </div>
              </article>
            </>
          ) : selectedOrder?.kind === "lab" ? (
            <>
              <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {selectedOrder.discipline}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedOrder.name}</h3>
                    <p className="text-sm text-slate-500">
                      {selectedOrder.requestedAt} - {selectedOrder.resultAt ?? selectedOrder.etaLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PriorityChip priority={selectedOrder.priority} />
                    <StatusChip tone={getQueueTone(selectedOrder.queueStatus)}>
                      {queueStatusLabel(selectedOrder.queueStatus)}
                    </StatusChip>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Examen</th>
                        <th className="px-3 py-2 font-semibold">Resultado</th>
                        <th className="px-3 py-2 font-semibold">Referencia</th>
                        <th className="px-3 py-2 font-semibold">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {(selectedOrder.resultRows ?? []).map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-3 font-medium text-slate-900">{row.label}</td>
                          <td className="px-3 py-3">
                            <span
                              className={[
                                "inline-flex rounded-xl border px-2.5 py-1 text-xs font-semibold",
                                resultToneClasses(row.tone),
                              ].join(" ")}
                            >
                              {row.value}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{row.reference}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-slate-700">
                                {trendArrow(row.trend)} {row.previous ?? "Sin previo"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <CompanionImagingPanel order={companionImagingOrder} />
            </>
          ) : (
            <>
              <ImagingViewerPanel order={selectedOrder} />
              <CompanionLabPanel order={companionLabOrder} trendMetrics={workspace.trendMetrics} />
            </>
          )}
        </div>

        <div className="space-y-4">
          <article
            id="lis-ris-request-panel"
            className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Formulario de solicitud
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Examenes frecuentes</h3>
                <p className="text-xs text-slate-500">
                  Chips agrupados por laboratorio e imagen, con marcado urgente por solicitud.
                </p>
              </div>
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setRequestMode("lis")}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    requestMode === "lis"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900",
                  ].join(" ")}
                >
                  Laboratorio
                </button>
                <button
                  type="button"
                  onClick={() => setRequestMode("ris")}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    requestMode === "ris"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900",
                  ].join(" ")}
                >
                  Imagen
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Buscar examen
                </span>
                <input
                  value={requestQuery}
                  onChange={(event) => setRequestQuery(event.target.value)}
                  placeholder="Troponina, INR, TAC de craneo..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </label>

              <div className="space-y-4">
                {requestGroups.map(([group, options]) => (
                  <div key={group}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => {
                        const selected = requestItems.some((item) => item.catalogId === option.id);
                        const active = activeCatalogIds.has(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleRequestItem(option)}
                            className={[
                              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
                              selected
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <span>{option.name}</span>
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                active
                                  ? "bg-red-100 text-red-700"
                                  : option.defaultPriority === "critico"
                                  ? "bg-red-100 text-red-700"
                                  : option.defaultPriority === "urgente"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600",
                              ].join(" ")}
                            >
                              {active ? "Activo" : option.defaultPriority}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Seleccionadas</p>
                    <p className="text-xs text-slate-500">
                      {selectedRequestEntries.length} ordenes en borrador
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestItemsByPatient((current) => ({
                        ...current,
                        [selectedPatient.id]: [],
                      }));
                      setRequestFeedbackByPatient((current) => ({
                        ...current,
                        [selectedPatient.id]: null,
                      }));
                    }}
                    className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {selectedRequestEntries.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Selecciona examenes desde los chips para preparar la solicitud.
                    </p>
                  ) : (
                    selectedRequestEntries.map(({ item, option }) => (
                      <div
                        key={option.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{option.name}</p>
                            <p className="text-xs text-slate-500">
                              {option.group} - {option.category}
                            </p>
                          </div>
                          {activeCatalogIds.has(option.id) ? (
                            <StatusChip tone="danger">Activa en cola</StatusChip>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <select
                            value={item.priority}
                            onChange={(event) =>
                              updateRequestPriority(
                                option.id,
                                event.target.value as ExamRequestPriority
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="rutina">Rutina</option>
                            <option value="urgente">Urgente</option>
                            <option value="critico">Critico</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => toggleRequestItem(option)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Justificacion / nota clinica
                </span>
                <textarea
                  value={requestNote}
                  onChange={(event) =>
                    setRequestNotesByPatient((current) => ({
                      ...current,
                      [selectedPatient.id]: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Motivo clinico, ventana terapeutica, estudios DICOM requeridos..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveRequests}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Registrar solicitud
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequestItemsByPatient((current) => ({
                      ...current,
                      [selectedPatient.id]: buildDefaultRequestItems(workspace.defaultRequestIds),
                    }));
                    setRequestNotesByPatient((current) => ({
                      ...current,
                      [selectedPatient.id]: "",
                    }));
                    setRequestFeedbackByPatient((current) => ({
                      ...current,
                      [selectedPatient.id]: null,
                    }));
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Restablecer sugeridos
                </button>
              </div>

              {requestFeedback ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {requestFeedback}
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Notificacion critica
              </p>
              <h3 className="text-lg font-semibold text-slate-900">Trazabilidad de acreditacion</h3>
            </div>
            <div className="mt-4 space-y-3">
              {(allOrders.filter((order) => Boolean(order.criticalNotification)).slice(0, 2)).map((order) => (
                <div key={order.id} className="rounded-2xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-800">{order.name}</p>
                  <p className="mt-1 text-xs text-red-700">
                    Notificado: {order.criticalNotification?.notifiedTo} - {order.criticalNotification?.notifiedAt}
                  </p>
                  <p className="text-xs text-red-600">
                    Confirmado por: {order.criticalNotification?.confirmedBy}
                  </p>
                </div>
              ))}
              {allOrders.every((order) => !order.criticalNotification) ? (
                <p className="text-sm text-slate-500">Sin notificaciones criticas activas para este paciente.</p>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </ModulePage>
  );
}

function QueueGroup({
  title,
  tone,
  orders,
  selectedOrderId,
  onSelect,
}: {
  title: string;
  tone: "danger" | "warning" | "success";
  orders: LisRisOrder[];
  selectedOrderId: string;
  onSelect: (orderId: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
        <StatusChip tone={tone}>{orders.length}</StatusChip>
      </div>
      <div className="space-y-2">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            Sin ordenes en este grupo.
          </div>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onSelect(order.id)}
              className={[
                "w-full rounded-[24px] border bg-white p-4 text-left transition",
                orderCardAccent(order.queueStatus),
                selectedOrderId === order.id
                  ? "border-slate-900 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{order.name}</p>
                    <PriorityChip priority={order.priority} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {order.discipline} - {order.system}
                  </p>
                </div>
                <StatusChip tone={getQueueTone(order.queueStatus)}>
                  {queueStatusLabel(order.queueStatus)}
                </StatusChip>
              </div>
              <p className="mt-3 text-sm text-slate-700">{order.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{order.resultAt ? `Resultado: ${order.resultAt}` : `Solicitada: ${order.requestedAt}`}</span>
                <span>{order.etaLabel}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function CompanionImagingPanel({ order }: { order: LisRisOrder | null }) {
  if (!order) {
    return (
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">No hay estudios RIS/DICOM para mostrar.</p>
      </article>
    );
  }

  return <ImagingViewerPanel order={order} compact />;
}

function ImagingViewerPanel({
  order,
  compact = false,
}: {
  order: LisRisOrder;
  compact?: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Estudios de imagen - RIS / DICOM
          </p>
          <h3 className="text-lg font-semibold text-slate-900">{order.name}</h3>
          <p className="text-sm text-slate-500">
            {order.viewer?.studyStatus ?? order.etaLabel} - {order.requestedAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityChip priority={order.priority} />
          <StatusChip tone={getQueueTone(order.queueStatus)}>
            {queueStatusLabel(order.queueStatus)}
          </StatusChip>
        </div>
      </div>

      <div className={compact ? "mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" : "mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"}>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-56 flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-white text-center">
            <div className="text-4xl">[ DICOM ]</div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {order.viewer?.previewTitle ?? order.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {order.viewer?.previewHint ?? "Vista previa del estudio"}
            </p>
            <button
              type="button"
              className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {order.viewer?.viewerButtonLabel ?? "Abrir visor"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Informe radiologico
            </p>
            <p className="mt-3 text-sm text-slate-700">
              {order.viewer?.report ?? order.summary}
            </p>
          </div>
          {order.viewer?.cardiologyReport ? (
            <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                Informe cardiologico integrado
              </p>
              <p className="mt-3 text-sm text-sky-800">{order.viewer.cardiologyReport}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function CompanionLabPanel({
  order,
  trendMetrics,
}: {
  order: LisRisOrder | null;
  trendMetrics: TrendMetric[];
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Laboratorio relacionado
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {order?.name ?? "Sin resultados de laboratorio"}
          </h3>
        </div>
        <StatusChip tone="info">Tendencia</StatusChip>
      </div>
      {order?.resultRows?.length ? (
        <div className="mt-4 space-y-3">
          {order.resultRows.slice(0, 4).map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                <p className="text-xs text-slate-500">{row.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{row.value}</p>
                <p className="text-xs text-slate-500">
                  {trendArrow(row.trend)} {row.previous ?? "Sin previo"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No hay detalle analitico adicional para esta orden.
        </p>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {trendMetrics.slice(0, 4).map((metric) => (
          <TrendMetricCard key={metric.id} metric={metric} compact />
        ))}
      </div>
    </article>
  );
}

function TrendMetricCard({
  metric,
  compact = false,
}: {
  metric: TrendMetric;
  compact?: boolean;
}) {
  return (
    <article
      className={[
        "rounded-[24px] border p-4",
        metricCardClasses(metric.tone),
        compact ? "bg-white" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.current}</p>
        </div>
        <span className="text-sm font-semibold text-slate-600">
          {trendArrow(metric.direction)}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">Previo: {metric.previous}</p>
      <p className="mt-3 text-sm text-slate-700">{metric.clinicalMeaning}</p>
    </article>
  );
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  return (
    <article className="flex gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div
        className={[
          "mt-1 h-3 w-3 rounded-full",
          event.tone === "critical"
            ? "bg-red-500"
            : event.tone === "warning"
            ? "bg-amber-500"
            : event.tone === "good"
            ? "bg-emerald-500"
            : "bg-slate-400",
        ].join(" ")}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
          <span className="text-xs text-slate-500">{event.datetime}</span>
        </div>
        <p className="mt-1 text-sm text-slate-700">{event.detail}</p>
        <p className="mt-2 text-xs text-slate-500">{event.owner}</p>
      </div>
    </article>
  );
}

function TopMetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className={["mt-3 text-4xl font-semibold", toneTextClasses(tone)].join(" ")}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

function StatusChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses(tone),
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function PriorityChip({ priority }: { priority: ExamRequestPriority }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase",
        priority === "critico"
          ? "border-red-200 bg-red-50 text-red-700"
          : priority === "urgente"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {priority}
    </span>
  );
}

function buildPatientWorkspace(patient: PatientRecord): PatientWorkspace {
  if (patient.id === "p-001") {
    return buildCardioWorkspace();
  }

  const genericOrders = sortOrders(
    patient.exams.map((exam) => mapExamRecordToOrder(patient, exam))
  );

  return {
    orders: genericOrders,
    defaultRequestIds:
      genericOrders
        .filter((order) => order.queueStatus === "pending")
        .map((order) => order.catalogId)
        .filter((catalogId): catalogId is string => Boolean(catalogId))
        .slice(0, 3) || [],
    trendMetrics: buildGenericTrendMetrics(patient),
    timeline: buildGenericTimeline(patient, genericOrders),
    averageTurnaroundLabel: calculateAverageTurnaroundLabel(genericOrders),
  };
}

function buildCardioWorkspace(): PatientWorkspace {
  const orders: LisRisOrder[] = [
    {
      id: "lis-001-glucosa",
      catalogId: "glucosa",
      system: "LIS",
      kind: "lab",
      queueStatus: "critical",
      priority: "critico",
      name: "Glucosa en ayuno",
      discipline: "Bioquimica y hematologia",
      requestedAt: "2026-03-08 05:10",
      resultAt: "2026-03-08 06:00",
      requestedBy: "Dra. Camila Rojas",
      etaLabel: "Disponible",
      summary:
        "Valor supera umbral critico (>250 mg/dL). Se notifico de forma inmediata y se ajusto hidratacion.",
      observation:
        "Mantener SSN 0.9% a 125 ml/h. Control capilar en 2 horas y revisar necesidad de ajuste insulinico.",
      criticalNotification: {
        notifiedTo: "Lic. Naranjo y Dr. Vargas",
        notifiedAt: "06:05",
        confirmedBy: "Lic. Naranjo",
        confirmedAt: "06:10",
        note:
          "Registro automatico de valor critico segun protocolo institucional. Confirmacion manual completada en la estacion LIS.",
      },
      resultRows: [
        {
          id: "row-glu",
          label: "Glucosa en ayuno",
          value: "287 mg/dL",
          reference: "70-100 mg/dL",
          tone: "critical",
          previous: "241 mg/dL",
          trend: "up",
        },
        {
          id: "row-hba1c",
          label: "HbA1c",
          value: "9.4 %",
          reference: "< 6.5 %",
          tone: "high",
          previous: "9.1 %",
          trend: "up",
        },
        {
          id: "row-leu",
          label: "Leucocitos",
          value: "14,200 /uL",
          reference: "4,500-11,000 /uL",
          tone: "high",
          previous: "13,100 /uL",
          trend: "up",
        },
        {
          id: "row-hb",
          label: "Hemoglobina",
          value: "12.8 g/dL",
          reference: "12-16 g/dL",
          tone: "normal",
          previous: "12.5 g/dL",
          trend: "up",
        },
        {
          id: "row-cr",
          label: "Creatinina",
          value: "0.9 mg/dL",
          reference: "0.5-1.1 mg/dL",
          tone: "normal",
          previous: "1.0 mg/dL",
          trend: "down",
        },
        {
          id: "row-urea",
          label: "Urea",
          value: "32 mg/dL",
          reference: "15-45 mg/dL",
          tone: "normal",
          previous: "38 mg/dL",
          trend: "down",
        },
        {
          id: "row-ldl",
          label: "Colesterol LDL",
          value: "148 mg/dL",
          reference: "< 100 mg/dL",
          tone: "high",
          previous: "152 mg/dL",
          trend: "down",
        },
        {
          id: "row-na",
          label: "Sodio",
          value: "138 mEq/L",
          reference: "136-145 mEq/L",
          tone: "normal",
          previous: "136 mEq/L",
          trend: "up",
        },
        {
          id: "row-k",
          label: "Potasio",
          value: "3.2 mEq/L",
          reference: "3.5-5.0 mEq/L",
          tone: "low",
          previous: "3.6 mEq/L",
          trend: "down",
        },
        {
          id: "row-trop",
          label: "Troponina I",
          value: "Pendiente",
          reference: "Est. disponible en 2 h",
          tone: "pending",
          previous: "0.08 ng/mL",
          trend: "same",
        },
      ],
      linkedTrendIds: ["glucose", "creatinine", "ldl", "hba1c"],
    },
    {
      id: "lis-001-hemograma",
      catalogId: "hemograma",
      system: "LIS",
      kind: "lab",
      queueStatus: "critical",
      priority: "urgente",
      name: "Hemograma completo",
      discipline: "Hematologia",
      requestedAt: "2026-03-08 06:15",
      resultAt: "2026-03-08 07:30",
      requestedBy: "Dra. Camila Rojas",
      etaLabel: "Disponible",
      summary: "Leucocitosis reactiva. Vigilar contexto inflamatorio y evolucion clinica.",
      observation: "Correlacionar con dolor toracico, respuesta hemodinamica y focos infecciosos.",
      resultRows: [
        {
          id: "row-hemo-leu",
          label: "Leucocitos",
          value: "14,200 /uL",
          reference: "4,500-11,000 /uL",
          tone: "high",
          previous: "13,100 /uL",
          trend: "up",
        },
        {
          id: "row-hemo-neu",
          label: "Neutrofilos",
          value: "81 %",
          reference: "45-75 %",
          tone: "high",
          previous: "78 %",
          trend: "up",
        },
        {
          id: "row-hemo-hb",
          label: "Hemoglobina",
          value: "12.8 g/dL",
          reference: "12-16 g/dL",
          tone: "normal",
          previous: "12.5 g/dL",
          trend: "up",
        },
      ],
      linkedTrendIds: ["glucose"],
    },
    {
      id: "lis-001-troponina",
      catalogId: "troponina_i",
      system: "LIS",
      kind: "lab",
      queueStatus: "pending",
      priority: "critico",
      name: "Troponina I ultrasensible",
      discipline: "Cardiomarcadores",
      requestedAt: "2026-03-08 10:00",
      requestedBy: "Dr. Vargas",
      etaLabel: "Est. 2 h",
      summary: "Muestra en proceso por protocolo SCA.",
      observation: "Solicitada por control seriado posterior a dolor toracico persistente.",
      linkedTrendIds: ["troponin"],
    },
    {
      id: "ris-001-rx",
      catalogId: "rx_torax",
      system: "RIS",
      kind: "image",
      queueStatus: "pending",
      priority: "urgente",
      name: "Radiografia de torax AP / lateral",
      discipline: "Radiologia",
      requestedAt: "2026-03-08 09:40",
      requestedBy: "Dr. Vargas",
      etaLabel: "Pendiente lectura",
      summary: "Estudio solicitado para descartar edema pulmonar o foco pulmonar asociado.",
      observation: "Paciente movilizada con monitorizacion continua.",
      viewer: {
        modality: "DICOM",
        previewTitle: "Radiografia de torax - adquisicion pendiente",
        previewHint: "Urgente - tecnico en traslado",
        report:
          "Aun sin informe validado. Mantener observacion hemodinamica y cargar imagen al visor apenas este disponible.",
        viewerButtonLabel: "Abrir visor DICOM",
        studyStatus: "Pendiente de lectura",
      },
      linkedTrendIds: [],
    },
    {
      id: "lis-001-inr",
      catalogId: "tp_ttp_inr",
      system: "LIS",
      kind: "lab",
      queueStatus: "pending",
      priority: "urgente",
      name: "INR basal - Warfarina",
      discipline: "Coagulacion",
      requestedAt: "2026-03-08 10:00",
      requestedBy: "Dra. Sofia Montalvo",
      etaLabel: "Pendiente toma",
      summary: "Monitoreo obligatorio previo a primera dosis de warfarina.",
      observation: "Registrar control basal y repetir a las 48 horas.",
      linkedTrendIds: ["inr"],
    },
    {
      id: "lis-001-hba1c",
      catalogId: "hba1c",
      system: "LIS",
      kind: "lab",
      queueStatus: "completed",
      priority: "rutina",
      name: "HbA1c",
      discipline: "Bioquimica",
      requestedAt: "2026-03-07 20:20",
      resultAt: "2026-03-08 06:00",
      requestedBy: "Dra. Camila Rojas",
      etaLabel: "Validado",
      summary: "Control cronico inadecuado.",
      observation: "Reforzar educacion diabetologica en alta.",
      resultRows: [
        {
          id: "row-hba1c-alone",
          label: "HbA1c",
          value: "9.4 %",
          reference: "< 6.5 %",
          tone: "high",
          previous: "9.1 %",
          trend: "up",
        },
      ],
      linkedTrendIds: ["hba1c"],
    },
    {
      id: "lis-001-lipidico",
      catalogId: "perfil_lipidico",
      system: "LIS",
      kind: "lab",
      queueStatus: "completed",
      priority: "rutina",
      name: "Panel lipidico",
      discipline: "Bioquimica",
      requestedAt: "2026-03-07 20:20",
      resultAt: "2026-03-08 06:00",
      requestedBy: "Dra. Camila Rojas",
      etaLabel: "Validado",
      summary: "LDL persistentemente alto pese a estatina.",
      observation: "Mantener atorvastatina y evaluar ajuste en consulta.",
      resultRows: [
        {
          id: "row-ldl-alone",
          label: "Colesterol LDL",
          value: "148 mg/dL",
          reference: "< 100 mg/dL",
          tone: "high",
          previous: "152 mg/dL",
          trend: "down",
        },
      ],
      linkedTrendIds: ["ldl"],
    },
    {
      id: "lis-001-renal",
      catalogId: "creatinina",
      system: "LIS",
      kind: "lab",
      queueStatus: "completed",
      priority: "rutina",
      name: "Funcion renal (Cr, Urea)",
      discipline: "Bioquimica",
      requestedAt: "2026-03-07 20:20",
      resultAt: "2026-03-08 06:00",
      requestedBy: "Dra. Camila Rojas",
      etaLabel: "Validado",
      summary: "Funcion renal conservada.",
      observation: "Sin limitacion renal para contraste por el momento.",
      resultRows: [
        {
          id: "row-renal-cr",
          label: "Creatinina",
          value: "0.9 mg/dL",
          reference: "0.5-1.1 mg/dL",
          tone: "normal",
          previous: "1.0 mg/dL",
          trend: "down",
        },
        {
          id: "row-renal-urea",
          label: "Urea",
          value: "32 mg/dL",
          reference: "15-45 mg/dL",
          tone: "normal",
          previous: "38 mg/dL",
          trend: "down",
        },
      ],
      linkedTrendIds: ["creatinine"],
    },
    {
      id: "ris-001-ecg",
      catalogId: "ecg_12",
      system: "RIS",
      kind: "ecg",
      queueStatus: "completed",
      priority: "critico",
      name: "ECG 12 derivaciones",
      discipline: "Cardiologia / electrofisiologia",
      requestedAt: "2026-03-07 20:15",
      resultAt: "2026-03-07 20:30",
      requestedBy: "Dra. Camila Rojas",
      etaLabel: "Validado",
      summary: "Ritmo sinusal. Cambios compatibles con SCA anterior en estudio.",
      observation: "Comparar con ECG seriado y evaluar cineangiocoronariografia.",
      viewer: {
        modality: "ECG",
        previewTitle: "ECG 12 derivaciones",
        previewHint: "Registrado 20:30 h - protocolo SCA",
        report:
          "Ritmo sinusal. FC 112 lpm. Eje conservado. Infradesnivel leve en derivaciones anterolaterales compatible con isquemia subendocardica.",
        cardiologyReport:
          "Informe del cardiologo: hallazgos compatibles con SCA anterior. Recomendado monitoreo continuo, marcadores seriados y valoracion de hemodinamia.",
        viewerButtonLabel: "Abrir visor ECG",
        studyStatus: "Disponible",
      },
      linkedTrendIds: ["heartRate"],
    },
  ];

  return {
    orders: sortOrders(orders),
    defaultRequestIds: ["glucosa", "troponina_i", "tp_ttp_inr"],
    trendMetrics: [
      {
        id: "metric-glucose",
        label: "Glucosa",
        current: "287 mg/dL",
        previous: "241 mg/dL",
        direction: "up",
        tone: "critical",
        clinicalMeaning: "Hiperglucemia en ascenso. Requiere control estrecho y ajuste insulinico.",
      },
      {
        id: "metric-hba1c",
        label: "HbA1c",
        current: "9.4 %",
        previous: "9.1 %",
        direction: "up",
        tone: "warning",
        clinicalMeaning: "Control cronico inadecuado. Reforzar plan de alta y adherencia.",
      },
      {
        id: "metric-creatinine",
        label: "Creatinina",
        current: "0.9 mg/dL",
        previous: "1.0 mg/dL",
        direction: "down",
        tone: "good",
        clinicalMeaning: "Funcion renal conservada. Sin deterioro agudo.",
      },
      {
        id: "metric-ldl",
        label: "LDL",
        current: "148 mg/dL",
        previous: "152 mg/dL",
        direction: "down",
        tone: "warning",
        clinicalMeaning: "Mejora discreta, aun por encima del objetivo cardiovascular.",
      },
      {
        id: "metric-inr",
        label: "INR basal",
        current: "Pendiente",
        previous: "1.1",
        direction: "same",
        tone: "neutral",
        clinicalMeaning: "Requerido antes de iniciar warfarina.",
      },
    ],
    timeline: [
      {
        id: "timeline-1",
        datetime: "Hoy 08:30",
        title: "Control de signos vitales",
        detail:
          "PA 146/88, FC 102, glucosa 202 mg/dL. Mejoria hemodinamica parcial; persiste control intensivo.",
        tone: "warning",
        owner: "Lic. Naranjo",
      },
      {
        id: "timeline-2",
        datetime: "Hoy 06:05",
        title: "Alerta de laboratorio critica",
        detail:
          "Glucosa en ayuno 287 mg/dL. Se notifico a Lic. Naranjo y Dr. Vargas. Se inicio hidratacion con SSN.",
        tone: "critical",
        owner: "Laboratorio central HGNE",
      },
      {
        id: "timeline-3",
        datetime: "Ayer 20:10",
        title: "Ingreso por triaje rojo",
        detail:
          "Dolor toracico opresivo irradiado. EVA 9/10. Se activa protocolo SCA con monitorizacion continua.",
        tone: "critical",
        owner: "Dra. Camila Rojas",
      },
      {
        id: "timeline-4",
        datetime: "Ayer 20:30",
        title: "ECG 12 derivaciones",
        detail:
          "Cambios anterolaterales sugestivos de isquemia. Cardiologia solicita marcadores seriados y monitoreo continuo.",
        tone: "warning",
        owner: "Dr. Vargas",
      },
    ],
    averageTurnaroundLabel: "8 h",
  };
}

function buildGenericTrendMetrics(patient: PatientRecord): TrendMetric[] {
  const latestVital = patient.vitalSigns[0];
  const previousVital = patient.vitalSigns[1];

  if (!latestVital || !previousVital) {
    return [
      {
        id: "metric-status",
        label: "Seguimiento",
        current: "Sin comparativo",
        previous: "-",
        direction: "same",
        tone: "neutral",
        clinicalMeaning: "El paciente aun no tiene suficientes controles para tendencia.",
      },
    ];
  }

  return [
    {
      id: "metric-glucose",
      label: "Glucosa",
      current: `${latestVital.glucose} mg/dL`,
      previous: `${previousVital.glucose} mg/dL`,
      direction: compareNumber(latestVital.glucose, previousVital.glucose),
      tone: latestVital.glucose >= 200 ? "critical" : latestVital.glucose >= 140 ? "warning" : "good",
      clinicalMeaning:
        latestVital.glucose >= 200
          ? "Control glucemico fuera de rango."
          : "Seguimiento metabolico estable.",
    },
    {
      id: "metric-hr",
      label: "Frecuencia cardiaca",
      current: `${latestVital.heartRate} lpm`,
      previous: `${previousVital.heartRate} lpm`,
      direction: compareNumber(latestVital.heartRate, previousVital.heartRate),
      tone: latestVital.heartRate > 100 ? "warning" : "good",
      clinicalMeaning:
        latestVital.heartRate > 100 ? "Persisten valores taquicardicos." : "Ritmo en mejor control.",
    },
    {
      id: "metric-spo2",
      label: "SpO2",
      current: `${latestVital.spo2} %`,
      previous: `${previousVital.spo2} %`,
      direction: compareNumber(latestVital.spo2, previousVital.spo2),
      tone: latestVital.spo2 < 94 ? "warning" : "good",
      clinicalMeaning:
        latestVital.spo2 < 94 ? "Saturacion requiere vigilancia." : "Oxigenacion aceptable.",
    },
  ];
}

function buildGenericTimeline(patient: PatientRecord, orders: LisRisOrder[]): TimelineEvent[] {
  const labOrder = orders.find((order) => order.system === "LIS");
  const imagingOrder = orders.find((order) => order.system === "RIS");

  return [
    {
      id: `${patient.id}-timeline-1`,
      datetime: patient.lastControlAt,
      title: "Ultimo control clinico",
      detail: patient.summary.latestNursingReport,
      tone: patient.riskLevel === "alto" ? "warning" : "neutral",
      owner: patient.assignedProfessional,
    },
    {
      id: `${patient.id}-timeline-2`,
      datetime: labOrder?.resultAt ?? labOrder?.requestedAt ?? patient.admissionDate,
      title: labOrder ? `Resultado ${labOrder.name}` : "Sin resultados recientes",
      detail: labOrder?.summary ?? "No hay resultados cargados en LIS.",
      tone: labOrder?.queueStatus === "critical" ? "critical" : "neutral",
      owner: labOrder?.requestedBy ?? patient.assignedProfessional,
    },
    {
      id: `${patient.id}-timeline-3`,
      datetime: imagingOrder?.resultAt ?? imagingOrder?.requestedAt ?? patient.admissionDate,
      title: imagingOrder ? imagingOrder.name : "Sin estudios RIS recientes",
      detail: imagingOrder?.summary ?? "No hay imagenes registradas.",
      tone: imagingOrder?.queueStatus === "pending" ? "warning" : "good",
      owner: imagingOrder?.requestedBy ?? patient.assignedProfessional,
    },
  ];
}

function mapExamRecordToOrder(patient: PatientRecord, exam: ExamRecord): LisRisOrder {
  const system: OrderSystem =
    exam.category === "Imagenologia" || exam.category === "Electrocardiograma" ? "RIS" : "LIS";
  const queueStatus = inferQueueStatus(patient, exam);
  const catalogId = findCatalogIdByName(exam.name);

  return {
    id: exam.id,
    catalogId,
    system,
    kind:
      exam.category === "Electrocardiograma"
        ? "ecg"
        : system === "RIS"
        ? "image"
        : "lab",
    queueStatus,
    priority:
      queueStatus === "critical"
        ? "critico"
        : exam.status === "Pendiente"
        ? "urgente"
        : "rutina",
    name: exam.name,
    discipline: exam.category,
    requestedAt: exam.requestedAt,
    resultAt: exam.resultAt,
    requestedBy: exam.requestedBy,
    etaLabel: exam.status === "Pendiente" ? "Pendiente validacion" : "Disponible",
    summary: exam.summary,
    observation: exam.observations,
    resultRows:
      system === "LIS" && exam.status !== "Pendiente"
        ? [
            {
              id: `${exam.id}-row`,
              label: exam.name,
              value: exam.summary,
              reference: "Correlacion clinica",
              tone: queueStatus === "critical" ? "critical" : "normal",
              previous: "Sin previo",
              trend: "same",
            },
          ]
        : undefined,
    viewer:
      system === "RIS"
        ? {
            modality: exam.category === "Electrocardiograma" ? "ECG" : "DICOM",
            previewTitle: exam.name,
            previewHint: exam.resultAt ?? exam.requestedAt,
            report: exam.observations || exam.summary,
            cardiologyReport:
              exam.category === "Electrocardiograma"
                ? `Informe cardiologico integrado: ${exam.summary}. ${exam.observations}`
                : undefined,
            viewerButtonLabel:
              exam.category === "Electrocardiograma" ? "Abrir visor ECG" : "Abrir visor DICOM",
            studyStatus: exam.status === "Pendiente" ? "Pendiente" : "Disponible",
          }
        : undefined,
    criticalNotification:
      queueStatus === "critical"
        ? {
            notifiedTo: patient.assignedProfessional,
            notifiedAt: exam.resultAt?.slice(11, 16) ?? "Pendiente",
            confirmedBy: patient.assignedProfessional,
            confirmedAt: exam.resultAt?.slice(11, 16) ?? "Pendiente",
            note: "Registro automatico de alerta critica asociado al resultado validado.",
          }
        : undefined,
    linkedTrendIds: inferTrendIds(exam.name),
  };
}

function buildRequestedOrder(
  patient: PatientRecord,
  option: ExamCatalogOption,
  priority: ExamRequestPriority,
  note: string,
  createdAt: string,
  index: number
): LisRisOrder {
  const system: OrderSystem = isRisCatalogOption(option) ? "RIS" : "LIS";

  return {
    id: `requested-${patient.id}-${Date.now()}-${index}`,
    catalogId: option.id,
    system,
    kind:
      option.category === "Electrocardiograma"
        ? "ecg"
        : system === "RIS"
        ? "image"
        : "lab",
    queueStatus: "pending",
    priority,
    name: option.name,
    discipline: option.group,
    requestedAt: createdAt,
    requestedBy: patient.assignedProfessional,
    etaLabel:
      priority === "critico" ? "Proceso inmediato" : priority === "urgente" ? "Est. 2 h" : "Rutina 6 h",
    summary:
      system === "RIS"
        ? "Estudio agregado al flujo RIS/PACS. Pendiente adquisicion y lectura."
        : "Examen agregado a la cola LIS. Pendiente toma y validacion.",
    observation: note || "Solicitud generada desde estacion clinica LIS/RIS.",
    viewer:
      system === "RIS"
        ? {
            modality: option.category === "Electrocardiograma" ? "ECG" : "DICOM",
            previewTitle: `${option.name} - pendiente`,
            previewHint: "Sin adquisicion aun",
            report: "Estudio solicitado. Aun no existe informe validado.",
            cardiologyReport:
              option.category === "Electrocardiograma"
                ? "Informe pendiente de cardiologia."
                : undefined,
            viewerButtonLabel:
              option.category === "Electrocardiograma" ? "Abrir visor ECG" : "Abrir visor DICOM",
            studyStatus: "Pendiente",
          }
        : undefined,
    linkedTrendIds: inferTrendIds(option.name),
  };
}

function calculateAverageTurnaroundLabel(orders: LisRisOrder[]) {
  const completedOrders = orders.filter((order) => order.resultAt && order.requestedAt);
  const diffs = completedOrders
    .map((order) => {
      const start = parseClinicalDate(order.requestedAt);
      const end = parseClinicalDate(order.resultAt ?? "");
      if (!start || !end) {
        return null;
      }

      return Math.max(0, end.getTime() - start.getTime());
    })
    .filter((value): value is number => value !== null);

  if (!diffs.length) {
    return "-";
  }

  const averageMinutes = Math.round(diffs.reduce((sum, value) => sum + value, 0) / diffs.length / 60000);
  if (averageMinutes >= 60) {
    return `${Math.round(averageMinutes / 60)} h`;
  }

  return `${averageMinutes} min`;
}

function parseClinicalDate(value: string) {
  if (!value.startsWith("20")) {
    return null;
  }

  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function findCatalogIdByName(name: string) {
  return examRequestCatalog.find((option) => normalizeText(option.name) === normalizeText(name))?.id;
}

function inferQueueStatus(patient: PatientRecord, exam: ExamRecord): QueueStatus {
  if (exam.status === "Pendiente") {
    return "pending";
  }

  const normalizedName = normalizeText(exam.name);
  const normalizedSummary = normalizeText(exam.summary);

  if (
    normalizedName.includes("troponina") ||
    normalizedSummary.includes("critico") ||
    normalizedSummary.includes("leucocitosis")
  ) {
    return patient.riskLevel === "alto" ? "critical" : "completed";
  }

  return "completed";
}

function inferTrendIds(name: string) {
  const normalized = normalizeText(name);
  const matches: string[] = [];

  if (normalized.includes("glucosa")) {
    matches.push("glucose");
  }
  if (normalized.includes("troponina")) {
    matches.push("troponin");
  }
  if (normalized.includes("creatinina")) {
    matches.push("creatinine");
  }
  if (normalized.includes("lipid")) {
    matches.push("ldl");
  }
  if (normalized.includes("inr")) {
    matches.push("inr");
  }
  if (normalized.includes("ecg")) {
    matches.push("heartRate");
  }

  return matches;
}

function groupExamCatalogByGroup(options: ExamCatalogOption[]) {
  const groups = new Map<string, ExamCatalogOption[]>();

  options.forEach((option) => {
    const entries = groups.get(option.group) ?? [];
    entries.push(option);
    groups.set(option.group, entries);
  });

  return Array.from(groups.entries());
}

function buildDefaultRequestItems(defaultRequestIds: string[]) {
  return defaultRequestIds.map((catalogId) => ({
    catalogId,
    priority:
      examRequestCatalog.find((option) => option.id === catalogId)?.defaultPriority ?? "urgente",
  }));
}

function sortOrders(orders: LisRisOrder[]) {
  return [...orders].sort((left, right) => {
    const statusDiff = queueStatusOrder[left.queueStatus] - queueStatusOrder[right.queueStatus];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return (right.resultAt ?? right.requestedAt).localeCompare(left.resultAt ?? left.requestedAt);
  });
}

function compareNumber(current: number, previous: number): TrendDirection {
  if (current > previous) {
    return "up";
  }
  if (current < previous) {
    return "down";
  }
  return "same";
}

function isLisCatalogOption(option: ExamCatalogOption) {
  return option.category !== "Imagenologia" && option.category !== "Electrocardiograma";
}

function isRisCatalogOption(option: ExamCatalogOption) {
  return option.category === "Imagenologia" || option.category === "Electrocardiograma";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initialsOf(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}

function trendArrow(direction: TrendDirection) {
  if (direction === "up") {
    return "↑";
  }
  if (direction === "down") {
    return "↓";
  }
  return "→";
}

function queueStatusLabel(status: QueueStatus) {
  if (status === "critical") {
    return "Critico";
  }
  if (status === "pending") {
    return "Pendiente";
  }
  return "Completo";
}

function getTriageTone(triageColor: PatientRecord["triageColor"]) {
  if (triageColor === "rojo") {
    return "danger";
  }
  if (triageColor === "naranja" || triageColor === "amarillo") {
    return "warning";
  }
  if (triageColor === "verde") {
    return "success";
  }
  return "info";
}

function getQueueTone(status: QueueStatus) {
  if (status === "critical") {
    return "danger";
  }
  if (status === "pending") {
    return "warning";
  }
  return "success";
}

function toneClasses(tone: "danger" | "warning" | "success" | "info" | "neutral") {
  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (tone === "info") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function toneTextClasses(tone: "danger" | "warning" | "success" | "info" | "neutral") {
  if (tone === "danger") {
    return "text-red-600";
  }
  if (tone === "warning") {
    return "text-amber-600";
  }
  if (tone === "success") {
    return "text-emerald-600";
  }
  if (tone === "info") {
    return "text-sky-600";
  }
  return "text-slate-900";
}

function orderCardAccent(status: QueueStatus) {
  if (status === "critical") {
    return "border-l-4 border-l-red-500";
  }
  if (status === "pending") {
    return "border-l-4 border-l-amber-500";
  }
  return "border-l-4 border-l-emerald-500";
}

function resultToneClasses(tone: ResultTone) {
  if (tone === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (tone === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (tone === "low") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (tone === "pending") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function metricCardClasses(tone: TrendTone) {
  if (tone === "critical") {
    return "border-red-200 bg-red-50";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50";
  }
  if (tone === "good") {
    return "border-emerald-200 bg-emerald-50";
  }
  return "border-slate-200 bg-slate-50";
}
