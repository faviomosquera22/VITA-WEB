import thresholdsJson from "../config/vitalThresholds.json";
import type {
  PediatricBandThreshold,
  PriorityCandidate,
  TriagePriority,
  VitalCriticalFlag,
  VitalSigns,
} from "../triageTypes";
import type { VitalRuleEvaluation } from "./adultVitalRules";

const pediatricThresholds = (thresholdsJson as { pediatric: Record<string, PediatricBandThreshold> })
  .pediatric;

export interface PediatricEvaluationOptions {
  appearanceAltered?: boolean;
  breathingWorkAltered?: boolean;
  skinCirculationAltered?: boolean;
  bulgingFontanelle?: boolean;
  petechiaeWithFever?: boolean;
  stridorAtRest?: boolean;
  inconsolableCry?: boolean;
  feedingRefusal?: boolean;
}

/**
 * Evalua signos vitales y alarmas pediatricas por grupo etario configurable.
 * Fuente clinica: triage pediatrico MSP con enfoque TEP y signos de alarma.
 */
export function evaluatePediatricVitals(
  vitalSigns: VitalSigns,
  age: number,
  ageUnit: "years" | "months" | "days",
  options: PediatricEvaluationOptions = {},
  mandatoryFields: Array<keyof VitalSigns | string> = []
): VitalRuleEvaluation {
  const candidates: PriorityCandidate[] = [];
  const criticalFlags: VitalCriticalFlag[] = [];

  const missingCriticalData = mandatoryFields.filter((field) => {
    const value = vitalSigns[field as keyof VitalSigns] as unknown;
    return value === undefined || value === null || value === "";
  });

  const band = resolveBand(age, ageUnit);

  if (!band) {
    return { candidates, criticalFlags, missingCriticalData };
  }

  evaluateHigh(vitalSigns.heartRate, band.heartRate, "heartRate", "Frecuencia cardiaca pediatrica", candidates, criticalFlags);
  evaluateHigh(vitalSigns.respiratoryRate, band.respiratoryRate, "respiratoryRate", "Frecuencia respiratoria pediatrica", candidates, criticalFlags);
  evaluateLow(vitalSigns.systolicBP, band.systolicBP, "systolicBP", "Presion arterial sistolica pediatrica", candidates, criticalFlags);
  evaluateLow(vitalSigns.spo2, band.spo2, "spo2", "Saturacion pediatrica", candidates, criticalFlags);

  applyPediatricAlarmRules(options, candidates, criticalFlags);

  return { candidates, criticalFlags, missingCriticalData };
}

function applyPediatricAlarmRules(
  options: PediatricEvaluationOptions,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  const tepSides = [options.appearanceAltered, options.breathingWorkAltered, options.skinCirculationAltered].filter(Boolean).length;

  if (tepSides >= 2) {
    candidates.push(
      createCandidate(1, `Triangulo de evaluacion pediatrica alterado en ${tepSides} lados.`, "tep", tepSides)
    );
    criticalFlags.push({
      parameter: "TEP",
      value: tepSides,
      threshold: ">=2",
      suggestedPriority: 1,
      message: "TEP alterado en 2 o mas lados",
    });
  }

  if (options.bulgingFontanelle) {
    candidates.push(createCandidate(1, "Fontanela abombada en lactante.", "bulgingFontanelle", 1));
  }

  if (options.petechiaeWithFever) {
    candidates.push(createCandidate(1, "Petequias con fiebre (alarma meningococcemia).", "petechiaeWithFever", 1));
  }

  if (options.stridorAtRest) {
    candidates.push(createCandidate(1, "Estridor en reposo.", "stridorAtRest", 1));
  }

  if (options.inconsolableCry) {
    candidates.push(createCandidate(2, "Llanto inconsolable.", "inconsolableCry", 1));
  }

  if (options.feedingRefusal) {
    candidates.push(createCandidate(2, "Rechazo alimentario en lactante.", "feedingRefusal", 1));
  }
}

