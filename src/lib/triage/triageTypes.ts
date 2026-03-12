export type LegacyTriageColor = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
export type UnifiedTriageColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE";
export type TriageColor = LegacyTriageColor;

export type TriagePriority = 1 | 2 | 3 | 4 | 5;

export interface TriageLevel {
  color: UnifiedTriageColor;
  priority: TriagePriority;
  label: "Resucitacion" | "Emergencia" | "Urgente" | "Menos urgente" | "No urgente";
  maxWaitMinutes: number;
  colorHex: string;
}

export interface TriageIdentification {
  patientId?: string;
  cedula?: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  ageUnit: "years" | "months" | "days";
  isPediatric: boolean;
  isObstetric: boolean;
  sex: "M" | "F" | "other";
  arrivalMode: "walking" | "wheelchair" | "stretcher" | "ambulance" | "police" | "transfer";
  arrivalTime: string;
  isCompanied: boolean;
  companionName?: string;
  companionRelation?: string;
  companionPhone?: string;
  consciousOnArrival: boolean;
  canCommunicate: boolean;
}

export type SubprotocolType =
  | "TRAUMA"
  | "BURNS"
  | "SEXUAL_VIOLENCE"
  | "OBSTETRIC"
  | "INTOXICATION"
  | "MENTAL_HEALTH";

export interface TriageChiefComplaint {
  chiefComplaintText: string;
  onsetTime: string;
  onsetUnit: "minutes" | "hours" | "days";
  discriminatorId: string;
  discriminatorLabel: string;
  basePriority: TriagePriority;
  activatedSubprotocols: SubprotocolType[];
}

export interface VitalCriticalFlag {
  parameter: string;
  value: number;
  threshold: string;
  suggestedPriority: TriagePriority;
  message: string;
}

export interface VitalSigns {
  takenAt: string;
  takenBy: string;
  systolicBP?: number;
  diastolicBP?: number;
  bpArm?: "left" | "right";
  heartRate?: number;
  heartRhythm?: "regular" | "irregular";
  respiratoryRate?: number;
  temperature?: number;
  temperatureSite?: "oral" | "axillar" | "rectal" | "tympanic";
  spo2?: number;
  spo2OnSupplementalO2?: boolean;
  glucometry?: number;
  glucometryState?: "fasting" | "postprandial" | "random";
  weight?: number;
  height?: number;
  bmi?: number;
  glasgowTotal?: number;
  glasgowEye?: number;
  glasgowVerbal?: number;
  glasgowMotor?: number;
  pupilsReactive?: boolean;
  pupilsSymmetric?: boolean;
  painScale?: number;
  painLocation?: string;
  gestationalAge?: number;
  fetalHeartRate?: number;
  criticalFlags: VitalCriticalFlag[];
}

export interface CriticalFindings {
  airwayCompromised: boolean;
  stridor: boolean;
  apnea: boolean;
  foreignBody: boolean;
  severeRespiratoryDistress: boolean;
  cyanosis: boolean;
  accessoryMuscleUse: boolean;
  uncontrolledBleeding: boolean;
  shockSigns: boolean;
  capillaryRefill?: number;
  alteredConsciousness: boolean;
  seizureActive: boolean;
  focalNeurologicDeficit: boolean;
  severePainUncontrolled: boolean;
  anaphylaxis: boolean;
  sepsisSigns: boolean;
  strokeSigns: boolean;
  acuteChestPain: boolean;
  pregnancyComplications: boolean;
}

export interface TriageHistory {
  symptomDuration: string;
  symptomProgression: "improving" | "stable" | "worsening" | "sudden";
  previousTreatmentAttempted: boolean;
  previousTreatmentDetail?: string;
  knownAllergies: boolean;
  allergyDetail?: string;
  currentMedications: boolean;
  medicationDetail?: string;
  relevantChronicConditions: string[];
  immunocompromised: boolean;
  anticoagulated: boolean;
  recentSurgery: boolean;
  recentDischarge: boolean;
}

