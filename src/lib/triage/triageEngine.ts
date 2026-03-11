import triageConfigJson from "./triage-config.json";
import { evaluateAdultVitalRules } from "./adultVitalRules";
import { evaluateBaseTriageRules } from "./baseTriageRules";
import { evaluateBurnRules } from "./burnRules";
import { evaluateIntoxicationRules } from "./intoxicationRules";
import { evaluateMentalHealthRules } from "./mentalHealthRules";
import { evaluateObstetricRules } from "./obstetricRules";
import { evaluatePediatricVitalRules } from "./pediatricVitalRules";
import { evaluateSexualViolenceRules } from "./sexualViolenceRules";
import { evaluateTraumaRules } from "./traumaRules";
import {
  getColorByPriority,
  getPriorityLabel,
  getWaitMinutesByPriority,
  highestPriority,
  normalizeText,
  toUniqueList,
  type TriageConfig,
  type TriageEngineResult,
  type TriageInput,
  type TriageRuleResult,
  type TriageSubprotocolId,
  type TriageVitalsInput,
} from "./triageTypes";

const triageConfig = triageConfigJson as TriageConfig;

const protocolKeywords: Record<TriageSubprotocolId, string[]> = {
  trauma: ["trauma", "accidente", "fractura", "caida", "golpe", "herida"],
  quemaduras: ["quemadura", "fuego", "escaldadura", "electrica", "quimica"],
  violencia_sexual: ["violencia sexual", "abuso sexual", "agresion sexual"],
  obstetrico: ["embarazo", "gestante", "parto", "obstetrico", "sangrado vaginal"],
  intoxicaciones: ["intoxicacion", "sobredosis", "envenenamiento", "sustancia"],
  salud_mental: ["agitacion", "suicidio", "autolesion", "psiquiatrico", "crisis emocional"],
};

export function runTriageEngine(input: TriageInput): TriageEngineResult {
  const activeProtocols = detectAutomaticProtocols(input);
  const candidates: TriageRuleResult[] = [];

  const base = evaluateBaseTriageRules(input);
  if (base) {
    candidates.push(base);
  }

  const pediatricVitals = evaluatePediatricVitalRules(input, triageConfig);
  if (pediatricVitals) {
    candidates.push(pediatricVitals);
  } else {
    const adultVitals = evaluateAdultVitalRules(input, triageConfig);
    if (adultVitals) {
      candidates.push(adultVitals);
    }
  }

  if (activeProtocols.includes("trauma")) {
    const trauma = evaluateTraumaRules(input);
    if (trauma) {
      candidates.push(trauma);
    }
  }

  if (activeProtocols.includes("quemaduras")) {
    const burn = evaluateBurnRules(input, triageConfig);
    if (burn) {
      candidates.push(burn);
    }
  }

  if (activeProtocols.includes("violencia_sexual")) {
    const sexualViolence = evaluateSexualViolenceRules(input, triageConfig);
    if (sexualViolence) {
      candidates.push(sexualViolence);
    }
  }

  if (activeProtocols.includes("obstetrico")) {
    const obstetric = evaluateObstetricRules(input, triageConfig);
    if (obstetric) {
      candidates.push(obstetric);
    }
  }

  if (activeProtocols.includes("intoxicaciones")) {
    const intoxication = evaluateIntoxicationRules(input, triageConfig);
    if (intoxication) {
      candidates.push(intoxication);
    }
  }

  if (activeProtocols.includes("salud_mental")) {
    const mental = evaluateMentalHealthRules(input);
    if (mental) {
      candidates.push(mental);
    }
  }

  if (candidates.length === 0) {
    candidates.push({
      source: "base",
      priority: 4,
      reasons: ["Sin criterios de riesgo alto; continuar flujo clinico habitual."],
      alerts: [],
      immediateActions: ["Mantener observacion y completar datos faltantes."],
    });
  }

  const finalPriority = highestPriority(candidates.map((item) => item.priority));
  const finalColor = getColorByPriority(finalPriority);
  const maxWaitMinutes = getWaitMinutesByPriority(finalPriority, triageConfig);

  const missingData = toUniqueList([
    ...collectCoreMissingData(input),
    ...candidates.flatMap((item) => item.missingData ?? []),
  ]);

  const protocolsActivated = toUniqueList([
    ...activeProtocols,
    ...candidates.flatMap((item) => item.activatedProtocols ?? []),
  ]) as TriageSubprotocolId[];

  return {
    suggestedColor: finalColor,
    priority: finalPriority,
    priorityLabel: getPriorityLabel(finalPriority),
    maxWaitMinutes,
    reasons: toUniqueList(candidates.flatMap((item) => item.reasons)),
    protocolsActivated,
    alerts: toUniqueList(candidates.flatMap((item) => item.alerts)),
    immediateActions: toUniqueList(candidates.flatMap((item) => item.immediateActions)),
    missingData,
    candidates,
  };
}

