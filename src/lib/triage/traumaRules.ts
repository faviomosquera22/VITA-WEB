import type { TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateTraumaRules(input: TriageInput): TriageRuleResult | null {
  const trauma = input.protocolInputs.trauma;

  const criticalCriteria = [
    trauma.penetratingWound && "Herida penetrante",
    trauma.amputation && "Amputacion",
    trauma.evisceration && "Evisceracion",
    trauma.uncontrolledBleeding && "Sangrado no controlado",
    trauma.suspectedSpinalCordInjury && "Lesion medular sospechada",
    trauma.severeTbi && "TEC severo",
    trauma.multipleMajorFractures && "Multiples fracturas mayores",
    trauma.neurovascularCompromise && "Compromiso neurovascular",
  ].filter((item): item is string => Boolean(item));

  if (criticalCriteria.length > 0) {
    return {
      source: "trauma",
      priority: 1,
      reasons: [
        `Trauma con criterio de prioridad I: ${criticalCriteria.join(", ")}.`,
      ],
      alerts: ["Trauma mayor"],
      immediateActions: [
        "Activar protocolo de trauma MSP.",
        "Asegurar ABCDE, inmovilizacion y control de hemorragia.",
      ],
      activatedProtocols: ["trauma"],
    };
  }

  const moderateCriteria = [
    trauma.polytrauma && "Politrauma",
    trauma.lossOfConsciousness && "Perdida de conciencia",
    trauma.activeBleeding && "Sangrado activo",
    trauma.deformity && "Deformidad evidente",
    trauma.cervicalPain && "Dolor cervical",
    trauma.thoracicPain && "Dolor toracico",
    trauma.abdominalPain && "Dolor abdominal",
    trauma.glasgow !== null && trauma.glasgow <= 13 && `Glasgow ${trauma.glasgow}`,
  ].filter((item): item is string => Boolean(item));

  if (moderateCriteria.length > 0) {
    return {
      source: "trauma",
      priority: 2,
      reasons: [`Trauma con criterios de riesgo: ${moderateCriteria.join(", ")}.`],
      alerts: ["Valoracion de trauma prioritaria"],
      immediateActions: [
        "Monitorizar signos vitales y reevaluar estado neurologico.",
        "Solicitar imagenologia/laboratorio segun mecanismo.",
      ],
      activatedProtocols: ["trauma"],
    };
  }

  if (!trauma.mechanism.trim()) {
    return {
      source: "trauma",
      priority: 3,
      reasons: ["Trauma sospechado sin datos de severidad mayor al momento."],
      alerts: [],
      immediateActions: ["Completar mecanismo de trauma para clasificacion final."],
      activatedProtocols: ["trauma"],
      missingData: ["Mecanismo de trauma"],
    };
  }

  return {
    source: "trauma",
    priority: 3,
    reasons: ["Trauma estable sin criterios de prioridad inmediata."],
    alerts: [],
    immediateActions: ["Manejo analgesico y reevaluacion clinica secuencial."],
    activatedProtocols: ["trauma"],
  };
}