export interface TraumaData {
  mechanism:
    | "mva_high"
    | "mva_low"
    | "fall_high"
    | "fall_low"
    | "penetrating"
    | "blunt"
    | "crush"
    | "blast"
    | "other";
  mechanismDetail?: string;
  lossOfConsciousness: boolean;
  locDuration?: "seconds" | "minutes" | "over30min";
  headTrauma: boolean;
  cervicalPain: boolean;
  chestTrauma: boolean;
  chestPain: boolean;
  abdominalTrauma: boolean;
  abdominalPain: boolean;
  pelvicTrauma: boolean;
  spineTrauma: boolean;
  penetratingWound: boolean;
  amputation: boolean;
  evisceration: boolean;
  uncontrolledHemorrhage: boolean;
  suspectedSpinalInjury: boolean;
  severeHeadTrauma: boolean;
  multipleMajorFractures: boolean;
  neurovascularCompromise: boolean;
  deformity: boolean;
  openFracture: boolean;
  traumaticBrainInjurySigns: boolean;
  isPolitrauma: boolean;
}

export interface BurnData {
  burnType: ("flame" | "scald" | "chemical" | "electrical" | "radiation" | "contact")[];
  tbsaPercent: number;
  burnMethod: "rule_of_9" | "lund_browder" | "palm";
  depth: ("superficial" | "partial_superficial" | "partial_deep" | "full_thickness")[];
  faceInvolved: boolean;
  handsInvolved: boolean;
  feetInvolved: boolean;
  genitalsInvolved: boolean;
  jointsInvolved: boolean;
  circumferentialBurn: boolean;
  airwayBurn: boolean;
  inhalationInjury: boolean;
  closedSpaceExposure: boolean;
  isElectrical: boolean;
  isChemical: boolean;
  associatedTrauma: boolean;
  isPediatric: boolean;
  patientAge: number;
  hemodynamicInstability: boolean;
}

export interface SexualViolenceData {
  codePurpleActivated: true;
  hoursSinceEvent: number;
  exactTimeKnown: boolean;
  activeBleeding: boolean;
  visibleInjuries: boolean;
  injuryLocations?: string[];
  possiblePregnancy: boolean;
  isMinor: boolean;
  hadBathOrShower: boolean;
  hadClothingChange: boolean;
  emotionalCrisis: boolean;
  dissociativeState: boolean;
  suicidalIdeation: boolean;
  requiresPrivateSpace: boolean;
  prefersFemaleStaff: boolean;
}

export interface ObstetricData {
  gestationalAgeWeeks?: number;
  isPuerperium: boolean;
  activeLabor: boolean;
  memoraneRupture: boolean;
  vaginalBleeding: boolean;
  bleedingAmount?: "spotting" | "moderate" | "heavy" | "hemorrhagic";
  abdominalPain: boolean;
  painType?: "contraction" | "constant" | "localized";
  eclampsia: boolean;
  severePreeclampsia: boolean;
  placentaPrevia: boolean;
  abruptionSigns: boolean;
  prolapsedCord: boolean;
  fetalDistress: boolean;
  ectopicSigns: boolean;
  headache: boolean;
  visualDisturbances: boolean;
  epigastricPain: boolean;
  decreasedFetalMovement: boolean;
  hemorrhagiaPostpartum: boolean;
  infectionSigns: boolean;
  thrombosisRisk: boolean;
}

export interface IntoxicationData {
  substanceType: (
    | "medication"
    | "alcohol"
    | "illicit_drug"
    | "pesticide"
    | "caustic"
    | "hydrocarbon"
    | "co"
    | "other"
  )[];
  substanceName?: string;
  estimatedDose?: string;
  routeOfExposure: ("ingested" | "inhaled" | "skin" | "injected" | "ocular")[];
  timeSinceExposure?: number;
  intentional: boolean;
  toxidrome?:
    | "cholinergic"
    | "anticholinergic"
    | "sympathomimetic"
    | "opioid"
    | "sedative"
    | "serotonin"
    | "unknown";
  alteredConsciousness: boolean;
  seizures: boolean;
  severeVomiting: boolean;
  oralBurns: boolean;
  bronchospasm: boolean;
  bradycardia: boolean;
  arrhythmia: boolean;
  miosis: boolean;
  mydriasis: boolean;
  salivation: boolean;
  lacrimation: boolean;
  urinaryIncontinence: boolean;
  defecation: boolean;
  muscleParalysis: boolean;
}

