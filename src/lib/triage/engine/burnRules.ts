import subprotocolsJson from "../config/subprotocols.json";
import type { BurnData, PriorityCandidate, SubprotocolActivationConfigItem } from "../triageTypes";

interface BurnThresholds {
  adultCriticalTbsa: number;
  pediatricCriticalTbsa: number;
  adultModerateTbsaLow: number;
  adultModerateTbsaHigh: number;
  pediatricModerateTbsaLow: number;
  pediatricModerateTbsaHigh: number;
}

const burnThresholdEntry = (subprotocolsJson as SubprotocolActivationConfigItem[]).find(
  (item) => item.id === "BURNS"
);

if (!burnThresholdEntry?.thresholds) {
  throw new Error("BURNS thresholds missing in subprotocols.json");
}

const burnConfig = burnThresholdEntry.thresholds as unknown as BurnThresholds;

/**
 * Evalua subprotocolo de quemaduras con prioridad por via aerea, extension y estabilidad.
 * Fuente clinica: criterios MSP para quemadura grave y derivacion a unidad especializada.
 */
export function evaluateBurns(data: BurnData): PriorityCandidate {
  const criticalReasons: string[] = [];

  if (data.airwayBurn) {
    criticalReasons.push("Compromiso de via aerea por quemadura");
  }
  if (data.inhalationInjury) {
    criticalReasons.push("Lesion inhalatoria");
  }
  if (data.circumferentialBurn) {
    criticalReasons.push("Quemadura circunferencial");
  }
  if (data.hemodynamicInstability) {
    criticalReasons.push("Inestabilidad hemodinamica");
  }

  const tbsaCriticalThreshold = data.isPediatric
    ? burnConfig.pediatricCriticalTbsa
    : burnConfig.adultCriticalTbsa;
  if (data.tbsaPercent >= tbsaCriticalThreshold) {
    criticalReasons.push(
      `Extension de quemadura critica (${data.tbsaPercent}% SCT, umbral ${tbsaCriticalThreshold}%).`
    );
  }

  if (criticalReasons.length > 0) {
    return buildBurnCandidate(1, criticalReasons, data);
  }

  const moderateReasons: string[] = [];
  const inAdultModerateRange =
    !data.isPediatric &&
    data.tbsaPercent >= burnConfig.adultModerateTbsaLow &&
    data.tbsaPercent <= burnConfig.adultModerateTbsaHigh;
  const inPediatricModerateRange =
    data.isPediatric &&
    data.tbsaPercent >= burnConfig.pediatricModerateTbsaLow &&
    data.tbsaPercent <= burnConfig.pediatricModerateTbsaHigh;

  if (inAdultModerateRange || inPediatricModerateRange) {
    moderateReasons.push(`Quemadura de extension moderada (${data.tbsaPercent}% SCT).`);
  }

  if (data.isElectrical) {
    moderateReasons.push("Quemadura electrica (minimo prioridad II)");
  }

  if (data.isChemical) {
    moderateReasons.push("Quemadura quimica");
  }

  if (
    data.faceInvolved ||
    data.handsInvolved ||
    data.feetInvolved ||
    data.genitalsInvolved ||
    data.jointsInvolved
  ) {
    moderateReasons.push("Compromiso de region especial (cara/manos/pies/genitales/articulaciones)");
  }

  if (moderateReasons.length > 0) {
    return buildBurnCandidate(2, moderateReasons, data);
  }

  return buildBurnCandidate(
    3,
    ["Quemadura sin criterios de gravedad mayor en evaluacion inicial."],
    data
  );
}

function buildBurnCandidate(
  priority: 1 | 2 | 3,
  reasons: string[],
  data: BurnData
): PriorityCandidate {
  return {
    source: "subprotocol",
    module: "burns",
    priority,
    reasons,
    alerts:
      priority <= 2
        ? [
            {
              type: "subprotocol",
              severity: priority === 1 ? "immediate" : "critical",
              message: "Subprotocolo de quemaduras activado.",
            },
          ]
        : [],
    actions: buildBurnActions(data),
    activatedSubprotocols: ["BURNS"],
  };
}

function buildBurnActions(data: BurnData): PriorityCandidate["actions"] {
  const actions: PriorityCandidate["actions"] = [
    {
      order: 1,
      action: "Detener la quema y enfriar con agua tibia 15-20 minutos.",
      responsible: "nurse",
      urgent: true,
    },
    {
      order: 2,
      action: "No aplicar hielo, cremas ni pasta dental.",
      responsible: "all",
      urgent: true,
    },
    {
      order: 3,
      action: "Cubrir lesiones con campo esteril seco.",
      responsible: "nurse",
      urgent: true,
    },
    {
      order: 4,
      action: "Canalizar 2 vias IV en zona no quemada e iniciar analgesia IV.",
      responsible: "nurse",
      urgent: true,
    },
    {
      order: 5,
      action: "Calcular formula de Parkland para reposicion hidrica.",
      responsible: "doctor",
      urgent: true,
    },
  ];

  if (data.isChemical) {
    actions.push({
      order: 6,
      action: "Realizar descontaminacion antes del ingreso definitivo.",
      responsible: "nurse",
      urgent: true,
    });
  }

  if (data.isElectrical) {
    actions.push({
      order: 7,
      action: "Solicitar ECG y monitoreo cardiaco continuo.",
      responsible: "doctor",
      urgent: true,
    });
  }

  if (data.tbsaPercent > 20) {
    actions.push({
      order: 8,
      action: "Contactar unidad de quemados para referencia temprana.",
      responsible: "doctor",
      urgent: true,
    });
  }

  return actions;
}
