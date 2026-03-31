import type { PatientRecord } from "@/app/portal/professional/_data/clinical-mock-data";

export type BundleComponentCode = "A" | "B" | "C" | "D" | "E" | "F";
export type BundleApplicability = "aplica" | "no_aplica" | "contraindicado_temporalmente";
export type BundleClosureType = "turno" | "dia";
export type BundleAlertSeverity = "soft" | "priority" | "relevant";
export type BundleCardTone = "success" | "warning" | "critical" | "muted";

export type BundlePainEntry = {
  id: string;
  recordedAt: string;
  painScaleName: string;
  painLocation: string;
  painIntensity: number;
  interventionPerformed: string;
  analgesiaIndicated: string;
  analgesiaAdministered: string;
  response: string;
  observations: string;
  professional: string;
};

export type BundleSatSbtEntry = {
  id: string;
  recordedAt: string;
  onMechanicalVentilation: boolean;
  satCandidate: boolean | null;
  satExclusionReason: string;
  satPerformed: boolean | null;
  satResult: string;
  sbtCandidate: boolean | null;
  sbtExclusionReason: string;
  sbtPerformed: boolean | null;
  sbtResult: string;
  observations: string;
  professional: string;
};

export type BundleSedationEntry = {
  id: string;
  recordedAt: string;
  relatedMedications: string[];
  sedationGoal: string;
  sedationScale: string;
  currentLevel: string;
  comparisonToGoal: string;
  observations: string;
  professional: string;
};

export type BundleDeliriumEntry = {
  id: string;
  recordedAt: string;
  screeningPerformed: boolean;
  instrument: string;
  result: string;
  riskFactors: string[];
  nonPharmacologicMeasures: string[];
  observations: string;
  nextReevaluationAt: string;
  professional: string;
};

export type BundleMobilityEntry = {
  id: string;
  recordedAt: string;
  dailyStatus: "Realizada" | "Pendiente";
  mobilityLevel: string;
  mobilityType: "Basica" | "Progresiva";
  responsibleProfessional: string;
  tolerance: string;
  barriers: string;
  observations: string;
  professional: string;
};

export type BundleFamilyEntry = {
  id: string;
  recordedAt: string;
  familyContact: string;
  communicationPerformed: boolean;
  educationProvided: string;
  participationInDecisions: string;
  observations: string;
  professional: string;
};

export type BundleClosureRecord = {
  id: string;
  recordedAt: string;
  closureType: BundleClosureType;
  professional: string;
  completedSections: BundleComponentCode[];
  pendingSections: BundleComponentCode[];
  validationNotes: string[];
  summary: string;
};

type BundleSection<TEntry> = {
  applicability: BundleApplicability;
  applicabilityReason: string;
  entries: TEntry[];
};

export type BundleAbcdefState = {
  patientId: string;
  createdAt: string;
  updatedAt: string;
  sections: {
    A: BundleSection<BundlePainEntry>;
    B: BundleSection<BundleSatSbtEntry>;
    C: BundleSection<BundleSedationEntry>;
    D: BundleSection<BundleDeliriumEntry>;
    E: BundleSection<BundleMobilityEntry>;
    F: BundleSection<BundleFamilyEntry>;
  };
  closures: BundleClosureRecord[];
};

export type BundleSummaryCard = {
  code: BundleComponentCode;
  title: string;
  tone: BundleCardTone;
  stateLabel: string;
  lastRecordedAt: string | null;
  appliesLabel: string;
  complete: boolean;
  overdue: boolean;
  relevantFinding: string | null;
};

export type BundleSmartAlert = {
  id: string;
  severity: BundleAlertSeverity;
  code: BundleComponentCode;
  title: string;
  detail: string;
};

export type BundleDashboard = {
  completionPercent: number;
  completedCount: number;
  applicableCount: number;
  cards: Record<BundleComponentCode, BundleSummaryCard>;
  alerts: BundleSmartAlert[];
  metrics: Array<{ code: BundleComponentCode; label: string; complete: boolean }>;
};

export type BundleClosureSnapshot = {
  completedSections: BundleComponentCode[];
  pendingSections: BundleComponentCode[];
  validationNotes: string[];
  summary: string;
};

export const bundleComponentMeta: Record<
  BundleComponentCode,
  { title: string; shortTitle: string; description: string }