export interface MentalHealthData {
  presentationType: (
    | "agitation"
    | "suicidal_ideation"
    | "suicide_attempt"
    | "psychosis"
    | "anxiety_crisis"
    | "dissociation"
    | "self_harm"
  )[];
  activeSuicidalIdeation: boolean;
  specificPlan: boolean;
  accessToMeans: boolean;
  priorAttempts: boolean;
  recentAttempt: boolean;
  suicideAttemptMethod?:
    | "hanging"
    | "overdose"
    | "cutting"
    | "jumping"
    | "firearm"
    | "drowning"
    | "other";
  agitationLevel?: "mild" | "moderate" | "severe";
  violentBehavior: boolean;
  riskToOthers: boolean;
  substanceInfluence: boolean;
  knownPsychiatricDiagnosis: boolean;
  psychiatricMedicationStopped: boolean;
  requiresContainment: boolean;
  requiresSecurityAlert: boolean;
}

export interface CriticalAlert {
  type: "vital" | "finding" | "subprotocol" | "legal";
  severity: "warning" | "critical" | "immediate";
  message: string;
  parameter?: string;
  value?: string | number;
}

export interface ImmediateAction {
  order: number;
  action: string;
  responsible: "nurse" | "doctor" | "social_worker" | "security" | "all";
  urgent: boolean;
}

export interface TriageResult {
  assignedLevel: TriageLevel;
  suggestedColor: UnifiedTriageColor;
  suggestedPriority: TriagePriority;
  maxWaitMinutes: number;
  prioritySource: "discriminator" | "vital_signs" | "critical_findings" | "subprotocol" | "combined";
  activatedSubprotocols: SubprotocolType[];
  clinicalReasons: string[];
  criticalAlerts: CriticalAlert[];
  immediateActions: ImmediateAction[];
  missingCriticalData: string[];
  calculatedScores: {
    news2?: number;
    glasgowTotal?: number;
    burnTBSA?: number;
    gestationalRisk?: string;
  };
  codePurple: boolean;
  mandatoryNotification: boolean;
  legalDocumentationRequired: boolean;
  generatedAt: string;
  triageNurseId: string;
  triageSessionId: string;
}

