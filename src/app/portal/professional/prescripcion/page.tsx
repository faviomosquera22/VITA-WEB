"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { ModulePage } from "../_components/clinical-ui";
import { mockPatients, type MedicationRecord } from "../_data/clinical-mock-data";
import {
  medicationCatalogBase,
  type MedicationCatalogItem,
} from "../_data/medication-catalog";

type PrescriptionStatus = "Validada farmacia" | "Pendiente farmacia" | "Bloqueada";
type FlowStepStatus = "done" | "pending" | "blocked";

type PrescriptionOrder = {
  id: string;
  dci: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  indication: string;
  prescriber: string;
  status: PrescriptionStatus;
  createdAt: string;
  clinicalNote: string;
  nextDose: string;
  pharmacyNote: string;
  flow: {
    medico: FlowStepStatus;
    farmacia: FlowStepStatus;
    enfermeria: FlowStepStatus;
  };
};

type ValidationAlert = {
  id: string;
  category: "Alergia" | "Interaccion" | "Monitoreo" | "Dosis";
  severity: "Alta" | "Media" | "Info";
  title: string;
  detail: string;
  action: string;
};

type InteractionAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "Alta" | "Media" | "Info";
};

type PrescriptionDraft = {
  query: string;
  dci: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  indication: string;
};

const patient = mockPatients[0];
const prescriberName = "Dra. Sofia Montalvo";

const initialOrders: PrescriptionOrder[] = [
  {
    id: "rx-1",
    dci: "Acido acetilsalicilico",
    dose: "100 mg",
    route: "Oral",
    frequency: "Cada 24h",
    duration: "30 dias",
    indication: "Antiagregacion en sindrome coronario.",
    prescriber: prescriberName,
    status: "Validada farmacia",
    createdAt: "14 mar 20:15",
    clinicalNote: "Verificar: no es AINE a dosis antiagregante.",
    nextDose: "Hoy 14:00",
    pharmacyNote: "Flujo completo.",
    flow: {
      medico: "done",
      farmacia: "done",
      enfermeria: "pending",
    },
  },
  {
    id: "rx-2",
    dci: "Warfarina sodica",
    dose: "5 mg",
    route: "Oral",
    frequency: "Cada 24h",
    duration: "14 dias",
    indication: "Profilaxis tromboembolica.",
    prescriber: prescriberName,
    status: "Pendiente farmacia",
    createdAt: "14 mar 20:15",
    clinicalNote: "Requiere monitoreo INR antes de la primera dosis y a las 48h.",
    nextDose: "Pendiente INR basal antes de dispensar",
    pharmacyNote: "Validacion de seguridad pendiente.",
    flow: {
      medico: "done",
      farmacia: "pending",
      enfermeria: "pending",
    },
  },
  {
    id: "rx-3",
    dci: "Amoxicilina",
    dose: "500 mg",
    route: "Oral",
    frequency: "Cada 8h",
    duration: "7 dias",
    indication: "Cobertura empirica respiratoria.",
    prescriber: prescriberName,
    status: "Bloqueada",
    createdAt: "14 mar 20:15",
    clinicalNote:
      "Betalactamico con reactividad cruzada frente a alergia documentada a Penicilina. Solicitar alternativa al prescriptor.",
    nextDose: "Bloqueada por alergia",
    pharmacyNote: "No dispensar.",
    flow: {
      medico: "done",
      farmacia: "blocked",
      enfermeria: "blocked",
    },
  },
];

const chronicMedicationProfile = [
  {
    id: "habit-1",
    name: "AAS 100 mg",
    detail: "Administrada 08:00 h · Proxima 14:00 h",
  },
  {
    id: "habit-2",
    name: "Enoxaparina 40 mg",
    detail: "Pendiente 20:00 h · requiere doble verificacion",
  },
  {
    id: "habit-3",
    name: "Metformina 850 mg",
    detail: "Medicacion habitual registrada en conciliacion",
  },
  {
    id: "habit-4",
    name: "Enalapril 10 mg",
    detail: "Habitual · control PA y funcion renal",
  },
];

const routeOptions = ["Oral", "IV", "IM", "SC", "Sublingual", "Infusion"];

