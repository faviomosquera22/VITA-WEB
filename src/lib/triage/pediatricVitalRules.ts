import type { TriageConfig, TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluatePediatricVitalRules(
  input: TriageInput,
  config: TriageConfig
): TriageRuleResult | null {
  const age = input.identification.ageYears;
  if (age === null || age > 15) {
    return null;
  }

  const band = config.pediatricVitals.find(
    (item) => age >= item.minAgeInclusive && age <= item.maxAgeInclusive
  );

  if (!band) {
    return null;
  }

  const reasons: string[] = [];
  const alerts: string[] = [];

  const vitals = input.vitals;

  if (vitals.heartRate !== null && vitals.heartRate > band.criticalHeartRateHigh) {
    reasons.push(`Taquicardia pediatrica critica (${vitals.heartRate} lpm).`);
    alerts.push("FC pediatrica critica");
  }

  if (vitals.respiratoryRate !== null && vitals.respiratoryRate > band.criticalRespiratoryRateHigh) {
    reasons.push(`Taquipnea pediatrica critica (${vitals.respiratoryRate} rpm).`);
    alerts.push("FR pediatrica critica");
  }

  if (vitals.systolicBp !== null && vitals.systolicBp < band.criticalSystolicBpLow) {
    reasons.push(`Hipotension pediatrica (${vitals.systolicBp} mmHg).`);
    alerts.push("PA pediatrica critica");
  }

  if (vitals.spo2 !== null && vitals.spo2 < 92) {
    reasons.push(`SpO2 pediatrica baja (${vitals.spo2}%).`);
    alerts.push("Hipoxemia pediatrica");
  }

  if (reasons.length > 0) {
    return {
      source: "pediatric_vitals",
      priority: 1,
      reasons,
      alerts,
      immediateActions: [
        "Priorizar atencion pediatrica inmediata.",
        "Monitoreo continuo y soporte ventilatorio segun necesidad.",
      ],
    };
  }

  if (vitals.temperatureC !== null && vitals.temperatureC >= 38.5) {
    return {
      source: "pediatric_vitals",
      priority: 3,
      reasons: [`Fiebre pediatrica (${vitals.temperatureC} C) sin inestabilidad mayor.`],
      alerts: [],
      immediateActions: ["Control termico y reevaluacion clinica."],
    };
  }

  return null;
}