export interface TriageAuditEntry {
  action: "created" | "modified" | "confirmed" | "reclassified";
  userId: string;
  userName: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

export interface TriageFormData {
  identification: TriageIdentification;
  chiefComplaint: TriageChiefComplaint;
  vitalSigns: VitalSigns;
  criticalFindings: CriticalFindings;
  history: TriageHistory;
  trauma?: TraumaData;
  burns?: BurnData;
  sexualViolence?: SexualViolenceData;
  obstetric?: ObstetricData;
  intoxication?: IntoxicationData;
  mentalHealth?: MentalHealthData;
  suggestedResult: TriageResult;
  confirmedBy?: string;
  confirmedAt?: string;
  confirmedLevel?: UnifiedTriageColor;
  reclassificationReason?: string;
  auditTrail: TriageAuditEntry[];
}

export interface PriorityCandidate {
  source: "discriminator" | "vital_signs" | "critical_findings" | "subprotocol";
  module:
    | "base"
    | "adult_vitals"
    | "pediatric_vitals"
    | "critical_findings"
    | "trauma"
    | "burns"
    | "sexual_violence"
    | "obstetric"
    | "intoxication"
    | "mental_health";
  priority: TriagePriority;
  reasons: string[];
  alerts: CriticalAlert[];
  actions: ImmediateAction[];
  activatedSubprotocols?: SubprotocolType[];
  codePurple?: boolean;
  mandatoryNotification?: boolean;
  legalDocumentationRequired?: boolean;
  missingCriticalData?: string[];
}

export interface DiscriminatorConfigItem {
  id: string;
  label: string;
  system: string;
  basePriority: TriagePriority;
  suggestsSubprotocols: SubprotocolType[];
  mandatoryVitals: Array<keyof VitalSigns | string>;
  criticalIfCombinedWith: string[];
}

export interface SubprotocolActivationConfigItem {
  id: SubprotocolType;
  keywords: string[];
  discriminatorIds: string[];
  thresholds?: Record<string, number>;
}

export interface NumericRange {
  low?: number | null;
  high?: number | null;
  highCritical?: number | null;
}

export interface AdultThresholdConfig {
  systolicBP: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  heartRate: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  respiratoryRate: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  spo2: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  temperature: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  glasgow: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  glucometry: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  painScale: {
    priority2: NumericRange;
    priority3: NumericRange;
  };
}

export interface PediatricBandThreshold {
  ageMinDays?: number;
  ageMaxDays?: number;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  ageMinYears?: number;
  ageMaxYears?: number;
  heartRate: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  respiratoryRate: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  systolicBP: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
  spo2: {
    priority1: NumericRange;
    priority2: NumericRange;
    priority3: NumericRange;
  };
}

export interface VitalThresholdConfig {
  adult: AdultThresholdConfig;
  pediatric: Record<string, PediatricBandThreshold>;
}

export type TriageSubprotocolId =
  | "trauma"
  | "quemaduras"
  | "violencia_sexual"
  | "obstetrico"
  | "intoxicaciones"
  | "salud_mental";

export interface TriageIdentificationInput {
  patientName: string;
  documentNumber: string;
  ageYears: number | null;
  sexBiological: "femenino" | "masculino" | "otro" | "";
  possiblePregnancy: boolean;
}

export interface TriageComplaintInput {
  reason: string;
  discriminator: string;
  discriminatorTags: string[];
}

export interface TriageVitalsInput {
  systolicBp: number | null;
  diastolicBp: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperatureC: number | null;
  spo2: number | null;
  glasgow: number | null;
  painScale: number | null;
  capillaryGlucose: number | null;
}

export interface TriageCriticalFindingsInput {
  airwayCompromise: boolean;
  severeRespiratoryDistress: boolean;
  activeUncontrolledBleeding: boolean;
  shockSigns: boolean;
  alteredConsciousness: boolean;
  seizureActive: boolean;
  chestPainIschemic: boolean;
  focalNeurologicDeficit: boolean;
  anaphylaxis: boolean;
  sepsisSuspicion: boolean;
}

export interface TriageClinicalHistoryInput {
  currentIllnessSummary: string;
  relevantHistorySummary: string;
  comorbidities: string[];
}

export interface TraumaProtocolInput {
  enabled: boolean;
  mechanism: string;
  lossOfConsciousness: boolean;
  activeBleeding: boolean;
  deformity: boolean;
  glasgow: number | null;
  cervicalPain: boolean;
  thoracicPain: boolean;
  abdominalPain: boolean;
  neurovascularCompromise: boolean;
  polytrauma: boolean;
  penetratingWound: boolean;
  amputation: boolean;
  evisceration: boolean;
  uncontrolledBleeding: boolean;
  suspectedSpinalCordInjury: boolean;
  severeTbi: boolean;
  multipleMajorFractures: boolean;
}

export interface BurnProtocolInput {
  enabled: boolean;
  burnType: "termica" | "quimica" | "electrica" | "radiacion" | "otro" | "";
  bodySurfacePercent: number | null;
  specialRegion: boolean;
  airwayCompromise: boolean;
  closedSpaceFire: boolean;
  circumferential: boolean;
  pediatricCase: boolean;
  unstable: boolean;
}

export interface SexualViolenceProtocolInput {
  enabled: boolean;
  timeSinceEventHours: number | null;
  bleeding: boolean;
  lesions: boolean;
  possiblePregnancy: boolean;
  minor: boolean;
  showeredOrChangedClothes: boolean;
  emotionalCrisis: boolean;
}

export interface ObstetricProtocolInput {
  enabled: boolean;
  gestationalWeeks: number | null;
  vaginalBleeding: boolean;
  severeAbdominalPain: boolean;
  severeHeadache: boolean;
  severeHypertension: boolean;
  contractions: boolean;
  decreasedFetalMovements: boolean;
  postpartumHemorrhage: boolean;
}

export interface IntoxicationProtocolInput {
  enabled: boolean;
  suspectedSubstance: string;
  ingestionTimeHours: number | null;
  alteredConsciousness: boolean;
  respiratoryDepression: boolean;
  seizures: boolean;
  hemodynamicInstability: boolean;
  suicidalIntent: boolean;
}

export interface MentalHealthProtocolInput {
  enabled: boolean;
  severeAgitation: boolean;
  suicideRisk: boolean;
  suicidePlan: boolean;
  violentBehavior: boolean;
  hallucinations: boolean;
  intoxicationAssociated: boolean;
  selfHarmInjury: boolean;
}

export interface TriageProtocolInputs {
  trauma: TraumaProtocolInput;
  quemaduras: BurnProtocolInput;
  violenciaSexual: SexualViolenceProtocolInput;
  obstetrico: ObstetricProtocolInput;
  intoxicaciones: IntoxicationProtocolInput;
  saludMental: MentalHealthProtocolInput;
}

export interface TriageInput {
  identification: TriageIdentificationInput;
  complaint: TriageComplaintInput;
  vitals: TriageVitalsInput;
  criticalFindings: TriageCriticalFindingsInput;
  clinicalHistory: TriageClinicalHistoryInput;
  protocolInputs: TriageProtocolInputs;
}

export interface TriageRuleResult {
  source:
    | "base"
    | "adult_vitals"
    | "pediatric_vitals"
    | "obstetric"
    | "trauma"
    | "quemaduras"
    | "violencia_sexual"
    | "intoxicaciones"
    | "salud_mental";
  priority: TriagePriority;
  reasons: string[];
  alerts: string[];
  immediateActions: string[];
  activatedProtocols?: TriageSubprotocolId[];
  missingData?: string[];
}

export interface TriageEngineResult {
  suggestedColor: TriageColor;
  priority: TriagePriority;
  priorityLabel: string;
  maxWaitMinutes: number;
  reasons: string[];
  protocolsActivated: TriageSubprotocolId[];
  alerts: string[];
  immediateActions: string[];
  missingData: string[];
  candidates: TriageRuleResult[];
}

export interface TriageManualOverride {
  color: TriageColor;
  priority: TriagePriority;
  maxWaitMinutes: number;
  reason: string;
}

export interface TriageConfig {
  waitTimes: Record<`${TriagePriority}`, number>;
  adultVitals: {
    criticalSpo2: number;
    criticalSystolicBpLow: number;
    criticalSystolicBpHigh: number;
    criticalHeartRateLow: number;
    criticalHeartRateHigh: number;
    criticalRespiratoryRateLow: number;
    criticalRespiratoryRateHigh: number;
    warningTemperatureHigh: number;
  };
  pediatricVitals: Array<{
    minAgeInclusive: number;
    maxAgeInclusive: number;
    criticalHeartRateHigh: number;
    criticalRespiratoryRateHigh: number;
    criticalSystolicBpLow: number;
  }>;
  obstetric: {
    severeSystolicBp: number;
    severeDiastolicBp: number;
  };
  burns: {
    highSurfaceAdult: number;
    highSurfacePediatric: number;
    moderateSurfaceAdult: number;
    moderateSurfacePediatric: number;
  };
  intoxications: {
    urgentIngestionHours: number;
  };
  sexualViolence: {
    urgentWindowHours: number;
  };
}

const legacyPriorityColorMap: Record<TriagePriority, Extract<TriageColor, "rojo" | "naranja" | "amarillo" | "verde" | "azul">> = {
  1: "rojo",
  2: "naranja",
  3: "amarillo",
  4: "verde",
  5: "azul",
};

const priorityLabelMap: Record<TriagePriority, string> = {
  1: "Prioridad I",
  2: "Prioridad II",
  3: "Prioridad III",
  4: "Prioridad IV",
  5: "Prioridad V",
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function toUniqueList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function getColorByPriority(
  priority: TriagePriority
): Extract<TriageColor, "rojo" | "naranja" | "amarillo" | "verde" | "azul"> {
  return legacyPriorityColorMap[priority];
}

export function getPriorityLabel(priority: TriagePriority): string {
  return priorityLabelMap[priority];
}

export function getWaitMinutesByPriority(priority: TriagePriority, config: TriageConfig): number {
  return config.waitTimes[String(priority) as `${TriagePriority}`];
}

export function highestPriority(values: Array<TriagePriority | null | undefined>): TriagePriority {
  const filtered = values.filter((value): value is TriagePriority => Boolean(value));

  if (filtered.length === 0) {
    return 5;
  }

  return filtered.reduce((current, candidate) => (candidate < current ? candidate : current));
}

export interface LegacyTriageRecord {
  id: string;
  createdAt: string;
  triageInput: TriageInput;
  engineResult: TriageEngineResult;
  manualOverride?: TriageManualOverride | null;
}
