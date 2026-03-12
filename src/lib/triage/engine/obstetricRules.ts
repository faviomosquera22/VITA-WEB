import subprotocolsJson from "../config/subprotocols.json";
import type {
  ObstetricData,
  PriorityCandidate,
  SubprotocolActivationConfigItem,
} from "../triageTypes";

interface ObstetricThresholds {
  pretermWeeks: number;
}

const obstetricThresholdEntry = (subprotocolsJson as SubprotocolActivationConfigItem[]).find(
  (item) => item.id === "OBSTETRIC"
);

if (!obstetricThresholdEntry?.thresholds) {
  throw new Error("OBSTETRIC thresholds missing in subprotocols.json");
}

const obstetricThresholds = obstetricThresholdEntry.thresholds as unknown as ObstetricThresholds;

/**
 * Evalua subprotocolo obstetrico para emergencias materno-fetales.
 * Fuente clinica: lineamientos MSP para obstetricia de urgencias.
 */
export function evaluateObstetric(data: ObstetricData): PriorityCandidate {
  const priorityOneReasons: string[] = [];

  if (data.eclampsia) {
    priorityOneReasons.push("Eclampsia");
  }
  if (data.prolapsedCord) {
    priorityOneReasons.push("Prolapso de cordon");
  }
  if (data.abruptionSigns) {
    priorityOneReasons.push("Sospecha de desprendimiento placentario");
  }
  if (data.ectopicSigns) {
    priorityOneReasons.push("Sospecha de embarazo ectopico complicado");
  }
  if (data.hemorrhagiaPostpartum) {
    priorityOneReasons.push("Hemorragia posparto");
  }
  if (data.fetalDistress) {
    priorityOneReasons.push("Sufrimiento fetal");
  }

  if (priorityOneReasons.length > 0) {
    return buildObstetricCandidate(1, priorityOneReasons);
  }

  const priorityTwoReasons: string[] = [];

  if (data.severePreeclampsia) {
    priorityTwoReasons.push("Preeclampsia severa");
  }

  if (data.activeLabor && data.memoraneRupture) {
    priorityTwoReasons.push("Trabajo de parto activo con ruptura de membranas");
  }

  if (data.vaginalBleeding && (data.bleedingAmount === "moderate" || data.bleedingAmount === "heavy" || data.bleedingAmount === "hemorrhagic")) {
    priorityTwoReasons.push("Sangrado vaginal moderado/severo");
  }

  const hasComplication =
    data.vaginalBleeding || data.abdominalPain || data.decreasedFetalMovement || data.headache || data.visualDisturbances;

  if ((data.gestationalAgeWeeks ?? 40) < obstetricThresholds.pretermWeeks && hasComplication) {
    priorityTwoReasons.push(
      `Gestacion <${obstetricThresholds.pretermWeeks} semanas con complicaciones`
    );
  }

  if (priorityTwoReasons.length > 0) {
    return buildObstetricCandidate(2, priorityTwoReasons);
  }

  return buildObstetricCandidate(
    3,
    ["Cuadro obstetrico sin criterios de prioridad I/II en evaluacion actual."]
  );
}

function buildObstetricCandidate(priority: 1 | 2 | 3, reasons: string[]): PriorityCandidate {
  return {
    source: "subprotocol",
    module: "obstetric",
    priority,
    reasons,
    alerts:
      priority <= 2
        ? [
            {
              type: "subprotocol",
              severity: priority === 1 ? "immediate" : "critical",
              message: "Subprotocolo obstetrico activado.",
            },
          ]
        : [],
    actions: [
      {
        order: 1,
        action: "Colocar en decubito lateral izquierdo.",
        responsible: "nurse",
        urgent: true,
      },
      {
        order: 2,
        action: "Iniciar monitoreo cardiotocografico.",
        responsible: "nurse",
        urgent: true,
      },
      {
        order: 3,
        action: "Canalizar via IV si hay sangrado, eclampsia o inestabilidad.",
        responsible: "nurse",
        urgent: true,
      },
      {
        order: 4,
        action: "Si eclampsia: iniciar sulfato de magnesio segun protocolo MSP.",
        responsible: "doctor",
        urgent: true,
      },
      {
        order: 5,
        action: "Activar ginecologia/obstetricia de guardia.",
        responsible: "doctor",
        urgent: true,
      },
    ],
    activatedSubprotocols: ["OBSTETRIC"],
  };
}
