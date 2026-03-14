export type PatientDocumentType = "cedula" | "pasaporte" | "carne_refugiado";
export type PatientSource = "manual" | "registro_civil";

export interface PatientIdentification {
  documentType: PatientDocumentType;
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  birthDate: string | null;
  age: number | null;
  sexBiological: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  civilStatus: string;
  educationLevel: string;
  occupation: string;
  workplace: string;
  religion: string;
  bloodGroup: string;
  photoUrl: string;
}

export interface PatientContact {
  address: string;
  parish: string;
  canton: string;
  province: string;
  gpsLat: string;
  gpsLng: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsapp: string;
  email: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  legalRepresentative: string;
}

export interface PatientFinancing {
  affiliationType: "IESS" | "ISSFA" | "ISSPOL" | "privado" | "particular" | "otro";
  iessNumber: string;
  privateInsurer: string;
  privatePolicyNumber: string;
  employer: string;
  copayExemption: string;
  disabilityPercent: number | null;
  conadisNumber: string;
}

export interface PatientLifestyle {
  tobacco: string;
  alcohol: string;
  drugs: string;
  physicalActivityMinutesPerWeek: number | null;
  dietType: string;
  sleepHours: number | null;
  occupationalRiskExposure: string;
}

export interface PatientAllergies {
  medications: string[];
  foods: string[];
  environmental: string[];
  contrastOrLatex: string[];
  reactionDate: string | null;
  reactionManagement: string;
  visualAlertActive: boolean;
}

export interface PatientAntecedentes {
  personalPathological: string[];
  previousHospitalizations: string[];
  surgeries: string[];
  traumaHistory: string[];
  transfusions: string[];
  infectiousDiseases: string[];
  stdHistory: string[];
  mentalHealthHistory: string[];
  familyHistory: string[];
  gynecoObstetricHistory: string[];
  neonatalPediatricHistory: string[];
  lifestyle: PatientLifestyle;
  allergies: PatientAllergies;
}

export interface PatientReviewBySystems {
  general: string;
  cardiovascular: string;
  respiratory: string;
  digestive: string;
  genitourinary: string;
  neurologic: string;
  musculoskeletal: string;
  dermatologic: string;
  psychiatric: string;
}

export interface PatientPhysicalExam {
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  bmi: string;
  abdominalPerimeterCm: string;
  capillaryGlucose: string;
  painScale: number | null;
  glasgow: number | null;
  generalAppearance: string;
  skin: string;
  headNeck: string;
  ent: string;
  thoraxLungs: string;
  cardiovascular: string;
  abdomen: string;
  extremities: string;
  neurologic: string;
  genitourinary: string;
  rectal: string;
  gyneco: string;
}

export interface PatientConsultation {
  consultedAt: string;
  establishment: string;
  service: string;
  professionalName: string;
  professionalSenescyt: string;
  consultationType: "primera_vez" | "subsecuente" | "urgencia" | "teleconsulta";
  consultationDurationMinutes: number | null;
  literalReason: string;
  evolutionTime: string;
  mainSymptom: string;
  currentIllnessNarrative: string;
  previousEpisodeTreatments: string;
  reviewBySystems: PatientReviewBySystems;
  physicalExam: PatientPhysicalExam;
}

export interface PatientDiagnosisEntry {
  cie11Code: string;
  description: string;
  type: "definitivo" | "presuntivo" | "descartado";
  condition: "principal" | "secundario" | "complicacion";
  pregnancyRelated: boolean;
}

export interface PatientPrescriptionOrder {
  dciName: string;
  commercialName: string;
  concentration: string;
  pharmaceuticalForm: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  unitsToDispense: string;
  patientInstructions: string;
}

export interface PatientTherapeuticPlan {
  linkedDiagnosisCodes: string[];
  nonPharmacological: string;
  followUpInstructions: string;
  alarmSignsExplained: string;
  referralDestination: string;
}

export interface PatientLaboratory {
  requests: string[];
  criticalResults: string[];
  criticalResultAcknowledged: boolean;
  priority: string;
  clinicalJustification: string;
}

export interface PatientImaging {
  requests: string[];
  reports: string[];
  pacsLinks: string[];
  priority: string;
  clinicalJustification: string;
}

export interface PatientHospitalization {
  admissionType: string;
  assignedService: string;
  assignedBed: string;
  admissionDiagnosisCie11: string;
  admissionCondition: string;
  dailySoapEvolutions: string[];
  nursingShiftNotes: string[];
  fluidBalanceNotes: string[];
  medicalOrders: string[];
  kardexAdministrationNotes: string[];
  dischargeSummary: string;
}

export interface PatientUrgencyTriage {
  arrivalMode: string;
  accompaniedBy: string;
  initialCondition: string;
  triageModel: "Manchester" | "ESI" | "otro";
  triageDiscriminator: string;
  triageLevel: string;
  triageColor: string;
  maxWaitMinutes: number | null;
  retriageAutomatic: boolean;
}

