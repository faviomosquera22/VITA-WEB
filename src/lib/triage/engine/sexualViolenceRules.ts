import subprotocolsJson from "../config/subprotocols.json";
import type {
  PriorityCandidate,
  SexualViolenceData,
  SubprotocolActivationConfigItem,
} from "../triageTypes";

interface SexualViolenceThresholds {
  forensicHours: number;
  emergencyContraceptionHours: number;
}

const sexualViolenceThresholdEntry = (subprotocolsJson as SubprotocolActivationConfigItem[]).find(
  (item) => item.id === "SEXUAL_VIOLENCE"
);

if (!sexualViolenceThresholdEntry?.thresholds) {
  throw new Error("SEXUAL_VIOLENCE thresholds missing in subprotocols.json");
}

const sexualViolenceThresholds =
  sexualViolenceThresholdEntry.thresholds as unknown as SexualViolenceThresholds;

/**
 * Evalua subprotocolo de violencia sexual con activacion de Codigo Purpura.
 * Fuente clinica: lineamientos MSP para atencion integral, legal y profilaxis.
 */
export function evaluateSexualViolence(data: SexualViolenceData): PriorityCandidate {
  const shouldEscalateToRed = data.dissociativeState && data.activeBleeding && data.suicidalIdeation;
  const priority: 1 | 2 = shouldEscalateToRed ? 1 : 2;

  const reasons = [
    "Caso de violencia sexual: prioridad minima NARANJA.",
    data.hoursSinceEvent < sexualViolenceThresholds.forensicHours
      ? `Evento dentro de ventana <${sexualViolenceThresholds.forensicHours}h: considerar ARV y kit forense completo.`
      : data.hoursSinceEvent <= sexualViolenceThresholds.emergencyContraceptionHours
        ? `Evento entre ${sexualViolenceThresholds.forensicHours}-${sexualViolenceThresholds.emergencyContraceptionHours}h: considerar anticoncepcion de emergencia.`
        : `Evento >${sexualViolenceThresholds.emergencyContraceptionHours}h: priorizar documentacion, manejo de lesiones y soporte psicologico.`,
  ];

  if (shouldEscalateToRed) {
    reasons.push("Crisis disociativa + sangrado activo + ideacion suicida: escalar a PRIORIDAD I.");
  }

  const alerts: PriorityCandidate["alerts"] = [
    {
      type: "legal",
      severity: "critical",
      message: "Codigo Purpura activado.",
    },
  ];

  if (data.isMinor) {
    alerts.push({
      type: "legal",
      severity: "immediate",
      message: "Victima menor de edad: notificacion obligatoria DINAPEN.",
    });
  }

  return {
    source: "subprotocol",
    module: "sexual_violence",
    priority,
    reasons,
    alerts,
    actions: [
      {
        order: 1,
        action: "Atender de inmediato en espacio privado.",
        responsible: "all",
        urgent: true,
      },
      {
        order: 2,
        action: "Intervencion en crisis por profesional entrenado y no dejar sola a la paciente.",
        responsible: "all",
        urgent: true,
      },
      {
        order: 3,
        action: "Comunicacion empatica; no presionar relato ni juzgar.",
        responsible: "all",
        urgent: true,
      },
      {
        order: 4,
        action: "Indicar no bano/cambio de ropa hasta recoleccion de evidencia si <72h.",
        responsible: "nurse",
        urgent: true,
      },
      {
        order: 5,
        action: "Realizar examen fisico completo con consentimiento y documentacion fotografica.",
        responsible: "doctor",
        urgent: true,
      },
      {
        order: 6,
        action: "Aplicar kit de violencia sexual si disponible y dentro de ventana forense.",
        responsible: "doctor",
        urgent: true,
      },
      {
        order: 7,
        action: "Solicitar pruebas basales: VIH, VDRL, hepatitis B y prueba de embarazo.",
        responsible: "doctor",
        urgent: true,
      },
      {
        order: 8,
        action: "Administrar profilaxis segun tiempo transcurrido (ARV/AE/vacuna hepatitis B).",
        responsible: "doctor",
        urgent: true,
      },
      {
        order: 9,
        action: "Notificar a trabajo social y soporte psicologico.",
        responsible: "social_worker",
        urgent: true,
      },
      {
        order: 10,
        action: "Completar registro clinico-legal integral y DINAPEN si es menor de edad.",
        responsible: "all",
        urgent: true,
      },
    ],
    activatedSubprotocols: ["SEXUAL_VIOLENCE"],
    codePurple: true,
    legalDocumentationRequired: true,
    mandatoryNotification: data.isMinor,
  };
}
