import type { TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateMentalHealthRules(input: TriageInput): TriageRuleResult | null {
  const protocol = input.protocolInputs.saludMental;

  const hasData =
    protocol.severeAgitation ||
    protocol.suicideRisk ||
    protocol.suicidePlan ||
    protocol.violentBehavior ||
    protocol.hallucinations ||
    protocol.intoxicationAssociated ||
    protocol.selfHarmInjury;

  if (!hasData) {
    return null;
  }

  if (protocol.violentBehavior || (protocol.selfHarmInjury && protocol.severeAgitation)) {
    return {
      source: "salud_mental",
      priority: 1,
      reasons: ["Riesgo inminente para paciente/terceros en crisis de salud mental."],
      alerts: ["Codigo de seguridad asistencial"],
      immediateActions: [
        "Asegurar entorno protegido y contencion terapeutica.",
        "Intervencion inmediata por equipo de salud mental.",
      ],
      activatedProtocols: ["salud_mental"],
    };
  }

  if (protocol.suicidePlan || protocol.severeAgitation || protocol.selfHarmInjury) {
    return {
      source: "salud_mental",
      priority: 2,
      reasons: ["Crisis psiquiatrica con riesgo alto de autolesion/agresion."],
      alerts: ["Riesgo suicida alto"],
      immediateActions: [
        "No dejar paciente sin supervision.",
        "Aplicar intervencion en crisis y valoracion psiquiatrica urgente.",
      ],
      activatedProtocols: ["salud_mental"],
    };
  }

  return {
    source: "salud_mental",
    priority: 3,
    reasons: ["Sintomatologia de salud mental que requiere evaluacion prioritaria."],
    alerts: protocol.suicideRisk ? ["Riesgo suicida en tamizaje"] : [],
    immediateActions: ["Tamizaje ampliado y seguimiento por equipo de salud mental."],
    activatedProtocols: ["salud_mental"],
  };
}
