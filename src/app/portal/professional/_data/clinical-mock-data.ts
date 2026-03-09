export type UserRole = "professional" | "patient" | "institution";

export type SidebarSectionId = "main" | "clinical" | "support" | "system";

export type ProfessionalModuleId =
  | "home"
  | "patients"
  | "triage"
  | "follow_up"
  | "vitals"
  | "medication"
  | "vaccination"
  | "nutrition"
  | "emotional_health"
  | "reports"
  | "health_centers"
  | "health_education"
  | "alerts"
  | "care_team"
  | "settings";

export type TriageColor = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
export type RiskLevel = "alto" | "medio" | "bajo";
export type CareMode = "Hospitalizacion" | "Ambulatorio";
export type ServiceArea =
  | "Emergencia"
  | "Observacion"
  | "Hospitalizacion"
  | "Consulta externa";
export type FunctionalPattern =
  | "Oxigenacion"
  | "Nutricional-metabolico"
  | "Eliminacion"
  | "Actividad-ejercicio"
  | "Sueno-descanso"
  | "Cognitivo-perceptual"
  | "Afrontamiento";

export interface SidebarModuleItem {
  id: ProfessionalModuleId;
  label: string;
  path: string;
  section: SidebarSectionId;
  roles: UserRole[];
}

export interface VitalSignRecord {
  recordedAt: string;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  spo2: number;
  glucose: number;
  painScale: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  professional: string;
  outOfRangeFlags: string[];
}

export interface MedicationRecord {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  schedule: string;
  startDate: string;
  endDate?: string;
  indication: string;
  prescriber: string;
  adherence: string;
  administrationStatus: "Pendiente" | "Administrado" | "Omitido";
  notes: string;
}

export interface ClinicalNote {
  id: string;
  datetime: string;
  professional: string;
  specialty: string;
  note: string;
}

export interface NursingShiftReport {
  id: string;
  shift: string;
  service: string;
  date: string;
  generalStatus: string;
  consciousness: string;
  breathing: string;
  pain: string;
  oralTolerance: string;
  elimination: string;
  mobility: string;
  skin: string;
  proceduresDone: string;
  patientResponse: string;
  incidents: string;
  carePlan: string;
}

export interface FluidBalanceRecord {
  id: string;
  shift: string;
  date: string;
  intake: {
    oral: number;
    intravenous: number;
    dilutedMedication: number;
    enteralParenteral: number;
    other: number;
  };
  output: {
    diuresis: number;
    vomiting: number;
    drains: number;
    liquidStools: number;
    aspiration: number;
    insensibleLoss: number;
    other: number;
  };
  observations: string;
}

export interface KardexRecord {
  id: string;
  date: string;
  diagnosis: string;
  diet: string;
  activity: string;
  vitalSignsPlan: string;
  medicationPlan: string;
  solutions: string;
  procedures: string;
  nursingCare: string;
  elimination: string;
  observations: string;
  specialIndications: string;
}

export interface KardexAdministrationRecord {
  id: string;
  type: "Infusion" | "Medicacion";
  itemName: string;
  route: string;
  totalVolumeMl: number;
  volumePerHourMl: number;
  durationHours: number;
  startedAt: string;
  responsible: string;
  status: "Activa" | "Completada" | "Suspendida";
  notes?: string;
}

export interface ExamRecord {
  id: string;
  category:
    | "Laboratorio"
    | "Imagenologia"
    | "Microbiologia"
    | "Prueba rapida"
    | "Electrocardiograma"
    | "Otro";
  name: string;
  requestedAt: string;
  resultAt?: string;
  status: "Pendiente" | "Procesado" | "Validado";
  summary: string;
  requestedBy: string;
  observations: string;
}

export interface DiagnosisRecord {
  id: string;
  type: "Principal" | "Secundario" | "Presuntivo";
  diagnosis: string;
  registeredAt: string;
  status: string;
  observations: string;
}

export interface ProcedureRecord {
  id: string;
  type:
    | "Cateter periferico"
    | "Cateter central"
    | "Sonda vesical"
    | "Sonda nasogastrica"
    | "Traqueostomia"
    | "Gastrostomia"
    | "Drenaje"
    | "Oxigenoterapia"
    | "Ventilacion mecanica"
    | "Otro";
  placedAt: string;
  daysInstalled: number;
  status: string;
  responsibleProfessional: string;
  observations: string;
}

export interface NutritionRecord {
  nutritionalStatus: string;
  diet: string;
  oralTolerance: string;
  estimatedIntake: string;
  nutritionalRisk: string;
  recommendations: string[];
  evolution: string;
}

export interface VaccinationRecord {
  applied: {
    vaccine: string;
    date: string;
    lot?: string;
    observations: string;
  }[];
  pending: {
    vaccine: string;
    suggestedDate: string;
    availability: string;
    observations: string;
  }[];
}

export interface EmotionalHealthRecord {
  currentState: string;
  moodFollowUp: {
    date: string;
    mood: string;
    stressFactor: string;
    observations: string;
  }[];
  emotionalAlerts: string[];
  recommendations: string[];
}

export interface CarePlanRecord {
  id: string;
  nursingDiagnosis: string;
  objective: string;
  interventions: string[];
  evaluation: string;
  observations: string;
}

export interface DocumentRecord {
  id: string;
  type: "PDF" | "Examen" | "Consentimiento" | "Referencia" | "Otro";
  title: string;
  date: string;
  uploadedBy: string;
  status: string;
}

export interface TimelineEvent {
  id: string;
  datetime: string;
  category:
    | "Ingreso"
    | "Triaje"
    | "Signos"
    | "Medicacion"
    | "Nota enfermeria"
    | "Nota medica"
    | "Procedimiento"
    | "Examen"
    | "Reporte"
    | "Alerta";
  detail: string;
}

export interface PatientRecord {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  fullName: string;
  sex: "Femenino" | "Masculino";
  age: number;
  birthDate: string;
  identification: string;
  medicalRecordNumber: string;
  avatarUrl?: string;
  currentStatus: "Critico" | "En observacion" | "Estable" | "Alta proxima";
  riskLevel: RiskLevel;
  triageColor: TriageColor;
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  assignedProfessional: string;
  careMode: CareMode;
  serviceArea?: ServiceArea;
  lastControlAt: string;
  admissionDate: string;
  activeAlerts: string[];
  functionalPatternsAltered?: FunctionalPattern[];
  summary: {
    reasonForConsultation: string;
    importantBackground: string[];
    activeMedicationSummary: string[];
    latestNursingReport: string;
    vaccinationPendingSummary: string[];
    nutritionalSummary: string;
    emotionalSummary: string;
  };
  personalData: {
    address: string;
    phone: string;
    emergencyContact: string;
    bloodType: string;
    insurance: string;
    civilStatus: string;
    occupation: string;
    origin: string;
    guardian: string;
  };
  antecedentes: {
    pathological: string[];
    surgical: string[];
    pharmacological: string[];
    allergies: string[];
    family: string[];
    gynecoObstetric: string[];
    habits: {
      tobacco: string;
      alcohol: string;
      substances: string;
      physicalActivity: string;
      feeding: string;
    };
    hospitalizations: string[];
    chronicDiseases: string[];
  };
  triageAssessment: {
    evaluatedAt: string;
    consultationReason: string;
    symptoms: string[];
    evolutionTime: string;
    riskClassification: string;
    triageColor: TriageColor;
    suggestedConduct: string;
    professionalObservations: string;
    warningSigns: string[];
    referral: string;
  };
  vitalSigns: VitalSignRecord[];
  medicationRecords: MedicationRecord[];
  nursingNotes: ClinicalNote[];
  medicalNotes: ClinicalNote[];
  nursingShiftReports: NursingShiftReport[];
  fluidBalances: FluidBalanceRecord[];
  kardex: KardexRecord[];
  kardexAdministrations?: KardexAdministrationRecord[];
  exams: ExamRecord[];
  diagnoses: DiagnosisRecord[];
  procedures: ProcedureRecord[];
  nutrition: NutritionRecord;
  vaccination: VaccinationRecord;
  emotionalHealth: EmotionalHealthRecord;
  carePlan: CarePlanRecord[];
  documents: DocumentRecord[];
  timeline: TimelineEvent[];
}

export interface HealthCenterRecord {
  id: string;
  name: string;
  city: string;
  services: string[];
  vaccineAvailability: string;
  contact: string;
  schedule: string;
  capacity: string;
  professionalsActive: number;
  observations: string;
}

export interface VaccineInventoryRecord {
  id: string;
  centerId: string;
  vaccine: string;
  campaign: string;
  targetGroup: string;
  stock: number;
  status: "Disponible" | "Baja disponibilidad" | "Agotada";
  updatedAt: string;
  notes: string;
}

export interface NandaDiagnosisOption {
  id: string;
  domain: string;
  class: string;
  label: string;
  relatedFactors: string[];
  definingCharacteristics: string[];
}

export interface NicInterventionOption {
  id: string;
  field: string;
  class: string;
  intervention: string;
  suggestedActivities: string[];
}

export interface NocOutcomeOption {
  id: string;
  outcome: string;
  indicators: string[];
  scale: string;
}

export interface NursingReportTemplateRecord {
  id: string;
  patientId: string;
  date: string;
  shift: string;
  service: string;
  diagnosis: string;
  generalStatus: string;
  consciousness: string;
  breathing: string;
  pain: string;
  feeding: string;
  elimination: string;
  skin: string;
  mobility: string;
  invasiveDevices: string;
  proceduresDone: string;
  response: string;
  incidents: string;
  immediatePlan: string;
  nandaId: string;
  nocId: string;
  nicId: string;
  clinicalRationale: string;
  evaluation: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "Medicina" | "Enfermeria" | "Nutricion" | "Psicologia";
  shift: string;
  activeCases: number;
  recentActivity: string;
}

export interface EducationResource {
  id: string;
  title: string;
  condition: string;
  format: "Guia" | "Video" | "Infografia";
  updatedAt: string;
}