> = {
  A: {
    title: "Dolor",
    shortTitle: "Dolor",
    description: "Assess, Prevent, and Manage Pain",
  },
  B: {
    title: "SAT / SBT",
    shortTitle: "SAT/SBT",
    description: "Spontaneous Awakening and Breathing Trials",
  },
  C: {
    title: "Analgesia y sedacion",
    shortTitle: "Sedacion",
    description: "Choice of Analgesia and Sedation",
  },
  D: {
    title: "Delirio",
    shortTitle: "Delirio",
    description: "Assess, Prevent, and Manage Delirium",
  },
  E: {
    title: "Movilizacion",
    shortTitle: "Movilizacion",
    description: "Early Mobility and Exercise",
  },
  F: {
    title: "Familia",
    shortTitle: "Familia",
    description: "Family Engagement and Empowerment",
  },
};

const reminderWindowsHours = {
  A: 8,
  B: 12,
  C: 12,
  D: 12,
  E: 24,
  F: 24,
} satisfies Record<BundleComponentCode, number>;

const criticalWindowsHours = {
  A: 12,
  B: 18,
  C: 18,
  D: 18,
  E: 30,
  F: 36,
} satisfies Record<BundleComponentCode, number>;

const analgesiaSedationKeywords = [
  "morf",
  "fentan",
  "propof",
  "dexmed",
  "midazol",
  "ketamin",
  "tramadol",
  "diazep",
  "lorazep",
  "clonazep",
  "haloperidol",
  "quetiap",
  "analges",
  "sed",
];

const familySupportKeywords = ["hijo", "hija", "esposa", "esposo", "madre", "padre", "hermano", "familiar"];

