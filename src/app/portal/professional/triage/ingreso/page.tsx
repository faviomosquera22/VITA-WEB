"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ModulePage, Panel, StatCard } from "../../_components/clinical-ui";
import {
  isTriageIntakeSectionId,
  triageIntakeSections,
  type TriageIntakeSectionId,
} from "../../_data/triage-intake-sections";
import {
  detectAutomaticProtocols,
  getCriticalVitalFlags,
  runTriageEngine,
} from "@/lib/triage/triageEngine";
import type {
  TriageColor,
  TriageInput,
  TriageManualOverride,
  TriagePriority,
  TriageSubprotocolId,
} from "@/lib/triage/triageTypes";

type DecisionHistoryEntry = {
  id: string;
  createdAt: string;
  actorName: string;
  action: "confirmar" | "reclasificar";
  finalColor: TriageColor;
  finalPriority: TriagePriority;
  finalMaxWaitMinutes: number;
  overrideReason: string;
  protocolsActivated: string[];
};

const STORAGE_KEY = "vita-triage-smart-flow-v1";

const reasonOptions = [
  "Dolor toracico",
  "Disnea",
  "Trauma",
  "Quemaduras",
  "Violencia sexual",
  "Obstetrico",
  "Intoxicaciones",
  "Salud mental",
  "Dolor abdominal",
  "Fiebre",
  "Cefalea",
  "Otro",
];

const discriminatorOptions = [
  "Compromiso respiratorio",
  "Dolor severo",
  "Sangrado",
  "Alteracion neurologica",
  "Riesgo psiquiatrico",
  "Riesgo obstetrico",
  "Trauma mayor",
  "Quemadura extensa",
  "Intoxicacion",
  "Violencia sexual",
];

const comorbidityOptions = [
  "HTA",
  "DM2",
  "Cardiopatia",
  "EPOC/Asma",
  "Insuficiencia renal",
  "Embarazo",
  "Trastorno psiquiatrico",
  "Ninguna conocida",
];

const protocolMeta: Array<{ id: TriageSubprotocolId; label: string; summary: string }> = [
  { id: "trauma", label: "Trauma", summary: "Mecanismo y lesiones mayores" },
  { id: "quemaduras", label: "Quemaduras", summary: "Tipo, extension, via aerea" },
  {
    id: "violencia_sexual",
    label: "Violencia sexual",
    summary: "Codigo Purpura y atencion clinico-legal",
  },
  { id: "obstetrico", label: "Obstetrico", summary: "Riesgo materno-fetal" },
  { id: "intoxicaciones", label: "Intoxicaciones", summary: "Compromiso toxico agudo" },
  {
    id: "salud_mental",
    label: "Salud mental",
    summary: "Agitacion, suicidio, autolesion",
  },
];

const emptyInput: TriageInput = {
  identification: {
    patientName: "",
    documentNumber: "",
    ageYears: null,
    sexBiological: "",
    possiblePregnancy: false,
  },
  complaint: {
    reason: "",
    discriminator: "",
    discriminatorTags: [],
  },
  vitals: {
    systolicBp: null,
    diastolicBp: null,
    heartRate: null,
    respiratoryRate: null,
    temperatureC: null,
    spo2: null,
    glasgow: null,
    painScale: null,
    capillaryGlucose: null,
  },
  criticalFindings: {
    airwayCompromise: false,
    severeRespiratoryDistress: false,
    activeUncontrolledBleeding: false,
    shockSigns: false,
    alteredConsciousness: false,
    seizureActive: false,
    chestPainIschemic: false,
    focalNeurologicDeficit: false,
    anaphylaxis: false,
    sepsisSuspicion: false,
  },
  clinicalHistory: {
    currentIllnessSummary: "",
    relevantHistorySummary: "",
    comorbidities: [],
  },
  protocolInputs: {
    trauma: {
      enabled: false,
      mechanism: "",
      lossOfConsciousness: false,
      activeBleeding: false,
      deformity: false,
      glasgow: null,
      cervicalPain: false,
      thoracicPain: false,
      abdominalPain: false,
      neurovascularCompromise: false,
      polytrauma: false,
      penetratingWound: false,
      amputation: false,
      evisceration: false,
      uncontrolledBleeding: false,
      suspectedSpinalCordInjury: false,
      severeTbi: false,
      multipleMajorFractures: false,
    },
    quemaduras: {
      enabled: false,
      burnType: "",
      bodySurfacePercent: null,
      specialRegion: false,
      airwayCompromise: false,
      closedSpaceFire: false,
      circumferential: false,
      pediatricCase: false,
      unstable: false,
    },
    violenciaSexual: {
      enabled: false,
      timeSinceEventHours: null,
      bleeding: false,
      lesions: false,
      possiblePregnancy: false,
      minor: false,
      showeredOrChangedClothes: false,
      emotionalCrisis: false,
    },
    obstetrico: {
      enabled: false,
      gestationalWeeks: null,
      vaginalBleeding: false,
      severeAbdominalPain: false,
      severeHeadache: false,
      severeHypertension: false,
      contractions: false,
      decreasedFetalMovements: false,
      postpartumHemorrhage: false,
    },
    intoxicaciones: {
      enabled: false,
      suspectedSubstance: "",
      ingestionTimeHours: null,
      alteredConsciousness: false,
      respiratoryDepression: false,
      seizures: false,
      hemodynamicInstability: false,
      suicidalIntent: false,
    },
    saludMental: {
      enabled: false,
      severeAgitation: false,
      suicideRisk: false,
      suicidePlan: false,
      violentBehavior: false,
      hallucinations: false,
      intoxicationAssociated: false,
      selfHarmInjury: false,
    },
  },
};