export function detectAutomaticProtocols(input: TriageInput): TriageSubprotocolId[] {
  const reasonText = normalizeText(
    `${input.complaint.reason} ${input.complaint.discriminator} ${input.complaint.discriminatorTags.join(" ")}`
  );

  const activated = new Set<TriageSubprotocolId>();

  (Object.keys(protocolKeywords) as TriageSubprotocolId[]).forEach((protocolId) => {
    if (protocolKeywords[protocolId].some((keyword) => reasonText.includes(keyword))) {
      activated.add(protocolId);
    }
  });

  if (hasTraumaSignals(input)) {
    activated.add("trauma");
  }

  if (hasBurnSignals(input)) {
    activated.add("quemaduras");
  }

  if (hasSexualViolenceSignals(input)) {
    activated.add("violencia_sexual");
  }

  if (hasObstetricSignals(input)) {
    activated.add("obstetrico");
  }

  if (hasIntoxicationSignals(input)) {
    activated.add("intoxicaciones");
  }

  if (hasMentalHealthSignals(input)) {
    activated.add("salud_mental");
  }

  return Array.from(activated);
}

export function getCriticalVitalFlags(
  input: Pick<TriageInput, "identification" | "vitals">
): Partial<Record<keyof TriageVitalsInput, boolean>> {
  const flags: Partial<Record<keyof TriageVitalsInput, boolean>> = {};
  const age = input.identification.ageYears;

  if (age !== null && age <= 15) {
    const band = triageConfig.pediatricVitals.find(
      (item) => age >= item.minAgeInclusive && age <= item.maxAgeInclusive
    );

    if (band) {
      flags.heartRate =
        input.vitals.heartRate !== null && input.vitals.heartRate > band.criticalHeartRateHigh;
      flags.respiratoryRate =
        input.vitals.respiratoryRate !== null &&
        input.vitals.respiratoryRate > band.criticalRespiratoryRateHigh;
      flags.systolicBp =
        input.vitals.systolicBp !== null && input.vitals.systolicBp < band.criticalSystolicBpLow;
      flags.spo2 = input.vitals.spo2 !== null && input.vitals.spo2 < 92;
    }

    return flags;
  }

  flags.spo2 =
    input.vitals.spo2 !== null && input.vitals.spo2 < triageConfig.adultVitals.criticalSpo2;

  flags.systolicBp =
    input.vitals.systolicBp !== null &&
    (input.vitals.systolicBp < triageConfig.adultVitals.criticalSystolicBpLow ||
      input.vitals.systolicBp > triageConfig.adultVitals.criticalSystolicBpHigh);

  flags.heartRate =
    input.vitals.heartRate !== null &&
    (input.vitals.heartRate < triageConfig.adultVitals.criticalHeartRateLow ||
      input.vitals.heartRate > triageConfig.adultVitals.criticalHeartRateHigh);

  flags.respiratoryRate =
    input.vitals.respiratoryRate !== null &&
    (input.vitals.respiratoryRate < triageConfig.adultVitals.criticalRespiratoryRateLow ||
      input.vitals.respiratoryRate > triageConfig.adultVitals.criticalRespiratoryRateHigh);

  flags.temperatureC =
    input.vitals.temperatureC !== null &&
    input.vitals.temperatureC >= triageConfig.adultVitals.warningTemperatureHigh;

  return flags;
}