export function createInitialBundleState(
  patient: PatientRecord,
  professional: string,
  referenceDate = new Date()
): BundleAbcdefState {
  const ventilationActive = getMechanicalVentilationStatus(patient);
  const defaultProfessional = professional.trim() || patient.assignedProfessional;
  const familyContact = patient.personalData.emergencyContact || "Sin contacto identificado";
  const relatedMedicationNames = getRelatedAnalgesiaSedationMedications(patient);

  const baseState: BundleAbcdefState = {
    patientId: patient.id,
    createdAt: referenceDate.toISOString(),
    updatedAt: referenceDate.toISOString(),
    sections: {
      A: {
        applicability: patient.careMode === "Hospitalizacion" ? "aplica" : "no_aplica",
        applicabilityReason:
          patient.careMode === "Hospitalizacion" ? "" : "Paciente sin necesidad de bundle critico en este episodio.",
        entries: patient.careMode === "Hospitalizacion"
          ? [
              {
                id: createBundleId("A"),
                recordedAt: hoursAgo(referenceDate, patient.currentStatus === "Critico" ? 3 : 5),
                painScaleName: "EVA",
                painLocation: inferPainLocation(patient),
                painIntensity: patient.vitalSigns[0]?.painScale ?? 2,
                interventionPerformed:
                  (patient.vitalSigns[0]?.painScale ?? 0) >= 4
                    ? "Reevaluacion, posicion terapeutica y analgesia segun indicacion."
                    : "Vigilancia y medidas de confort.",
                analgesiaIndicated: patient.medicationRecords[0]?.name ?? "Pendiente confirmar analgesia activa",
                analgesiaAdministered:
                  patient.medicationRecords.find((record) => record.administrationStatus === "Administrado")?.name ??
                  "",
                response:
                  (patient.vitalSigns[0]?.painScale ?? 0) >= 4
                    ? "Dolor en descenso posterior a intervencion."
                    : "Confort aceptable.",
                observations: patient.summary.latestNursingReport,
                professional: defaultProfessional,
              },
            ]
          : [],
      },
      B: {
        applicability: ventilationActive ? "aplica" : "no_aplica",
        applicabilityReason: ventilationActive ? "" : "Paciente sin ventilacion mecanica activa en este momento.",
        entries: ventilationActive
          ? [
              {
                id: createBundleId("B"),
                recordedAt: hoursAgo(referenceDate, 6),
                onMechanicalVentilation: true,
                satCandidate: true,
                satExclusionReason: "",
                satPerformed: true,
                satResult: "Tolero SAT parcial sin agitacion clinicamente significativa.",
                sbtCandidate: true,
                sbtExclusionReason: "",
                sbtPerformed: false,
                sbtResult: "Pendiente coordinacion con terapia respiratoria.",
                observations: "Revisar siguiente ventana del turno.",
                professional: defaultProfessional,
              },
            ]
          : [],
      },
      C: {
        applicability:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? "aplica"
            : "no_aplica",
        applicabilityReason:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? ""
            : "Paciente fuera de cuidado critico u observacion hospitalaria.",
        entries:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? [
                {
                  id: createBundleId("C"),
                  recordedAt: hoursAgo(referenceDate, patient.id === "p-005" ? 14 : 4),
                  relatedMedications: relatedMedicationNames,
                  sedationGoal:
                    patient.id === "p-005"
                      ? ""
                      : patient.currentStatus === "Critico"
                        ? "RASS 0 a -1, paciente confortable y colaboradora."
                        : "Confort clinico sin sobresedacion.",
                  sedationScale: "RASS",
                  currentLevel: patient.currentStatus === "Critico" ? "0" : "0 / despierto",
                  comparisonToGoal: patient.id === "p-005" ? "Meta no documentada" : "En meta",
                  observations:
                    relatedMedicationNames.length > 0
                      ? "Revisar correlacion entre analgesia activa, confort y nivel de sedacion."
                      : "Sin analgesicos o sedantes criticos detectados en la medicacion activa.",
                  professional: defaultProfessional,
                },
              ]
            : [],
      },
      D: {
        applicability:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? "aplica"
            : "no_aplica",
        applicabilityReason:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? ""
            : "Seguimiento de delirio no prioritario en este episodio ambulatorio.",
        entries:
          patient.id === "p-002"
            ? [
                {
                  id: createBundleId("D"),
                  recordedAt: hoursAgo(referenceDate, 4),
                  screeningPerformed: true,
                  instrument: "CAM-ICU",
                  result: "Negativo",
                  riskFactors: ["Sueno fragmentado", "Hospitalizacion reciente"],
                  nonPharmacologicMeasures: ["Reorientacion", "Control de sueno"],
                  observations: "Paciente orientado y cooperador.",
                  nextReevaluationAt: hoursAhead(referenceDate, 8),
                  professional: defaultProfessional,
                },
              ]
            : [],
      },
      E: {
        applicability: patient.careMode === "Hospitalizacion" ? "aplica" : "no_aplica",
        applicabilityReason:
          patient.careMode === "Hospitalizacion" ? "" : "Fuera de hospitalizacion u observacion activa.",
        entries: patient.careMode === "Hospitalizacion"
          ? [
              {
                id: createBundleId("E"),
                recordedAt: hoursAgo(referenceDate, patient.id === "p-001" ? 7 : 5),
                dailyStatus: "Realizada",
                mobilityLevel:
                  patient.id === "p-001"
                    ? "Sedestacion y cambios posturales asistidos"
                    : "Marcha corta supervisada",
                mobilityType: patient.id === "p-001" ? "Basica" : "Progresiva",
                responsibleProfessional: defaultProfessional,
                tolerance: patient.id === "p-001" ? "Adecuada con apoyo" : "Buena tolerancia",
                barriers: patient.id === "p-001" ? "Monitoreo continuo" : "",
                observations:
                  patient.id === "p-001"
                    ? "Movilizacion con vigilancia hemodinamica."
                    : "Se progreso sin disnea marcada ni mareo.",
                professional: defaultProfessional,
              },
            ]
          : [],
      },
      F: {
        applicability:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? "aplica"
            : "no_aplica",
        applicabilityReason:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? ""
            : "No requiere seguimiento familiar estructurado de bundle en este contexto.",
        entries:
          patient.careMode === "Hospitalizacion" || patient.currentStatus === "Critico"
            ? [
                {
                  id: createBundleId("F"),
                  recordedAt: hoursAgo(referenceDate, patient.id === "p-001" ? 28 : 6),
                  familyContact,
                  communicationPerformed: true,
                  educationProvided:
                    patient.id === "p-001"
                      ? "Explicacion de vigilancia cardiometabolica y signos de alarma."
                      : "Actualizacion de evolucion y plan inmediato del turno.",
                  participationInDecisions:
                    patient.id === "p-001" ? "Familia informada sobre plan de vigilancia." : "Participacion documentada.",
                  observations:
                    patient.id === "p-001"
                      ? "Pendiente nueva actualizacion durante la tarde."
                      : "Canal de comunicacion activo con familiar responsable.",
                  professional: defaultProfessional,
                },
              ]
            : [],
      },
    },
    closures: [],
  };

  return baseState;
}

