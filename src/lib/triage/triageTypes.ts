export type TriageColor = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
export type TriagePriority = 1 | 2 | 3 | 4 | 5;

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

const priorityColorMap: Record<TriagePriority, TriageColor> = {
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

export function getColorByPriority(priority: TriagePriority): TriageColor {
  return priorityColorMap[priority];
}

export function getPriorityLabel(priority: TriagePriority): string {
  return priorityLabelMap[priority];
}

export function getWaitMinutesByPriority(
  priority: TriagePriority,
  config: TriageConfig
): number {
  return config.waitTimes[String(priority) as `${TriagePriority}`];
}

export function highestPriority(
  values: Array<TriagePriority | null | undefined>
): TriagePriority {
  const filtered = values.filter((value): value is TriagePriority => Boolean(value));

  if (filtered.length === 0) {
    return 5;
  }

  return filtered.reduce((current, candidate) =>
    candidate < current ? candidate : current
  );
}
