import type { PriorityCandidate, TraumaData } from "../triageTypes";

/**
 * Evalua subprotocolo de trauma MSP.
 * Fuente clinica: trauma mayor con criterios de prioridad I automatica.
 */
export function evaluateTrauma(data: TraumaData): PriorityCandidate {
  const priorityOneTriggers: Array<[boolean, string]> = [
    [data.penetratingWound, "Herida penetrante"],
    [data.amputation, "Amputacion traumatica"],
    [data.evisceration, "Evisceracion"],
    [data.uncontrolledHemorrhage, "Hemorragia no controlada"],
    [data.suspectedSpinalInjury, "Sospecha de lesion medular"],
    [data.severeHeadTrauma, "Trauma craneoencefalico severo"],
    [data.multipleMajorFractures, "Multiples fracturas mayores"],
    [data.neurovascularCompromise, "Compromiso neurovascular"],
  ];

  const reasons = priorityOneTriggers.filter(([flag]) => flag).map(([, message]) => message);

  const actions = [
    {
      order: 1,
      action: data.cervicalPain
        ? "Inmovilizacion cervical inmediata con collarin."
        : "Evaluar necesidad de inmovilizacion cervical.",
      responsible: "nurse" as const,
      urgent: true,
    },
    {
      order: 2,
      action: "Control de hemostasia manual si hay sangrado activo.",
      responsible: "nurse" as const,
      urgent: true,
    },
    {
      order: 3,
      action: "Canalizar 2 vias IV de grueso calibre.",
      responsible: "nurse" as const,
      urgent: true,
    },
    {
      order: 4,
      action: "Activar equipo de trauma y solicitar laboratorio urgente con grupo y factor.",
      responsible: "doctor" as const,
      urgent: true,
    },
    {
      order: 5,
      action: "Solicitar Rx portatil si inestable hemodinamicamente.",
      responsible: "doctor" as const,
      urgent: true,
    },
  ];

  if (reasons.length > 0) {
    return {
      source: "subprotocol",
      module: "trauma",
      priority: 1,
      reasons: reasons.map((reason) => `${reason} activa prioridad I de trauma.`),
      alerts: reasons.map((reason) => ({
        type: "subprotocol" as const,
        severity: "immediate" as const,
        message: reason,
      })),
      actions,
      activatedSubprotocols: ["TRAUMA"],
    };
  }

  const priorityTwoReasons: string[] = [];
  if (data.lossOfConsciousness && (data.locDuration === "minutes" || data.locDuration === "over30min")) {
    priorityTwoReasons.push("Perdida de conciencia posterior a trauma");
  }
  if (data.isPolitrauma) {
    priorityTwoReasons.push("Politrauma");
  }
  if (data.cervicalPain) {
    priorityTwoReasons.push("Dolor cervical post trauma");
  }
  if (data.openFracture) {
    priorityTwoReasons.push("Fractura abierta");
  }

  if (priorityTwoReasons.length > 0) {
    return {
      source: "subprotocol",
      module: "trauma",
      priority: 2,
      reasons: priorityTwoReasons.map((reason) => `${reason} requiere manejo prioritario.`),
      alerts: [
        {
          type: "subprotocol",
          severity: "critical",
          message: "Trauma con criterios de prioridad II.",
        },
      ],
      actions,
      activatedSubprotocols: ["TRAUMA"],
    };
  }

  return {
    source: "subprotocol",
    module: "trauma",
    priority: 3,
    reasons: ["Trauma sin criterios de prioridad I/II al momento de la valoracion."],
    alerts: [],
    actions,
    activatedSubprotocols: ["TRAUMA"],
  };
}