function collectCoreMissingData(input: TriageInput) {
  const missing: string[] = [];

  if (!input.identification.patientName.trim()) {
    missing.push("Nombre del paciente");
  }
  if (!input.identification.documentNumber.trim()) {
    missing.push("Documento de identificacion");
  }
  if (input.identification.ageYears === null) {
    missing.push("Edad");
  }

  if (!input.complaint.reason.trim()) {
    missing.push("Motivo de consulta");
  }
  if (!input.complaint.discriminator.trim()) {
    missing.push("Discriminador principal");
  }

  if (input.vitals.systolicBp === null) {
    missing.push("PA sistolica");
  }
  if (input.vitals.heartRate === null) {
    missing.push("Frecuencia cardiaca");
  }
  if (input.vitals.respiratoryRate === null) {
    missing.push("Frecuencia respiratoria");
  }
  if (input.vitals.spo2 === null) {
    missing.push("SpO2");
  }

  if (!input.clinicalHistory.currentIllnessSummary.trim()) {
    missing.push("Resumen de enfermedad actual");
  }

  return missing;
}

function hasTraumaSignals(input: TriageInput) {
  const trauma = input.protocolInputs.trauma;

  return Boolean(
    trauma.enabled ||
    trauma.mechanism.trim() ||
      trauma.lossOfConsciousness ||
      trauma.activeBleeding ||
      trauma.deformity ||
      trauma.polytrauma ||
      trauma.penetratingWound ||
      trauma.amputation ||
      trauma.evisceration ||
      trauma.uncontrolledBleeding ||
      trauma.suspectedSpinalCordInjury ||
      trauma.severeTbi ||
      trauma.multipleMajorFractures ||
      trauma.neurovascularCompromise
  );
}

function hasBurnSignals(input: TriageInput) {
  const burn = input.protocolInputs.quemaduras;

  return Boolean(
    burn.enabled ||
    burn.burnType ||
      burn.bodySurfacePercent !== null ||
      burn.airwayCompromise ||
      burn.closedSpaceFire ||
      burn.specialRegion ||
      burn.circumferential
  );
}

function hasSexualViolenceSignals(input: TriageInput) {
  const item = input.protocolInputs.violenciaSexual;

  return Boolean(
    item.enabled ||
    item.timeSinceEventHours !== null ||
      item.bleeding ||
      item.lesions ||
      item.possiblePregnancy ||
      item.minor ||
      item.showeredOrChangedClothes ||
      item.emotionalCrisis
  );
}

function hasObstetricSignals(input: TriageInput) {
  const item = input.protocolInputs.obstetrico;

  return Boolean(
    item.enabled ||
    input.identification.possiblePregnancy ||
      (item.gestationalWeeks !== null && item.gestationalWeeks > 0) ||
      item.vaginalBleeding ||
      item.severeAbdominalPain ||
      item.contractions ||
      item.decreasedFetalMovements ||
      item.postpartumHemorrhage
  );
}

function hasIntoxicationSignals(input: TriageInput) {
  const item = input.protocolInputs.intoxicaciones;

  return Boolean(
    item.enabled ||
    item.suspectedSubstance.trim() ||
      item.ingestionTimeHours !== null ||
      item.alteredConsciousness ||
      item.respiratoryDepression ||
      item.seizures ||
      item.hemodynamicInstability ||
      item.suicidalIntent
  );
}

function hasMentalHealthSignals(input: TriageInput) {
  const item = input.protocolInputs.saludMental;

  return Boolean(
    item.enabled ||
    item.severeAgitation ||
      item.suicideRisk ||
      item.suicidePlan ||
      item.violentBehavior ||
      item.hallucinations ||
      item.intoxicationAssociated ||
      item.selfHarmInjury
  );
}