export const professionalSidebarModules: SidebarModuleItem[] = [
  {
    id: "home",
    label: "Inicio",
    path: "/portal/professional",
    section: "main",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "patients",
    label: "Pacientes",
    path: "/portal/professional/patients",
    section: "main",
    roles: ["professional", "institution"],
  },
  {
    id: "triage",
    label: "Triaje",
    path: "/portal/professional/triage",
    section: "main",
    roles: ["professional", "institution"],
  },
  {
    id: "follow_up",
    label: "Seguimiento",
    path: "/portal/professional/follow-up",
    section: "main",
    roles: ["professional", "institution"],
  },
  {
    id: "vitals",
    label: "Signos vitales",
    path: "/portal/professional/vitals",
    section: "clinical",
    roles: ["professional", "institution"],
  },
  {
    id: "medication",
    label: "Medicacion",
    path: "/portal/professional/medication",
    section: "clinical",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "vaccination",
    label: "Vacunacion",
    path: "/portal/professional/vaccination",
    section: "clinical",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "nutrition",
    label: "Nutricion",
    path: "/portal/professional/nutrition",
    section: "clinical",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "emotional_health",
    label: "Salud emocional",
    path: "/portal/professional/emotional-health",
    section: "clinical",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "reports",
    label: "Reportes",
    path: "/portal/professional/reports",
    section: "support",
    roles: ["professional", "institution"],
  },
  {
    id: "health_centers",
    label: "Centros de salud",
    path: "/portal/professional/health-centers",
    section: "support",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "health_education",
    label: "Educacion en salud",
    path: "/portal/professional/health-education",
    section: "support",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "alerts",
    label: "Alertas",
    path: "/portal/professional/alerts",
    section: "support",
    roles: ["professional", "institution", "patient"],
  },
  {
    id: "care_team",
    label: "Equipo de salud",
    path: "/portal/professional/care-team",
    section: "system",
    roles: ["professional", "institution"],
  },
  {
    id: "settings",
    label: "Configuracion",
    path: "/portal/professional/settings",
    section: "system",
    roles: ["professional", "institution", "patient"],
  },
];

export const healthCenters: HealthCenterRecord[] = [
  {
    id: "hc-1",
    name: "Hospital General Norte",
    city: "Quito",
    services: ["Urgencias", "Hospitalizacion", "Vacunacion", "Laboratorio"],
    vaccineAvailability: "Alta",
    contact: "+593 2 211 0001",
    schedule: "24/7",
    capacity: "120 camas",
    professionalsActive: 44,
    observations: "Centro de referencia para emergencias cardiovasculares.",
  },
  {
    id: "hc-2",
    name: "Centro Integral Sur",
    city: "Guayaquil",
    services: ["Consulta externa", "Nutricion", "Psicologia", "Vacunacion"],
    vaccineAvailability: "Media",
    contact: "+593 4 355 0145",
    schedule: "06:00 - 22:00",
    capacity: "48 consultorios",
    professionalsActive: 26,
    observations: "Fuerte capacidad ambulatoria y seguimiento integral.",
  },
  {
    id: "hc-3",
    name: "Unidad Metropolitana Este",
    city: "Cuenca",
    services: ["Triaje", "Medicina interna", "Imagenologia"],
    vaccineAvailability: "Baja",
    contact: "+593 7 401 4480",
    schedule: "07:00 - 19:00",
    capacity: "35 camas",
    professionalsActive: 18,
    observations: "Alta demanda de triaje en franjas matutinas.",
  },
];

export const currentClinicalContext = {
  centerId: "hc-1",
  centerName: "Hospital General Norte",
  service: "Emergencia y observacion clinica",
  role: "Profesional",
  professionalName: "Lic. Daniela Naranjo",
  activeShift: "Turno manana 07:00 - 15:00",
};

export const vaccineInventory: VaccineInventoryRecord[] = [
  {
    id: "stock-1",
    centerId: "hc-1",
    vaccine: "Influenza estacional",
    campaign: "Adulto mayor",
    targetGroup: ">= 65 anios",
    stock: 48,
    status: "Disponible",
    updatedAt: "2026-03-08 07:30",
    notes: "Alta rotacion por campania activa.",
  },
  {
    id: "stock-2",
    centerId: "hc-1",
    vaccine: "Neumococo refuerzo",
    campaign: "Riesgo respiratorio",
    targetGroup: "Comorbilidades respiratorias",
    stock: 9,
    status: "Baja disponibilidad",
    updatedAt: "2026-03-08 07:30",
    notes: "Solicitar reposicion para siguiente jornada.",
  },
  {
    id: "stock-3",
    centerId: "hc-1",
    vaccine: "Hepatitis B refuerzo",
    campaign: "Cronicos",
    targetGroup: "Diabetes e inmunocompromiso",
    stock: 0,
    status: "Agotada",
    updatedAt: "2026-03-08 07:30",
    notes: "Sin stock, derivar a centro alterno.",
  },
  {
    id: "stock-4",
    centerId: "hc-2",
    vaccine: "Td refuerzo",
    campaign: "Adultos",
    targetGroup: "18 - 64 anios",
    stock: 30,
    status: "Disponible",
    updatedAt: "2026-03-07 18:10",
    notes: "Disponible en consulta externa.",
  },
];

export const nandaCatalog: NandaDiagnosisOption[] = [
  {
    id: "NANDA-00029",
    domain: "Actividad/reposo",
    class: "Respuestas cardiopulmonares",
    label: "Perfusion tisular cardiaca inefectiva",
    relatedFactors: ["Desequilibrio aporte/demanda de oxigeno", "Hipoperfusion coronaria"],
    definingCharacteristics: ["Dolor toracico", "Cambios ECG", "Disnea"],
  },
  {
    id: "NANDA-00032",
    domain: "Actividad/reposo",
    class: "Funcion respiratoria",
    label: "Patron respiratorio ineficaz",
    relatedFactors: ["Broncoespasmo", "Fatiga muscular respiratoria"],
    definingCharacteristics: ["Disnea", "FR alterada", "Uso de O2 suplementario"],
  },
  {
    id: "NANDA-00126",
    domain: "Afrontamiento/tolerancia al estres",
    class: "Respuestas emocionales",
    label: "Ansiedad",
    relatedFactors: ["Hospitalizacion", "Incertidumbre del diagnostico"],
    definingCharacteristics: ["Preocupacion", "Inquietud", "Miedo verbalizado"],
  },
  {
    id: "NANDA-00179",
    domain: "Promocion de la salud",
    class: "Gestion de la salud",
    label: "Manejo inefectivo del regimen terapeutico",
    relatedFactors: ["Conocimiento insuficiente", "Complejidad del tratamiento"],
    definingCharacteristics: ["Adherencia irregular", "Resultados clinicos suboptimos"],
  },
];

export const nicCatalog: NicInterventionOption[] = [
  {
    id: "NIC-4160",
    field: "Fisiologico complejo",
    class: "Control perfusion tisular",
    intervention: "Monitorizacion hemodinamica",
    suggestedActivities: [
      "Monitorizar TA y FC segun protocolo",
      "Valorar dolor toracico y respuesta al tratamiento",
      "Notificar variaciones hemodinamicas relevantes",
    ],
  },
  {
    id: "NIC-3320",
    field: "Fisiologico basico",
    class: "Control respiratorio",
    intervention: "Oxigenoterapia",
    suggestedActivities: [
      "Ajustar flujo segun satO2 objetivo",
      "Valorar tolerancia respiratoria",
      "Registrar respuesta al soporte de O2",
    ],
  },
  {
    id: "NIC-5602",
    field: "Conductual",
    class: "Educacion del paciente",
    intervention: "Ensenanza: proceso de enfermedad",
    suggestedActivities: [
      "Explicar diagnostico y signos de alarma",
      "Verificar comprension del paciente/familia",
      "Entregar plan de autocuidado escrito",
    ],
  },
  {
    id: "NIC-5820",
    field: "Conductual",
    class: "Apoyo psicologico",
    intervention: "Disminucion de la ansiedad",
    suggestedActivities: [
      "Escucha activa durante la atencion",
      "Guiar tecnicas de respiracion controlada",
      "Coordinar apoyo de psicologia si persiste ansiedad",
    ],
  },
];

export const nocCatalog: NocOutcomeOption[] = [
  {
    id: "NOC-0401",
    outcome: "Estado circulatorio",
    indicators: ["Perfusion periferica", "Dolor toracico", "Estabilidad hemodinamica"],
    scale: "1 (grave) a 5 (optimo)",
  },
  {
    id: "NOC-0415",
    outcome: "Estado respiratorio",
    indicators: ["Frecuencia respiratoria", "Saturacion de oxigeno", "Disnea"],
    scale: "1 (grave) a 5 (optimo)",
  },
  {
    id: "NOC-1402",
    outcome: "Autocontrol de la ansiedad",
    indicators: ["Nivel de preocupacion", "Uso de tecnicas de afrontamiento"],
    scale: "1 (nulo) a 5 (optimo)",
  },
  {
    id: "NOC-1813",
    outcome: "Conocimiento: regimen terapeutico",
    indicators: ["Comprension de tratamiento", "Adherencia planificada"],
    scale: "1 (insuficiente) a 5 (completo)",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Dra. Camila Rojas",
    role: "Medicina",
    shift: "07:00 - 15:00",
    activeCases: 9,
    recentActivity: "Actualizo plan terapeutico en 3 pacientes.",
  },
  {
    id: "tm-2",
    name: "Lic. Daniela Naranjo",
    role: "Enfermeria",
    shift: "07:00 - 19:00",
    activeCases: 14,
    recentActivity: "Registro reportes de enfermeria de turno manana.",
  },
  {
    id: "tm-3",
    name: "Lcda. Gabriela Viteri",
    role: "Nutricion",
    shift: "08:00 - 16:00",
    activeCases: 6,
    recentActivity: "Ajusto dieta para pacientes de riesgo nutricional.",
  },
  {
    id: "tm-4",
    name: "Psic. Andrea Montalvo",
    role: "Psicologia",
    shift: "09:00 - 17:00",
    activeCases: 5,
    recentActivity: "Seguimiento emocional en pacientes con alerta media.",
  },
];

