import thresholdsJson from "../config/vitalThresholds.json";
import type {
  AdultThresholdConfig,
  PriorityCandidate,
  TriagePriority,
  VitalCriticalFlag,
  VitalSigns,
} from "../triageTypes";

const adultThresholds = (thresholdsJson as { adult: AdultThresholdConfig }).adult;

export interface VitalRuleEvaluation {
  candidates: PriorityCandidate[];
  criticalFlags: VitalCriticalFlag[];
  missingCriticalData: string[];
}

/**
 * Evalua signos vitales en adulto usando umbrales configurables en JSON.
 * Fuente clinica: lineamientos MSP/Manchester para descompensacion fisiologica.
 */
export function evaluateAdultVitals(
  vitalSigns: VitalSigns,
  mandatoryFields: Array<keyof VitalSigns | string> = []
): VitalRuleEvaluation {
  const candidates: PriorityCandidate[] = [];
  const criticalFlags: VitalCriticalFlag[] = [];

  const missingCriticalData = mandatoryFields.filter((field) => {
    const value = vitalSigns[field as keyof VitalSigns] as unknown;
    return value === undefined || value === null || value === "";
  });

  evaluateSystolicBP(vitalSigns.systolicBP, candidates, criticalFlags);
  evaluateHeartRate(vitalSigns.heartRate, candidates, criticalFlags);
  evaluateRespiratoryRate(vitalSigns.respiratoryRate, candidates, criticalFlags);
  evaluateSpo2(vitalSigns.spo2, candidates, criticalFlags);
  evaluateTemperature(vitalSigns.temperature, candidates, criticalFlags);
  evaluateGlasgow(vitalSigns.glasgowTotal, candidates, criticalFlags);
  evaluateGlucometry(vitalSigns.glucometry, candidates, criticalFlags);
  evaluatePain(vitalSigns.painScale, candidates);

  return {
    candidates,
    criticalFlags,
    missingCriticalData,
  };
}

function evaluateSystolicBP(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.systolicBP.priority1;
  const p2 = adultThresholds.systolicBP.priority2;
  const p3 = adultThresholds.systolicBP.priority3;

  if (isBelow(value, p1.low) || isAbove(value, p1.high)) {
    pushVitalCandidate("Presion arterial sistolica critica", "systolicBP", value, 1, candidates, criticalFlags, `${p1.low ?? "-"}/${p1.high ?? "-"}`);
    return;
  }

  if (isBelow(value, p2.low) || isAbove(value, p2.high)) {
    pushVitalCandidate("Presion arterial sistolica de alto riesgo", "systolicBP", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}/${p2.high ?? "-"}`);
    return;
  }

  if (isBelow(value, p3.low) || isAbove(value, p3.high)) {
    pushVitalCandidate("Presion arterial sistolica en zona de alerta", "systolicBP", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}/${p3.high ?? "-"}`);
  }
}

function evaluateHeartRate(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.heartRate.priority1;
  const p2 = adultThresholds.heartRate.priority2;
  const p3 = adultThresholds.heartRate.priority3;

  if (isBelow(value, p1.low) || isAbove(value, p1.high)) {
    pushVitalCandidate("Frecuencia cardiaca critica", "heartRate", value, 1, candidates, criticalFlags, `${p1.low ?? "-"}/${p1.high ?? "-"}`);
    return;
  }

  if (isBelow(value, p2.low) || isAbove(value, p2.high)) {
    pushVitalCandidate("Frecuencia cardiaca de alto riesgo", "heartRate", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}/${p2.high ?? "-"}`);
    return;
  }

  if (isBelow(value, p3.low) || isAbove(value, p3.high)) {
    pushVitalCandidate("Frecuencia cardiaca en zona de alerta", "heartRate", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}/${p3.high ?? "-"}`);
  }
}

function evaluateRespiratoryRate(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.respiratoryRate.priority1;
  const p2 = adultThresholds.respiratoryRate.priority2;
  const p3 = adultThresholds.respiratoryRate.priority3;

  if (isBelow(value, p1.low) || isAbove(value, p1.high)) {
    pushVitalCandidate("Frecuencia respiratoria critica", "respiratoryRate", value, 1, candidates, criticalFlags, `${p1.low ?? "-"}/${p1.high ?? "-"}`);
    return;
  }

  if (isBelow(value, p2.low) || isAbove(value, p2.high)) {
    pushVitalCandidate("Frecuencia respiratoria de alto riesgo", "respiratoryRate", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}/${p2.high ?? "-"}`);
    return;
  }

  if (isBelow(value, p3.low) || isAbove(value, p3.high)) {
    pushVitalCandidate("Frecuencia respiratoria en zona de alerta", "respiratoryRate", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}/${p3.high ?? "-"}`);
  }
}