export function buildBundleDashboard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate = new Date()
): BundleDashboard {
  const cards = {
    A: summarizePainCard(state, patient, referenceDate),
    B: summarizeSatSbtCard(state, patient, referenceDate),
    C: summarizeSedationCard(state, patient, referenceDate),
    D: summarizeDeliriumCard(state, patient, referenceDate),
    E: summarizeMobilityCard(state, patient, referenceDate),
    F: summarizeFamilyCard(state, patient, referenceDate),
  } satisfies Record<BundleComponentCode, BundleSummaryCard>;

  const alerts: BundleSmartAlert[] = [];
  const applicableCards = Object.values(cards).filter((card) => card.appliesLabel === "Aplica");
  const completedCards = applicableCards.filter((card) => card.complete);

  if (cards.A.tone !== "success" && state.sections.A.applicability === "aplica") {
    alerts.push({
      id: "alert-a-missing-pain",
      severity: cards.A.tone === "critical" ? "priority" : "soft",
      code: "A",
      title: "Falta valoracion de dolor",
      detail: "Registrar escala, intensidad e intervencion del dolor en la ventana configurada.",
    });
  }

  const latestPainEntry = getLatestEntry(state.sections.A.entries);
  if (
    latestPainEntry &&
    latestPainEntry.painIntensity >= 7 &&
    !latestPainEntry.interventionPerformed.trim() &&
    state.sections.A.applicability === "aplica"
  ) {
    alerts.push({
      id: "alert-a-high-pain",
      severity: "relevant",
      code: "A",
      title: "Dolor elevado sin intervencion documentada",
      detail: "Existe dolor alto registrado. Verificar respuesta clinica e intervencion documentada.",
    });
  }

  if (cards.B.tone !== "success" && state.sections.B.applicability === "aplica") {
    alerts.push({
      id: "alert-b-sat-sbt",
      severity: cards.B.tone === "critical" ? "priority" : "soft",
      code: "B",
      title: "Paciente ventilado sin revision SAT/SBT",
      detail: "Revisar elegibilidad o documentar motivo clinico de exclusion.",
    });
  }

  const latestSedationEntry = getLatestEntry(state.sections.C.entries);
  if (
    latestSedationEntry &&
    latestSedationEntry.relatedMedications.length > 0 &&
    !latestSedationEntry.sedationGoal.trim() &&
    state.sections.C.applicability === "aplica"
  ) {
    alerts.push({
      id: "alert-c-goal",
      severity: "priority",
      code: "C",
      title: "Sedacion registrada sin objetivo documentado",
      detail: "Documentar meta clinica y escala para mantener trazabilidad del bundle.",
    });
  }

  if (cards.C.relevantFinding) {
    alerts.push({
      id: "alert-c-mismatch",
      severity: cards.C.tone === "critical" ? "relevant" : "soft",
      code: "C",
      title: "Desviacion entre estado actual y meta",
      detail: cards.C.relevantFinding,
    });
  }

  if (cards.D.tone !== "success" && state.sections.D.applicability === "aplica") {
    alerts.push({
      id: "alert-d-screening",
      severity: cards.D.tone === "critical" ? "priority" : "soft",
      code: "D",
      title: "Falta tamizaje de delirio",
      detail: "Registrar instrumento, resultado y proxima reevaluacion sugerida.",
    });
  }

  if (cards.D.relevantFinding) {
    alerts.push({
      id: "alert-d-risk",
      severity: cards.D.tone === "critical" ? "relevant" : "soft",
      code: "D",
      title: "Hallazgo de delirio o riesgo aumentado",
      detail: cards.D.relevantFinding,
    });
  }

  if (cards.E.tone !== "success" && state.sections.E.applicability === "aplica") {
    alerts.push({
      id: "alert-e-mobility",
      severity: cards.E.tone === "critical" ? "priority" : "soft",
      code: "E",
      title: "Falta registro de movilizacion",
      detail: "Documentar nivel del dia, barreras o motivo clinico si no fue posible movilizar.",
    });
  }

  if (cards.F.tone !== "success" && state.sections.F.applicability === "aplica") {
    alerts.push({
      id: "alert-f-family",
      severity: cards.F.tone === "critical" ? "priority" : "soft",
      code: "F",
      title: "Falta actualizacion familiar",
      detail: "Registrar comunicacion, educacion brindada y participacion en decisiones.",
    });
  }

  return {
    completionPercent: applicableCards.length
      ? Math.round((completedCards.length / applicableCards.length) * 100)
      : 100,
    completedCount: completedCards.length,
    applicableCount: applicableCards.length,
    cards,
    alerts,
    metrics: (["A", "B", "C", "D", "E", "F"] as BundleComponentCode[]).map((code) => ({
      code,
      label: bundleComponentMeta[code].shortTitle,
      complete: cards[code].complete,
    })),
  };
}

