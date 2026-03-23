import type {
  MedicationOrder,
  ObservationPriority,
  ObservationSource,
  SurveillanceRuleConfig,
  TriggeredRule,
} from "@/lib/clinical-surveillance/types";

export const defaultSurveillanceRuleConfig: SurveillanceRuleConfig = {
  evaluationReferenceTime: "2026-03-15T12:00:00",
  staleVitalsHours: 6,
  staleFluidBalanceHours: 12,
  painReevaluationHours: 2,
  abnormalReevaluationHours: 4,
  medicationAdministrationGraceHours: 2,
  groupedObservationMinimum: 2,
};

const priorityWeights: Record<ObservationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  informative: 1,
};

const medicationClassMap: Record<string, string> = {
  aas: "antiagregante",
  acetilsalicilico: "antiagregante",
  aspirin: "antiagregante",
  enoxaparina: "anticoagulante",
  heparina: "anticoagulante",
  budesonida: "corticoide inhalado",
  formoterol: "broncodilatador inhalado",
  salbutamol: "broncodilatador inhalado",
  insulina: "insulina",
  regular: "insulina",
  metformina: "biguanida",
  ibuprofeno: "aine",
  paracetamol: "analgesico",
  penicilina: "betalactamico",
  amoxicilina: "betalactamico",
  ampicilina: "betalactamico",
  ceftriaxona: "betalactamico",
};

const respiratoryTerms = [
  "respir",
  "disnea",
  "epoc",
  "asma",
  "neumonia",
  "hipox",
  "bronco",
  "oxigen",
];

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseClinicalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.includes(" ")
      ? trimmed.replace(" ", "T")
      : `${trimmed}T00:00:00`;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toIsoTimestamp(value: string) {
  return parseClinicalDate(value)?.toISOString() ?? value;
}

export function hoursBetween(from: string | null | undefined, to: string) {
  const fromDate = parseClinicalDate(from);
  const toDate = parseClinicalDate(to);

  if (!fromDate || !toDate) {
    return null;
  }

  return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
}

export function parseBloodPressure(value: string) {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) {
    return { systolic: null, diastolic: null };
  }

  return {
    systolic: Number(match[1]),
    diastolic: Number(match[2]),
  };
}

export function uniqueSources(values: ObservationSource[]) {
  return Array.from(new Set(values));
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

export function priorityLabel(priority: ObservationPriority) {
  const labels: Record<ObservationPriority, string> = {
    critical: "critica",
    high: "alta",
    medium: "media",
    informative: "informativa",
  };

  return labels[priority];
}

export function comparePriority(left: ObservationPriority, right: ObservationPriority) {
  return priorityWeights[right] - priorityWeights[left];
}

export function sortTriggeredRules(rules: TriggeredRule[]) {
  return [...rules].sort((left, right) => {
    const byPriority = comparePriority(left.priority, right.priority);
    if (byPriority !== 0) {
      return byPriority;
    }

    return right.triggeredAt.localeCompare(left.triggeredAt);
  });
}

export function sortByPriority<T extends { priority: ObservationPriority; updatedAt?: string; createdAt?: string }>(
  items: T[]
) {
  return [...items].sort((left, right) => {
    const byPriority = comparePriority(left.priority, right.priority);
    if (byPriority !== 0) {
      return byPriority;
    }

    return (right.updatedAt ?? right.createdAt ?? "").localeCompare(
      left.updatedAt ?? left.createdAt ?? ""
    );
  });
}

export function highestPriority(priorities: ObservationPriority[]) {
  return priorities.reduce<ObservationPriority>(
    (current, next) => (priorityWeights[next] > priorityWeights[current] ? next : current),
    "informative"
  );
}

export function escalatePriority(priority: ObservationPriority): ObservationPriority {
  if (priority === "informative") {
    return "medium";
  }
  if (priority === "medium") {
    return "high";
  }
  if (priority === "high") {
    return "critical";
  }
  return "critical";
}

export function buildRuleTriggerId(patientId: string, ruleId: string, triggeredAt: string) {
  return `${patientId}:${ruleId}:${toIsoTimestamp(triggeredAt)}`;
}

export function buildObservationDedupeKey(patientId: string, ruleIds: string[]) {
  return `${patientId}::${uniqueStrings(ruleIds).sort().join("+")}`;
}

export function isRespiratoryDiagnosis(diagnoses: string[]) {
  const haystack = normalizeText(diagnoses.join(" "));
  return respiratoryTerms.some((term) => haystack.includes(term));
}

export function resolveMedicationClass(medicationName: string) {
  const normalized = normalizeText(medicationName);
  const entry = Object.entries(medicationClassMap).find(([term]) =>
    normalized.includes(term)
  );

  return entry?.[1] ?? normalized.split(/[\/\s]/)[0] ?? "clase_no_identificada";
}

export function medicationMatchesAllergy(medicationName: string, allergy: string) {
  const normalizedMedication = normalizeText(medicationName);
  const normalizedAllergy = normalizeText(allergy);
  const medicationClass = resolveMedicationClass(medicationName);
  const allergyClass = resolveMedicationClass(allergy);

  if (normalizedAllergy.includes("ninguna") || normalizedAllergy.includes("no conocida")) {
    return false;
  }

  return (
    normalizedMedication.includes(normalizedAllergy) ||
    normalizedAllergy.includes(normalizedMedication) ||
    medicationClass === allergyClass ||
    (normalizedAllergy.includes("penicilin") && medicationClass === "betalactamico")
  );
}

export function medicationScheduleLooksPrn(schedule: string, frequency: string) {
  const normalizedSchedule = normalizeText(schedule);
  const normalizedFrequency = normalizeText(frequency);
  return normalizedSchedule.includes("prn") || normalizedFrequency.includes("segun") || normalizedFrequency.includes("prn");
}

export function inferMedicationDueAt(order: MedicationOrder) {
  if (medicationScheduleLooksPrn(order.schedule, order.frequency)) {
    return null;
  }

  const firstTime = order.schedule
    .split("-")
    .map((token) => token.trim())
    .find((token) => /^\d{1,2}:\d{2}$/.test(token));

  if (!firstTime) {
    return `${order.startDate}T00:00:00`;
  }

  return `${order.startDate}T${firstTime}:00`;
}

export function buildCountsByPriority<T extends { priority: ObservationPriority }>(items: T[]) {
  return items.reduce<Record<ObservationPriority, number>>(
    (accumulator, item) => {
      accumulator[item.priority] += 1;
      return accumulator;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      informative: 0,
    }
  );
}
