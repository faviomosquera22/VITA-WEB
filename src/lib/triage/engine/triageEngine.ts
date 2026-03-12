import { TIE_BREAK_SOURCE_ORDER, colorFromPriority, levelFromPriority } from "../triageConstants";
import type {
  CriticalFindings,
  ImmediateAction,
  PriorityCandidate,
  SubprotocolType,
  TriageFormData,
  TriageResult,
} from "../triageTypes";
import {
  detectActivatedSubprotocols,
  evaluateDiscriminator,
  getMissingMandatoryVitals,
} from "./baseTriageRules";
import { evaluateAdultVitals } from "./adultVitalRules";
import { evaluatePediatricVitals } from "./pediatricVitalRules";
import { evaluateTrauma } from "./traumaRules";
import { evaluateBurns } from "./burnRules";
import { evaluateSexualViolence } from "./sexualViolenceRules";
import { evaluateObstetric } from "./obstetricRules";
import { evaluateIntoxication } from "./intoxicationRules";
import { evaluateMentalHealth } from "./mentalHealthRules";

const sourceRank = Object.fromEntries(TIE_BREAK_SOURCE_ORDER.map((source, idx) => [source, idx])) as Record<
  PriorityCandidate["source"],
  number
>;

/**
 * Motor principal de triaje unificado MSP.
 * Fuente clinica: integracion de discriminador + signos vitales + hallazgos criticos + subprotocolos,
 * resolviendo por la prioridad mas alta (numero mas bajo).
 */
export function runTriageEngine(data: TriageFormData): TriageResult {
  const candidates: PriorityCandidate[] = [];

  const baseCandidate = evaluateDiscriminator(data.chiefComplaint);
  candidates.push(baseCandidate);

  const mandatoryVitals = getMissingMandatoryVitals(data.chiefComplaint, data.vitalSigns);

  const vitalEvaluation = data.identification.isPediatric
    ? evaluatePediatricVitals(
        data.vitalSigns,
        data.identification.age,
        data.identification.ageUnit,
        {
          appearanceAltered: data.criticalFindings.alteredConsciousness,
          breathingWorkAltered: data.criticalFindings.severeRespiratoryDistress,
          skinCirculationAltered: data.criticalFindings.cyanosis,
          stridorAtRest: data.criticalFindings.stridor,
        },
        mandatoryVitals
      )
    : evaluateAdultVitals(data.vitalSigns, mandatoryVitals);

  candidates.push(...vitalEvaluation.candidates);
  candidates.push(...evaluateCriticalFindings(data.criticalFindings));

  const autoProtocols = detectActivatedSubprotocols(data.chiefComplaint);
  const activeProtocols = collectSubprotocols(data, autoProtocols, baseCandidate.activatedSubprotocols ?? []);

  if (activeProtocols.includes("TRAUMA") && data.trauma) {
    candidates.push(evaluateTrauma(data.trauma));
  }

  if (activeProtocols.includes("BURNS") && data.burns) {
    candidates.push(evaluateBurns(data.burns));
  }

  if (activeProtocols.includes("SEXUAL_VIOLENCE") && data.sexualViolence) {
    candidates.push(evaluateSexualViolence(data.sexualViolence));
  }

  if (activeProtocols.includes("OBSTETRIC") && data.obstetric) {
    candidates.push(evaluateObstetric(data.obstetric));
  }

  if (activeProtocols.includes("INTOXICATION") && data.intoxication) {
    candidates.push(evaluateIntoxication(data.intoxication));
  }

  if (activeProtocols.includes("MENTAL_HEALTH") && data.mentalHealth) {
    candidates.push(evaluateMentalHealth(data.mentalHealth));
  }

  const winner = resolveWinner(candidates);

  const allReasons = unique(candidates.flatMap((candidate) => candidate.reasons));
  const allAlerts = uniqueByMessage(candidates.flatMap((candidate) => candidate.alerts));
  const allActions = normalizeActions(candidates.flatMap((candidate) => candidate.actions));

  const missingCriticalData = unique([
    ...mandatoryVitals,
    ...vitalEvaluation.missingCriticalData,
    ...(winner?.missingCriticalData ?? []),
  ]);

  const codePurple = candidates.some((candidate) => candidate.codePurple);
  const mandatoryNotification = candidates.some((candidate) => candidate.mandatoryNotification);
  const legalDocumentationRequired =
    candidates.some((candidate) => candidate.legalDocumentationRequired) || codePurple;

  const suggestedPriority = winner?.priority ?? 5;
  const level = levelFromPriority(suggestedPriority);

  return {
    assignedLevel: level,
    suggestedColor: colorFromPriority(suggestedPriority),
    suggestedPriority,
    maxWaitMinutes: level.maxWaitMinutes,
    prioritySource: resolvePrioritySource(candidates, winner),
    activatedSubprotocols: activeProtocols,
    clinicalReasons: allReasons,
    criticalAlerts: allAlerts,
    immediateActions: allActions,
    missingCriticalData,
    calculatedScores: {
      news2: calculateNews2(data),
      glasgowTotal: data.vitalSigns.glasgowTotal,
      burnTBSA: data.burns?.tbsaPercent,
      gestationalRisk: data.obstetric ? (winner?.priority === 1 ? "high" : winner?.priority === 2 ? "moderate" : "low") : undefined,
    },
    codePurple,
    mandatoryNotification,
    legalDocumentationRequired,
    generatedAt: new Date().toISOString(),
    triageNurseId: data.vitalSigns.takenBy,
    triageSessionId: data.suggestedResult?.triageSessionId || `triage-${Date.now()}`,
  };
}