export function buildBundleClosureSnapshot(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate = new Date()
): BundleClosureSnapshot {
  const dashboard = buildBundleDashboard(state, patient, referenceDate);
  const completedSections: BundleComponentCode[] = [];
  const pendingSections: BundleComponentCode[] = [];
  const validationNotes: string[] = [];

  for (const code of ["A", "B", "C", "D", "E", "F"] as BundleComponentCode[]) {
    const section = state.sections[code];
    const card = dashboard.cards[code];

    if (section.applicability !== "aplica") {
      continue;
    }

    if (card.complete) {
      completedSections.push(code);
      continue;
    }

    pendingSections.push(code);
    validationNotes.push(`Seccion ${code} pendiente o fuera de ventana clinica.`);
  }

  for (const code of ["A", "B", "C", "D", "E", "F"] as BundleComponentCode[]) {
    const section = state.sections[code];
    if (
      (section.applicability === "no_aplica" ||
        section.applicability === "contraindicado_temporalmente") &&
      !section.applicabilityReason.trim()
    ) {
      validationNotes.push(`Seccion ${code} requiere motivo clinico documentado.`);
    }
  }

  const summary = pendingSections.length
    ? `Bundle con ${completedSections.length}/${dashboard.applicableCount} componentes aplicables completados; quedan pendientes ${pendingSections.join(", ")}.`
    : `Bundle completo en ${completedSections.length}/${dashboard.applicableCount} componentes aplicables.`;

  return {
    completedSections,
    pendingSections,
    validationNotes,
    summary,
  };
}

export function getMechanicalVentilationStatus(patient: PatientRecord) {
  return patient.procedures.some((procedure) => {
    const normalized = normalizeText(procedure.type);
    return normalized.includes("ventilacion mecanica") || normalized.includes("traqueostomia");
  });
}

export function getBundleUpdatedStateTimestamp() {
  return new Date().toISOString();
}

export function formatBundleDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function summarizePainCard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate: Date
): BundleSummaryCard {
  const latestEntry = getLatestEntry(state.sections.A.entries);
  const isApplicable = state.sections.A.applicability === "aplica";

  if (!isApplicable) {
    return createMutedCard("A", state.sections.A.applicability, latestEntry?.recordedAt ?? null);
  }

  const dueState = getDueState(latestEntry?.recordedAt, "A", referenceDate);
  const unresolvedPain =
    latestEntry &&
    latestEntry.painIntensity >= 7 &&
    !latestEntry.interventionPerformed.trim() &&
    !latestEntry.analgesiaAdministered.trim();

  if (latestEntry && !dueState.overdue && !unresolvedPain) {
    return {
      code: "A",
      title: bundleComponentMeta.A.title,
      tone: "success",
      stateLabel: "Completo",
      lastRecordedAt: latestEntry.recordedAt,
      appliesLabel: "Aplica",
      complete: true,
      overdue: false,
      relevantFinding:
        latestEntry.painIntensity >= 5 ? `Dolor actual ${latestEntry.painIntensity}/10 con seguimiento documentado.` : null,
    };
  }

  return {
    code: "A",
    title: bundleComponentMeta.A.title,
    tone: unresolvedPain || dueState.critical ? "critical" : "warning",
    stateLabel: unresolvedPain || dueState.critical ? "Pendiente prioritario" : "Pendiente hoy",
    lastRecordedAt: latestEntry?.recordedAt ?? null,
    appliesLabel: "Aplica",
    complete: false,
    overdue: Boolean(dueState.overdue),
    relevantFinding: unresolvedPain ? "Dolor elevado sin intervencion registrada." : null,
  };
}

