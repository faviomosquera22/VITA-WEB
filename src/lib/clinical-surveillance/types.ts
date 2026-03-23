export type ObservationPriority = "critical" | "high" | "medium" | "informative";

export type ObservationStatus = "new" | "acknowledged" | "dismissed" | "resolved";

export type ObservationSource =
  | "vital_signs"
  | "diagnosis"
  | "medication_orders"
  | "medication_administrations"
  | "pain_scale"
  | "fluid_balance"
  | "clinical_notes"
  | "reevaluation"
  | "allergies"
  | "grouping"
  | "rules_engine"
  | "ai_adapter";

export interface VitalSigns {
  recordedAt: string;
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  spo2: number;
  painScale: number;
  glucose?: number;
  professional?: string;
  outOfRangeFlags?: string[];
  rawBloodPressure?: string;
}

export interface MedicationOrder {
  id: string;
  name: string;
  normalizedName: string;
  className: string;
  dose: string;
  frequency: string;
  route: string;
  schedule: string;
  startDate: string;
  indication: string;
  prescriber: string;
  administrationStatus: "Pendiente" | "Administrado" | "Omitido";
  notes?: string;
}

export interface MedicationAdministration {
  id: string;
  medicationName: string;
  normalizedMedicationName: string;
  route: string;
  administeredAt: string;
  responsible: string;
  status: "Activa" | "Completada" | "Suspendida";
  notes?: string;
}

export interface FluidBalanceSummary {
  id: string;
  recordedAt: string;
  shift: string;
  totalIntakeMl: number;
  totalOutputMl: number;
  netBalanceMl: number;
  observations: string;
}

export interface ClinicalNoteSummary {
  id: string;
  datetime: string;
  author: string;
  specialty: string;
  module: "nursing" | "medical";
  text: string;
}

export interface ActivePatient {
  id: string;
  patientName: string;
  medicalRecordNumber: string;
  currentDiagnosis: string;
  diagnoses: string[];
  serviceArea: string;
  careMode: string;
  currentStatus: string;
  assignedProfessional: string;
  allergies: string[];
  vitalSigns: VitalSigns[];
  medicationOrders: MedicationOrder[];
  medicationAdministrations: MedicationAdministration[];
  fluidBalances: FluidBalanceSummary[];
  clinicalNotes: ClinicalNoteSummary[];
  lastReevaluationAt: string | null;
  lastRecordAt: string | null;
  requiresFluidBalance: boolean;
  metadata: Record<string, unknown>;
}

export interface SurveillanceRuleConfig {
  evaluationReferenceTime: string;
  staleVitalsHours: number;
  staleFluidBalanceHours: number;
  painReevaluationHours: number;
  abnormalReevaluationHours: number;
  medicationAdministrationGraceHours: number;
  groupedObservationMinimum: number;
}

export interface RulesEngineContext {
  evaluatedAt: string;
  config: SurveillanceRuleConfig;
}

export interface TriggeredRule {
  id: string;
  ruleId: string;
  ruleName: string;
  patientId: string;
  patientName: string;
  priority: ObservationPriority;
  title: string;
  description: string;
  sourceModules: ObservationSource[];
  metadata: Record<string, unknown>;
  triggeredAt: string;
}

export interface ClinicalRule {
  id: string;
  name: string;
  description: string;
  sourceModules: ObservationSource[];
  evaluate: (patient: ActivePatient, context: RulesEngineContext) => TriggeredRule[];
}

export interface ClinicalObservation {
  id: string;
  dedupeKey: string;
  patientId: string;
  patientName: string;
  priority: ObservationPriority;
  title: string;
  description: string;
  triggeredRules: TriggeredRule[];
  sourceModules: ObservationSource[];
  createdAt: string;
  updatedAt: string;
  status: ObservationStatus;
  metadata: Record<string, unknown>;
  reviewedAt: string | null;
  reviewedBy: string | null;
  narrativeSource: "rules" | "ai_adapter";
}

export type ObservationAuditAction =
  | "generated"
  | "regenerated"
  | "acknowledged"
  | "dismissed"
  | "resolved";

export interface ObservationAuditEntry {
  id: string;
  observationId: string;
  action: ObservationAuditAction;
  actorName: string;
  actorRole: string;
  createdAt: string;
  detail: string;
  metadata: Record<string, unknown>;
}

export interface ObservationReviewInput {
  status: Extract<ObservationStatus, "acknowledged" | "dismissed" | "resolved">;
  comment?: string;
}

export interface ClinicalSurveillancePayload {
  generatedAt: string;
  total: number;
  countsByPriority: Record<ObservationPriority, number>;
  observations: ClinicalObservation[];
  dataSource: "mock_current_project";
  aiNarrativeEnabled?: boolean;
  aiNarrativeProvider?: "gemini" | "openai" | null;
}