export default function TriageIntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [triageInput, setTriageInput] = useState<TriageInput>(() => {
    if (typeof window === "undefined") {
      return emptyInput;
    }

    const rawDraft = window.localStorage.getItem(STORAGE_KEY);
    if (!rawDraft) {
      return emptyInput;
    }

    try {
      return {
        ...emptyInput,
        ...JSON.parse(rawDraft),
      } as TriageInput;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return emptyInput;
    }
  });

  const [history, setHistory] = useState<DecisionHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "done" | "error">(
    "idle"
  );
  const [submitMessage, setSubmitMessage] = useState("");

  const [manualMode, setManualMode] = useState(false);
  const [manualOverride, setManualOverride] = useState<TriageManualOverride>({
    color: "azul",
    priority: 5,
    maxWaitMinutes: 120,
    reason: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(triageInput));
  }, [triageInput]);

  const activeSectionId = useMemo<TriageIntakeSectionId>(() => {
    const raw = searchParams.get("section");
    if (isTriageIntakeSectionId(raw)) {
      return raw;
    }
    return "ingreso_identificacion";
  }, [searchParams]);

  const activeSection =
    triageIntakeSections.find((section) => section.id === activeSectionId) ??
    triageIntakeSections[0];

  const activeIndex = triageIntakeSections.findIndex((item) => item.id === activeSection.id);
  const prevSection = activeIndex > 0 ? triageIntakeSections[activeIndex - 1] : null;
  const nextSection =
    activeIndex < triageIntakeSections.length - 1 ? triageIntakeSections[activeIndex + 1] : null;

  const autoProtocols = useMemo(
    () => detectAutomaticProtocols(triageInput),
    [triageInput]
  );

  const engineResult = useMemo(() => runTriageEngine(triageInput), [triageInput]);

  const criticalVitalFlags = useMemo(
    () =>
      getCriticalVitalFlags({
        identification: triageInput.identification,
        vitals: triageInput.vitals,
      }),
    [triageInput.identification, triageInput.vitals]
  );

  useEffect(() => {
    if (!manualMode) {
      setManualOverride({
        color: engineResult.suggestedColor,
        priority: engineResult.priority,
        maxWaitMinutes: engineResult.maxWaitMinutes,
        reason: "",
      });
    }
  }, [engineResult, manualMode]);

  const currentSectionMissing = useMemo(
    () => getSectionMissingFields(activeSection.id, triageInput),
    [activeSection.id, triageInput]
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/triage/decision?limit=8", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as { data?: DecisionHistoryEntry[] };
      setHistory(payload.data ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const goToSection = (sectionId: TriageIntakeSectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", sectionId);
    router.replace(`/portal/professional/triage/ingreso?${params.toString()}`, {
      scroll: false,
    });
  };

  const saveDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(triageInput));
    }
    setSubmitMessage("Borrador guardado localmente.");
    setSubmitState("done");
  };

  const resetForm = () => {
    if (typeof window !== "undefined") {
      const proceed = window.confirm("Se limpiara todo el triaje actual. Continuar?");
      if (!proceed) {
        return;
      }
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setTriageInput(emptyInput);
    setManualMode(false);
    setSubmitState("idle");
    setSubmitMessage("");
    goToSection("ingreso_identificacion");
  };

  const submitDecision = async (mode: "confirmar" | "reclasificar") => {
    setSubmitState("saving");
    setSubmitMessage("");

    if (mode === "reclasificar" && (!manualMode || !manualOverride.reason.trim())) {
      setSubmitState("error");
      setSubmitMessage("Debes ingresar la razon clinica de la reclasificacion manual.");
      return;
    }

    try {
      const response = await fetch("/api/triage/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          triageInput,
          manualOverride: mode === "reclasificar" ? manualOverride : null,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar la decision de triaje.");
      }

      setSubmitState("done");
      setSubmitMessage(
        mode === "confirmar"
          ? "Clasificacion confirmada y guardada."
          : "Reclasificacion manual guardada."
      );
      void loadHistory();
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Error inesperado al guardar.");
    }
  };

  const finalColor = manualMode ? manualOverride.color : engineResult.suggestedColor;
  const finalPriority = manualMode ? manualOverride.priority : engineResult.priority;
  const finalWait = manualMode ? manualOverride.maxWaitMinutes : engineResult.maxWaitMinutes;

  const protocolsInUse = useMemo(
    () => Array.from(new Set([...autoProtocols, ...engineResult.protocolsActivated])),
    [autoProtocols, engineResult.protocolsActivated]
  );

  return (
    <ModulePage
      title="Triaje asistido inteligente"
      subtitle="Flujo unico: nucleo general obligatorio + subprotocolos automaticos + resultado integrado."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/triage"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Volver a triaje
          </Link>
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
          >
            Nuevo formulario
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Color sugerido"
          value={engineResult.suggestedColor.toUpperCase()}
          hint={`${engineResult.priorityLabel}  -  max ${engineResult.maxWaitMinutes} min`}
        />
        <StatCard
          label="Protocolos activos"
          value={protocolsInUse.length}
          hint={
            protocolsInUse.length
              ? protocolsInUse.map((item) => protocolLabel(item)).join("  -  ")
              : "Sin subprotocolos activados"
          }
        />
        <StatCard
          label="Alertas"
          value={engineResult.alerts.length}
          hint={engineResult.alerts.slice(0, 2).join("  -  ") || "Sin alertas"}
        />
        <StatCard
          label="Datos faltantes"
          value={engineResult.missingData.length}
          hint={engineResult.missingData.slice(0, 2).join("  -  ") || "Completo"}
        />
      </div>

      <Panel title="Wizard clinico" subtitle="Se muestran solo campos segun contexto y se valida en tiempo real">
        <div className="mb-3 flex flex-wrap gap-2">
          {triageIntakeSections.map((section) => {
            const isActive = section.id === activeSection.id;
            const missing = getSectionMissingFields(section.id, triageInput);

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => goToSection(section.id)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {section.code} {section.shortLabel}
                {missing.length > 0 ? ` (${missing.length})` : ""}
              </button>
            );
          })}
        </div>

        {activeSection.id === "ingreso_identificacion" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InputField
              label="Documento"
              value={triageInput.identification.documentNumber}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  identification: { ...prev.identification, documentNumber: value },
                }))
              }
              required
            />
            <InputField
              label="Nombre del px"
              value={triageInput.identification.patientName}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  identification: { ...prev.identification, patientName: value },
                }))
              }
              required
            />
            <NumberField
              label="Edad"
              value={triageInput.identification.ageYears}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  identification: { ...prev.identification, ageYears: value },
                }))
              }
              required
            />
            <SelectField
              label="Sexo biologico"
              value={triageInput.identification.sexBiological}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  identification: {
                    ...prev.identification,
                    sexBiological: value as TriageInput["identification"]["sexBiological"],
                  },
                }))
              }
              options={[
                { value: "", label: "Seleccionar" },
                { value: "femenino", label: "Femenino" },
                { value: "masculino", label: "Masculino" },
                { value: "otro", label: "Otro" },
              ]}
            />
            {triageInput.identification.sexBiological === "femenino" ? (
              <CheckChip
                label="Posible embarazo"
                checked={triageInput.identification.possiblePregnancy}
                onToggle={() =>
                  setTriageInput((prev) => ({
                    ...prev,
                    identification: {
                      ...prev.identification,
                      possiblePregnancy: !prev.identification.possiblePregnancy,
                    },
                  }))
                }
              />
            ) : null}
          </div>
        ) : null}

        {activeSection.id === "motivo_discriminador" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SelectField
                label="Motivo de consulta"
                value={triageInput.complaint.reason}
                onChange={(value) =>
                  setTriageInput((prev) => ({
                    ...prev,
                    complaint: { ...prev.complaint, reason: value },
                  }))
                }
                required
                options={[
                  { value: "", label: "Seleccionar motivo" },
                  ...reasonOptions.map((item) => ({ value: item, label: item })),
                ]}
              />
              <InputField
                label="Discriminador principal"
                value={triageInput.complaint.discriminator}
                onChange={(value) =>
                  setTriageInput((prev) => ({
                    ...prev,
                    complaint: { ...prev.complaint, discriminator: value },
                  }))
                }
                required
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Discriminadores sugeridos
              </p>
              <div className="flex flex-wrap gap-2">
                {discriminatorOptions.map((option) => {
                  const active = triageInput.complaint.discriminatorTags.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setTriageInput((prev) => ({
                          ...prev,
                          complaint: {
                            ...prev.complaint,
                            discriminatorTags: active
                              ? prev.complaint.discriminatorTags.filter((item) => item !== option)
                              : [...prev.complaint.discriminatorTags, option],
                          },
                        }))
                      }
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        active
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {activeSection.id === "signos_vitales" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <NumberField
              label="PA sistolica"
              value={triageInput.vitals.systolicBp}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, systolicBp: value },
                }))
              }
              required
              critical={Boolean(criticalVitalFlags.systolicBp)}
            />
            <NumberField
              label="PA diastolica"
              value={triageInput.vitals.diastolicBp}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, diastolicBp: value },
                }))
              }
            />
            <NumberField
              label="FC"
              value={triageInput.vitals.heartRate}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, heartRate: value },
                }))
              }
              required
              critical={Boolean(criticalVitalFlags.heartRate)}
            />
            <NumberField
              label="FR"
              value={triageInput.vitals.respiratoryRate}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, respiratoryRate: value },
                }))
              }
              required
              critical={Boolean(criticalVitalFlags.respiratoryRate)}
            />
            <NumberField
              label="SpO2"
              value={triageInput.vitals.spo2}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, spo2: value },
                }))
              }
              required
              critical={Boolean(criticalVitalFlags.spo2)}
            />
            <NumberField
              label="Temp C"
              value={triageInput.vitals.temperatureC}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, temperatureC: value },
                }))
              }
              critical={Boolean(criticalVitalFlags.temperatureC)}
            />
            <NumberField
              label="Glasgow"
              value={triageInput.vitals.glasgow}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, glasgow: value },
                }))
              }
            />
            <NumberField
              label="Dolor (0-10)"
              value={triageInput.vitals.painScale}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, painScale: value },
                }))
              }
            />
            <NumberField
              label="Glucosa capilar"
              value={triageInput.vitals.capillaryGlucose}
              onChange={(value) =>
                setTriageInput((prev) => ({
                  ...prev,
                  vitals: { ...prev.vitals, capillaryGlucose: value },
                }))
              }
            />
          </div>
        ) : null}

        {activeSection.id === "hallazgos_criticos" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {criticalChipConfig.map((chip) => (
              <CheckChip
                key={chip.key}
                label={chip.label}
                checked={triageInput.criticalFindings[chip.key]}
                tone={chip.tone}
                onToggle={() =>
                  setTriageInput((prev) => ({
                    ...prev,
                    criticalFindings: {
                      ...prev.criticalFindings,
                      [chip.key]: !prev.criticalFindings[chip.key],
                    },
                  }))
                }
              />
            ))}
          </div>
        ) : null}

        {activeSection.id === "antecedentes_enfermedad" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SelectField
                label="Enfermedad actual"
                value={triageInput.clinicalHistory.currentIllnessSummary}
                onChange={(value) =>
                  setTriageInput((prev) => ({
                    ...prev,
                    clinicalHistory: {
                      ...prev.clinicalHistory,
                      currentIllnessSummary: value,
                    },
                  }))
                }
                required
                options={[
                  { value: "", label: "Seleccionar" },
                  { value: "Inicio brusco", label: "Inicio brusco" },
                  { value: "Inicio progresivo", label: "Inicio progresivo" },
                  { value: "Evolucion en horas", label: "Evolucion en horas" },
                  { value: "Evolucion en dias", label: "Evolucion en dias" },
                ]}
              />
              <SelectField
                label="Antecedente relevante"
                value={triageInput.clinicalHistory.relevantHistorySummary}
                onChange={(value) =>
                  setTriageInput((prev) => ({
                    ...prev,
                    clinicalHistory: {
                      ...prev.clinicalHistory,
                      relevantHistorySummary: value,
                    },
                  }))
                }
                options={[
                  { value: "", label: "Seleccionar" },
                  { value: "Sin antecedentes", label: "Sin antecedentes" },
                  { value: "Cardiovascular", label: "Cardiovascular" },
                  { value: "Respiratorio", label: "Respiratorio" },
                  { value: "Neurologico", label: "Neurologico" },
                  { value: "Psiquiatrico", label: "Psiquiatrico" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Comorbilidades
              </p>
              <div className="flex flex-wrap gap-2">
                {comorbidityOptions.map((item) => {
                  const checked = triageInput.clinicalHistory.comorbidities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setTriageInput((prev) => ({
                          ...prev,
                          clinicalHistory: {
                            ...prev.clinicalHistory,
                            comorbidities: checked
                              ? prev.clinicalHistory.comorbidities.filter((value) => value !== item)
                              : [...prev.clinicalHistory.comorbidities, item],
                          },
                        }))
                      }
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        checked
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {activeSection.id === "subprotocolos" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">Subprotocolos activados automaticamente</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {autoProtocols.length === 0 ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                    Sin activacion automatica por ahora
                  </span>
                ) : (
                  autoProtocols.map((protocol) => (
                    <span
                      key={protocol}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {protocolLabel(protocol)}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {protocolMeta.map((protocol) => {
                const enabled = isProtocolEnabled(triageInput, protocol.id);
                return (
                  <button
                    key={protocol.id}
                    type="button"
                    onClick={() =>
                      setTriageInput((prev) =>
                        setProtocolEnabled(prev, protocol.id, !isProtocolEnabled(prev, protocol.id))
                      )
                    }
                    className={[
                      "rounded-xl border p-3 text-left transition",
                      enabled
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold text-slate-900">{protocol.label}</p>
                    <p className="text-xs text-slate-600">{protocol.summary}</p>
                  </button>
                );
              })}
            </div>

            {protocolsInUse.includes("violencia_sexual") ? (
              <div className="rounded-xl border border-fuchsia-300 bg-fuchsia-50 p-3">
                <p className="text-sm font-semibold text-fuchsia-800">Codigo Purpura activo</p>
                <p className="text-xs text-fuchsia-700">
                  Atencion inmediata, intervencion en crisis y registro clinico legal.
                </p>
              </div>
            ) : null}

            {protocolsInUse.map((protocol) => (
              <ProtocolFormBlock
                key={protocol}
                protocol={protocol}
                triageInput={triageInput}
                setTriageInput={setTriageInput}
              />
            ))}
          </div>
        ) : null}

        {activeSection.id === "resultado" ? (
          <div className="space-y-4">
            <ResultCard
              title="Resultado final integrado"
              color={finalColor}
              priority={finalPriority}
              waitMinutes={finalWait}
            />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <ResultList title="Motivos clinicos" values={engineResult.reasons} emptyLabel="Sin motivos" />
              <ResultList
                title="Protocolos activados"
                values={engineResult.protocolsActivated.map((item) => protocolLabel(item))}
                emptyLabel="Sin protocolos"
              />
              <ResultList title="Alertas" values={engineResult.alerts} emptyLabel="Sin alertas" />
              <ResultList
                title="Acciones inmediatas"
                values={engineResult.immediateActions}
                emptyLabel="Sin acciones"
              />
            </div>

            <ResultList
              title="Datos faltantes"
              values={engineResult.missingData}
              emptyLabel="No hay datos faltantes"
              warning
            />

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <CheckChip
                label="Reclasificar manualmente"
                checked={manualMode}
                onToggle={() => setManualMode((prev) => !prev)}
              />

              {manualMode ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <SelectField
                    label="Color manual"
                    value={manualOverride.color}
                    onChange={(value) =>
                      setManualOverride((prev) => ({
                        ...prev,
                        color: value as TriageColor,
                      }))
                    }
                    options={[
                      { value: "rojo", label: "Rojo" },
                      { value: "naranja", label: "Naranja" },
                      { value: "amarillo", label: "Amarillo" },
                      { value: "verde", label: "Verde" },
                      { value: "azul", label: "Azul" },
                    ]}
                  />
                  <SelectField
                    label="Prioridad manual"
                    value={String(manualOverride.priority)}
                    onChange={(value) =>
                      setManualOverride((prev) => ({
                        ...prev,
                        priority: Number(value) as TriagePriority,
                      }))
                    }
                    options={[
                      { value: "1", label: "Prioridad I" },
                      { value: "2", label: "Prioridad II" },
                      { value: "3", label: "Prioridad III" },
                      { value: "4", label: "Prioridad IV" },
                      { value: "5", label: "Prioridad V" },
                    ]}
                  />
                  <NumberField
                    label="Tiempo maximo (min)"
                    value={manualOverride.maxWaitMinutes}
                    onChange={(value) =>
                      setManualOverride((prev) => ({
                        ...prev,
                        maxWaitMinutes: value ?? prev.maxWaitMinutes,
                      }))
                    }
                  />
                  <InputField
                    label="Razon clinica manual"
                    value={manualOverride.reason}
                    onChange={(value) =>
                      setManualOverride((prev) => ({
                        ...prev,
                        reason: value,
                      }))
                    }
                    required
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => submitDecision("confirmar")}
                disabled={submitState === "saving"}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirmar clasificacion
              </button>
              <button
                type="button"
                onClick={() => submitDecision("reclasificar")}
                disabled={submitState === "saving" || !manualMode}
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar reclasificacion manual
              </button>
            </div>

            {submitMessage ? (
              <p
                className={[
                  "text-xs font-medium",
                  submitState === "error" ? "text-red-700" : "text-emerald-700",
                ].join(" ")}
              >
                {submitMessage}
              </p>
            ) : null}

            <Panel title="Historial reciente" subtitle="Confirmaciones y reclasificaciones con usuario, fecha y hora">
              {historyLoading ? (
                <p className="text-xs text-slate-500">Cargando historial...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-slate-500">Sin registros en historial.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-900">
                        {entry.action === "reclasificar" ? "Reclasificacion" : "Confirmacion"}  -  {entry.actorName}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {new Date(entry.createdAt).toLocaleString()}  -  {entry.finalColor.toUpperCase()}  -  P{entry.finalPriority}  -  {entry.finalMaxWaitMinutes} min
                      </p>
                      {entry.overrideReason ? (
                        <p className="text-[11px] text-amber-700">Razon manual: {entry.overrideReason}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          {prevSection ? (
            <button
              type="button"
              onClick={() => goToSection(prevSection.id)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Anterior: {prevSection.code}
            </button>
          ) : null}
          {nextSection ? (
            <button
              type="button"
              onClick={() => goToSection(nextSection.id)}
              disabled={currentSectionMissing.length > 0}
              className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente: {nextSection.code}
            </button>
          ) : null}
          {currentSectionMissing.length > 0 ? (
            <p className="self-center text-xs text-amber-700">
              Completa: {currentSectionMissing.join(", ")}
            </p>
          ) : null}
        </div>
      </Panel>
    </ModulePage>
  );
}

function InputField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-700">
      <span className="font-semibold text-slate-600">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required,
  critical,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
  critical?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-700">
      <span className="font-semibold text-slate-600">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(toNullableNumber(event.target.value))}
        className={[
          "rounded-lg border bg-white px-3 py-2 text-sm outline-none",
          critical
            ? "border-red-300 text-red-700 ring-2 ring-red-100"
            : "border-slate-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
        ].join(" ")}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-700">
      <span className="font-semibold text-slate-600">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckChip({
  label,
  checked,
  onToggle,
  tone = "default",
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  tone?: "default" | "critical";
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "rounded-xl border px-4 py-2 text-left text-sm font-semibold transition",
        checked
          ? tone === "critical"
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-sky-300 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {checked ? "[x]" : "[ ]"} {label}
    </button>
  );
}

function ProtocolFormBlock({
  protocol,
  triageInput,
  setTriageInput,
}: {
  protocol: TriageSubprotocolId;
  triageInput: TriageInput;
  setTriageInput: (value: TriageInput | ((prev: TriageInput) => TriageInput)) => void;
}) {
  if (protocol === "trauma") {
    const trauma = triageInput.protocolInputs.trauma;

    return (
      <Panel title="Subprotocolo: Trauma" subtitle="Mecanismo y criterios mayores de prioridad I">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Mecanismo"
            value={trauma.mechanism}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  trauma: { ...prev.protocolInputs.trauma, mechanism: value },
                },
              }))
            }
            options={[
              { value: "", label: "Seleccionar" },
              { value: "Transito", label: "Transito" },
              { value: "Caida", label: "Caida" },
              { value: "Aplastamiento", label: "Aplastamiento" },
              { value: "Penetrante", label: "Penetrante" },
              { value: "Otro", label: "Otro" },
            ]}
          />
          <NumberField
            label="Glasgow trauma"
            value={trauma.glasgow}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  trauma: { ...prev.protocolInputs.trauma, glasgow: value },
                },
              }))
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["lossOfConsciousness", "Perdida de conciencia", "default"],
            ["activeBleeding", "Sangrado activo", "default"],
            ["deformity", "Deformidad", "default"],
            ["cervicalPain", "Dolor cervical", "default"],
            ["thoracicPain", "Dolor toracico", "default"],
            ["abdominalPain", "Dolor abdominal", "default"],
            ["polytrauma", "Politrauma", "default"],
            ["penetratingWound", "Herida penetrante", "critical"],
            ["amputation", "Amputacion", "critical"],
            ["evisceration", "Evisceracion", "critical"],
            ["uncontrolledBleeding", "Sangrado no controlado", "critical"],
            ["suspectedSpinalCordInjury", "Lesion medular sospechada", "critical"],
            ["severeTbi", "TEC severo", "critical"],
            ["multipleMajorFractures", "Multiples fracturas mayores", "critical"],
            ["neurovascularCompromise", "Compromiso neurovascular", "critical"],
          ] as const).map(([key, label, tone]) => (
            <CheckChip
              key={key}
              label={label}
              checked={trauma[key]}
              tone={tone}
              onToggle={() =>
                setTriageInput((prev) => ({
                  ...prev,
                  protocolInputs: {
                    ...prev.protocolInputs,
                    trauma: {
                      ...prev.protocolInputs.trauma,
                      [key]: !prev.protocolInputs.trauma[key],
                    },
                  },
                }))
              }
            />
          ))}
        </div>
      </Panel>
    );
  }

  if (protocol === "quemaduras") {
    const burns = triageInput.protocolInputs.quemaduras;

    return (
      <Panel title="Subprotocolo: Quemaduras" subtitle="Tipo, superficie, region especial y via aerea">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Tipo"
            value={burns.burnType}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  quemaduras: {
                    ...prev.protocolInputs.quemaduras,
                    burnType: value as TriageInput["protocolInputs"]["quemaduras"]["burnType"],
                  },
                },
              }))
            }
            options={[
              { value: "", label: "Seleccionar" },
              { value: "termica", label: "Termica" },
              { value: "quimica", label: "Quimica" },
              { value: "electrica", label: "Electrica" },
              { value: "radiacion", label: "Radiacion" },
              { value: "otro", label: "Otro" },
            ]}
          />
          <NumberField
            label="% superficie corporal"
            value={burns.bodySurfacePercent}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  quemaduras: {
                    ...prev.protocolInputs.quemaduras,
                    bodySurfacePercent: value,
                  },
                },
              }))
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["specialRegion", "Region especial", "default"],
            ["airwayCompromise", "Compromiso de via aerea", "critical"],
            ["closedSpaceFire", "Fuego en ambiente cerrado", "critical"],
            ["circumferential", "Quemadura circunferencial", "default"],
            ["pediatricCase", "Caso pediatrico", "default"],
            ["unstable", "Inestabilidad hemodinamica", "critical"],
          ] as const).map(([key, label, tone]) => (
            <CheckChip
              key={key}
              label={label}
              checked={burns[key]}
              tone={tone}
              onToggle={() =>
                setTriageInput((prev) => ({
                  ...prev,
                  protocolInputs: {
                    ...prev.protocolInputs,
                    quemaduras: {
                      ...prev.protocolInputs.quemaduras,
                      [key]: !prev.protocolInputs.quemaduras[key],
                    },
                  },
                }))
              }
            />
          ))}
        </div>
      </Panel>
    );
  }

  if (protocol === "violencia_sexual") {
    const sexual = triageInput.protocolInputs.violenciaSexual;

    return (
      <Panel title="Subprotocolo: Violencia sexual" subtitle="Codigo Purpura, tiempo y criterios clinico-legales">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <NumberField
            label="Tiempo desde el evento (h)"
            value={sexual.timeSinceEventHours}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  violenciaSexual: {
                    ...prev.protocolInputs.violenciaSexual,
                    timeSinceEventHours: value,
                  },
                },
              }))
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["bleeding", "Sangrado", "critical"],
            ["lesions", "Lesiones", "critical"],
            ["possiblePregnancy", "Embarazo posible", "default"],
            ["minor", "Menor de edad", "critical"],
            ["showeredOrChangedClothes", "Bano/cambio de ropa", "default"],
            ["emotionalCrisis", "Crisis emocional", "critical"],
          ] as const).map(([key, label, tone]) => (
            <CheckChip
              key={key}
              label={label}
              checked={sexual[key]}
              tone={tone}
              onToggle={() =>
                setTriageInput((prev) => ({
                  ...prev,
                  protocolInputs: {
                    ...prev.protocolInputs,
                    violenciaSexual: {
                      ...prev.protocolInputs.violenciaSexual,
                      [key]: !prev.protocolInputs.violenciaSexual[key],
                    },
                  },
                }))
              }
            />
          ))}
        </div>
      </Panel>
    );
  }

  if (protocol === "obstetrico") {
    const obstetric = triageInput.protocolInputs.obstetrico;

    return (
      <Panel title="Subprotocolo: Obstetrico" subtitle="Evaluacion de riesgo materno-fetal">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <NumberField
            label="Semanas de gestacion"
            value={obstetric.gestationalWeeks}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  obstetrico: {
                    ...prev.protocolInputs.obstetrico,
                    gestationalWeeks: value,
                  },
                },
              }))
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["vaginalBleeding", "Sangrado vaginal", "critical"],
            ["severeAbdominalPain", "Dolor abdominal severo", "critical"],
            ["severeHeadache", "Cefalea severa", "default"],
            ["severeHypertension", "HTA severa", "critical"],
            ["contractions", "Contracciones", "default"],
            ["decreasedFetalMovements", "Disminucion mov. fetales", "default"],
            ["postpartumHemorrhage", "Hemorragia posparto", "critical"],
          ] as const).map(([key, label, tone]) => (
            <CheckChip
              key={key}
              label={label}
              checked={obstetric[key]}
              tone={tone}
              onToggle={() =>
                setTriageInput((prev) => ({
                  ...prev,
                  protocolInputs: {
                    ...prev.protocolInputs,
                    obstetrico: {
                      ...prev.protocolInputs.obstetrico,
                      [key]: !prev.protocolInputs.obstetrico[key],
                    },
                  },
                }))
              }
            />
          ))}
        </div>
      </Panel>
    );
  }

  if (protocol === "intoxicaciones") {
    const intox = triageInput.protocolInputs.intoxicaciones;

    return (
      <Panel title="Subprotocolo: Intoxicaciones" subtitle="Sustancia, tiempo y compromiso vital">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Sustancia sospechada"
            value={intox.suspectedSubstance}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  intoxicaciones: {
                    ...prev.protocolInputs.intoxicaciones,
                    suspectedSubstance: value,
                  },
                },
              }))
            }
            options={[
              { value: "", label: "Seleccionar" },
              { value: "Medicamentos", label: "Medicamentos" },
              { value: "Alcohol", label: "Alcohol" },
              { value: "Plaguicidas", label: "Plaguicidas" },
              { value: "Drogas", label: "Drogas" },
              { value: "Otro", label: "Otro" },
            ]}
          />
          <NumberField
            label="Tiempo de ingestion (h)"
            value={intox.ingestionTimeHours}
            onChange={(value) =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  intoxicaciones: {
                    ...prev.protocolInputs.intoxicaciones,
                    ingestionTimeHours: value,
                  },
                },
              }))
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["alteredConsciousness", "Compromiso de conciencia", "critical"],
            ["respiratoryDepression", "Depresion respiratoria", "critical"],
            ["seizures", "Convulsiones", "critical"],
            ["hemodynamicInstability", "Inestabilidad hemodinamica", "critical"],
            ["suicidalIntent", "Intencion suicida", "default"],
          ] as const).map(([key, label, tone]) => (
            <CheckChip
              key={key}
              label={label}
              checked={intox[key]}
              tone={tone}
              onToggle={() =>
                setTriageInput((prev) => ({
                  ...prev,
                  protocolInputs: {
                    ...prev.protocolInputs,
                    intoxicaciones: {
                      ...prev.protocolInputs.intoxicaciones,
                      [key]: !prev.protocolInputs.intoxicaciones[key],
                    },
                  },
                }))
              }
            />
          ))}
        </div>
      </Panel>
    );
  }

  const mental = triageInput.protocolInputs.saludMental;

  return (
    <Panel title="Subprotocolo: Salud mental" subtitle="Agitacion, suicidio y riesgo de autolesion">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {([
          ["severeAgitation", "Agitacion severa", "critical"],
          ["suicideRisk", "Riesgo suicida", "critical"],
          ["suicidePlan", "Plan suicida", "critical"],
          ["violentBehavior", "Conducta violenta", "critical"],
          ["hallucinations", "Alucinaciones", "default"],
          ["intoxicationAssociated", "Intoxicacion asociada", "default"],
          ["selfHarmInjury", "Lesion autoinfligida", "critical"],
        ] as const).map(([key, label, tone]) => (
          <CheckChip
            key={key}
            label={label}
            checked={mental[key]}
            tone={tone}
            onToggle={() =>
              setTriageInput((prev) => ({
                ...prev,
                protocolInputs: {
                  ...prev.protocolInputs,
                  saludMental: {
                    ...prev.protocolInputs.saludMental,
                    [key]: !prev.protocolInputs.saludMental[key],
                  },
                },
              }))
            }
          />
        ))}
      </div>
    </Panel>
  );
}