function summarizeSatSbtCard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate: Date
): BundleSummaryCard {
  const latestEntry = getLatestEntry(state.sections.B.entries);
  const ventilationActive = getMechanicalVentilationStatus(patient);
  const isApplicable = state.sections.B.applicability === "aplica" && ventilationActive;

  if (!isApplicable) {
    return createMutedCard("B", state.sections.B.applicability, latestEntry?.recordedAt ?? null);
  }

  const dueState = getDueState(latestEntry?.recordedAt, "B", referenceDate);
  const missingEligibility =
    latestEntry &&
    ((latestEntry.satCandidate === false && !latestEntry.satExclusionReason.trim()) ||
      (latestEntry.sbtCandidate === false && !latestEntry.sbtExclusionReason.trim()));
  const missingReview = !latestEntry || latestEntry.onMechanicalVentilation !== true;
  const complete =
    Boolean(latestEntry) &&
    !dueState.overdue &&
    !missingEligibility &&
    latestEntry.onMechanicalVentilation &&
    (latestEntry.satCandidate !== null || latestEntry.sbtCandidate !== null);

  if (complete) {
    return {
      code: "B",
      title: bundleComponentMeta.B.title,
      tone: "success",
      stateLabel: "Completo",
      lastRecordedAt: latestEntry?.recordedAt ?? null,
      appliesLabel: "Aplica",
      complete: true,
      overdue: false,
      relevantFinding:
        latestEntry?.sbtPerformed === false ? "SBT aun pendiente dentro de la ventana actual." : null,
    };
  }

  return {
    code: "B",
    title: bundleComponentMeta.B.title,
    tone: missingReview || missingEligibility || dueState.critical ? "critical" : "warning",
    stateLabel: missingReview || missingEligibility || dueState.critical ? "Pendiente prioritario" : "Pendiente hoy",
    lastRecordedAt: latestEntry?.recordedAt ?? null,
    appliesLabel: "Aplica",
    complete: false,
    overdue: Boolean(dueState.overdue),
    relevantFinding:
      missingEligibility ? "Existe exclusion sin motivo documentado." : missingReview ? "Falta revisar elegibilidad SAT/SBT." : null,
  };
}

function summarizeSedationCard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate: Date
): BundleSummaryCard {
  const latestEntry = getLatestEntry(state.sections.C.entries);
  const isApplicable = state.sections.C.applicability === "aplica";

  if (!isApplicable) {
    return createMutedCard("C", state.sections.C.applicability, latestEntry?.recordedAt ?? null);
  }

  const dueState = getDueState(latestEntry?.recordedAt, "C", referenceDate);
  const missingGoal =
    latestEntry &&
    latestEntry.relatedMedications.length > 0 &&
    !latestEntry.sedationGoal.trim();
  const mismatch =
    latestEntry &&
    /sobre|infra|no coincide|meta no documentada/i.test(latestEntry.comparisonToGoal);
  const complete =
    Boolean(latestEntry) &&
    !dueState.overdue &&
    !missingGoal &&
    !mismatch &&
    Boolean(latestEntry?.sedationScale.trim()) &&
    Boolean(latestEntry?.currentLevel.trim());

  if (complete) {
    return {
      code: "C",
      title: bundleComponentMeta.C.title,
      tone: "success",
      stateLabel: "Completo",
      lastRecordedAt: latestEntry?.recordedAt ?? null,
      appliesLabel: "Aplica",
      complete: true,
      overdue: false,
      relevantFinding: latestEntry?.relatedMedications.length
        ? `${latestEntry.relatedMedications.length} medicamentos relacionados revisados.`
        : "Revision documentada sin sedantes o analgesicos criticos activos.",
    };
  }

  return {
    code: "C",
    title: bundleComponentMeta.C.title,
    tone: missingGoal || mismatch || dueState.critical ? "critical" : "warning",
    stateLabel: missingGoal || mismatch || dueState.critical ? "Pendiente prioritario" : "Pendiente hoy",
    lastRecordedAt: latestEntry?.recordedAt ?? null,
    appliesLabel: "Aplica",
    complete: false,
    overdue: Boolean(dueState.overdue),
    relevantFinding: missingGoal
      ? "Hay medicacion relevante sin objetivo de sedacion documentado."
      : mismatch
        ? "El nivel actual no coincide con la meta registrada."
        : null,
  };
}

