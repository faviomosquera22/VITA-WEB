"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { runTriageEngine } from "@/lib/triage/engine/triageEngine";
import type {
  BurnData,
  IntoxicationData,
  MentalHealthData,
  ObstetricData,
  SexualViolenceData,
  SubprotocolType,
  TriageAuditEntry,
  TriageFormData,
  TriageResult,
  TraumaData,
} from "@/lib/triage/triageTypes";

import TriageResultView from "./result/TriageResult";
import ProgressStepper from "./shared/ProgressStepper";
import Step1Identification from "./steps/Step1Identification";
import Step2ChiefComplaint from "./steps/Step2ChiefComplaint";
import Step3VitalSigns from "./steps/Step3VitalSigns";
import Step4CriticalFindings from "./steps/Step4CriticalFindings";
import Step5History from "./steps/Step5History";
import Step6Subprotocols from "./steps/Step6Subprotocols";

const wizardSchema = z.object({
  identification: z.object({
    firstName: z.string().min(1, "Nombres requeridos"),
    lastName: z.string().min(1, "Apellidos requeridos"),
    age: z.number().min(0),
    ageUnit: z.enum(["years", "months", "days"]),
    sex: z.enum(["M", "F", "other"]),
    arrivalMode: z.enum(["walking", "wheelchair", "stretcher", "ambulance", "police", "transfer"]),
    consciousOnArrival: z.boolean(),
    canCommunicate: z.boolean(),
    isCompanied: z.boolean(),
    isPediatric: z.boolean(),
    isObstetric: z.boolean(),
    birthDate: z.string(),
    arrivalTime: z.string(),
    patientId: z.string().optional(),
    cedula: z.string().optional(),
    companionName: z.string().optional(),
    companionRelation: z.string().optional(),
    companionPhone: z.string().optional(),
  }),
  chiefComplaint: z.object({
    chiefComplaintText: z.string().max(200),
    onsetTime: z.string(),
    onsetUnit: z.enum(["minutes", "hours", "days"]),
    discriminatorId: z.string().min(1, "Selecciona discriminador"),
    discriminatorLabel: z.string(),
    basePriority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    activatedSubprotocols: z.array(
      z.enum(["TRAUMA", "BURNS", "SEXUAL_VIOLENCE", "OBSTETRIC", "INTOXICATION", "MENTAL_HEALTH"])
    ),
  }),
  vitalSigns: z.object({
    takenAt: z.string(),
    takenBy: z.string(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    systolicBP: z.number().optional(),
    diastolicBP: z.number().optional(),
    spo2: z.number().optional(),
    temperature: z.number().optional(),
    glasgowTotal: z.number().optional(),
    painScale: z.number().optional(),
    glucometry: z.number().optional(),
    fetalHeartRate: z.number().optional(),
    weight: z.number().optional(),
    criticalFlags: z.array(
      z.object({
        parameter: z.string(),
        value: z.number(),
        threshold: z.string(),
        suggestedPriority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
        message: z.string(),
      })
    ),
  }),
  criticalFindings: z.any(),
  history: z.any(),
  trauma: z.any().optional(),
  burns: z.any().optional(),
  sexualViolence: z.any().optional(),
  obstetric: z.any().optional(),
  intoxication: z.any().optional(),
  mentalHealth: z.any().optional(),
  suggestedResult: z.any(),
  auditTrail: z.array(z.any()),
  confirmedBy: z.string().optional(),
  confirmedAt: z.string().optional(),
  confirmedLevel: z.string().optional(),
  reclassificationReason: z.string().optional(),
});

const steps = [
  "Identificacion",
  "Motivo/Discriminador",
  "Signos vitales",
  "Hallazgos criticos",
  "Antecedentes",
  "Subprotocolos",
  "Resultado",
];

export default function TriageWizard() {
  const form = useForm<TriageFormData>({
    resolver: zodResolver(wizardSchema) as unknown as Resolver<TriageFormData>,
    defaultValues: createDefaultFormData(),
    mode: "onChange",
  });

  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const values = form.watch();

  const liveResult = useMemo<TriageResult>(() => {
    try {
      const normalized = normalizeFormData(values);
      return runTriageEngine(normalized);
    } catch {
      return values.suggestedResult;
    }
  }, [values]);

  useEffect(() => {
    form.setValue("suggestedResult", liveResult, { shouldDirty: false });
  }, [liveResult, form]);

  const activeSubprotocols = liveResult.activatedSubprotocols;

  useEffect(() => {
    form.setValue("chiefComplaint.activatedSubprotocols", activeSubprotocols, { shouldDirty: true });

    if (activeSubprotocols.includes("TRAUMA") && !values.trauma) {
      form.setValue("trauma", defaultTrauma(), { shouldDirty: true });
    }
    if (activeSubprotocols.includes("BURNS") && !values.burns) {
      form.setValue("burns", defaultBurns(), { shouldDirty: true });
    }
    if (activeSubprotocols.includes("SEXUAL_VIOLENCE") && !values.sexualViolence) {
      form.setValue("sexualViolence", defaultSexualViolence(), { shouldDirty: true });
    }
    if (activeSubprotocols.includes("OBSTETRIC") && !values.obstetric) {
      form.setValue("obstetric", defaultObstetric(), { shouldDirty: true });
    }
    if (activeSubprotocols.includes("INTOXICATION") && !values.intoxication) {
      form.setValue("intoxication", defaultIntoxication(), { shouldDirty: true });
    }
    if (activeSubprotocols.includes("MENTAL_HEALTH") && !values.mentalHealth) {
      form.setValue("mentalHealth", defaultMentalHealth(), { shouldDirty: true });
    }
  }, [activeSubprotocols, form, values.burns, values.intoxication, values.mentalHealth, values.obstetric, values.sexualViolence, values.trauma]);

  const criticalParameters = useMemo<Record<string, "critical" | "alert" | "normal">>(() => {
    const output: Record<string, "critical" | "alert" | "normal"> = {};

    liveResult.criticalAlerts.forEach((alert) => {
      if (!alert.parameter) {
        return;
      }

      output[alert.parameter] =
        alert.severity === "immediate" || alert.severity === "critical" ? "critical" : "alert";
    });

    return output;
  }, [liveResult.criticalAlerts]);

  const completedIndexes = useMemo(() => {
    return Array.from({ length: activeStep }, (_, index) => index);
  }, [activeStep]);

  const goNext = async () => {
    if (activeStep >= steps.length - 1) {
      return;
    }

    const valid = await validateStep(activeStep, form);
    if (!valid) {
      setFeedback("Completa los campos obligatorios del paso actual.");
      return;
    }

    setFeedback(null);
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setFeedback(null);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const submitDecision = async (override?: { color: TriageResult["suggestedColor"]; reason: string }) => {
    setSaving(true);
    setFeedback(null);

    try {
      const snapshot = normalizeFormData(form.getValues());
      const now = new Date().toISOString();

      const auditEntry: TriageAuditEntry = {
        action: override ? "reclassified" : "confirmed",
        userId: snapshot.vitalSigns.takenBy,
        userName: "Profesional de triaje",
        timestamp: now,
        previousValue: snapshot.suggestedResult.suggestedColor,
        newValue: override?.color ?? snapshot.suggestedResult.suggestedColor,
        reason: override?.reason,
      };

      const payload: TriageFormData = {
        ...snapshot,
        suggestedResult: liveResult,
        confirmedBy: snapshot.vitalSigns.takenBy,
        confirmedAt: now,
        confirmedLevel: override?.color ?? liveResult.suggestedColor,
        reclassificationReason: override?.reason,
        auditTrail: [...snapshot.auditTrail, auditEntry],
      };

      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as { success?: boolean; triageId?: string; error?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "No se pudo guardar el triaje.");
      }

      setFeedback(`Triaje guardado correctamente. ID: ${json.triageId}`);
      form.setValue("auditTrail", payload.auditTrail, { shouldDirty: false });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Error inesperado al guardar triaje.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <Step1Identification />;
      case 1:
        return <Step2ChiefComplaint />;
      case 2:
        return (
          <Step3VitalSigns
            criticalParameters={criticalParameters}
            tentativePriority={liveResult.suggestedPriority}
          />
        );
      case 3:
        return <Step4CriticalFindings />;
      case 4:
        return <Step5History />;
      case 5:
        return <Step6Subprotocols activeSubprotocols={activeSubprotocols} />;
      case 6:
      default:
        return (
          <TriageResultView
            result={liveResult}
            saving={saving}
            onConfirm={() => submitDecision()}
            onReclassify={(color, reason) => submitDecision({ color, reason })}
            onPrint={() => window.print()}
          />
        );
    }
  };

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4 lg:self-start">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Flujo de triaje</h2>
          <ProgressStepper
            steps={steps}
            activeIndex={activeStep}
            completedIndexes={completedIndexes}
            onStepClick={(index) => setActiveStep(index)}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Subprotocolos activos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeSubprotocols.length === 0 ? (
                <span className="text-xs text-slate-500">Ninguno</span>
              ) : (
                activeSubprotocols.map((protocol) => (
                  <span
                    key={protocol}
                    className="rounded-full border border-sky-300 bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-900"
                  >
                    {protocol}
                  </span>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-xl border p-3"
            style={{
              borderColor: liveResult.assignedLevel.colorHex,
              backgroundColor: `${liveResult.assignedLevel.colorHex}20`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tentativo</p>
            <p className="text-sm font-bold text-slate-900">
              {liveResult.assignedLevel.color} | Prioridad {liveResult.suggestedPriority}
            </p>
            <p className="text-xs text-slate-700">Tiempo maximo: {liveResult.maxWaitMinutes} min</p>
          </div>
        </aside>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {renderStep()}

          {feedback ? (
            <p className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              {feedback}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={activeStep === 0 || saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Anterior
            </button>

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={saving}
                className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Siguiente
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </FormProvider>
  );
}

async function validateStep(step: number, form: ReturnType<typeof useForm<TriageFormData>>) {
  switch (step) {
    case 0:
      return form.trigger([
        "identification.firstName",
        "identification.lastName",
        "identification.age",
        "identification.ageUnit",
        "identification.sex",
      ]);
    case 1:
      return form.trigger(["chiefComplaint.chiefComplaintText", "chiefComplaint.discriminatorId"]);
    case 2:
      return form.trigger([
        "vitalSigns.heartRate",
        "vitalSigns.respiratoryRate",
        "vitalSigns.systolicBP",
        "vitalSigns.spo2",
        "vitalSigns.temperature",
        "vitalSigns.glasgowTotal",
      ]);
    default:
      return true;
  }
}

function normalizeFormData(value: TriageFormData): TriageFormData {
  return {
    ...value,
    suggestedResult: value.suggestedResult,
    chiefComplaint: {
      ...value.chiefComplaint,
      activatedSubprotocols: (value.chiefComplaint.activatedSubprotocols ?? []) as SubprotocolType[],
    },
    auditTrail: value.auditTrail ?? [],
  };
}

function createDefaultFormData(): TriageFormData {
  const now = new Date().toISOString();
  const result = createPlaceholderResult();

  return {
    identification: {
      firstName: "",
      lastName: "",
      birthDate: "",
      age: 18,
      ageUnit: "years",
      isPediatric: false,
      isObstetric: false,
      sex: "M",
      arrivalMode: "walking",
      arrivalTime: now,
      isCompanied: false,
      consciousOnArrival: true,
      canCommunicate: true,
    },
    chiefComplaint: {
      chiefComplaintText: "",
      onsetTime: "",
      onsetUnit: "hours",
      discriminatorId: "",
      discriminatorLabel: "",
      basePriority: 3,
      activatedSubprotocols: [],
    },
    vitalSigns: {
      takenAt: now,
      takenBy: "triage-nurse-1",
      criticalFlags: [],
    },
    criticalFindings: {
      airwayCompromised: false,
      stridor: false,
      apnea: false,
      foreignBody: false,
      severeRespiratoryDistress: false,
      cyanosis: false,
      accessoryMuscleUse: false,
      uncontrolledBleeding: false,
      shockSigns: false,
      alteredConsciousness: false,
      seizureActive: false,
      focalNeurologicDeficit: false,
      severePainUncontrolled: false,
      anaphylaxis: false,
      sepsisSigns: false,
      strokeSigns: false,
      acuteChestPain: false,
      pregnancyComplications: false,
    },
    history: {
      symptomDuration: "",
      symptomProgression: "stable",
      previousTreatmentAttempted: false,
      knownAllergies: false,
      currentMedications: false,
      relevantChronicConditions: [],
      immunocompromised: false,
      anticoagulated: false,
      recentSurgery: false,
      recentDischarge: false,
    },
    suggestedResult: result,
    auditTrail: [
      {
        action: "created",
        userId: "triage-nurse-1",
        userName: "Profesional de triaje",
        timestamp: now,
      },
    ],
  };
}

function createPlaceholderResult(): TriageResult {
  const now = new Date().toISOString();

  return {
    assignedLevel: {
      color: "GREEN",
      priority: 4,
      label: "Menos urgente",
      maxWaitMinutes: 120,
      colorHex: "#16a34a",
    },
    suggestedColor: "GREEN",
    suggestedPriority: 4,
    maxWaitMinutes: 120,
    prioritySource: "discriminator",
    activatedSubprotocols: [],
    clinicalReasons: [],
    criticalAlerts: [],
    immediateActions: [],
    missingCriticalData: [],
    calculatedScores: {},
    codePurple: false,
    mandatoryNotification: false,
    legalDocumentationRequired: false,
    generatedAt: now,
    triageNurseId: "triage-nurse-1",
    triageSessionId: `triage-${Date.now()}`,
  };
}

function defaultTrauma(): TraumaData {
  return {
    mechanism: "other",
    lossOfConsciousness: false,
    headTrauma: false,
    cervicalPain: false,
    chestTrauma: false,
    chestPain: false,
    abdominalTrauma: false,
    abdominalPain: false,
    pelvicTrauma: false,
    spineTrauma: false,
    penetratingWound: false,
    amputation: false,
    evisceration: false,
    uncontrolledHemorrhage: false,
    suspectedSpinalInjury: false,
    severeHeadTrauma: false,
    multipleMajorFractures: false,
    neurovascularCompromise: false,
    deformity: false,
    openFracture: false,
    traumaticBrainInjurySigns: false,
    isPolitrauma: false,
  };
}

function defaultBurns(): BurnData {
  return {
    burnType: [],
    tbsaPercent: 0,
    burnMethod: "rule_of_9",
    depth: [],
    faceInvolved: false,
    handsInvolved: false,
    feetInvolved: false,
    genitalsInvolved: false,
    jointsInvolved: false,
    circumferentialBurn: false,
    airwayBurn: false,
    inhalationInjury: false,
    closedSpaceExposure: false,
    isElectrical: false,
    isChemical: false,
    associatedTrauma: false,
    isPediatric: false,
    patientAge: 18,
    hemodynamicInstability: false,
  };
}

function defaultSexualViolence(): SexualViolenceData {
  return {
    codePurpleActivated: true as const,
    hoursSinceEvent: 0,
    exactTimeKnown: false,
    activeBleeding: false,
    visibleInjuries: false,
    possiblePregnancy: false,
    isMinor: false,
    hadBathOrShower: false,
    hadClothingChange: false,
    emotionalCrisis: false,
    dissociativeState: false,
    suicidalIdeation: false,
    requiresPrivateSpace: true,
    prefersFemaleStaff: false,
  };
}

function defaultObstetric(): ObstetricData {
  return {
    isPuerperium: false,
    activeLabor: false,
    memoraneRupture: false,
    vaginalBleeding: false,
    abdominalPain: false,
    eclampsia: false,
    severePreeclampsia: false,
    placentaPrevia: false,
    abruptionSigns: false,
    prolapsedCord: false,
    fetalDistress: false,
    ectopicSigns: false,
    headache: false,
    visualDisturbances: false,
    epigastricPain: false,
    decreasedFetalMovement: false,
    hemorrhagiaPostpartum: false,
    infectionSigns: false,
    thrombosisRisk: false,
  };
}

function defaultIntoxication(): IntoxicationData {
  return {
    substanceType: [],
    routeOfExposure: [],
    intentional: false,
    alteredConsciousness: false,
    seizures: false,
    severeVomiting: false,
    oralBurns: false,
    bronchospasm: false,
    bradycardia: false,
    arrhythmia: false,
    miosis: false,
    mydriasis: false,
    salivation: false,
    lacrimation: false,
    urinaryIncontinence: false,
    defecation: false,
    muscleParalysis: false,
  };
}

function defaultMentalHealth(): MentalHealthData {
  return {
    presentationType: [],
    activeSuicidalIdeation: false,
    specificPlan: false,
    accessToMeans: false,
    priorAttempts: false,
    recentAttempt: false,
    violentBehavior: false,
    riskToOthers: false,
    substanceInfluence: false,
    knownPsychiatricDiagnosis: false,
    psychiatricMedicationStopped: false,
    requiresContainment: false,
    requiresSecurityAlert: false,
  };
}
