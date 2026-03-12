import type { MentalHealthData, PriorityCandidate } from "../triageTypes";

/**
 * Evalua subprotocolo de salud mental/agitación/suicidio.
 * Fuente clinica: abordaje de riesgo de suicidio y seguridad inmediata.
 */
export function evaluateMentalHealth(data: MentalHealthData): PriorityCandidate {
  const reasons: string[] = [];
  let priority: 1 | 2 | 3 = 3;

  if (data.recentAttempt) {
    priority = 1;
    reasons.push("Intento suicida reciente (ultimo mes)");
  }

  if (data.violentBehavior || data.riskToOthers) {
    priority = priority === 1 ? 1 : 2;
    reasons.push("Conducta violenta o riesgo para terceros");
  }

  const hasHighSuicideRisk = data.activeSuicidalIdeation && (data.specificPlan || data.accessToMeans);
  if (hasHighSuicideRisk) {
    priority = priority === 1 ? 1 : 2;
    reasons.push("Ideacion suicida activa con plan especifico y/o acceso a medios");
  }

  if (data.presentationType.includes("suicidal_ideation") && priority > 2) {
    priority = 2;
    reasons.push("Ideacion suicida: prioridad minima II");
  }

  if (data.agitationLevel === "severe" && priority > 2) {
    priority = 2;
    reasons.push("Agitacion severa");
  }

  if (reasons.length === 0) {
    reasons.push("Crisis de salud mental sin criterios de extrema gravedad inicial.");
  }

  return {
    source: "subprotocol",
    module: "mental_health",
    priority,
    reasons,
    alerts:
      priority <= 2
        ? [
            {
              type: "subprotocol",
              severity: priority === 1 ? "immediate" : "critical",
              message: "Subprotocolo de salud mental activado.",
            },
          ]
        : [],
    actions: [
      {
        order: 1,
        action: "Asegurar entorno protegido: retirar objetos de riesgo y controlar accesos.",
        responsible: "all",
        urgent: true,
      },
      {
        order: 2,
        action: "No dejar solo al paciente.",
        responsible: "all",
        urgent: true,
      },
      {
        order: 3,
        action: "Activar psiquiatria/psicologia de guardia.",
        responsible: "doctor",
        urgent: true,
      },
      {
        order: 4,
        action: "Mantener comunicacion empatica, no confrontativa y sin juicios.",
        responsible: "all",
        urgent: true,
      },
      {
        order: 5,
        action: "Si hay riesgo de violencia, activar apoyo de seguridad institucional.",
        responsible: "security",
        urgent: data.violentBehavior || data.riskToOthers,
      },
    ],
    activatedSubprotocols: ["MENTAL_HEALTH"],
  };
}
