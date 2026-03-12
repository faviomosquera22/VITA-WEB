import discriminatorsJson from "../config/discriminators.json";
import subprotocolsJson from "../config/subprotocols.json";
import type {
  DiscriminatorConfigItem,
  PriorityCandidate,
  SubprotocolActivationConfigItem,
  SubprotocolType,
  TriageChiefComplaint,
  TriagePriority,
  VitalSigns,
} from "../triageTypes";
import { normalizeText } from "../triageTypes";

const discriminatorCatalog = discriminatorsJson as DiscriminatorConfigItem[];
const subprotocolCatalog = subprotocolsJson as SubprotocolActivationConfigItem[];

/**
 * Evalua la prioridad base del motivo de consulta y discriminador seleccionado.
 * Fuente clinica: flujo Manchester adaptado MSP, donde todo paciente inicia por un
 * discriminador de entrada antes de refinar por vitales/hallazgos/subprotocolos.
 */
export function evaluateDiscriminator(chiefComplaint: TriageChiefComplaint): PriorityCandidate {
  const catalogItem = getDiscriminatorConfig(chiefComplaint.discriminatorId);
  const priority = catalogItem?.basePriority ?? chiefComplaint.basePriority ?? 3;
  const label =
    (catalogItem?.label ?? chiefComplaint.discriminatorLabel) || "Discriminador clinico";

  return {
    source: "discriminator",
    module: "base",
    priority,
    reasons: [
      `Discriminador principal seleccionado: ${label} (prioridad base ${priority}).`,
      chiefComplaint.chiefComplaintText
        ? `Motivo referido por paciente: ${chiefComplaint.chiefComplaintText}.`
        : "Motivo de consulta sin texto libre registrado.",
    ],
    alerts: [],
    actions: [
      {
        order: 1,
        action: "Completar nucleo general de triaje y monitorizacion inicial.",
        responsible: "nurse",
        urgent: false,
      },
    ],
    activatedSubprotocols: mergeActivatedSubprotocols(chiefComplaint, catalogItem),
  };
}

/**
 * Detecta subprotocolos automaticamente por discriminador y palabras clave.
 * Fuente clinica: activacion contextual MSP para trauma, obstetricia, violencia, etc.
 */
export function detectActivatedSubprotocols(chiefComplaint: TriageChiefComplaint): SubprotocolType[] {
  return mergeActivatedSubprotocols(chiefComplaint, getDiscriminatorConfig(chiefComplaint.discriminatorId));
}

/**
 * Obtiene campos de signos vitales mandatorios para el discriminador seleccionado.
 */
export function getMandatoryVitalsForDiscriminator(
  chiefComplaint: TriageChiefComplaint
): Array<keyof VitalSigns | string> {
  const item = getDiscriminatorConfig(chiefComplaint.discriminatorId);
  return item?.mandatoryVitals ?? [];
}

/**
 * Valida datos faltantes de signos vitales que son obligatorios para el discriminador.
 */
export function getMissingMandatoryVitals(
  chiefComplaint: TriageChiefComplaint,
  vitalSigns: VitalSigns
): string[] {
  const mandatory = getMandatoryVitalsForDiscriminator(chiefComplaint);
  return mandatory.filter((field) => {
    const value = vitalSigns[field as keyof VitalSigns] as unknown;
    return value === undefined || value === null || value === "";
  });
}

export function getDiscriminatorConfig(discriminatorId: string): DiscriminatorConfigItem | undefined {
  return discriminatorCatalog.find((item) => item.id === discriminatorId);
}

function mergeActivatedSubprotocols(
  chiefComplaint: TriageChiefComplaint,
  catalogItem?: DiscriminatorConfigItem
): SubprotocolType[] {
  const activated = new Set<SubprotocolType>(chiefComplaint.activatedSubprotocols ?? []);

  (catalogItem?.suggestsSubprotocols ?? []).forEach((id) => {
    activated.add(id);
  });

  const normalized = normalizeText(
    `${chiefComplaint.chiefComplaintText} ${chiefComplaint.discriminatorLabel} ${chiefComplaint.discriminatorId}`
  );

  subprotocolCatalog.forEach((entry) => {
    if (entry.discriminatorIds.includes(chiefComplaint.discriminatorId)) {
      activated.add(entry.id);
      return;
    }

    if (entry.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      activated.add(entry.id);
    }
  });

  return Array.from(activated);
}

export function asPriority(value: unknown, fallback: TriagePriority = 3): TriagePriority {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }
  return fallback;
}
