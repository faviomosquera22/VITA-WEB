import type { TriageConfig, TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateBurnRules(
  input: TriageInput,
  config: TriageConfig
): TriageRuleResult | null {
  const burn = input.protocolInputs.quemaduras;

  const hasBurnData =
    Boolean(burn.burnType) ||
    burn.bodySurfacePercent !== null ||
    burn.specialRegion ||
    burn.airwayCompromise ||
    burn.closedSpaceFire ||
    burn.circumferential;

  if (!hasBurnData) {
    return null;
  }

  const isPediatric = burn.pediatricCase || ((input.identification.ageYears ?? 99) <= 15);
  const highSurface = isPediatric
    ? config.burns.highSurfacePediatric
    : config.burns.highSurfaceAdult;
  const moderateSurface = isPediatric
    ? config.burns.moderateSurfacePediatric
    : config.burns.moderateSurfaceAdult;

  const surface = burn.bodySurfacePercent ?? 0;

  if (burn.airwayCompromise || burn.unstable) {
    return {
      source: "quemaduras",
      priority: 1,
      reasons: [
        "Quemadura con compromiso de via aerea o inestabilidad hemodinamica.",
      ],
      alerts: ["Quemadura critica"],
      immediateActions: [
        "Asegurar via aerea y soporte hemodinamico.",
        "Activar protocolo de quemados de alta prioridad.",
      ],
      activatedProtocols: ["quemaduras"],
    };
  }

  if (burn.closedSpaceFire || surface >= highSurface) {
    return {
      source: "quemaduras",
      priority: 2,
      reasons: [
        `Quemadura de alta gravedad (${surface}% SCT o incendio en ambiente cerrado).`,
      ],
      alerts: ["Riesgo alto por quemadura"],
      immediateActions: [
        "Monitorizar oxigenacion y evaluar necesidad de traslado a unidad especializada.",
      ],
      activatedProtocols: ["quemaduras"],
    };
  }

  if (burn.circumferential || burn.specialRegion || surface >= moderateSurface) {
    return {
      source: "quemaduras",
      priority: 3,
      reasons: [
        "Quemadura con criterio de seguimiento estrecho (region especial/circunferencial/extension moderada).",
      ],
      alerts: [],
      immediateActions: ["Analgesia, curacion inicial y reevaluacion frecuente."],
      activatedProtocols: ["quemaduras"],
    };
  }

  return {
    source: "quemaduras",
    priority: 4,
    reasons: ["Quemadura leve sin criterios de alta prioridad."],
    alerts: [],
    immediateActions: ["Manejo local y educacion de signos de alarma."],
    activatedProtocols: ["quemaduras"],
  };
}