export const educationResources: EducationResource[] = [
  {
    id: "ed-1",
    title: "Control de hipertension en casa",
    condition: "Cardiovascular",
    format: "Guia",
    updatedAt: "2026-02-12",
  },
  {
    id: "ed-2",
    title: "Adherencia a inhaladores",
    condition: "Respiratorio",
    format: "Video",
    updatedAt: "2026-01-29",
  },
  {
    id: "ed-3",
    title: "Manejo de glucosa capilar",
    condition: "Metabolico",
    format: "Infografia",
    updatedAt: "2026-02-01",
  },
  {
    id: "ed-4",
    title: "Autocuidado emocional en hospitalizacion",
    condition: "Salud mental",
    format: "Guia",
    updatedAt: "2026-02-20",
  },
];

export const mockPatients: PatientRecord[] = [
  {
    id: "p-001",
    code: "VITA-0001",
    firstName: "Maria",
    lastName: "Lopez",
    fullName: "Maria Lopez",
    sex: "Femenino",
    age: 68,
    birthDate: "1957-04-11",
    identification: "1722334412",
    medicalRecordNumber: "HC-2026-0001",
    currentStatus: "Critico",
    riskLevel: "alto",
    triageColor: "rojo",
    primaryDiagnosis: "Sindrome coronario agudo en estudio",
    secondaryDiagnoses: ["Hipertension arterial", "Diabetes tipo 2"],
    assignedProfessional: "Dra. Camila Rojas",
    careMode: "Hospitalizacion",
    lastControlAt: "2026-03-08 09:35",
    admissionDate: "2026-03-07",
    activeAlerts: [
      "Dolor toracico persistente",
      "Riesgo cardiovascular alto",
      "Control estricto de glucemia",
    ],
    summary: {
      reasonForConsultation: "Dolor toracico opresivo y disnea de inicio subagudo.",
      importantBackground: [
        "Antecedente de angina estable",
        "Hipertension de larga data",
        "Riesgo metabolico elevado",
      ],
      activeMedicationSummary: [
        "AAS 100 mg cada 24h",
        "Enalapril 10 mg cada 12h",
        "Metformina 850 mg cada 12h",
      ],
      latestNursingReport:
        "Paciente vigil con dolor 2/10 posterior a manejo inicial. Monitorizacion continua.",
      vaccinationPendingSummary: ["Influenza estacional", "Neumococo refuerzo"],
      nutritionalSummary: "Riesgo nutricional moderado por ingesta reducida.",
      emotionalSummary: "Ansiedad leve relacionada a hospitalizacion.",
    },
    personalData: {
      address: "Av. Eloy Alfaro y Los Cedros, Quito",
      phone: "+593 99 222 1010",
      emergencyContact: "Luis Lopez (hijo) +593 98 301 0011",
      bloodType: "O+",
      insurance: "IESS",
      civilStatus: "Casada",
      occupation: "Jubilada",
      origin: "Quito",
      guardian: "No aplica",
    },
    antecedentes: {
      pathological: ["Hipertension arterial", "Diabetes mellitus tipo 2"],
      surgical: ["Colecistectomia 2012"],
      pharmacological: ["Enalapril", "Metformina", "AAS"],
      allergies: ["Penicilina"],
      family: ["Padre con infarto agudo de miocardio a los 62 anios"],
      gynecoObstetric: ["G3P3", "Menopausia a los 52 anios"],
      habits: {
        tobacco: "Exfumadora, suspendio hace 10 anios",
        alcohol: "Social ocasional",
        substances: "Niega",
        physicalActivity: "Baja",
        feeding: "Dieta hipercalorica previa",
      },
      hospitalizations: ["Hospitalizacion por angina inestable en 2022"],
      chronicDiseases: ["Hipertension", "Diabetes tipo 2"],
    },
    triageAssessment: {
      evaluatedAt: "2026-03-07 20:10",
      consultationReason: "Dolor toracico opresivo irradiado a brazo izquierdo",
      symptoms: ["Dolor toracico", "Disnea", "Diaforesis"],
      evolutionTime: "4 horas",
      riskClassification: "Muy alto",
      triageColor: "rojo",
      suggestedConduct: "Ingreso inmediato a sala de reanimacion",
      professionalObservations:
        "Paciente con factores de riesgo multiples, requiere manejo urgente.",
      warningSigns: ["Dolor prolongado", "Hipotension intermitente"],
      referral: "Cardiologia y medicina interna",
    },
    vitalSigns: [
      {
        recordedAt: "2026-03-08 09:35",
        bloodPressure: "146/88",
        heartRate: 102,
        respiratoryRate: 22,
        temperature: 37.6,
        spo2: 93,
        glucose: 202,
        painScale: 2,
        weightKg: 74,
        heightCm: 160,
        bmi: 28.9,
        professional: "Lic. Daniela Naranjo",
        outOfRangeFlags: ["FC alta", "Glucosa elevada", "SpO2 limite"],
      },
      {
        recordedAt: "2026-03-08 06:20",
        bloodPressure: "152/92",
        heartRate: 108,
        respiratoryRate: 24,
        temperature: 37.9,
        spo2: 91,
        glucose: 218,
        painScale: 4,
        weightKg: 74,
        heightCm: 160,
        bmi: 28.9,
        professional: "Lic. Daniela Naranjo",
        outOfRangeFlags: ["TA alta", "FC alta", "SpO2 baja"],
      },
    ],
    medicationRecords: [
      {
        id: "med-001-1",
        name: "AAS",
        dose: "100 mg",
        frequency: "Cada 24 horas",
        route: "VO",
        schedule: "08:00",
        startDate: "2026-03-07",
        indication: "Proteccion cardiovascular",
        prescriber: "Dra. Camila Rojas",
        adherence: "Alta",
        administrationStatus: "Administrado",
        notes: "Sin reacciones adversas.",
      },
      {
        id: "med-001-2",
        name: "Enoxaparina",
        dose: "40 mg",
        frequency: "Cada 24 horas",
        route: "SC",
        schedule: "21:00",
        startDate: "2026-03-07",
        indication: "Profilaxis trombotica",
        prescriber: "Dra. Camila Rojas",
        adherence: "En seguimiento",
        administrationStatus: "Pendiente",
        notes: "Administracion programada turno noche.",
      },
    ],
    nursingNotes: [
      {
        id: "nn-001-1",
        datetime: "2026-03-08 09:40",
        professional: "Lic. Daniela Naranjo",
        specialty: "Enfermeria",
        note: "Paciente refiere alivio parcial del dolor. Se mantiene monitorizacion continua.",
      },
      {
        id: "nn-001-2",
        datetime: "2026-03-08 06:30",
        professional: "Lic. Daniela Naranjo",
        specialty: "Enfermeria",
        note: "Control de glicemia capilar elevado, se notifica a medicina.",
      },
    ],
    medicalNotes: [
      {
        id: "mn-001-1",
        datetime: "2026-03-08 08:15",
        professional: "Dra. Camila Rojas",
        specialty: "Medicina interna",
        note: "Continuar manejo antiisquemico y control metabolico estrecho.",
      },
    ],
    nursingShiftReports: [
      {
        id: "nr-001-1",
        shift: "Manana",
        service: "Emergencia",
        date: "2026-03-08",
        generalStatus: "Estable con vigilancia intensiva",
        consciousness: "Alerta y orientada",
        breathing: "Leve disnea de esfuerzo",
        pain: "2/10",
        oralTolerance: "Aceptable",
        elimination: "Conservada",
        mobility: "Asistida",
        skin: "Integra",
        proceduresDone: "Control cardiaco continuo",
        patientResponse: "Adecuada",
        incidents: "Sin eventos adversos",
        carePlan: "Mantener monitorizacion y control de glicemia.",
      },
    ],
    fluidBalances: [
      {
        id: "fb-001-1",
        shift: "24 horas",
        date: "2026-03-08",
        intake: {
          oral: 900,
          intravenous: 1200,
          dilutedMedication: 200,
          enteralParenteral: 0,
          other: 0,
        },
        output: {
          diuresis: 1500,
          vomiting: 0,
          drains: 0,
          liquidStools: 0,
          aspiration: 0,
          insensibleLoss: 450,
          other: 0,
        },
        observations: "Balance negativo leve, vigilar hidratacion.",
      },
    ],
    kardex: [
      {
        id: "k-001-1",
        date: "2026-03-08",
        diagnosis: "Sindrome coronario agudo",
        diet: "Hiposodica",
        activity: "Reposo relativo",
        vitalSignsPlan: "Control cada 2 horas",
        medicationPlan: "Segun esquema medico",
        solutions: "SSN 0.9% 80 ml/h",
        procedures: "Monitorizacion cardiaca",
        nursingCare: "Vigilancia de dolor y signos de alarma",
        elimination: "Diuresis espontanea",
        observations: "Paciente colaboradora",
        specialIndications: "Notificar dolor > 4/10",
      },
    ],
    exams: [
      {
        id: "ex-001-1",
        category: "Laboratorio",
        name: "Troponina I",
        requestedAt: "2026-03-07 20:20",
        resultAt: "2026-03-07 21:10",
        status: "Validado",
        summary: "Elevacion moderada",
        requestedBy: "Dra. Camila Rojas",
        observations: "Correlacion clinica con ECG",
      },
      {
        id: "ex-001-2",
        category: "Electrocardiograma",
        name: "ECG 12 derivaciones",
        requestedAt: "2026-03-07 20:15",
        resultAt: "2026-03-07 20:30",
        status: "Validado",
        summary: "Cambios isquemicos inespecificos",
        requestedBy: "Dra. Camila Rojas",
        observations: "Repetir en 6 horas",
      },
    ],
    diagnoses: [
      {
        id: "dg-001-1",
        type: "Principal",
        diagnosis: "Sindrome coronario agudo",
        registeredAt: "2026-03-07 21:30",
        status: "Activo",
        observations: "Pendiente estratificacion definitiva",
      },
      {
        id: "dg-001-2",
        type: "Secundario",
        diagnosis: "Diabetes mellitus tipo 2",
        registeredAt: "2026-03-07 21:35",
        status: "Activo",
        observations: "Control metabolico suboptimo",
      },
    ],
    procedures: [
      {
        id: "pr-001-1",
        type: "Cateter periferico",
        placedAt: "2026-03-07 20:18",
        daysInstalled: 1,
        status: "Permeable",
        responsibleProfessional: "Lic. Daniela Naranjo",
        observations: "Sitio limpio y sin flebitis.",
      },
      {
        id: "pr-001-2",
        type: "Oxigenoterapia",
        placedAt: "2026-03-07 20:20",
        daysInstalled: 1,
        status: "Activa 2L/min",
        responsibleProfessional: "Lic. Daniela Naranjo",
        observations: "Objetivo SpO2 > 94%.",
      },
    ],
    nutrition: {
      nutritionalStatus: "Sobrepeso",
      diet: "Hiposodica y control de carbohidratos",
      oralTolerance: "Parcial",
      estimatedIntake: "70% del requerimiento",
      nutritionalRisk: "Moderado",
      recommendations: [
        "Fraccionar la alimentacion en 5 tiempos.",
        "Reducir sodio y azucares simples.",
      ],
      evolution: "En seguimiento diario por nutricion.",
    },
    vaccination: {
      applied: [
        {
          vaccine: "COVID-19 refuerzo",
          date: "2025-10-11",
          lot: "CV-2025-77",
          observations: "Sin eventos adversos",
        },
      ],
      pending: [
        {
          vaccine: "Influenza 2026",
          suggestedDate: "2026-04-01",
          availability: "Hospital General Norte",
          observations: "Aplicar al egreso",
        },
      ],
    },
    emotionalHealth: {
      currentState: "Ansiedad leve",
      moodFollowUp: [
        {
          date: "2026-03-08",
          mood: "Preocupada",
          stressFactor: "Estado clinico actual",
          observations: "Responde bien a contencion emocional.",
        },
      ],
      emotionalAlerts: ["Ansiedad asociada a ingreso reciente"],
      recommendations: [
        "Acompanamiento familiar supervisado",
        "Respiracion guiada dos veces al dia",
      ],
    },
    carePlan: [
      {
        id: "cp-001-1",
        nursingDiagnosis: "Perfusion tisular cardiaca inefectiva",
        objective: "Mantener estabilidad hemodinamica",
        interventions: [
          "Monitorizacion continua",
          "Control de dolor y signos de alarma",
          "Cumplimiento terapeutico",
        ],
        evaluation: "En progreso",
        observations: "Evolucion favorable en primeras 12 horas.",
      },
    ],
    documents: [
      {
        id: "doc-001-1",
        type: "PDF",
        title: "Resumen clinico ingreso",
        date: "2026-03-07",
        uploadedBy: "Dra. Camila Rojas",
        status: "Disponible",
      },
      {
        id: "doc-001-2",
        type: "Consentimiento",
        title: "Consentimiento informado manejo cardiologico",
        date: "2026-03-07",
        uploadedBy: "Lic. Daniela Naranjo",
        status: "Firmado",
      },
    ],
    timeline: [
      {
        id: "tl-001-1",
        datetime: "2026-03-07 20:10",
        category: "Ingreso",
        detail: "Ingreso a emergencia por dolor toracico.",
      },
      {
        id: "tl-001-2",
        datetime: "2026-03-07 20:15",
        category: "Triaje",
        detail: "Clasificacion rojo por riesgo vital inmediato.",
      },
      {
        id: "tl-001-3",
        datetime: "2026-03-08 09:40",
        category: "Nota enfermeria",
        detail: "Disminucion del dolor, paciente hemodinamicamente estable.",
      },
    ],
  },
  {
    id: "p-002",
    code: "VITA-0002",
    firstName: "Juan",
    lastName: "Perez",
    fullName: "Juan Perez",
    sex: "Masculino",
    age: 54,
    birthDate: "1971-01-26",
    identification: "0912290066",
    medicalRecordNumber: "HC-2026-0002",
    currentStatus: "En observacion",
    riskLevel: "medio",
    triageColor: "amarillo",
    primaryDiagnosis: "Disnea moderada en estudio",
    secondaryDiagnoses: ["EPOC leve", "Exposicion tabaco previa"],
    assignedProfessional: "Dr. Luis Herrera",
    careMode: "Hospitalizacion",
    lastControlAt: "2026-03-08 10:15",
    admissionDate: "2026-03-07",
    activeAlerts: ["SatO2 limtrofe"],
    summary: {
      reasonForConsultation: "Disnea progresiva con tos seca.",
      importantBackground: ["EPOC", "Exfumador"],
      activeMedicationSummary: ["Budesonida/Formoterol", "Ipratropio"],
      latestNursingReport: "Mantiene saturacion 93-94% con O2 de bajo flujo.",
      vaccinationPendingSummary: ["Neumococo refuerzo"],
      nutritionalSummary: "Sin riesgo nutricional alto.",
      emotionalSummary: "Estado emocional estable.",
    },
    personalData: {
      address: "Urdesa Central, Guayaquil",
      phone: "+593 99 101 3390",
      emergencyContact: "Martha Perez (esposa) +593 98 556 2211",
      bloodType: "A+",
      insurance: "Seguro privado",
      civilStatus: "Casado",
      occupation: "Comerciante",
      origin: "Guayaquil",
      guardian: "No aplica",
    },
    antecedentes: {
      pathological: ["EPOC leve"],
      surgical: ["Sin cirugias mayores"],
      pharmacological: ["Broncodilatadores inhalados"],
      allergies: ["Ninguna conocida"],
      family: ["Madre con asma"],
      gynecoObstetric: ["No aplica"],
      habits: {
        tobacco: "Exfumador",
        alcohol: "Ocasional",
        substances: "Niega",
        physicalActivity: "Moderada",
        feeding: "Regular",
      },
      hospitalizations: ["Hospitalizacion respiratoria en 2024"],
      chronicDiseases: ["EPOC"],
    },
    triageAssessment: {
      evaluatedAt: "2026-03-07 17:40",
      consultationReason: "Disnea y tos",
      symptoms: ["Disnea", "Tos seca", "Fatiga"],
      evolutionTime: "2 dias",
      riskClassification: "Moderado",
      triageColor: "amarillo",
      suggestedConduct: "Observacion y manejo broncodilatador",
      professionalObservations: "Sin uso de musculos accesorios al ingreso.",
      warningSigns: ["SatO2 < 92%", "Disnea de reposo"],
      referral: "Neumologia",
    },
    vitalSigns: [
      {
        recordedAt: "2026-03-08 10:15",
        bloodPressure: "130/78",
        heartRate: 92,
        respiratoryRate: 20,
        temperature: 37.1,
        spo2: 94,
        glucose: 115,
        painScale: 1,
        weightKg: 79,
        heightCm: 171,
        bmi: 27,
        professional: "Lic. Daniela Naranjo",
        outOfRangeFlags: [],
      },
      {
        recordedAt: "2026-03-08 05:40",
        bloodPressure: "136/80",
        heartRate: 96,
        respiratoryRate: 22,
        temperature: 37.3,
        spo2: 93,
        glucose: 120,
        painScale: 2,
        weightKg: 79,
        heightCm: 171,
        bmi: 27,
        professional: "Lic. Ricardo Silva",
        outOfRangeFlags: ["FR alta"],
      },
    ],
    medicationRecords: [
      {
        id: "med-002-1",
        name: "Budesonida/Formoterol",
        dose: "160/4.5 mcg",
        frequency: "Cada 12 horas",
        route: "Inhalada",
        schedule: "08:00 - 20:00",
        startDate: "2026-03-07",
        indication: "Control respiratorio",
        prescriber: "Dr. Luis Herrera",
        adherence: "Alta",
        administrationStatus: "Administrado",
        notes: "Buen uso de tecnica inhalatoria.",
      },
    ],
    nursingNotes: [
      {
        id: "nn-002-1",
        datetime: "2026-03-08 10:20",
        professional: "Lic. Daniela Naranjo",
        specialty: "Enfermeria",
        note: "Tolera movilizacion corta sin disnea severa.",
      },
    ],
    medicalNotes: [
      {
        id: "mn-002-1",
        datetime: "2026-03-08 09:00",
        professional: "Dr. Luis Herrera",
        specialty: "Medicina interna",
        note: "Mantener plan broncodilatador y control de saturacion.",
      },
    ],
    nursingShiftReports: [
      {
        id: "nr-002-1",
        shift: "Manana",
        service: "Observacion",
        date: "2026-03-08",
        generalStatus: "Estable",
        consciousness: "Alerta",
        breathing: "Disnea leve con actividad",
        pain: "1/10",
        oralTolerance: "Adecuada",
        elimination: "Conservada",
        mobility: "Independiente con supervision",
        skin: "Integra",
        proceduresDone: "Nebulizacion segun orden",
        patientResponse: "Favorable",
        incidents: "Sin incidentes",
        carePlan: "Continuar vigilancia respiratoria.",
      },
    ],
    fluidBalances: [
      {
        id: "fb-002-1",
        shift: "24 horas",
        date: "2026-03-08",
        intake: {
          oral: 1400,
          intravenous: 500,
          dilutedMedication: 120,
          enteralParenteral: 0,
          other: 0,
        },
        output: {
          diuresis: 1600,
          vomiting: 0,
          drains: 0,
          liquidStools: 0,
          aspiration: 0,
          insensibleLoss: 400,
          other: 0,
        },
        observations: "Balance cercano a neutro.",
      },
    ],
    kardex: [
      {
        id: "k-002-1",
        date: "2026-03-08",
        diagnosis: "Disnea moderada",
        diet: "Normal",
        activity: "Movilizacion progresiva",
        vitalSignsPlan: "Control cada 4 horas",
        medicationPlan: "Broncodilatadores e inhaloterapia",
        solutions: "SSN 0.9% segun necesidad",
        procedures: "Nebulizacion",
        nursingCare: "Educacion sobre tecnica inhalatoria",
        elimination: "Conservada",
        observations: "Evolucion favorable",
        specialIndications: "Avisar sat < 92%",
      },
    ],
    exams: [
      {
        id: "ex-002-1",
        category: "Imagenologia",
        name: "Radiografia de torax",
        requestedAt: "2026-03-07 18:00",
        resultAt: "2026-03-07 19:10",
        status: "Validado",
        summary: "Sin infiltrados consolidativos",
        requestedBy: "Dr. Luis Herrera",
        observations: "Correlacion con examen clinico",
      },
    ],
    diagnoses: [
      {
        id: "dg-002-1",
        type: "Principal",
        diagnosis: "Disnea moderada en estudio",
        registeredAt: "2026-03-07 19:40",
        status: "Activo",
        observations: "Mejoria parcial",
      },
    ],
    procedures: [
      {
        id: "pr-002-1",
        type: "Oxigenoterapia",
        placedAt: "2026-03-07 18:10",
        daysInstalled: 1,
        status: "Intermitente",
        responsibleProfessional: "Lic. Ricardo Silva",
        observations: "Bajo flujo.",
      },
    ],
    nutrition: {
      nutritionalStatus: "Sobrepeso leve",
      diet: "Control de grasas",
      oralTolerance: "Buena",
      estimatedIntake: "85%",
      nutritionalRisk: "Bajo",
      recommendations: ["Reducir fritos", "Aumentar fibra"],
      evolution: "Sin cambios clinicos significativos.",
    },
    vaccination: {
      applied: [
        {
          vaccine: "Influenza",
          date: "2025-09-29",
          observations: "Aplicada en consulta externa",
        },
      ],
      pending: [
        {
          vaccine: "Neumococo refuerzo",
          suggestedDate: "2026-04-15",
          availability: "Centro Integral Sur",
          observations: "Agendar posterior al alta",
        },
      ],
    },
    emotionalHealth: {
      currentState: "Estable",
      moodFollowUp: [
        {
          date: "2026-03-08",
          mood: "Tranquilo",
          stressFactor: "Hospitalizacion corta",
          observations: "Buena red de apoyo familiar.",
        },
      ],
      emotionalAlerts: [],
      recommendations: ["Mantener higiene del suenio"],
    },
    carePlan: [
      {
        id: "cp-002-1",
        nursingDiagnosis: "Patron respiratorio ineficaz",
        objective: "Mantener saturacion > 93%",
        interventions: ["Control respiratorio", "Fisioterapia"],
        evaluation: "Cumplido parcialmente",
        observations: "Buena respuesta a terapia.",
      },
    ],
    documents: [
      {
        id: "doc-002-1",
        type: "PDF",
        title: "Reporte de observacion respiratoria",
        date: "2026-03-08",
        uploadedBy: "Dr. Luis Herrera",
        status: "Disponible",
      },
    ],
    timeline: [
      {
        id: "tl-002-1",
        datetime: "2026-03-07 17:40",
        category: "Triaje",
        detail: "Clasificacion amarillo por disnea moderada.",
      },
      {
        id: "tl-002-2",
        datetime: "2026-03-08 10:20",
        category: "Nota enfermeria",
        detail: "Evolucion favorable con movilizacion supervisada.",
      },
    ],
  },
  {
    id: "p-003",
    code: "VITA-0003",
    firstName: "Ana",
    lastName: "Torres",
    fullName: "Ana Torres",
    sex: "Femenino",
    age: 32,
    birthDate: "1993-06-02",
    identification: "0602147741",
    medicalRecordNumber: "HC-2026-0003",
    currentStatus: "Estable",
    riskLevel: "bajo",
    triageColor: "verde",
    primaryDiagnosis: "Cefalea tensional",
    secondaryDiagnoses: ["Insomnio de conciliacion"],
    assignedProfessional: "Dra. Paula Cevallos",
    careMode: "Ambulatorio",
    lastControlAt: "2026-03-08 08:50",
    admissionDate: "2026-03-08",
    activeAlerts: ["Pendiente control en 72h"],
    summary: {
      reasonForConsultation: "Cefalea frontotemporal y tension cervical.",
      importantBackground: ["Migrana episodica sin aura"],
      activeMedicationSummary: ["Ibuprofeno 400 mg PRN"],
      latestNursingReport: "Paciente sin signos neurologicos de alarma.",
      vaccinationPendingSummary: ["Td refuerzo"],
      nutritionalSummary: "Sin riesgo nutricional.",
      emotionalSummary: "Estres laboral moderado.",
    },
    personalData: {
      address: "Sector El Batan, Quito",
      phone: "+593 98 123 4500",
      emergencyContact: "Camilo Torres (hermano) +593 99 000 7654",
      bloodType: "B+",
      insurance: "Particular",
      civilStatus: "Soltera",
      occupation: "Analista financiera",
      origin: "Quito",
      guardian: "No aplica",
    },
    antecedentes: {
      pathological: ["Migrana episodica"],
      surgical: ["No refiere"],
      pharmacological: ["AINEs de rescate"],
      allergies: ["No conocidas"],
      family: ["Madre con migrana"],
      gynecoObstetric: ["G0P0"],
      habits: {
        tobacco: "Niega",
        alcohol: "Ocasional",
        substances: "Niega",
        physicalActivity: "3 veces por semana",
        feeding: "Regular",
      },
      hospitalizations: ["No registra"],
      chronicDiseases: ["Ninguna"],
    },
    triageAssessment: {
      evaluatedAt: "2026-03-08 08:10",
      consultationReason: "Cefalea y tension cervical",
      symptoms: ["Cefalea", "Fotofobia leve"],
      evolutionTime: "12 horas",
      riskClassification: "Bajo",
      triageColor: "verde",
      suggestedConduct: "Manejo ambulatorio",
      professionalObservations: "Sin focalidad neurologica",
      warningSigns: ["Cefalea subita intensa", "Deficit motor"],
      referral: "Neurologia ambulatoria si persiste",
    },
    vitalSigns: [
      {
        recordedAt: "2026-03-08 08:50",
        bloodPressure: "118/74",
        heartRate: 78,
        respiratoryRate: 17,
        temperature: 36.8,
        spo2: 98,
        glucose: 96,
        painScale: 3,
        weightKg: 61,
        heightCm: 164,
        bmi: 22.7,
        professional: "Lic. Andrea Puga",
        outOfRangeFlags: [],
      },
    ],
    medicationRecords: [
      {
        id: "med-003-1",
        name: "Ibuprofeno",
        dose: "400 mg",
        frequency: "Cada 8 horas segun dolor",
        route: "VO",
        schedule: "PRN",
        startDate: "2026-03-08",
        indication: "Control cefalea",
        prescriber: "Dra. Paula Cevallos",
        adherence: "Buena",
        administrationStatus: "Administrado",
        notes: "No eventos adversos.",
      },
    ],
    nursingNotes: [
      {
        id: "nn-003-1",
        datetime: "2026-03-08 08:55",
        professional: "Lic. Andrea Puga",
        specialty: "Enfermeria",
        note: "Educacion sobre higiene del suenio y relajacion muscular.",
      },
    ],
    medicalNotes: [
      {
        id: "mn-003-1",
        datetime: "2026-03-08 09:10",
        professional: "Dra. Paula Cevallos",
        specialty: "Medicina general",
        note: "Manejo ambulatorio y control en 72 horas.",
      },
    ],
    nursingShiftReports: [
      {
        id: "nr-003-1",
        shift: "Manana",
        service: "Consulta externa",
        date: "2026-03-08",
        generalStatus: "Estable",
        consciousness: "Alerta",
        breathing: "Normal",
        pain: "3/10",
        oralTolerance: "Buena",
        elimination: "Conservada",
        mobility: "Independiente",
        skin: "Integra",
        proceduresDone: "Control de signos",
        patientResponse: "Favorable",
        incidents: "Ninguno",
        carePlan: "Seguimiento ambulatorio",
      },
    ],
    fluidBalances: [
      {
        id: "fb-003-1",
        shift: "Ambulatorio",
        date: "2026-03-08",
        intake: {
          oral: 600,
          intravenous: 0,
          dilutedMedication: 0,
          enteralParenteral: 0,
          other: 0,
        },
        output: {
          diuresis: 500,
          vomiting: 0,
          drains: 0,
          liquidStools: 0,
          aspiration: 0,
          insensibleLoss: 250,
          other: 0,
        },
        observations: "Sin alteraciones.",
      },
    ],
    kardex: [
      {
        id: "k-003-1",
        date: "2026-03-08",
        diagnosis: "Cefalea tensional",
        diet: "Normal",
        activity: "Ambulatoria",
        vitalSignsPlan: "Control unico",
        medicationPlan: "AINE PRN",
        solutions: "No aplica",
        procedures: "Sin procedimientos",
        nursingCare: "Educacion y seguimiento",
        elimination: "Conservada",
        observations: "Alta con recomendaciones",
        specialIndications: "Retornar por signos de alarma",
      },
    ],
    exams: [
      {
        id: "ex-003-1",
        category: "Laboratorio",
        name: "Biometria hematico",
        requestedAt: "2026-03-08 09:00",
        status: "Pendiente",
        summary: "Pendiente de toma",
        requestedBy: "Dra. Paula Cevallos",
        observations: "Solo si persiste cefalea",
      },
    ],
    diagnoses: [
      {
        id: "dg-003-1",
        type: "Principal",
        diagnosis: "Cefalea tensional",
        registeredAt: "2026-03-08 09:05",
        status: "Activo",
        observations: "Manejo ambulatorio",
      },
    ],
    procedures: [
      {
        id: "pr-003-1",
        type: "Otro",
        placedAt: "2026-03-08 09:00",
        daysInstalled: 0,
        status: "No aplica",
        responsibleProfessional: "Lic. Andrea Puga",
        observations: "Sin procedimientos invasivos.",
      },
    ],
    nutrition: {
      nutritionalStatus: "Normopeso",
      diet: "Regular",
      oralTolerance: "Buena",
      estimatedIntake: "100%",
      nutritionalRisk: "Bajo",
      recommendations: ["Hidratacion adecuada", "Reducir cafeina"],
      evolution: "Sin cambios relevantes",
    },
    vaccination: {
      applied: [
        {
          vaccine: "COVID-19 refuerzo",
          date: "2025-12-09",
          observations: "Completo",
        },
      ],
      pending: [
        {
          vaccine: "Td refuerzo",
          suggestedDate: "2026-06-01",
          availability: "Unidad Metropolitana Este",
          observations: "Agendar en centro cercano",
        },
      ],
    },
    emotionalHealth: {
      currentState: "Estres moderado",
      moodFollowUp: [
        {
          date: "2026-03-08",
          mood: "Cansancio",
          stressFactor: "Sobrecarga laboral",
          observations: "Se recomienda pausas activas.",
        },
      ],
      emotionalAlerts: ["Estres sostenido"],
      recommendations: [
        "Rutina de suenio",
        "Ejercicios de relajacion",
        "Seguimiento psicologico si persiste",
      ],
    },
    carePlan: [
      {
        id: "cp-003-1",
        nursingDiagnosis: "Dolor agudo relacionado a tension muscular",
        objective: "Disminuir dolor a <= 2/10",
        interventions: ["Educacion", "Manejo farmacologico", "Control ambulatorio"],
        evaluation: "En progreso",
        observations: "Dolor disminuyo a 3/10 al egreso.",
      },
    ],
    documents: [
      {
        id: "doc-003-1",
        type: "PDF",
        title: "Indicaciones de alta ambulatoria",
        date: "2026-03-08",
        uploadedBy: "Dra. Paula Cevallos",
        status: "Entregado",
      },
    ],
    timeline: [
      {
        id: "tl-003-1",
        datetime: "2026-03-08 08:10",
        category: "Triaje",
        detail: "Clasificacion verde.",
      },
      {
        id: "tl-003-2",
        datetime: "2026-03-08 09:10",
        category: "Nota medica",
        detail: "Plan ambulatorio y control en 72 horas.",
      },
    ],
  },
  {
    id: "p-004",
    code: "VITA-0004",
    firstName: "Carlos",
    lastName: "Gomez",
    fullName: "Carlos Gomez",
    sex: "Masculino",
    age: 21,
    birthDate: "2005-02-14",
    identification: "1104780032",
    medicalRecordNumber: "HC-2026-0004",
    currentStatus: "Estable",
    riskLevel: "bajo",
    triageColor: "azul",
    primaryDiagnosis: "Faringitis viral leve",
    secondaryDiagnoses: [],
    assignedProfessional: "Dr. Luis Herrera",
    careMode: "Ambulatorio",
    lastControlAt: "2026-03-07 10:05",
    admissionDate: "2026-03-07",
    activeAlerts: [],
    summary: {
      reasonForConsultation: "Dolor de garganta y odinofagia leve.",
      importantBackground: ["Sin antecedentes relevantes"],
      activeMedicationSummary: ["Paracetamol PRN"],
      latestNursingReport: "Paciente estable sin fiebre.",
      vaccinationPendingSummary: ["Influenza"],
      nutritionalSummary: "Adecuado",
      emotionalSummary: "Sin alertas emocionales",
    },
    personalData: {
      address: "Centro historico, Cuenca",
      phone: "+593 97 200 4455",
      emergencyContact: "Daniel Gomez +593 99 800 1122",
      bloodType: "O+",
      insurance: "Particular",
      civilStatus: "Soltero",
      occupation: "Estudiante",
      origin: "Cuenca",
      guardian: "No aplica",
    },
    antecedentes: {
      pathological: ["Ninguno"],
      surgical: ["Ninguno"],
      pharmacological: ["Ninguno"],
      allergies: ["Ninguna conocida"],
      family: ["No relevantes"],
      gynecoObstetric: ["No aplica"],
      habits: {
        tobacco: "Niega",
        alcohol: "Esporadico",
        substances: "Niega",
        physicalActivity: "Alta",
        feeding: "Regular",
      },
      hospitalizations: ["No registra"],
      chronicDiseases: ["No registra"],
    },
    triageAssessment: {
      evaluatedAt: "2026-03-07 09:50",
      consultationReason: "Dolor de garganta",
      symptoms: ["Odinofagia", "Malestar general leve"],
      evolutionTime: "1 dia",
      riskClassification: "Bajo",
      triageColor: "azul",
      suggestedConduct: "Manejo ambulatorio y autocuidado",
      professionalObservations: "Sin fiebre ni compromiso respiratorio",
      warningSigns: ["Fiebre alta", "Disnea"],
      referral: "No requiere",
    },
    vitalSigns: [
      {
        recordedAt: "2026-03-07 10:05",
        bloodPressure: "112/70",
        heartRate: 76,
        respiratoryRate: 16,
        temperature: 36.9,
        spo2: 99,
        glucose: 90,
        painScale: 2,
        weightKg: 72,
        heightCm: 178,
        bmi: 22.7,
        professional: "Lic. Andrea Puga",
        outOfRangeFlags: [],
      },
    ],
    medicationRecords: [
      {
        id: "med-004-1",
        name: "Paracetamol",
        dose: "500 mg",
        frequency: "Cada 8 horas PRN",
        route: "VO",
        schedule: "PRN",
        startDate: "2026-03-07",
        indication: "Analgesia",
        prescriber: "Dr. Luis Herrera",
        adherence: "Buena",
        administrationStatus: "Administrado",
        notes: "Uso condicional",
      },
    ],
    nursingNotes: [],
    medicalNotes: [],
    nursingShiftReports: [],
    fluidBalances: [],
    kardex: [],
    exams: [],
    diagnoses: [
      {
        id: "dg-004-1",
        type: "Principal",
        diagnosis: "Faringitis viral leve",
        registeredAt: "2026-03-07 10:10",
        status: "Resuelto",
        observations: "Control por teleconsulta en 72h.",
      },
    ],
    procedures: [],
    nutrition: {
      nutritionalStatus: "Normopeso",
      diet: "Regular",
      oralTolerance: "Buena",
      estimatedIntake: "100%",
      nutritionalRisk: "Bajo",
      recommendations: ["Hidratacion", "Dieta blanda temporal"],
      evolution: "Sin complicaciones",
    },
    vaccination: {
      applied: [],
      pending: [
        {
          vaccine: "Influenza",
          suggestedDate: "2026-04-02",
          availability: "Centro Integral Sur",
          observations: "Agendar en proximo control",
        },
      ],
    },
    emotionalHealth: {
      currentState: "Estable",
      moodFollowUp: [],
      emotionalAlerts: [],
      recommendations: ["Descanso", "Manejo de estres academico"],
    },
    carePlan: [],
    documents: [],
    timeline: [
      {
        id: "tl-004-1",
        datetime: "2026-03-07 10:10",
        category: "Ingreso",
        detail: "Consulta ambulatoria de baja prioridad.",
      },
    ],
  },
  {
    id: "p-005",
    code: "VITA-0005",
    firstName: "Sofia",
    lastName: "Mendoza",
    fullName: "Sofia Mendoza",
    sex: "Femenino",
    age: 47,
    birthDate: "1979-09-03",
    identification: "1305900876",
    medicalRecordNumber: "HC-2026-0005",
    currentStatus: "En observacion",
    riskLevel: "medio",
    triageColor: "naranja",
    primaryDiagnosis: "Hiperglucemia sintomatica",
    secondaryDiagnoses: ["Diabetes mellitus tipo 2", "Obesidad grado I"],
    assignedProfessional: "Dra. Camila Rojas",
    careMode: "Hospitalizacion",
    lastControlAt: "2026-03-08 11:00",
    admissionDate: "2026-03-08",
    activeAlerts: ["Glucosa > 250 mg/dl", "Adherencia irregular a tratamiento"],
    summary: {
      reasonForConsultation: "Mareos, polidipsia y glicemia elevada.",
      importantBackground: ["Diabetes tipo 2", "Adherencia irregular"],
      activeMedicationSummary: ["Insulina regular segun esquema"],
      latestNursingReport: "Control glucemico cada 4 horas.",
      vaccinationPendingSummary: ["Hepatitis B refuerzo"],
      nutritionalSummary: "Riesgo nutricional alto por patrones alimentarios.",
      emotionalSummary: "Ansiedad por cambios de estilo de vida.",
    },
    personalData: {
      address: "Portoviejo, sector Los Almendros",
      phone: "+593 98 777 0044",
      emergencyContact: "Marcos Mendoza +593 99 333 0019",
      bloodType: "A-",
      insurance: "IESS",
      civilStatus: "Casada",
      occupation: "Docente",
      origin: "Portoviejo",
      guardian: "No aplica",
    },
    antecedentes: {
      pathological: ["Diabetes mellitus tipo 2", "Obesidad grado I"],
      surgical: ["Apendicectomia 2009"],
      pharmacological: ["Metformina", "Glibenclamida"],
      allergies: ["No conocidas"],
      family: ["Hermana con diabetes tipo 2"],
      gynecoObstetric: ["G2P2"],
      habits: {
        tobacco: "Niega",
        alcohol: "Ocasional",
        substances: "Niega",
        physicalActivity: "Baja",
        feeding: "Alta carga de carbohidratos",
      },
      hospitalizations: ["Descompensacion metabolica en 2023"],
      chronicDiseases: ["Diabetes tipo 2", "Obesidad"],
    },
    triageAssessment: {
      evaluatedAt: "2026-03-08 07:20",
      consultationReason: "Hiperglucemia y mareos",
      symptoms: ["Mareo", "Poliuria", "Polidipsia"],
      evolutionTime: "24 horas",
      riskClassification: "Alto",
      triageColor: "naranja",
      suggestedConduct: "Observacion y control metabolico",
      professionalObservations: "Sin compromiso neurologico agudo",
      warningSigns: ["Glucosa > 300", "Alteracion de conciencia"],
      referral: "Endocrinologia",
    },
    vitalSigns: [
      {
        recordedAt: "2026-03-08 11:00",
        bloodPressure: "138/84",
        heartRate: 94,
        respiratoryRate: 20,
        temperature: 37.0,
        spo2: 96,
        glucose: 268,
        painScale: 1,
        weightKg: 83,
        heightCm: 162,
        bmi: 31.6,
        professional: "Lic. Daniela Naranjo",
        outOfRangeFlags: ["Glucosa elevada", "IMC alto"],
      },
    ],
    medicationRecords: [
      {
        id: "med-005-1",
        name: "Insulina regular",
        dose: "6 UI",
        frequency: "Cada 6 horas segun control",
        route: "SC",
        schedule: "06:00 - 12:00 - 18:00 - 00:00",
        startDate: "2026-03-08",
        indication: "Control glucemico",
        prescriber: "Dra. Camila Rojas",
        adherence: "En seguimiento",
        administrationStatus: "Pendiente",
        notes: "Ajustar segun escala.",
      },
    ],
    nursingNotes: [
      {
        id: "nn-005-1",
        datetime: "2026-03-08 11:05",
        professional: "Lic. Daniela Naranjo",
        specialty: "Enfermeria",
        note: "Se refuerza educacion sobre automonitoreo de glucosa.",
      },
    ],
    medicalNotes: [
      {
        id: "mn-005-1",
        datetime: "2026-03-08 10:30",
        professional: "Dra. Camila Rojas",
        specialty: "Medicina interna",
        note: "Ajustar esquema insulinico y valorar alta segun respuesta.",
      },
    ],
    nursingShiftReports: [
      {
        id: "nr-005-1",
        shift: "Manana",
        service: "Observacion",
        date: "2026-03-08",
        generalStatus: "Estable en observacion",
        consciousness: "Alerta",
        breathing: "Normal",
        pain: "1/10",
        oralTolerance: "Buena",
        elimination: "Poliuria",
        mobility: "Independiente",
        skin: "Integra",
        proceduresDone: "Controles glucemicos seriados",
        patientResponse: "Cooperadora",
        incidents: "Sin incidencias",
        carePlan: "Educacion diabetologica",
      },
    ],
    fluidBalances: [
      {
        id: "fb-005-1",
        shift: "24 horas",
        date: "2026-03-08",
        intake: {
          oral: 1800,
          intravenous: 800,
          dilutedMedication: 100,
          enteralParenteral: 0,
          other: 0,
        },
        output: {
          diuresis: 2300,
          vomiting: 0,
          drains: 0,
          liquidStools: 0,
          aspiration: 0,
          insensibleLoss: 500,
          other: 0,
        },
        observations: "Balance negativo moderado.",
      },
    ],
    kardex: [
      {
        id: "k-005-1",
        date: "2026-03-08",
        diagnosis: "Hiperglucemia sintomatica",
        diet: "Diabetica",
        activity: "Movilizacion libre",
        vitalSignsPlan: "Control cada 4 horas",
        medicationPlan: "Insulina segun escala",
        solutions: "Cristaloides mantenimiento",
        procedures: "Controles glucemicos",
        nursingCare: "Educacion en autocuidado",
        elimination: "Poliuria",
        observations: "Buena evolucion inicial",
        specialIndications: "Notificar glucosa > 300",
      },
    ],
    exams: [
      {
        id: "ex-005-1",
        category: "Laboratorio",
        name: "Hemoglobina glicosilada",
        requestedAt: "2026-03-08 08:00",
        status: "Pendiente",
        summary: "Muestra enviada",
        requestedBy: "Dra. Camila Rojas",
        observations: "Esperar validacion laboratorio",
      },
    ],
    diagnoses: [
      {
        id: "dg-005-1",
        type: "Principal",
        diagnosis: "Hiperglucemia sintomatica",
        registeredAt: "2026-03-08 08:20",
        status: "Activo",
        observations: "Respuesta inicial favorable",
      },
      {
        id: "dg-005-2",
        type: "Secundario",
        diagnosis: "Diabetes mellitus tipo 2",
        registeredAt: "2026-03-08 08:21",
        status: "Activo",
        observations: "Control ambulatorio irregular",
      },
    ],
    procedures: [
      {
        id: "pr-005-1",
        type: "Cateter periferico",
        placedAt: "2026-03-08 07:30",
        daysInstalled: 1,
        status: "Permeable",
        responsibleProfessional: "Lic. Daniela Naranjo",
        observations: "Sin signos de infeccion.",
      },
    ],
    nutrition: {
      nutritionalStatus: "Obesidad grado I",
      diet: "Diabetica fraccionada",
      oralTolerance: "Buena",
      estimatedIntake: "80%",
      nutritionalRisk: "Alto",
      recommendations: [
        "Plan alimentario individualizado",
        "Educacion de conteo de carbohidratos",
      ],
      evolution: "Seguimiento por nutricion clinica.",
    },
    vaccination: {
      applied: [
        {
          vaccine: "Influenza",
          date: "2025-10-01",
          observations: "Aplicada",
        },
      ],
      pending: [
        {
          vaccine: "Hepatitis B refuerzo",
          suggestedDate: "2026-05-05",
          availability: "Hospital General Norte",
          observations: "Programar post alta",
        },
      ],
    },
    emotionalHealth: {
      currentState: "Ansiedad moderada",
      moodFollowUp: [
        {
          date: "2026-03-08",
          mood: "Preocupada",
          stressFactor: "Control de enfermedad cronica",
          observations: "Requiere acompanamiento educativo.",
        },
      ],
      emotionalAlerts: ["Ansiedad por adherencia terapeutica"],
      recommendations: [
        "Intervencion breve de psicologia",
        "Plan de apoyo familiar",
      ],
    },
    carePlan: [
      {
        id: "cp-005-1",
        nursingDiagnosis: "Manejo inefectivo del regimen terapeutico",
        objective: "Mejorar adherencia al tratamiento",
        interventions: [
          "Educacion diabetologica",
          "Registro de glicemia domiciliaria",
          "Seguimiento interprofesional",
        ],
        evaluation: "En progreso",
        observations: "Paciente motivada a cambios.",
      },
    ],
    documents: [
      {
        id: "doc-005-1",
        type: "PDF",
        title: "Plan nutricional inicial",
        date: "2026-03-08",
        uploadedBy: "Lcda. Gabriela Viteri",
        status: "Disponible",
      },
    ],
    timeline: [
      {
        id: "tl-005-1",
        datetime: "2026-03-08 07:20",
        category: "Triaje",
        detail: "Clasificacion naranja por riesgo metabolico.",
      },
      {
        id: "tl-005-2",
        datetime: "2026-03-08 10:30",
        category: "Nota medica",
        detail: "Ajuste de insulina por hiperglucemia persistente.",
      },
    ],
  },
];