function ResultCard({
  title,
  color,
  priority,
  waitMinutes,
}: {
  title: string;
  color: TriageColor;
  priority: TriagePriority;
  waitMinutes: number;
}) {
  const toneByColor: Record<TriageColor, string> = {
    rojo: "border-red-300 bg-red-50 text-red-700",
    naranja: "border-orange-300 bg-orange-50 text-orange-700",
    amarillo: "border-amber-300 bg-amber-50 text-amber-700",
    verde: "border-emerald-300 bg-emerald-50 text-emerald-700",
    azul: "border-sky-300 bg-sky-50 text-sky-700",
  };

  return (
    <div className={["rounded-2xl border p-4", toneByColor[color]].join(" ")}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-2xl font-bold">{color.toUpperCase()}</p>
      <p className="text-sm font-semibold">Prioridad {priority}  -  Max {waitMinutes} min</p>
    </div>
  );
}

function ResultList({
  title,
  values,
  emptyLabel,
  warning,
}: {
  title: string;
  values: string[];
  emptyLabel: string;
  warning?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-3",
        warning ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      {values.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {values.map((item) => (
            <li key={`${title}-${item}`}>- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function protocolLabel(value: TriageSubprotocolId) {
  const labels: Record<TriageSubprotocolId, string> = {
    trauma: "Trauma",
    quemaduras: "Quemaduras",
    violencia_sexual: "Violencia sexual",
    obstetrico: "Obstetrico",
    intoxicaciones: "Intoxicaciones",
    salud_mental: "Salud mental",
  };

  return labels[value];
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSectionMissingFields(sectionId: TriageIntakeSectionId, input: TriageInput) {
  if (sectionId === "ingreso_identificacion") {
    const missing: string[] = [];
    if (!input.identification.documentNumber.trim()) {
      missing.push("Documento");
    }
    if (!input.identification.patientName.trim()) {
      missing.push("Nombre");
    }
    if (input.identification.ageYears === null) {
      missing.push("Edad");
    }
    return missing;
  }

  if (sectionId === "motivo_discriminador") {
    const missing: string[] = [];
    if (!input.complaint.reason.trim()) {
      missing.push("Motivo");
    }
    if (!input.complaint.discriminator.trim()) {
      missing.push("Discriminador");
    }
    return missing;
  }

  if (sectionId === "signos_vitales") {
    const missing: string[] = [];
    if (input.vitals.systolicBp === null) {
      missing.push("PA sistolica");
    }
    if (input.vitals.heartRate === null) {
      missing.push("FC");
    }
    if (input.vitals.respiratoryRate === null) {
      missing.push("FR");
    }
    if (input.vitals.spo2 === null) {
      missing.push("SpO2");
    }
    return missing;
  }

  if (sectionId === "antecedentes_enfermedad") {
    if (!input.clinicalHistory.currentIllnessSummary.trim()) {
      return ["Enfermedad actual"];
    }
  }

  return [];
}

function isProtocolEnabled(input: TriageInput, protocol: TriageSubprotocolId) {
  if (protocol === "trauma") {
    return input.protocolInputs.trauma.enabled;
  }
  if (protocol === "quemaduras") {
    return input.protocolInputs.quemaduras.enabled;
  }
  if (protocol === "violencia_sexual") {
    return input.protocolInputs.violenciaSexual.enabled;
  }
  if (protocol === "obstetrico") {
    return input.protocolInputs.obstetrico.enabled;
  }
  if (protocol === "intoxicaciones") {
    return input.protocolInputs.intoxicaciones.enabled;
  }
  return input.protocolInputs.saludMental.enabled;
}

function setProtocolEnabled(
  input: TriageInput,
  protocol: TriageSubprotocolId,
  enabled: boolean
): TriageInput {
  if (protocol === "trauma") {
    return {
      ...input,
      protocolInputs: {
        ...input.protocolInputs,
        trauma: { ...input.protocolInputs.trauma, enabled },
      },
    };
  }

  if (protocol === "quemaduras") {
    return {
      ...input,
      protocolInputs: {
        ...input.protocolInputs,
        quemaduras: { ...input.protocolInputs.quemaduras, enabled },
      },
    };
  }

  if (protocol === "violencia_sexual") {
    return {
      ...input,
      protocolInputs: {
        ...input.protocolInputs,
        violenciaSexual: { ...input.protocolInputs.violenciaSexual, enabled },
      },
    };
  }

  if (protocol === "obstetrico") {
    return {
      ...input,
      protocolInputs: {
        ...input.protocolInputs,
        obstetrico: { ...input.protocolInputs.obstetrico, enabled },
      },
    };
  }

  if (protocol === "intoxicaciones") {
    return {
      ...input,
      protocolInputs: {
        ...input.protocolInputs,
        intoxicaciones: { ...input.protocolInputs.intoxicaciones, enabled },
      },
    };
  }

  return {
    ...input,
    protocolInputs: {
      ...input.protocolInputs,
      saludMental: { ...input.protocolInputs.saludMental, enabled },
    },
  };
}

const criticalChipConfig: Array<{
  key: keyof TriageInput["criticalFindings"];
  label: string;
  tone: "default" | "critical";
}> = [
  { key: "airwayCompromise", label: "Compromiso via aerea", tone: "critical" },
  { key: "severeRespiratoryDistress", label: "Distres respiratorio", tone: "critical" },
  { key: "activeUncontrolledBleeding", label: "Sangrado no controlado", tone: "critical" },
  { key: "shockSigns", label: "Signos de shock", tone: "critical" },
  { key: "alteredConsciousness", label: "Alteracion de conciencia", tone: "critical" },
  { key: "seizureActive", label: "Convulsion activa", tone: "critical" },
  { key: "chestPainIschemic", label: "Dolor toracico isquemico", tone: "default" },
  { key: "focalNeurologicDeficit", label: "Deficit neurologico focal", tone: "critical" },
  { key: "anaphylaxis", label: "Anafilaxia", tone: "critical" },
  { key: "sepsisSuspicion", label: "Sospecha de sepsis", tone: "default" },
];