function evaluateHigh(
  value: number | undefined,
  ranges: PediatricBandThreshold["heartRate"],
  parameter: string,
  label: string,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = ranges.priority1.high;
  const p2 = ranges.priority2.high;
  const p3 = ranges.priority3.high;

  if (isAbove(value, p1)) {
    push(label, parameter, value, 1, `>${p1 ?? "-"}`, candidates, criticalFlags);
    return;
  }

  if (isAbove(value, p2)) {
    push(label, parameter, value, 2, `>${p2 ?? "-"}`, candidates, criticalFlags);
    return;
  }

  if (isAbove(value, p3)) {
    push(label, parameter, value, 3, `>${p3 ?? "-"}`, candidates, criticalFlags);
  }
}

function evaluateLow(
  value: number | undefined,
  ranges: PediatricBandThreshold["systolicBP"],
  parameter: string,
  label: string,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = ranges.priority1.low;
  const p2 = ranges.priority2.low;
  const p3 = ranges.priority3.low;

  if (isBelow(value, p1)) {
    push(label, parameter, value, 1, `<${p1 ?? "-"}`, candidates, criticalFlags);
    return;
  }

  if (isBelow(value, p2)) {
    push(label, parameter, value, 2, `<${p2 ?? "-"}`, candidates, criticalFlags);
    return;
  }

  if (isBelow(value, p3)) {
    push(label, parameter, value, 3, `<${p3 ?? "-"}`, candidates, criticalFlags);
  }
}

function push(
  label: string,
  parameter: string,
  value: number,
  priority: TriagePriority,
  threshold: string,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  const message = `${label} fuera de rango (${value}).`;
  candidates.push(createCandidate(priority, message, parameter, value));
  criticalFlags.push({
    parameter,
    value,
    threshold,
    suggestedPriority: priority,
    message,
  });
}

function createCandidate(
  priority: TriagePriority,
  reason: string,
  parameter: string,
  value: number
): PriorityCandidate {
  const severity = priority === 1 ? "immediate" : priority === 2 ? "critical" : "warning";

  return {
    source: "vital_signs",
    module: "pediatric_vitals",
    priority,
    reasons: [reason],
    alerts: [
      {
        type: "vital",
        severity,
        message: reason,
        parameter,
        value,
      },
    ],
    actions: [
      {
        order: 1,
        action:
          priority === 1
            ? "Atencion pediatrica inmediata con monitorizacion continua."
            : "Reevaluar paciente pediatrico y mantener vigilancia estrecha.",
        responsible: "nurse",
        urgent: priority <= 2,
      },
    ],
  };
}

function resolveBand(
  age: number,
  ageUnit: "years" | "months" | "days"
): PediatricBandThreshold | undefined {
  const ageInDays = toDays(age, ageUnit);
  const ageInMonths = ageUnit === "days" ? age / 30 : ageUnit === "months" ? age : age * 12;
  const ageInYears = ageUnit === "days" ? age / 365 : ageUnit === "months" ? age / 12 : age;

  return Object.values(pediatricThresholds).find((band) => {
    if (band.ageMinDays !== undefined && band.ageMaxDays !== undefined) {
      return ageInDays >= band.ageMinDays && ageInDays <= band.ageMaxDays;
    }

    if (band.ageMinMonths !== undefined && band.ageMaxMonths !== undefined) {
      return ageInMonths >= band.ageMinMonths && ageInMonths <= band.ageMaxMonths;
    }

    if (band.ageMinYears !== undefined && band.ageMaxYears !== undefined) {
      return ageInYears >= band.ageMinYears && ageInYears <= band.ageMaxYears;
    }

    return false;
  });
}

function toDays(age: number, unit: "years" | "months" | "days") {
  if (unit === "days") {
    return age;
  }
  if (unit === "months") {
    return age * 30;
  }
  return age * 365;
}

function isBelow(value: number, low?: number | null) {
  return low !== undefined && low !== null && value < low;
}

function isAbove(value: number, high?: number | null) {
  return high !== undefined && high !== null && value > high;
}