const patientServiceById: Record<string, ServiceArea> = {
  "p-001": "Emergencia",
  "p-002": "Observacion",
  "p-003": "Consulta externa",
  "p-004": "Consulta externa",
  "p-005": "Hospitalizacion",
};

const patientPatternsById: Record<string, FunctionalPattern[]> = {
  "p-001": ["Oxigenacion", "Actividad-ejercicio", "Afrontamiento"],
  "p-002": ["Oxigenacion", "Actividad-ejercicio"],
  "p-003": ["Sueno-descanso", "Afrontamiento"],
  "p-004": ["Cognitivo-perceptual"],
  "p-005": ["Nutricional-metabolico", "Eliminacion", "Afrontamiento"],
};

const kardexAdministrationsByPatientId: Record<string, KardexAdministrationRecord[]> = {
  "p-001": [
    {
      id: "ka-001-1",
      type: "Infusion",
      itemName: "Solucion salina 0.9%",
      route: "IV",
      totalVolumeMl: 1000,
      volumePerHourMl: 80,
      durationHours: 12,
      startedAt: "2026-03-08 07:00",
      responsible: "Lic. Daniela Naranjo",
      status: "Activa",
      notes: "Control por balance y perfusion periferica.",
    },
    {
      id: "ka-001-2",
      type: "Medicacion",
      itemName: "Enoxaparina 40 mg SC",
      route: "SC",
      totalVolumeMl: 2,
      volumePerHourMl: 2,
      durationHours: 1,
      startedAt: "2026-03-08 21:00",
      responsible: "Lic. Daniela Naranjo",
      status: "Activa",
      notes: "Dosis unica programada turno noche.",
    },
  ],
  "p-002": [
    {
      id: "ka-002-1",
      type: "Infusion",
      itemName: "SSN 0.9% mantenimiento",
      route: "IV",
      totalVolumeMl: 500,
      volumePerHourMl: 60,
      durationHours: 8,
      startedAt: "2026-03-08 06:00",
      responsible: "Lic. Ricardo Silva",
      status: "Activa",
      notes: "Mantener hidratacion y vigilar satO2.",
    },
  ],
  "p-005": [
    {
      id: "ka-005-1",
      type: "Infusion",
      itemName: "Cristaloides mantenimiento",
      route: "IV",
      totalVolumeMl: 1000,
      volumePerHourMl: 90,
      durationHours: 10,
      startedAt: "2026-03-08 08:00",
      responsible: "Lic. Daniela Naranjo",
      status: "Activa",
      notes: "Vigilar glucosa y balance neto.",
    },
    {
      id: "ka-005-2",
      type: "Medicacion",
      itemName: "Insulina regular 6 UI",
      route: "SC",
      totalVolumeMl: 1,
      volumePerHourMl: 1,
      durationHours: 1,
      startedAt: "2026-03-08 12:00",
      responsible: "Lic. Daniela Naranjo",
      status: "Activa",
      notes: "Administracion segun escala.",
    },
  ],
};