function summarizeDeliriumCard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate: Date
): BundleSummaryCard {
  const latestEntry = getLatestEntry(state.sections.D.entries);
  const isApplicable = state.sections.D.applicability === "aplica";

  if (!isApplicable) {
    return createMutedCard("D", state.sections.D.applicability, latestEntry?.recordedAt ?? null);
  }

  const dueState = getDueState(latestEntry?.recordedAt, "D", referenceDate);
  const positiveResult = latestEntry && /positivo|sugestivo|delirio/i.test(latestEntry.result);
  const riskIncreased = Boolean(latestEntry?.riskFactors.length);
  const complete =
    Boolean(latestEntry) &&
    !dueState.overdue &&
    latestEntry.screeningPerformed &&
    Boolean(latestEntry.instrument.trim()) &&
    Boolean(latestEntry.result.trim()) &&
    !positiveResult;

  if (complete) {
    return {
      code: "D",
      title: bundleComponentMeta.D.title,
      tone: "success",
      stateLabel: "Completo",
      lastRecordedAt: latestEntry?.recordedAt ?? null,
      appliesLabel: "Aplica",
      complete: true,
      overdue: false,
      relevantFinding: riskIncreased ? "Riesgo aumentado, con medidas preventivas registradas." : null,
    };
  }

  return {
    code: "D",
    title: bundleComponentMeta.D.title,
    tone: positiveResult || dueState.critical ? "critical" : "warning",
    stateLabel: positiveResult || dueState.critical ? "Pendiente prioritario" : "Pendiente hoy",
    lastRecordedAt: latestEntry?.recordedAt ?? null,
    appliesLabel: "Aplica",
    complete: false,
    overdue: Boolean(dueState.overdue),
    relevantFinding: positiveResult
      ? "Tamizaje positivo. Considerar reevaluacion y medidas no farmacologicas."
      : riskIncreased
        ? "Riesgo aumentado por factores predisponentes."
        : null,
  };
}

function summarizeMobilityCard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate: Date
): BundleSummaryCard {
  const latestEntry = getLatestEntry(state.sections.E.entries);
  const isApplicable = state.sections.E.applicability === "aplica";

  if (!isApplicable) {
    return createMutedCard("E", state.sections.E.applicability, latestEntry?.recordedAt ?? null);
  }

  const dueState = getDueState(latestEntry?.recordedAt, "E", referenceDate);
  const complete =
    Boolean(latestEntry) &&
    latestEntry.dailyStatus === "Realizada" &&
    !dueState.overdue &&
    Boolean(latestEntry.mobilityLevel.trim());

  if (complete) {
    return {
      code: "E",
      title: bundleComponentMeta.E.title,
      tone: "success",
      stateLabel: "Completo",
      lastRecordedAt: latestEntry?.recordedAt ?? null,
      appliesLabel: "Aplica",
      complete: true,
      overdue: false,
      relevantFinding: latestEntry?.mobilityType
        ? `${latestEntry.mobilityType} documentada con tolerancia ${latestEntry.tolerance || "registrada"}.`
        : null,
    };
  }

  return {
    code: "E",
    title: bundleComponentMeta.E.title,
    tone: latestEntry?.dailyStatus === "Pendiente" || dueState.critical ? "critical" : "warning",
    stateLabel:
      latestEntry?.dailyStatus === "Pendiente" || dueState.critical ? "Pendiente prioritario" : "Pendiente hoy",
    lastRecordedAt: latestEntry?.recordedAt ?? null,
    appliesLabel: "Aplica",
    complete: false,
    overdue: Boolean(dueState.overdue),
    relevantFinding:
      latestEntry?.barriers.trim() ? `Barreras actuales: ${latestEntry.barriers.trim()}` : null,
  };
}

