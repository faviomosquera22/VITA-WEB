import type { TriageConfig, TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateIntoxicationRules(
  input: TriageInput,
  config: TriageConfig
): TriageRuleResult | null {
  const protocol = input.protocolInputs.intoxicaciones;

  const hasData =
    protocol.suspectedSubstance.trim().length > 0 ||
    protocol.ingestionTimeHours !== null ||
    protocol.alteredConsciousness ||
    protocol.respiratoryDepression ||
    protocol.seizures ||
    protocol.hemodynamicInstability ||
    protocol.suicidalIntent;

  if (!hasData) {
    return null;
  }

  if (
    protocol.alteredConsciousness ||
    protocol.respiratoryDepression ||
    protocol.seizures ||
    protocol.hemodynamicInstability
  ) {
    return {
      source: "intoxicaciones",
      priority: 1,
      reasons: ["Intoxicacion con compromiso vital o neurologico."],
      alerts: ["Emergencia toxica"],
      immediateActions: [
        "ABC inicial y monitorizacion continua.",
        "Contactar toxicologia y considerar antidoto especifico.",
      ],
      activatedProtocols: ["intoxicaciones"],
    };
  }

  if (
    protocol.suicidalIntent ||
    (protocol.ingestionTimeHours !== null &&
      protocol.ingestionTimeHours <= config.intoxications.urgentIngestionHours)
  ) {
    return {
      source: "intoxicaciones",
      priority: 2,
      reasons: ["Intoxicacion con necesidad de atencion urgente y vigilancia estrecha."],
      alerts: ["Riesgo toxicologico"],
      immediateActions: [
        "Valorar via de exposicion, dosis y tiempo desde evento.",
        "Iniciar observacion prioritaria con soporte clinico.",
      ],
      activatedProtocols: ["intoxicaciones"],
    };
  }

  return {
    source: "intoxicaciones",
    priority: 3,
    reasons: ["Intoxicacion estable al ingreso, requiere evaluacion priorizada."],
    alerts: [],
    immediateActions: ["Mantener reevaluacion clinica y seguimiento de sintomas."],
    activatedProtocols: ["intoxicaciones"],
  };
}