export const nursingReportRecords: NursingReportTemplateRecord[] = [
  {
    id: "nrf-1",
    patientId: "p-001",
    date: "2026-03-08",
    shift: "Manana",
    service: "Emergencia",
    diagnosis: "Sindrome coronario agudo",
    generalStatus: "Estable con vigilancia intensiva",
    consciousness: "Alerta y orientada",
    breathing: "Disnea leve de esfuerzo",
    pain: "2/10",
    feeding: "Dieta hiposodica tolerada parcialmente",
    elimination: "Diuresis conservada",
    skin: "Integra",
    mobility: "Asistida",
    invasiveDevices: "Cateter periferico permeable",
    proceduresDone: "Monitorizacion cardiaca continua",
    response: "Adecuada al tratamiento",
    incidents: "Sin eventos adversos",
    immediatePlan: "Mantener control cardiometabolico estricto.",
    nandaId: "NANDA-00029",
    nocId: "NOC-0401",
    nicId: "NIC-4160",
    clinicalRationale:
      "Dolor toracico, riesgo cardiovascular alto y cambios hemodinamicos justifican diagnostico NANDA y monitorizacion activa.",
    evaluation: "Meta parcial cumplida. Mantener vigilancia.",
  },
  {
    id: "nrf-2",
    patientId: "p-005",
    date: "2026-03-08",
    shift: "Manana",
    service: "Observacion",
    diagnosis: "Hiperglucemia sintomatica",
    generalStatus: "Estable en observacion",
    consciousness: "Alerta",
    breathing: "Normal",
    pain: "1/10",
    feeding: "Dieta diabetica fraccionada",
    elimination: "Poliuria",
    skin: "Integra",
    mobility: "Independiente",
    invasiveDevices: "Cateter periferico sin signos de infeccion",
    proceduresDone: "Controles glucemicos seriados",
    response: "Cooperadora",
    incidents: "Sin incidencias",
    immediatePlan: "Continuar educacion diabetologica y ajuste insulinico.",
    nandaId: "NANDA-00179",
    nocId: "NOC-1813",
    nicId: "NIC-5602",
    clinicalRationale:
      "Adherencia irregular y descompensacion metabolica hacen prioritario manejo educativo estructurado.",
    evaluation: "En progreso con buena disposicion de paciente.",
  },
];