function summarizeFamilyCard(
  state: BundleAbcdefState,
  patient: PatientRecord,
  referenceDate: Date
): BundleSummaryCard {
  const latestEntry = getLatestEntry(state.sections.F.entries);
  const isApplicable = state.sections.F.applicability === "aplica";

  if (!isApplicable) {
    return createMutedCard("F", state.sections.F.applicability, latestEntry?.recordedAt ?? null);
  }

  const dueState = getDueState(latestEntry?.recordedAt, "F", referenceDate);
  const complete =
    Boolean(latestEntry) &&
    latestEntry.communicationPerformed &&
    !dueState.overdue &&
    Boolean(latestEntry.familyContact.trim());

  if (complete) {
    return {
      code: "F",
      title: bundleComponentMeta.F.title,
      tone: "success",
      stateLabel: "Completo",
      lastRecordedAt: latestEntry?.recordedAt ?? null,
      appliesLabel: "Aplica",
      complete: true,
      overdue: false,
      relevantFinding: latestEntry?.participationInDecisions.trim()
        ? "Participacion familiar documentada."
        : null,
    };
  }

  return {
    code: "F",
    title: bundleComponentMeta.F.title,
    tone: dueState.critical ? "critical" : "warning",
    stateLabel: dueState.critical ? "Pendiente prioritario" : "Pendiente hoy",
    lastRecordedAt: latestEntry?.recordedAt ?? null,
    appliesLabel: "Aplica",
    complete: false,
    overdue: Boolean(dueState.overdue),
    relevantFinding: latestEntry?.familyContact.trim()
      ? `Ultimo contacto: ${latestEntry.familyContact.trim()}`
      : "Sin contacto familiar identificado.",
  };
}

function createMutedCard(
  code: BundleComponentCode,
  applicability: BundleApplicability,
  lastRecordedAt: string | null
): BundleSummaryCard {
  return {
    code,
    title: bundleComponentMeta[code].title,
    tone: "muted",
    stateLabel: applicability === "contraindicado_temporalmente" ? "Contraindicado temporalmente" : "No aplica",
    lastRecordedAt,
    appliesLabel:
      applicability === "contraindicado_temporalmente" ? "Contraindicado temporalmente" : "No aplica",
    complete: false,
    overdue: false,
    relevantFinding: null,
  };
}

function getRelatedAnalgesiaSedationMedications(patient: PatientRecord) {
  return patient.medicationRecords
    .filter((record) =>
      analgesiaSedationKeywords.some((keyword) => normalizeText(record.name).includes(keyword))
    )
    .map((record) => `${record.name} ${record.dose}`.trim());
}

function inferPainLocation(patient: PatientRecord) {
  const diagnosis = normalizeText(patient.primaryDiagnosis);
  if (diagnosis.includes("torac")) {
    return "Torax";
  }
  if (diagnosis.includes("disnea") || diagnosis.includes("resp")) {
    return "Sin dolor localizado predominante";
  }
  if (diagnosis.includes("cefalea")) {
    return "Cefalica";
  }
  if (diagnosis.includes("gluc")) {
    return "Sin foco doloroso principal";
  }
  return "Pendiente precisar localizacion";
}

function createBundleId(code: BundleComponentCode) {
  return `bundle-${code.toLowerCase()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hoursAgo(referenceDate: Date, hours: number) {
  return new Date(referenceDate.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function hoursAhead(referenceDate: Date, hours: number) {
  return new Date(referenceDate.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function getLatestEntry<TEntry extends { recordedAt: string }>(entries: TEntry[]) {
  return [...entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;
}

function getDueState(
  recordedAt: string | null | undefined,
  code: BundleComponentCode,
  referenceDate: Date
) {
  if (!recordedAt) {
    return { overdue: true, critical: true };
  }

  const elapsedHours = getElapsedHours(recordedAt, referenceDate);
  return {
    overdue: elapsedHours > reminderWindowsHours[code],
    critical: elapsedHours > criticalWindowsHours[code],
  };
}

function getElapsedHours(value: string, referenceDate: Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return (referenceDate.getTime() - parsed.getTime()) / (1000 * 60 * 60);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function inferBundleFamilyContact(patient: PatientRecord) {
  const emergencyContact = patient.personalData.emergencyContact.trim();
  if (emergencyContact) {
    return emergencyContact;
  }

  const familyMatch = patient.antecedentes.family.find((entry) =>
    familySupportKeywords.some((keyword) => normalizeText(entry).includes(keyword))
  );

  return familyMatch ?? "Sin contacto familiar identificado";
}