const defaultDraft: PrescriptionDraft = {
  query: "",
  dci: "",
  dose: "",
  route: "Oral",
  frequency: "Cada 24h",
  duration: "7 dias",
  indication: "",
};

export default function PrescriptionPage() {
  const [orders, setOrders] = useState<PrescriptionOrder[]>(initialOrders);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [archivedOrderIds, setArchivedOrderIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<PrescriptionDraft>(defaultDraft);
  const [feedback, setFeedback] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(draft.query);

  const activeAllergies = useMemo(
    () => patient.antecedentes.allergies.filter((item) => !isNoKnownAllergy(item)),
    []
  );

  const visibleOrders = useMemo(
    () => orders.filter((order) => !archivedOrderIds.includes(order.id)),
    [archivedOrderIds, orders]
  );

  const dciSuggestions = useMemo(() => {
    const query = normalizeText(deferredQuery);

    if (!query) {
      return medicationCatalogBase.slice(0, 10);
    }

    return medicationCatalogBase
      .filter((item) =>
        normalizeText(`${item.name} ${item.presentations.join(" ")}`).includes(query)
      )
      .slice(0, 10);
  }, [deferredQuery]);

  const safetyOverview = useMemo(
    () =>
      buildPrescriptionSafety(
        visibleOrders,
        activeAllergies,
        patient.medicationRecords,
        chronicMedicationProfile.map((item) => item.name)
      ),
    [activeAllergies, visibleOrders]
  );

  const activeOrderCount = visibleOrders.length;
  const validatedCount = visibleOrders.filter((order) => order.status === "Validada farmacia").length;
  const blockedCount = visibleOrders.filter((order) => order.status === "Bloqueada").length;
  const countedAlerts = safetyOverview.validationAlerts.filter(
    (alert) => alert.severity !== "Info"
  ).length;

  const openDraftForEdit = (order: PrescriptionOrder) => {
    setEditingOrderId(order.id);
    setShowInlineForm(true);
    setFeedback(null);
    setDraft({
      query: order.dci,
      dci: order.dci,
      dose: order.dose,
      route: order.route,
      frequency: order.frequency,
      duration: order.duration,
      indication: order.indication,
    });
  };

  const resetDraft = () => {
    setDraft(defaultDraft);
    setEditingOrderId(null);
  };

  const selectSuggestion = (item: MedicationCatalogItem) => {
    setDraft((prev) => ({
      ...prev,
      query: item.name,
      dci: item.name,
      dose: item.presentations[0] ?? "",
    }));
  };

  const toggleInlineForm = () => {
    setShowInlineForm((prev) => {
      if (prev) {
        resetDraft();
      }
      return !prev;
    });
    setFeedback(null);
  };

  const submitPrescription = () => {
    if (!draft.dci.trim() || !draft.dose.trim() || !draft.indication.trim()) {
      return;
    }

    const blockedReason = getMedicationBlockReason(draft.dci, activeAllergies);
    const nextStatus = blockedReason
      ? "Bloqueada"
      : requiresPharmacyValidation(draft.dci)
      ? "Pendiente farmacia"
      : "Validada farmacia";

    const nextOrder: PrescriptionOrder = {
      id: editingOrderId ?? `rx-${Date.now()}`,
      dci: draft.dci.trim(),
      dose: draft.dose.trim(),
      route: draft.route.trim(),
      frequency: draft.frequency.trim(),
      duration: draft.duration.trim(),
      indication: draft.indication.trim(),
      prescriber: prescriberName,
      status: nextStatus,
      createdAt: "15 mar 12:38",
      clinicalNote: blockedReason ?? buildClinicalNote(draft.dci),
      nextDose: blockedReason
        ? "Bloqueada por seguridad"
        : nextStatus === "Validada farmacia"
        ? "Primera dosis lista para kardex"
        : "Pendiente validacion farmaceutica",
      pharmacyNote: blockedReason
        ? "Orden detenida por alergia."
        : nextStatus === "Pendiente farmacia"
        ? "Farmacia debe revisar interacciones y stock."
        : "Validada para flujo asistencial.",
      flow: {
        medico: "done",
        farmacia: blockedReason ? "blocked" : nextStatus === "Validada farmacia" ? "done" : "pending",
        enfermeria: blockedReason ? "blocked" : "pending",
      },
    };

    setOrders((prev) =>
      editingOrderId
        ? prev.map((order) => (order.id === editingOrderId ? nextOrder : order))
        : [nextOrder, ...prev]
    );
    setShowInlineForm(false);
    setFeedback(
      blockedReason
        ? `${nextOrder.dci} quedo bloqueada por seguridad clinica.`
        : `${nextOrder.dci} registrada con estado ${nextOrder.status.toLowerCase()}.`
    );
    resetDraft();
  };

  const validateOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "Validada farmacia",
              nextDose: "Lista para administracion segun kardex",
              pharmacyNote: "Farmacia valido la orden.",
              flow: {
                ...order.flow,
                farmacia: "done",
              },
            }
          : order
      )
    );
    setFeedback("Farmacia valido la orden y la libero a kardex.");
  };

  const requestInr = () => {
    setFeedback("INR basal solicitado. Monitorear INR a las 48h antes de ajuste de warfarina.");
  };

  const notifyPrescriber = (order: PrescriptionOrder) => {
    setFeedback(`Prescriptor notificado sobre ${order.dci}. Revisar alternativa terapeutica.`);
  };

  const archiveOrder = (orderId: string) => {
    setArchivedOrderIds((prev) => [...prev, orderId]);
    setFeedback("Orden archivada del panel activo.");
  };

  const suggestAlternative = (order: PrescriptionOrder) => {
    setShowInlineForm(true);
    setEditingOrderId(null);
    setDraft({
      query: "Azitromicina",
      dci: "Azitromicina",
      dose: "500 mg",
      route: order.route,
      frequency: "Cada 24h",
      duration: order.duration,
      indication: order.indication,
    });
    setFeedback("Alternativa sugerida cargada en el formulario inline.");
  };

  return (
    <ModulePage
      title="Prescripcion electronica y farmacia"
      subtitle="Prescripcion DCI, validacion farmaceutica, alertas de seguridad, dispensacion y kardex."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/portal/professional/patients/${patient.id}?tab=medication`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Historial completo
          </Link>
          <button
            type="button"
            onClick={toggleInlineForm}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            {showInlineForm ? "Cerrar formulario" : "+ Nueva prescripcion"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))]">
        <PatientSummaryCard />
        <MetricCard label="Ordenes activas" value={activeOrderCount} hint={`${validatedCount} validadas · ${blockedCount} bloqueadas`} />
        <MetricCard label="Validada farmacia" value={validatedCount} hint="Flujo completo" tone="success" />
        <MetricCard
          label="Alertas seguridad"
          value={countedAlerts}
          hint={describeAlertMix(safetyOverview.validationAlerts)}
          tone="critical"
        />
        <MetricCard label="Orden bloqueada" value={blockedCount} hint="Alergia confirmada" tone="critical" />
      </div>

      {feedback ? (
        <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </section>
      ) : null}

      {safetyOverview.bannerAlert ? (
        <section className="rounded-[30px] border border-red-300 bg-red-50 px-5 py-4 text-red-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold">
                Contraindicacion critica activa - verificar ANTES de dispensar
              </p>
              <p className="mt-2 text-base font-semibold">
                {safetyOverview.bannerAlert.title}
              </p>
              <p className="mt-2 text-sm leading-6">
                {safetyOverview.bannerAlert.detail}
              </p>
            </div>
            <span className="inline-flex rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {safetyOverview.bannerAlert.action}
            </span>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.88fr)_minmax(320px,0.9fr)]">
        <section className="rounded-[30px] border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">Prescripciones activas - DCI</p>
                <p className="mt-1 text-xs text-stone-500">
                  Nombre generico, dosis, via, frecuencia, duracion e indicacion.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleInlineForm}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                {showInlineForm ? "Ocultar" : "Agregar"}
              </button>
            </div>
          </div>

          {showInlineForm ? (
            <div className="border-b border-stone-200 bg-[#fcfbf8] px-5 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(240px,0.95fr)]">
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                      Busca DCI
                    </span>
                    <input
                      value={draft.query}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          query: event.target.value,
                          dci: event.target.value,
                        }))
                      }
                      placeholder="Ej. warfarina, azitromicina, ceftriaxona..."
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-emerald-300"
                    />
                  </label>

                  <div className="grid gap-2 md:grid-cols-2">
                    <FormField
                      label="Dosis / presentacion"
                      value={draft.dose}
                      onChange={(value) => setDraft((prev) => ({ ...prev, dose: value }))}
                      placeholder="500 mg"
                    />
                    <SelectField
                      label="Via"
                      value={draft.route}
                      onChange={(value) => setDraft((prev) => ({ ...prev, route: value }))}
                      options={routeOptions}
                    />
                    <FormField
                      label="Frecuencia"
                      value={draft.frequency}
                      onChange={(value) => setDraft((prev) => ({ ...prev, frequency: value }))}
                      placeholder="Cada 24h"
                    />
                    <FormField
                      label="Duracion"
                      value={draft.duration}
                      onChange={(value) => setDraft((prev) => ({ ...prev, duration: value }))}
                      placeholder="7 dias"
                    />
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                      Indicacion
                    </span>
                    <textarea
                      value={draft.indication}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, indication: event.target.value }))
                      }
                      placeholder="Indica motivo clinico, objetivo y condicion de uso."
                      className="min-h-[94px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-emerald-300"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={submitPrescription}
                      className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800"
                    >
                      {editingOrderId ? "Actualizar prescripcion" : "Guardar prescripcion"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetDraft();
                        setShowInlineForm(false);
                      }}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-900">Buscar DCI</p>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] text-stone-500">
                      {dciSuggestions.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {dciSuggestions.map((item) => (
                      <button
                        key={`${item.name}-${item.presentations[0] ?? "base"}`}
                        type="button"
                        onClick={() => selectSuggestion(item)}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fcfbf8] px-3 py-3 text-left hover:bg-stone-50"
                      >
                        <p className="text-sm font-medium text-stone-900">{item.name}</p>
                        <p className="mt-1 text-[11px] text-stone-500">
                          {item.presentations.slice(0, 2).join(" · ")}
                        </p>
                        <p className="mt-1 text-[11px] capitalize text-stone-400">
                          {item.therapeuticGroup}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-0">
            {visibleOrders.map((order) => (
              <PrescriptionOrderCard
                key={order.id}
                order={order}
                patientId={patient.id}
                onEdit={() => openDraftForEdit(order)}
                onValidate={() => validateOrder(order.id)}
                onRequestInr={requestInr}
                onSuggestAlternative={() => suggestAlternative(order)}
                onNotify={() => notifyPrescriber(order)}
                onArchive={() => archiveOrder(order.id)}
              />
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-[30px] border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Validacion de seguridad - tiempo real
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Interacciones, alergias cruzadas, dosis y contraindicaciones.
                  </p>
                </div>
                <Link
                  href={`/portal/professional/patients/${patient.id}?tab=background`}
                  className="text-sm font-medium text-emerald-700"
                >
                  Ver todas
                </Link>
              </div>
            </div>
            <div className="space-y-3 px-5 py-4">
              {safetyOverview.validationAlerts.map((alert) => (
                <SafetyAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <p className="text-sm font-semibold text-stone-900">
                Interacciones entre medicamentos
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Basado en el perfil activo del paciente.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              {safetyOverview.interactionAlerts.map((alert) => (
                <InteractionCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-[30px] border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <p className="text-sm font-semibold text-stone-900">Dispensacion y kardex</p>
              <p className="mt-1 text-xs text-stone-500">
                Flujo visual medico - farmacia - enfermeria.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              {visibleOrders.map((order) => (
                <KardexFlowCard key={`${order.id}-flow`} order={order} />
              ))}
            </div>
            <div className="border-t border-stone-200 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/portal/professional/patients/${patient.id}?tab=kardex`}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Imprimir Kardex
                </Link>
                <Link
                  href={`/portal/professional/patients/${patient.id}?tab=medication`}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Revisar historial
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <p className="text-sm font-semibold text-stone-900">Medicacion habitual y perfil</p>
              <p className="mt-1 text-xs text-stone-500">
                Referencias del perfil farmacologico actual del paciente.
              </p>
            </div>
            <div className="space-y-2 px-5 py-4">
              {chronicMedicationProfile.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-stone-200 bg-[#fcfbf8] px-4 py-3">
                  <p className="text-sm font-medium text-stone-900">{entry.name}</p>
                  <p className="mt-1 text-[11px] text-stone-500">{entry.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ModulePage>
  );
}

function PatientSummaryCard() {
  return (
    <article className="rounded-[28px] border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg font-semibold text-rose-700">
          ML
        </div>
        <div>
          <p className="text-lg font-semibold text-stone-900">{patient.fullName}</p>
          <p className="text-xs text-stone-500">
            HC-{patient.medicalRecordNumber.replace("HC-", "")} · {patient.age} a · SCA en estudio
          </p>
          <p className="text-xs text-stone-500">
            Nivel I · {patient.triageColor === "rojo" ? "Rojo" : patient.triageColor}
          </p>
        </div>
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "critical";
}) {
  const toneClassName =
    tone === "success"
      ? "text-emerald-700"
      : tone === "critical"
      ? "text-red-700"
      : "text-stone-900";

  return (
    <article className="rounded-[28px] border border-stone-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">{label}</p>
      <p className={["mt-3 text-4xl font-semibold tracking-tight", toneClassName].join(" ")}>{value}</p>
      <p className="mt-2 text-sm text-stone-500">{hint}</p>
    </article>
  );
}

function PrescriptionOrderCard({
  order,
  patientId,
  onEdit,
  onValidate,
  onRequestInr,
  onSuggestAlternative,
  onNotify,
  onArchive,
}: {
  order: PrescriptionOrder;
  patientId: string;
  onEdit: () => void;
  onValidate: () => void;
  onRequestInr: () => void;
  onSuggestAlternative: () => void;
  onNotify: () => void;
  onArchive: () => void;
}) {
  const cardTone =
    order.status === "Validada farmacia"
      ? "border-l-emerald-500 bg-white"
      : order.status === "Pendiente farmacia"
      ? "border-l-amber-500 bg-amber-50/50"
      : "border-l-red-500 bg-red-50/60";

  const statusChipTone =
    order.status === "Validada farmacia"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : order.status === "Pendiente farmacia"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-red-200 bg-red-100 text-red-700";

  return (
    <article className={["border-l-4 px-5 py-4", cardTone].join(" ")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-sm">
          <p
            className={[
              "text-2xl font-semibold leading-tight text-stone-900",
              order.status === "Bloqueada" ? "line-through decoration-red-400 decoration-2" : "",
            ].join(" ")}
          >
            {order.dci}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {order.route} · {order.frequency} · {order.duration}
          </p>
          <p className="text-sm text-stone-700">{order.indication}</p>
          <p className="mt-2 text-[11px] text-stone-500">
            Prescriptor: {order.prescriber} · {order.createdAt}
          </p>
        </div>

        <span className={["rounded-full border px-3 py-1 text-[11px] font-semibold", statusChipTone].join(" ")}>
          {order.status === "Bloqueada" ? "BLOQUEADA" : order.status}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
        {order.clinicalNote}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "Validada farmacia" ? (
          <>
            <Link
              href={`/portal/professional/patients/${patientId}?tab=kardex`}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Ver Kardex
            </Link>
            <Link
              href={`/portal/professional/patients/${patientId}?tab=medication`}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Historial dosis
            </Link>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Editar
            </button>
          </>
        ) : null}

        {order.status === "Pendiente farmacia" ? (
          <>
            <button
              type="button"
              onClick={onValidate}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              Validar
            </button>
            <button
              type="button"
              onClick={onRequestInr}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Solicitar INR
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Editar dosis
            </button>
          </>
        ) : null}

        {order.status === "Bloqueada" ? (
          <>
            <button
              type="button"
              onClick={onSuggestAlternative}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Sugerir alternativa
            </button>
            <button
              type="button"
              onClick={onNotify}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Notificar prescriptor
            </button>
            <button
              type="button"
              onClick={onArchive}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Archivar
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function SafetyAlertCard({ alert }: { alert: ValidationAlert }) {
  const toneClassName =
    alert.severity === "Alta"
      ? "border-red-200 bg-red-50 text-red-800"
      : alert.severity === "Media"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const pillClassName =
    alert.severity === "Alta"
      ? "bg-red-600 text-white"
      : alert.severity === "Media"
      ? "bg-amber-500 text-white"
      : "bg-emerald-600 text-white";

  return (
    <article className={["rounded-[24px] border p-4", toneClassName].join(" ")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{alert.title}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">
            {alert.category}
          </p>
        </div>
        <span className={["rounded-full px-2.5 py-0.5 text-[11px] font-semibold", pillClassName].join(" ")}>
          {alert.severity}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6">{alert.detail}</p>
      <p className="mt-3 text-sm font-medium">{alert.action}</p>
    </article>
  );
}

function InteractionCard({ alert }: { alert: InteractionAlert }) {
  const toneClassName =
    alert.severity === "Alta"
      ? "border-amber-200 bg-amber-50"
      : alert.severity === "Media"
      ? "border-stone-200 bg-[#fcfbf8]"
      : "border-slate-200 bg-white";

  return (
    <article className={["rounded-[24px] border p-4", toneClassName].join(" ")}>
      <p className="text-sm font-semibold text-stone-900">{alert.title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-700">{alert.detail}</p>
    </article>
  );
}

function KardexFlowCard({ order }: { order: PrescriptionOrder }) {
  return (
    <article className="rounded-[24px] border border-stone-200 bg-[#fcfbf8] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p
            className={[
              "text-lg font-semibold text-stone-900",
              order.status === "Bloqueada" ? "line-through decoration-red-400 decoration-2" : "",
            ].join(" ")}
          >
            {order.dci}
          </p>
          <p className="mt-1 text-xs text-stone-500">{order.nextDose}</p>
        </div>
        <span className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-[11px] text-stone-600">
          {order.pharmacyNote}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <FlowStep label="Medico" status={order.flow.medico} />
        <span className="text-stone-300">→</span>
        <FlowStep label="Farmacia" status={order.flow.farmacia} />
        <span className="text-stone-300">→</span>
        <FlowStep label="Enfermeria" status={order.flow.enfermeria} />
      </div>
    </article>
  );
}

function FlowStep({ label, status }: { label: string; status: FlowStepStatus }) {
  const className =
    status === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "blocked"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  const suffix = status === "done" ? "✓" : status === "blocked" ? "⨯" : "•";

  return (
    <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold", className].join(" ")}>
      {label} {suffix}
    </span>
  );
}

function FormField({
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
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-emerald-300"
      />
    </label>
  );
}

function SelectField({
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
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-emerald-300"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildPrescriptionSafety(
  orders: PrescriptionOrder[],
  allergies: string[],
  activeMedication: MedicationRecord[],
  chronicProfile: string[]
) {
  const validationAlerts: ValidationAlert[] = [];
  const interactionAlerts: InteractionAlert[] = [];

  const blockedAllergyOrder = orders.find((order) => getMedicationBlockReason(order.dci, allergies));
  const profileNames = [
    ...orders.map((item) => item.dci),
    ...activeMedication.map((item) => item.name),
    ...chronicProfile,
  ].map(normalizeText);

  if (blockedAllergyOrder) {
    validationAlerts.push({
      id: "allergy-block",
      category: "Alergia",
      severity: "Alta",
      title: "Alergia cruzada - Betalactamicos",
      detail: `${blockedAllergyOrder.dci} prescrita en paciente con alergia documentada a Penicilina. La reactividad cruzada obliga a bloqueo automatico y reevaluacion medica inmediata.`,
      action: "Orden bloqueada automaticamente. Notificar a coordinacion medica y seleccionar alternativa.",
    });
  }

  if (orders.some((order) => normalizeText(order.dci).includes("warfarina"))) {
    validationAlerts.push({
      id: "monitor-warfarina",
      category: "Monitoreo",
      severity: "Media",
      title: "Monitoreo obligatorio - Warfarina",
      detail: "Inicio de warfarina requiere INR basal y control a 48 horas. Rango terapeutico objetivo INR 2-3 segun indicacion.",
      action: "Programar INR urgente antes de primera dosis.",
    });
  }

  if (orders.some((order) => normalizeText(order.dci).includes("acido acetilsalicilico"))) {
    validationAlerts.push({
      id: "aas-info",
      category: "Dosis",
      severity: "Info",
      title: "AAS - dosis antiagregante confirmada",
      detail: "100 mg/dia corresponde a dosis antiagregante. Mantener diferenciada de uso analgesico/antiinflamatorio.",
      action: "Sin accion adicional si el objetivo clinico es antiagregacion.",
    });
  }

  if (
    profileNames.some((name) => name.includes("warfarina")) &&
    profileNames.some((name) => name.includes("acido acetilsalicilico") || name === "aas")
  ) {
    interactionAlerts.push({
      id: "int-warfarina-aas",
      title: "Warfarina + AAS",
      detail: "Potenciacion del efecto anticoagulante y riesgo de sangrado aumentado. Monitorear INR y eventos hemorragicos con mayor frecuencia.",
      severity: "Alta",
    });
  }

  if (
    profileNames.some((name) => name.includes("enoxaparina")) &&
    profileNames.some((name) => name.includes("acido acetilsalicilico") || name === "aas")
  ) {
    interactionAlerts.push({
      id: "int-aas-enoxa",
      title: "AAS + Enoxaparina",
      detail: "Riesgo hemorrhagico reforzado. Confirmar indicacion dual y mantener vigilancia clinica y de signos de sangrado.",
      severity: "Media",
    });
  }

  if (
    profileNames.some((name) => name.includes("metformina")) &&
    orders.some((order) => normalizeText(order.indication).includes("contraste"))
  ) {
    interactionAlerts.push({
      id: "int-metformina-contraste",
      title: "Metformina + contraste yodado",
      detail: "Suspender 48h antes o despues de imagen contrastada segun funcion renal. Documentar en ordenes de imagen.",
      severity: "Info",
    });
  }

  return {
    bannerAlert: blockedAllergyOrder
      ? {
          title: `${blockedAllergyOrder.dci} ${blockedAllergyOrder.dose} esta BLOQUEADA`,
          detail: `El paciente tiene alergia documentada a ${allergies.join(", ")}. ${blockedAllergyOrder.dci} es un betalactamico con riesgo de reactividad cruzada. Se requiere sustitucion por antibiotico de otra clase y bloqueo automatico hasta nueva orden medica.`,
          action: "Alergia clase I - bloqueo automatico activo",
        }
      : null,
    validationAlerts,
    interactionAlerts,
  };
}

function getMedicationBlockReason(dci: string, allergies: string[]) {
  const normalizedDci = normalizeText(dci);
  const normalizedAllergies = allergies.map(normalizeText);

  const hasPenicillinAllergy = normalizedAllergies.some((item) => item.includes("penic"));
  const isPenicillinFamily =
    normalizedDci.includes("amoxicilina") ||
    normalizedDci.includes("ampicilina") ||
    normalizedDci.includes("penicilina");

  if (hasPenicillinAllergy && isPenicillinFamily) {
    return "Bloqueo automatico por antecedente alergico a Penicilina con riesgo de reactividad cruzada.";
  }

  return null;
}

function requiresPharmacyValidation(dci: string) {
  const normalized = normalizeText(dci);

  return (
    normalized.includes("warfarina") ||
    normalized.includes("enoxaparina") ||
    normalized.includes("insulina") ||
    normalized.includes("amiodarona")
  );
}

function buildClinicalNote(dci: string) {
  const normalized = normalizeText(dci);

  if (normalized.includes("warfarina")) {
    return "Dosis inicial requiere protocolo de ajuste por INR y vigilancia de sangrado.";
  }

  if (normalized.includes("acido acetilsalicilico") || normalized === "aas") {
    return "Confirmar uso antiagregante y mantener separado de indicacion analgesica.";
  }

  if (normalized.includes("azitromicina")) {
    return "Alternativa sugerida cuando existe alergia a penicilinas y se requiere cobertura respiratoria.";
  }

  return "Orden lista para validacion farmaceutica y posterior integracion a kardex.";
}

function describeAlertMix(alerts: ValidationAlert[]) {
  const high = alerts.filter((alert) => alert.severity === "Alta").length;
  const medium = alerts.filter((alert) => alert.severity === "Media").length;

  if (high === 0 && medium === 0) {
    return "Sin alertas clinicas mayores";
  }

  return `${high} alta · ${medium} media`;
}

function isNoKnownAllergy(value: string) {
  const normalized = normalizeText(value);
  return normalized.includes("ninguna") || normalized.includes("no conocidas");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}