export function getPatientById(patientId: string) {
  return mockPatients.find((patient) => patient.id === patientId) ?? null;
}

export function getPatientServiceArea(patient: PatientRecord): ServiceArea {
  return patient.serviceArea ?? patientServiceById[patient.id] ?? "Consulta externa";
}

export function getPatientFunctionalPatterns(
  patient: PatientRecord
): FunctionalPattern[] {
  if (patient.functionalPatternsAltered && patient.functionalPatternsAltered.length > 0) {
    return patient.functionalPatternsAltered;
  }
  return patientPatternsById[patient.id] ?? [];
}

export function getKardexAdministrations(patient: PatientRecord) {
  if (patient.kardexAdministrations && patient.kardexAdministrations.length > 0) {
    return patient.kardexAdministrations;
  }
  return kardexAdministrationsByPatientId[patient.id] ?? [];
}

export function getCriticalPatients() {
  return mockPatients.filter(
    (patient) => patient.riskLevel === "alto" || patient.currentStatus === "Critico"
  );
}

export function getPatientsWithAlerts() {
  return mockPatients.filter((patient) => patient.activeAlerts.length > 0);
}

export function getDashboardMetrics() {
  const activePatients = mockPatients.length;
  const criticalPatients = getCriticalPatients().length;
  const observationPatients = mockPatients.filter(
    (patient) => patient.currentStatus === "En observacion"
  ).length;
  const activeAlerts = mockPatients.reduce(
    (count, patient) => count + patient.activeAlerts.length,
    0
  );
  const pendingMedication = getMedicationPendingCount();
  const pendingVaccines = getTotalPendingVaccines();
  const pendingNursingReports = mockPatients.filter(
    (patient) => patient.nursingShiftReports.length === 0
  ).length;
  const incompleteFluidBalances = mockPatients.filter(
    (patient) => patient.careMode === "Hospitalizacion" && patient.fluidBalances.length === 0
  ).length;
  const pendingExamReview = mockPatients.reduce(
    (count, patient) =>
      count + patient.exams.filter((exam) => exam.status === "Pendiente").length,
    0
  );
  const dayPending = mockPatients.filter(
    (patient) => patient.currentStatus === "En observacion" || patient.riskLevel === "alto"
  ).length;

  return {
    activePatients,
    criticalPatients,
    observationPatients,
    activeAlerts,
    pendingMedication,
    pendingVaccines,
    pendingNursingReports,
    incompleteFluidBalances,
    pendingExamReview,
    dayPending,
  };
}