/**
 * Reglas de hallazgos criticos (A/B/C/D y red flags neurologicos/cardiacos).
 * Fuente clinica: criterios de riesgo vital inmediato del MSP en admision de urgencias.
 */
export function evaluateCriticalFindings(findings: CriticalFindings): PriorityCandidate[] {
  const immediateReasons: string[] = [];
  const priorityTwoReasons: string[] = [];

  if (findings.airwayCompromised || findings.apnea || findings.stridor || findings.foreignBody) {
    immediateReasons.push("Compromiso de via aerea");
  }

  if (findings.severeRespiratoryDistress || findings.cyanosis) {
    immediateReasons.push("Compromiso respiratorio severo");
  }

  if (findings.uncontrolledBleeding || findings.shockSigns) {
    immediateReasons.push("Compromiso circulatorio grave");
  }

  if (findings.alteredConsciousness || findings.seizureActive) {
    immediateReasons.push("Compromiso neurologico agudo");
  }

  if (findings.anaphylaxis || findings.strokeSigns || findings.acuteChestPain || findings.pregnancyComplications) {
    immediateReasons.push("Emergencia clinica mayor");
  }

  if (findings.focalNeurologicDeficit) {
    priorityTwoReasons.push("Deficit neurologico focal");
  }

  if (findings.sepsisSigns) {
    priorityTwoReasons.push("Sospecha de sepsis");
  }

  if (findings.severePainUncontrolled || findings.accessoryMuscleUse) {
    priorityTwoReasons.push("Compromiso sintomatico de alto riesgo");
  }

  if (immediateReasons.length > 0) {
    return [
      {
        source: "critical_findings",
        module: "critical_findings",
        priority: 1,
        reasons: unique(immediateReasons),
        alerts: unique(immediateReasons).map((reason) => ({
          type: "finding",
          severity: "immediate",
          message: reason,
        })),
        actions: [
          {
            order: 1,
            action: "Activar respuesta inmediata y traslado a area de reanimacion.",
            responsible: "all",
            urgent: true,
          },
        ],
      },
    ];
  }

  if (priorityTwoReasons.length > 0) {
    return [
      {
        source: "critical_findings",
        module: "critical_findings",
        priority: 2,
        reasons: unique(priorityTwoReasons),
        alerts: [
          {
            type: "finding",
            severity: "critical",
            message: "Hallazgos criticos que requieren atencion prioritaria.",
          },
        ],
        actions: [
          {
            order: 1,
            action: "Mantener monitorizacion estrecha y reevaluacion frecuente.",
            responsible: "nurse",
            urgent: true,
          },
        ],
      },
    ];
  }

  return [];
}