export interface PatientNursingReport {
  shiftSummary: string;
  fallEvents: string;
  pressureUlcerRecord: string;
  physicalRestraintRecord: string;
  adverseEvents: string;
}

export interface PatientAppointments {
  scheduleNotes: string;
  reminderPreference: string;
  noShowHistory: string;
}

export interface PatientReferrals {
  referralType: string;
  referenceCode: string;
  referenceReason: string;
  destination: string;
  clinicalSummary: string;
  relevantFindings: string;
  treatmentsPerformed: string;
  recommendedTreatment: string;
  counterReferenceSummary: string;
}

export interface PatientPublicHealth {
  notifiableDisease: boolean;
  suspectedCondition: string;
  siveAlertCode: string;
  outbreakCluster: string;
  surveillanceNotes: string;
  reportedAt: string | null;
}

export interface PatientAdmissionContext {
  admissionArea: string;
  sourceEstablishment: string;
  sourceService: string;
  bedOrDesk: string;
}

export interface PatientConsentRecord {
  required: boolean;
  obtained: boolean;
  type: string;
  scope: string;
  explainedRisks: string;
  explainedBenefits: string;
  explainedAlternatives: string;
  obtainedBy: string;
  obtainedAt: string | null;
  witnessName: string;
  representativeName: string;
  representativeRelationship: string;
  decisionCapacity: string;
  refusalReason: string;
}

export interface PatientInterconsultation {
  requested: boolean;
  specialty: string;
  priority: string;
  reason: string;
  clinicalSummary: string;
  requestedAt: string | null;
  responseSummary: string;
}

export type PatientMspChecklistStatus =
  | "completo"
  | "incompleto"
  | "no_aplica";

export interface PatientMspChecklistItem {
  code: string;
  title: string;
  reference: string;
  required: boolean;
  status: PatientMspChecklistStatus;
  pendingItems: string[];
}

export interface PatientMspComplianceSnapshot {
  score: number;
  criticalPendingItems: string[];
  forms: PatientMspChecklistItem[];
  generatedAt: string;
}

export interface PatientProgramTracking {
  diabetes: boolean;
  hypertension: boolean;
  tuberculosis: boolean;
  maternalChild: boolean;
  olderAdult: boolean;
  mentalHealth: boolean;
  notes: string;
}

export interface PatientPharmacyContext {
  stockControlNotes: string;
  psychotropicsDoubleSignature: boolean;
}

export interface PatientIndicatorsContext {
  operational: string;
  clinical: string;
  administrative: string;
}

export interface PatientCompliance {
  twoFactorEnabled: boolean;
  autoLogout15m: boolean;
  immutableSignedNotes: boolean;
  aes256DataEncryption: boolean;
  informedConsentDigital: boolean;
  sensitiveDataConsent: boolean;
  backupEvery4h: boolean;
  disasterRecoveryValidated: boolean;
  offlineSyncEnabled: boolean;
}

export interface RegisteredPatientRecord {
  id: string;
  medicalRecordNumber: string;
  source: PatientSource;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByUserName: string;
  identification: PatientIdentification;
  contact: PatientContact;
  financing: PatientFinancing;
  antecedentes: PatientAntecedentes;
  consultation: PatientConsultation;
  diagnostics: PatientDiagnosisEntry[];
  therapeuticPlan: PatientTherapeuticPlan;
  prescriptions: PatientPrescriptionOrder[];
  laboratory: PatientLaboratory;
  imaging: PatientImaging;
  hospitalization: PatientHospitalization;
  urgency: PatientUrgencyTriage;
  admission: PatientAdmissionContext;
  consent: PatientConsentRecord;
  interconsultation: PatientInterconsultation;
  nursingReport: PatientNursingReport;
  appointments: PatientAppointments;
  referrals: PatientReferrals;
  publicHealth: PatientPublicHealth;
  programTracking: PatientProgramTracking;
  pharmacyContext: PatientPharmacyContext;
  indicatorsContext: PatientIndicatorsContext;
  compliance: PatientCompliance;
  mspCompliance: PatientMspComplianceSnapshot;
}

export type PatientIntakePayload = Omit<
  RegisteredPatientRecord,
  | "id"
  | "medicalRecordNumber"
  | "createdAt"
  | "updatedAt"
  | "identification"
  | "createdByUserId"
  | "createdByUserName"
  | "mspCompliance"
> & {
  identification: Omit<PatientIdentification, "age">;
};

export interface RegisteredPatientSummary {
  id: string;
  medicalRecordNumber: string;
  createdAt: string;
  source: PatientSource;
  fullName: string;
  documentNumber: string;
  age: number | null;
  consultationReason: string;
  principalDiagnosis: string;
  mspScore: number;
  criticalPendingCount: number;
}