export function getLatestVitalByPatient(patient: PatientRecord) {
  return patient.vitalSigns[0] ?? null;
}

export function getTotalPendingVaccines() {
  return mockPatients.reduce(
    (count, patient) => count + patient.vaccination.pending.length,
    0
  );
}

export function getMedicationPendingCount() {
  return mockPatients.reduce(
    (count, patient) =>
      count +
      patient.medicationRecords.filter(
        (medication) => medication.administrationStatus === "Pendiente"
      ).length,
    0
  );
}

export function getPatientsByTriagePriority() {
  const triageWeight: Record<TriageColor, number> = {
    rojo: 5,
    naranja: 4,
    amarillo: 3,
    verde: 2,
    azul: 1,
  };

  return [...mockPatients].sort(
    (a, b) => triageWeight[b.triageColor] - triageWeight[a.triageColor]
  );
}

export function getFollowUpQueue() {
  return mockPatients.map((patient) => ({
    id: patient.id,
    code: patient.code,
    patientName: patient.fullName,
    diagnosis: patient.primaryDiagnosis,
    serviceArea: getPatientServiceArea(patient),
    adherence:
      patient.medicationRecords.length === 0
        ? "Sin plan farmacologico"
        : patient.medicationRecords.every((item) => item.administrationStatus === "Administrado")
        ? "Adecuada"
        : "Requiere seguimiento",
    nextControl:
      patient.careMode === "Hospitalizacion" ? "Control en 24h" : "Control en 72h",
    changes: patient.timeline.slice(0, 2).map((event) => event.detail),
  }));
}