function evaluateSpo2(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.spo2.priority1;
  const p2 = adultThresholds.spo2.priority2;
  const p3 = adultThresholds.spo2.priority3;

  if (inRange(value, p1.low, p1.high)) {
    pushVitalCandidate("Saturacion de oxigeno critica", "spo2", value, 1, candidates, criticalFlags, `${p1.low ?? "-"}-${p1.high ?? "-"}`);
    return;
  }

  if (inRange(value, p2.low, p2.high)) {
    pushVitalCandidate("Saturacion de oxigeno de alto riesgo", "spo2", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}-${p2.high ?? "-"}`);
    return;
  }

  if (inRange(value, p3.low, p3.high)) {
    pushVitalCandidate("Saturacion de oxigeno en alerta", "spo2", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}-${p3.high ?? "-"}`);
  }
}

function evaluateTemperature(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.temperature.priority1;
  const p2 = adultThresholds.temperature.priority2;
  const p3 = adultThresholds.temperature.priority3;

  if (isBelow(value, p1.high) || isAbove(value, p1.highCritical)) {
    pushVitalCandidate(
      "Temperatura critica",
      "temperature",
      value,
      1,
      candidates,
      criticalFlags,
      `<${p1.high ?? "-"} o >${p1.highCritical ?? "-"}`
    );
    return;
  }

  if (inRange(value, p2.low, p2.high)) {
    pushVitalCandidate("Temperatura de alto riesgo", "temperature", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}-${p2.high ?? "-"}`);
    return;
  }

  if (inRange(value, p3.low, p3.high)) {
    pushVitalCandidate("Temperatura en alerta", "temperature", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}-${p3.high ?? "-"}`);
  }
}

function evaluateGlasgow(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.glasgow.priority1;
  const p2 = adultThresholds.glasgow.priority2;
  const p3 = adultThresholds.glasgow.priority3;

  if (inRange(value, p1.low, p1.high)) {
    pushVitalCandidate("Compromiso neurologico severo por Glasgow", "glasgowTotal", value, 1, candidates, criticalFlags, `${p1.low ?? "-"}-${p1.high ?? "-"}`);
    return;
  }

  if (inRange(value, p2.low, p2.high)) {
    pushVitalCandidate("Compromiso neurologico moderado por Glasgow", "glasgowTotal", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}-${p2.high ?? "-"}`);
    return;
  }

  if (inRange(value, p3.low, p3.high)) {
    pushVitalCandidate("Glasgow en zona de alerta", "glasgowTotal", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}-${p3.high ?? "-"}`);
  }
}

function evaluateGlucometry(
  value: number | undefined,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[]
) {
  if (value === undefined) {
    return;
  }

  const p1 = adultThresholds.glucometry.priority1;
  const p2 = adultThresholds.glucometry.priority2;
  const p3 = adultThresholds.glucometry.priority3;

  if (isBelow(value, p1.high) || isAbove(value, p1.highCritical)) {
    pushVitalCandidate(
      "Glucometria critica",
      "glucometry",
      value,
      1,
      candidates,
      criticalFlags,
      `<${p1.high ?? "-"} o >${p1.highCritical ?? "-"}`
    );
    return;
  }

  const highRangeP2Low = p3.highCritical;
  if (inRange(value, p2.low, p2.high) || inRange(value, highRangeP2Low, p2.highCritical)) {
    pushVitalCandidate("Glucometria de alto riesgo", "glucometry", value, 2, candidates, criticalFlags, `${p2.low ?? "-"}-${p2.high ?? "-"} o ${highRangeP2Low ?? "-"}-${p2.highCritical ?? "-"}`);
    return;
  }

  if (inRange(value, p3.low, p3.high)) {
    pushVitalCandidate("Glucometria en alerta", "glucometry", value, 3, candidates, criticalFlags, `${p3.low ?? "-"}-${p3.high ?? "-"}`);
  }
}

function evaluatePain(value: number | undefined, candidates: PriorityCandidate[]) {
  if (value === undefined) {
    return;
  }

  const p2 = adultThresholds.painScale.priority2;
  const p3 = adultThresholds.painScale.priority3;

  if (inRange(value, p2.low, p2.high)) {
    candidates.push(createCandidate(2, `Dolor intenso EVA ${value}/10.`, "painScale", value));
    return;
  }

  if (inRange(value, p3.low, p3.high)) {
    candidates.push(createCandidate(3, `Dolor moderado EVA ${value}/10.`, "painScale", value));
  }
}

function pushVitalCandidate(
  message: string,
  parameter: string,
  value: number,
  priority: TriagePriority,
  candidates: PriorityCandidate[],
  criticalFlags: VitalCriticalFlag[],
  threshold: string
) {
  candidates.push(createCandidate(priority, `${message}: ${value}.`, parameter, value));

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
    module: "adult_vitals",
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
            ? "Atencion medica inmediata y monitorizacion continua."
            : "Reevaluacion prioritaria de signos vitales y preparacion de intervencion clinica.",
        responsible: "nurse",
        urgent: priority <= 2,
      },
    ],
  };
}

function inRange(value: number, low?: number | null, high?: number | null) {
  if (low === undefined || low === null || high === undefined || high === null) {
    return false;
  }

  return value >= low && value <= high;
}

function isBelow(value: number, threshold?: number | null) {
  return threshold !== undefined && threshold !== null && value < threshold;
}

function isAbove(value: number, threshold?: number | null) {
  return threshold !== undefined && threshold !== null && value > threshold;
}
