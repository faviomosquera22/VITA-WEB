import type {
  PriorityCandidate,
  TriageLevel,
  TriagePriority,
  UnifiedTriageColor,
} from "./triageTypes";

export const TRIAGE_LEVELS: Record<TriagePriority, TriageLevel> = {
  1: {
    color: "RED",
    priority: 1,
    label: "Resucitacion",
    maxWaitMinutes: 0,
    colorHex: "#dc2626",
  },
  2: {
    color: "ORANGE",
    priority: 2,
    label: "Emergencia",
    maxWaitMinutes: 10,
    colorHex: "#f97316",
  },
  3: {
    color: "YELLOW",
    priority: 3,
    label: "Urgente",
    maxWaitMinutes: 60,
    colorHex: "#eab308",
  },
  4: {
    color: "GREEN",
    priority: 4,
    label: "Menos urgente",
    maxWaitMinutes: 120,
    colorHex: "#16a34a",
  },
  5: {
    color: "BLUE",
    priority: 5,
    label: "No urgente",
    maxWaitMinutes: 240,
    colorHex: "#0284c7",
  },
};

export const TIE_BREAK_SOURCE_ORDER: Array<PriorityCandidate["source"]> = [
  "critical_findings",
  "vital_signs",
  "subprotocol",
  "discriminator",
];

export const SUBPROTOCOL_LABELS = {
  TRAUMA: "Trauma",
  BURNS: "Quemaduras",
  SEXUAL_VIOLENCE: "Violencia sexual",
  OBSTETRIC: "Obstetrico",
  INTOXICATION: "Intoxicaciones",
  MENTAL_HEALTH: "Salud mental",
} as const;

export const ARRIVAL_MODES = [
  "walking",
  "wheelchair",
  "stretcher",
  "ambulance",
  "police",
  "transfer",
] as const;

export function levelFromPriority(priority: TriagePriority): TriageLevel {
  return TRIAGE_LEVELS[priority];
}

export function colorFromPriority(priority: TriagePriority): UnifiedTriageColor {
  return TRIAGE_LEVELS[priority].color;
}

export function isPediatricByAge(age: number) {
  return age < 14;
}

export function shouldAskObstetric(sex: "M" | "F" | "other", age: number) {
  return sex === "F" && age >= 10 && age <= 55;
}