export function searchPatients(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return mockPatients;
  }

  return mockPatients.filter((patient) => {
    const service = getPatientServiceArea(patient).toLowerCase();
    const terms = [
      patient.firstName,
      patient.lastName,
      patient.fullName,
      patient.identification,
      patient.medicalRecordNumber,
      patient.code,
      patient.assignedProfessional,
      service,
    ]
      .join(" ")
      .toLowerCase();

    return terms.includes(normalized);
  });
}

export function getDailyPendingTasks() {
  const patientsWithoutVitals = mockPatients.filter((patient) => {
    const latest = patient.vitalSigns[0];
    return !latest || !latest.recordedAt.startsWith("2026-03-08");
  });

  const medicationToRegister = mockPatients.filter((patient) =>
    patient.medicationRecords.some((record) => record.administrationStatus === "Pendiente")
  );

  const withAlerts = getPatientsWithAlerts();
  const withPendingVaccines = mockPatients.filter(
    (patient) => patient.vaccination.pending.length > 0
  );
  const withIncompleteBalance = mockPatients.filter(
    (patient) => patient.careMode === "Hospitalizacion" && patient.fluidBalances.length === 0
  );
  const shiftReportPending = mockPatients.filter(
    (patient) => patient.nursingShiftReports.length === 0
  );

  return [
    {
      id: "pending-vitals",
      label: "Pacientes sin signos vitales actualizados",
      count: patientsWithoutVitals.length,
      patients: patientsWithoutVitals.map((patient) => patient.fullName),
    },
    {
      id: "pending-medication",
      label: "Pacientes con medicacion por registrar",
      count: medicationToRegister.length,
      patients: medicationToRegister.map((patient) => patient.fullName),
    },
    {
      id: "pending-alerts",
      label: "Pacientes con alerta activa",
      count: withAlerts.length,
      patients: withAlerts.map((patient) => patient.fullName),
    },
    {
      id: "pending-vaccines",
      label: "Pacientes con vacuna pendiente",
      count: withPendingVaccines.length,
      patients: withPendingVaccines.map((patient) => patient.fullName),
    },
    {
      id: "pending-balance",
      label: "Pacientes con balance hidrico incompleto",
      count: withIncompleteBalance.length,
      patients: withIncompleteBalance.map((patient) => patient.fullName),
    },
    {
      id: "pending-shift-report",
      label: "Pacientes con reporte de turno pendiente",
      count: shiftReportPending.length,
      patients: shiftReportPending.map((patient) => patient.fullName),
    },
  ];
}

export function getRecentClinicalActivity() {
  const activity = mockPatients.flatMap((patient) => {
    const items: Array<{
      id: string;
      category:
        | "Control"
        | "Nota enfermeria"
        | "Medicacion"
        | "Vacunacion"
        | "Examen"
        | "Reporte";
      datetime: string;
      patientId: string;
      patientName: string;
      detail: string;
    }> = [];

    const latestVital = patient.vitalSigns[0];
    if (latestVital) {
      items.push({
        id: `${patient.id}-control`,
        category: "Control",
        datetime: latestVital.recordedAt,
        patientId: patient.id,
        patientName: patient.fullName,
        detail: `Control de signos TA ${latestVital.bloodPressure}, FC ${latestVital.heartRate}`,
      });
    }

    const latestNursingNote = patient.nursingNotes[0];
    if (latestNursingNote) {
      items.push({
        id: `${patient.id}-nurse-note`,
        category: "Nota enfermeria",
        datetime: latestNursingNote.datetime,
        patientId: patient.id,
        patientName: patient.fullName,
        detail: latestNursingNote.note,
      });
    }

    const latestMedication = patient.medicationRecords[0];
    if (latestMedication) {
      items.push({
        id: `${patient.id}-medication`,
        category: "Medicacion",
        datetime: `${latestMedication.startDate} 09:00`,
        patientId: patient.id,
        patientName: patient.fullName,
        detail: `${latestMedication.name} ${latestMedication.dose} (${latestMedication.administrationStatus})`,
      });
    }

    const latestVaccination = patient.vaccination.applied[0];
    if (latestVaccination) {
      items.push({
        id: `${patient.id}-vaccination`,
        category: "Vacunacion",
        datetime: `${latestVaccination.date} 10:00`,
        patientId: patient.id,
        patientName: patient.fullName,
        detail: `Vacuna aplicada: ${latestVaccination.vaccine}`,
      });
    }

    const latestExam = patient.exams[0];
    if (latestExam) {
      items.push({
        id: `${patient.id}-exam`,
        category: "Examen",
        datetime: latestExam.resultAt ?? latestExam.requestedAt,
        patientId: patient.id,
        patientName: patient.fullName,
        detail: `${latestExam.name} (${latestExam.status})`,
      });
    }

    const latestReport = patient.nursingShiftReports[0];
    if (latestReport) {
      items.push({
        id: `${patient.id}-report`,
        category: "Reporte",
        datetime: `${latestReport.date} 12:00`,
        patientId: patient.id,
        patientName: patient.fullName,
        detail: `Reporte de turno ${latestReport.shift}`,
      });
    }

    return items;
  });

  return activity
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 12);
}

export function getCurrentCenter() {
  return (
    healthCenters.find((center) => center.id === currentClinicalContext.centerId) ??
    healthCenters[0]
  );
}

export function getCenterVaccineInventory(centerId: string) {
  return vaccineInventory.filter((item) => item.centerId === centerId);
}

export function getCenterOperationalSummary() {
  const center = getCurrentCenter();
  const centerInventory = getCenterVaccineInventory(center.id);
  const availableVaccines = centerInventory.filter(
    (item) => item.status === "Disponible"
  ).length;

  return {
    centerName: center.name,
    capacity: center.capacity,
    services: center.services,
    professionalsInShift: teamMembers.length,
    availableVaccines,
  };
}
