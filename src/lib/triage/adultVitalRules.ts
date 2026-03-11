import type { TriageConfig, TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateAdultVitalRules(
  input: TriageInput,
  config: TriageConfig
): TriageRuleResult | null {
  const age = input.identification.ageYears;
  if (age !== null && age <= 15) {
    return null;
  }

  const vitals = input.vitals;
  const reasons: string[] = [];
  const alerts: string[] = [];
  const immediateActions: string[] = [];

  if (vitals.spo2 !== null && vitals.spo2 < config.adultVitals.criticalSpo2) {
    reasons.push(`SpO2 critica (${vitals.spo2}%).`);
    alerts.push("Hipoxemia");
    immediateActions.push("Oxigeno suplementario y monitorizacion continua.");
  }

  if (
    vitals.systolicBp !== null &&
    (vitals.systolicBp < config.adultVitals.criticalSystolicBpLow ||
      vitals.systolicBp > config.adultVitals.criticalSystolicBpHigh)
  ) {
    reasons.push(`PA sistolica critica (${vitals.systolicBp} mmHg).`);
    alerts.push("Presion arterial critica");
    immediateActions.push("Reevaluar hemodinamia y canalizar acceso venoso.");
  }

  if (
    vitals.heartRate !== null &&
    (vitals.heartRate < config.adultVitals.criticalHeartRateLow ||
      vitals.heartRate > config.adultVitals.criticalHeartRateHigh)
  ) {
    reasons.push(`Frecuencia cardiaca fuera de rango critico (${vitals.heartRate} lpm).`);
    alerts.push("Alteracion cardiaca");
  }

  if (
    vitals.respiratoryRate !== null &&
    (vitals.respiratoryRate < config.adultVitals.criticalRespiratoryRateLow ||
      vitals.respiratoryRate > config.adultVitals.criticalRespiratoryRateHigh)
  ) {
    reasons.push(`Frecuencia respiratoria critica (${vitals.respiratoryRate} rpm).`);
    alerts.push("Alteracion respiratoria");
  }

  if (reasons.length > 0) {
    return {
      source: "adult_vitals",
      priority: 1,
      reasons,
      alerts,
      immediateActions: immediateActions.length
        ? immediateActions
        : ["Atencion medica inmediata por signos vitales criticos."],
    };
  }

  const warningReasons: string[] = [];
  if (vitals.temperatureC !== null && vitals.temperatureC >= config.adultVitals.warningTemperatureHigh) {
    warningReasons.push(`Fiebre alta (${vitals.temperatureC} C).`);
  }

  if (vitals.painScale !== null && vitals.painScale >= 8) {
    warningReasons.push(`Dolor severo (EVA ${vitals.painScale}).`);
  }

  if (warningReasons.length > 0) {
    return {
      source: "adult_vitals",
      priority: 2,
      reasons: warningReasons,
      alerts: ["Signos de riesgo intermedio-alto"],
      immediateActions: ["Control de signos y reevaluacion medica prioritaria."],
    };
  }

  return null;
}
