import type { TriageConfig, TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateSexualViolenceRules(
  input: TriageInput,
  config: TriageConfig
): TriageRuleResult | null {
  const protocol = input.protocolInputs.violenciaSexual;

  const hasData =
    protocol.timeSinceEventHours !== null ||
    protocol.bleeding ||
    protocol.lesions ||
    protocol.possiblePregnancy ||
    protocol.minor ||
    protocol.showeredOrChangedClothes ||
    protocol.emotionalCrisis;

  if (!hasData) {
    return null;
  }

  const reasons: string[] = ["Caso con sospecha/confirmacion de violencia sexual."];
  const alerts: string[] = ["Codigo Purpura activado"]; 
  const immediateActions: string[] = [
    "Atencion inmediata y privada en area segura.",
    "Intervencion en crisis y contencion emocional.",
    "Examen fisico dirigido y registro clinico-legal.",
    "Solicitar pruebas y profilaxis segun evaluacion clinica.",
  ];

  if (
    protocol.timeSinceEventHours !== null &&
    protocol.timeSinceEventHours <= config.sexualViolence.urgentWindowHours
  ) {
    reasons.push(
      `Evento dentro de ventana prioritaria (${protocol.timeSinceEventHours}h).`
    );
  }

  if (protocol.bleeding || protocol.lesions || protocol.minor || protocol.emotionalCrisis) {
    reasons.push("Hallazgos de alto impacto clinico/psicosocial en evaluacion inicial.");

    return {
      source: "violencia_sexual",
      priority: 1,
      reasons,
      alerts,
      immediateActions,
      activatedProtocols: ["violencia_sexual"],
      missingData: collectMissingData(protocol),
    };
  }

  return {
    source: "violencia_sexual",
    priority: 2,
    reasons,
    alerts,
    immediateActions,
    activatedProtocols: ["violencia_sexual"],
    missingData: collectMissingData(protocol),
  };
}

function collectMissingData(input: TriageInput["protocolInputs"]["violenciaSexual"]) {
  const missing: string[] = [];

  if (input.timeSinceEventHours === null) {
    missing.push("Tiempo desde el evento");
  }

  if (!input.bleeding && !input.lesions) {
    missing.push("Sangrado o lesiones (confirmar)");
  }

  return missing;
}