/**
 * Desempata candidatos por prioridad y jerarquia de fuente.
 * Fuente clinica: en empate, priorizar hallazgos criticos sobre vitales, luego subprotocolos y discriminador.
 */
export function resolveWinner(candidates: PriorityCandidate[]): PriorityCandidate | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  return [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return sourceRank[a.source] - sourceRank[b.source];
  })[0];
}

/**
 * Fuente final de prioridad para trazabilidad medico-legal.
 */
export function resolvePrioritySource(
  candidates: PriorityCandidate[],
  winner: PriorityCandidate | undefined
): TriageResult["prioritySource"] {
  if (!winner) {
    return "combined";
  }

  const top = candidates.filter((candidate) => candidate.priority === winner.priority);
  const sources = new Set(top.map((candidate) => candidate.source));

  if (sources.size > 1) {
    return "combined";
  }

  return winner.source;
}

function collectSubprotocols(
  data: TriageFormData,
  detected: SubprotocolType[],
  fromDiscriminator: SubprotocolType[]
): SubprotocolType[] {
  const set = new Set<SubprotocolType>([...detected, ...fromDiscriminator]);

  if (data.trauma) set.add("TRAUMA");
  if (data.burns) set.add("BURNS");
  if (data.sexualViolence) set.add("SEXUAL_VIOLENCE");
  if (data.obstetric) set.add("OBSTETRIC");
  if (data.intoxication) set.add("INTOXICATION");
  if (data.mentalHealth) set.add("MENTAL_HEALTH");

  return Array.from(set);
}

/**
 * Calcula NEWS2 simplificado para soporte de deterioro clinico.
 */
function calculateNews2(data: TriageFormData): number {
  let score = 0;

  const rr = data.vitalSigns.respiratoryRate;
  if (rr !== undefined && (rr <= 8 || rr >= 25)) {
    score += 3;
  } else if (rr !== undefined && (rr <= 11 || rr >= 21)) {
    score += 1;
  }

  const spo2 = data.vitalSigns.spo2;
  if (spo2 !== undefined && spo2 <= 91) {
    score += 3;
  } else if (spo2 !== undefined && spo2 <= 93) {
    score += 2;
  } else if (spo2 !== undefined && spo2 <= 95) {
    score += 1;
  }

  const systolic = data.vitalSigns.systolicBP;
  if (systolic !== undefined && systolic <= 90) {
    score += 3;
  } else if (systolic !== undefined && (systolic <= 100 || systolic >= 220)) {
    score += 2;
  }

  const hr = data.vitalSigns.heartRate;
  if (hr !== undefined && (hr <= 40 || hr >= 131)) {
    score += 3;
  } else if (hr !== undefined && (hr <= 50 || hr >= 111)) {
    score += 1;
  }

  const temp = data.vitalSigns.temperature;
  if (temp !== undefined && (temp <= 35 || temp >= 39.1)) {
    score += 2;
  }

  const consciousnessAltered =
    data.criticalFindings.alteredConsciousness ||
    (data.vitalSigns.glasgowTotal !== undefined && data.vitalSigns.glasgowTotal < 15);

  if (consciousnessAltered) {
    score += 3;
  }

  return score;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function uniqueByMessage<T extends { message: string }>(items: T[]) {
  const seen = new Set<string>();
  const output: T[] = [];

  items.forEach((item) => {
    if (seen.has(item.message)) {
      return;
    }
    seen.add(item.message);
    output.push(item);
  });

  return output;
}

function normalizeActions(actions: ImmediateAction[]): ImmediateAction[] {
  const map = new Map<string, ImmediateAction>();

  actions.forEach((action) => {
    const key = `${action.action}:${action.responsible}`;
    if (!map.has(key)) {
      map.set(key, action);
      return;
    }

    const existing = map.get(key);
    if (!existing) {
      return;
    }

    if (action.urgent) {
      existing.urgent = true;
    }
    if (action.order < existing.order) {
      existing.order = action.order;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}
