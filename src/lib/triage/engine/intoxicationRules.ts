import type { IntoxicationData, PriorityCandidate } from "../triageTypes";

/**
 * Evalua subprotocolo de intoxicaciones con enfoque toxidromatico.
 * Fuente clinica: urgencias toxicas MSP, incluyendo organofosforados.
 */
export function evaluateIntoxication(data: IntoxicationData): PriorityCandidate {
  const priorityOneReasons: string[] = [];

  if (data.alteredConsciousness) {
    priorityOneReasons.push("Alteracion del estado de conciencia");
  }
  if (data.seizures) {
    priorityOneReasons.push("Convulsiones activas o recientes");
  }
  if (data.bronchospasm) {
    priorityOneReasons.push("Broncoespasmo por intoxicacion");
  }
  if (data.arrhythmia) {
    priorityOneReasons.push("Arritmia asociada a intoxicacion");
  }
  if (data.oralBurns) {
    priorityOneReasons.push("Quemadura oral por causticos");
  }

  const cholinergicPattern = data.miosis && data.salivation;
  if (cholinergicPattern) {
    priorityOneReasons.push("Patron colinergico (miosis + salivacion), sospecha organofosforados");
  }

  if (data.muscleParalysis) {
    priorityOneReasons.push("Paralisis muscular por posible toxicidad colinergica");
  }

  if (priorityOneReasons.length > 0) {
    return buildIntoxicationCandidate(1, priorityOneReasons, cholinergicPattern);
  }

  const priorityTwoReasons: string[] = [];
  if (data.severeVomiting) {
    priorityTwoReasons.push("Vomito severo persistente");
  }
  if (data.bradycardia) {
    priorityTwoReasons.push("Bradicardia asociada");
  }
  if (data.miosis || data.mydriasis) {
    priorityTwoReasons.push("Alteraciones pupilares toxidromaticas");
  }

  if (priorityTwoReasons.length > 0) {
    return buildIntoxicationCandidate(2, priorityTwoReasons, cholinergicPattern);
  }

  return buildIntoxicationCandidate(
    3,
    ["Intoxicacion sin criterios de gravedad extrema al ingreso."],
    cholinergicPattern
  );
}

function buildIntoxicationCandidate(
  priority: 1 | 2 | 3,
  reasons: string[],
  cholinergicPattern: boolean
): PriorityCandidate {
  const actions: PriorityCandidate["actions"] = [
    {
      order: 1,
      action: "Asegurar via aerea, ventilacion y monitorizacion continua.",
      responsible: "all",
      urgent: true,
    },
    {
      order: 2,
      action: "Identificar sustancia, dosis y tiempo de exposicion; contactar toxicologia.",
      responsible: "doctor",
      urgent: true,
    },
    {
      order: 3,
      action: "Descontaminacion segun via de exposicion cuando aplique.",
      responsible: "nurse",
      urgent: true,
    },
  ];

  if (cholinergicPattern) {
    actions.push({
      order: 4,
      action: "Preparar manejo para sindrome colinergico por organofosforados segun protocolo.",
      responsible: "doctor",
      urgent: true,
    });
  }

  if (priority === 1) {
    actions.push({
      order: 5,
      action: "Ingreso inmediato a area critica y soporte hemodinamico.",
      responsible: "doctor",
      urgent: true,
    });
  }

  return {
    source: "subprotocol",
    module: "intoxication",
    priority,
    reasons,
    alerts:
      priority <= 2
        ? [
            {
              type: "subprotocol",
              severity: priority === 1 ? "immediate" : "critical",
              message: "Subprotocolo de intoxicaciones activado.",
            },
          ]
        : [],
    actions,
    activatedSubprotocols: ["INTOXICATION"],
  };
}
