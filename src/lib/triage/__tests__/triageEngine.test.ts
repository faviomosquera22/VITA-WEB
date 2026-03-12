import assert from "node:assert/strict";
import test from "node:test";

import { runTriageEngine } from "@/lib/triage/engine/triageEngine";
import type { TriageFormData, TriageResult } from "@/lib/triage/triageTypes";

const defaultResult: TriageResult = {
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
  generatedAt: new Date().toISOString(),
  triageNurseId: "nurse-1",
  triageSessionId: "session-1",
};

function baseForm(): TriageFormData {
  return {
    identification: {
      firstName: "Paciente",
      lastName: "Demo",
      birthDate: "1990-01-01",
      age: 36,
      ageUnit: "years",
      isPediatric: false,
      isObstetric: false,
      sex: "M",
      arrivalMode: "walking",
      arrivalTime: new Date().toISOString(),
      isCompanied: false,
      consciousOnArrival: true,
      canCommunicate: true,
    },
    chiefComplaint: {
      chiefComplaintText: "tos",
      onsetTime: "2",
      onsetUnit: "hours",
      discriminatorId: "fever",
      discriminatorLabel: "Fiebre",
      basePriority: 3,
      activatedSubprotocols: [],
    },
    vitalSigns: {
      takenAt: new Date().toISOString(),
      takenBy: "nurse-1",
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 84,
      respiratoryRate: 18,
      temperature: 37,
      spo2: 98,
      glasgowTotal: 15,
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
      symptomDuration: "2h",
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
    suggestedResult: defaultResult,
    auditTrail: [],
  };
}

test("SpO2 85 + discriminador tos => prioridad I por vitales", () => {
  const form = baseForm();
  form.vitalSigns.spo2 = 85;

  const result = runTriageEngine(form);
  assert.equal(result.suggestedPriority, 1);
  assert.equal(result.prioritySource, "vital_signs");
});

test("Trauma con herida penetrante => prioridad I", () => {
  const form = baseForm();
  form.chiefComplaint.discriminatorId = "trauma_mva";
  form.chiefComplaint.discriminatorLabel = "Trauma";
  form.chiefComplaint.activatedSubprotocols = ["TRAUMA"];
  form.trauma = {
    mechanism: "penetrating",
    lossOfConsciousness: false,
    headTrauma: false,
    cervicalPain: false,
    chestTrauma: false,
    chestPain: false,
    abdominalTrauma: false,
    abdominalPain: false,
    pelvicTrauma: false,
    spineTrauma: false,
    penetratingWound: true,
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

  const result = runTriageEngine(form);
  assert.equal(result.suggestedPriority, 1);
});

test("Violencia sexual => minimo prioridad II y codePurple", () => {
  const form = baseForm();
  form.chiefComplaint.discriminatorId = "sexual_violence";
  form.chiefComplaint.discriminatorLabel = "Violencia sexual";
  form.chiefComplaint.activatedSubprotocols = ["SEXUAL_VIOLENCE"];
  form.sexualViolence = {
    codePurpleActivated: true,
    hoursSinceEvent: 20,
    exactTimeKnown: true,
    activeBleeding: false,
    visibleInjuries: false,
    possiblePregnancy: true,
    isMinor: false,
    hadBathOrShower: false,
    hadClothingChange: false,
    emotionalCrisis: true,
    dissociativeState: false,
    suicidalIdeation: false,
    requiresPrivateSpace: true,
    prefersFemaleStaff: false,
  };

  const result = runTriageEngine(form);
  assert.ok(result.suggestedPriority <= 2);
  assert.equal(result.codePurple, true);
});

test("Embarazada con eclampsia => prioridad I + sulfato de magnesio", () => {
  const form = baseForm();
  form.identification.sex = "F";
  form.identification.isObstetric = true;
  form.chiefComplaint.discriminatorId = "obstetric_emergency";
  form.chiefComplaint.activatedSubprotocols = ["OBSTETRIC"];
  form.obstetric = {
    isPuerperium: false,
    activeLabor: false,
    memoraneRupture: false,
    vaginalBleeding: false,
    abdominalPain: false,
    eclampsia: true,
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

  const result = runTriageEngine(form);
  assert.equal(result.suggestedPriority, 1);
  assert.ok(result.immediateActions.some((action) => action.action.includes("sulfato de magnesio")));
});

test("Quemadura 25% SCT sin via aerea => prioridad I por extension", () => {
  const form = baseForm();
  form.chiefComplaint.discriminatorId = "burn_injury";
  form.chiefComplaint.discriminatorLabel = "Quemadura";
  form.chiefComplaint.activatedSubprotocols = ["BURNS"];
  form.burns = {
    burnType: ["flame"],
    tbsaPercent: 25,
    burnMethod: "rule_of_9",
    depth: ["partial_deep"],
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
    patientAge: 25,
    hemodynamicInstability: false,
  };

  const result = runTriageEngine(form);
  assert.equal(result.suggestedPriority, 1);
});

test("Pediatrico 6 meses FC 180 => usa tabla pediatrica", () => {
  const form = baseForm();
  form.identification.age = 6;
  form.identification.ageUnit = "months";
  form.identification.isPediatric = true;
  form.vitalSigns.heartRate = 180;

  const result = runTriageEngine(form);
  assert.equal(result.suggestedPriority, 2);
});

test("Intoxicacion organofosforados con miosis + salivacion => prioridad I", () => {
  const form = baseForm();
  form.chiefComplaint.discriminatorId = "intoxication";
  form.chiefComplaint.activatedSubprotocols = ["INTOXICATION"];
  form.intoxication = {
    substanceType: ["pesticide"],
    routeOfExposure: ["ingested"],
    intentional: false,
    alteredConsciousness: false,
    seizures: false,
    severeVomiting: false,
    oralBurns: false,
    bronchospasm: false,
    bradycardia: false,
    arrhythmia: false,
    miosis: true,
    mydriasis: false,
    salivation: true,
    lacrimation: false,
    urinaryIncontinence: false,
    defecation: false,
    muscleParalysis: false,
  };

  const result = runTriageEngine(form);
  assert.equal(result.suggestedPriority, 1);
});

test("Ideacion suicida con plan especifico => prioridad II minimo", () => {
  const form = baseForm();
  form.chiefComplaint.discriminatorId = "mental_health_crisis";
  form.chiefComplaint.activatedSubprotocols = ["MENTAL_HEALTH"];
  form.mentalHealth = {
    presentationType: ["suicidal_ideation"],
    activeSuicidalIdeation: true,
    specificPlan: true,
    accessToMeans: true,
    priorAttempts: false,
    recentAttempt: false,
    violentBehavior: false,
    riskToOthers: false,
    substanceInfluence: false,
    knownPsychiatricDiagnosis: true,
    psychiatricMedicationStopped: false,
    requiresContainment: true,
    requiresSecurityAlert: false,
  };

  const result = runTriageEngine(form);
  assert.ok(result.suggestedPriority <= 2);
});
