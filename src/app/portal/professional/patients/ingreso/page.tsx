"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { ModulePage, Panel, StatCard } from "../../_components/clinical-ui";
import type { CedulaLookupErrorResponse, CedulaLookupResponse } from "@/types/paciente-cedula";
import type { RegisteredPatientRecord, RegisteredPatientSummary } from "@/types/patient-intake";

type FormState = {
  source: "manual" | "registro_civil";
  documentType: "cedula" | "pasaporte" | "carne_refugiado";
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  birthDate: string;
  sexBiological: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  civilStatus: string;
  educationLevel: string;
  occupation: string;
  workplace: string;
  religion: string;
  establishment: string;
  service: string;
  professionalSenescyt: string;
  consultationDurationMinutes: string;
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
  affiliationType: "IESS" | "ISSFA" | "ISSPOL" | "privado" | "particular" | "otro";
  iessNumber: string;
  privateInsurer: string;
  privatePolicyNumber: string;
  employer: string;
  copayExemption: string;
  disabilityPercent: string;
  conadisNumber: string;
  bloodGroup: string;
  personalPathological: string;
  familyHistory: string;
  surgeries: string;
  previousHospitalizations: string;
  allergiesMedications: string;
  allergiesFoods: string;
  allergiesEnvironmental: string;
  allergiesContrastLatex: string;
  tobacco: string;
  alcohol: string;
  drugs: string;
  physicalActivityMinutesPerWeek: string;
  dietType: string;
  sleepHours: string;
  occupationalRiskExposure: string;
  consultationType: "primera_vez" | "subsecuente" | "urgencia" | "teleconsulta";
  literalReason: string;
  evolutionTime: string;
  mainSymptom: string;
  currentIllnessNarrative: string;
  previousEpisodeTreatments: string;
  reviewGeneral: string;
  reviewCardiovascular: string;
  reviewRespiratory: string;
  reviewDigestive: string;
  reviewGenitourinary: string;
  reviewNeurologic: string;
  reviewMusculoskeletal: string;
  reviewDermatologic: string;
  reviewPsychiatric: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  capillaryGlucose: string;
  painScale: string;
  glasgow: string;
  generalAppearance: string;
  skin: string;
  headNeck: string;
  ent: string;
  thoraxLungs: string;
  cardiovascularExam: string;
  abdomen: string;
  extremities: string;
  neurologicExam: string;
  genitourinaryExam: string;
  rectalExam: string;
  gynecoExam: string;
  cie11Code: string;
  diagnosisDescription: string;
  diagnosisType: "definitivo" | "presuntivo" | "descartado";
  diagnosisCondition: "principal" | "secundario" | "complicacion";
  pregnancyRelated: boolean;
  nonPharmacological: string;
  followUpInstructions: string;
  alarmSignsExplained: string;
  referralDestination: string;
  prescriptionDci: string;
  prescriptionDose: string;
  prescriptionRoute: string;
  prescriptionFrequency: string;
  prescriptionDuration: string;
  prescriptionInstructions: string;
  arrivalMode: string;
  accompaniedBy: string;
  initialCondition: string;
  triageModel: "Manchester" | "ESI" | "otro";
  triageDiscriminator: string;
  triageLevel: string;
  triageColor: string;
  maxWaitMinutes: string;
  retriageAutomatic: boolean;
  admissionArea: string;
  admissionSourceEstablishment: string;
  admissionSourceService: string;
  admissionBedOrDesk: string;
  labRequests: string;
  labCriticalResults: string;
  labPriority: string;
  labClinicalJustification: string;
  imagingRequests: string;
  imagingReports: string;
  imagingPriority: string;
  imagingClinicalJustification: string;
  consentRequired: boolean;
  consentObtained: boolean;
  consentType: string;
  consentScope: string;
  consentRisks: string;
  consentBenefits: string;
  consentAlternatives: string;
  consentObtainedBy: string;
  consentObtainedAt: string;
  consentWitnessName: string;
  consentRepresentativeName: string;
  consentRepresentativeRelationship: string;
  consentDecisionCapacity: string;
  consentRefusalReason: string;
  interconsultRequested: boolean;
  interconsultSpecialty: string;
  interconsultPriority: string;
  interconsultReason: string;
  interconsultSummary: string;
  interconsultRequestedAt: string;
  interconsultResponseSummary: string;
  referralType: string;
  referenceCode: string;
  referenceReason: string;
  referenceClinicalSummary: string;
  referenceFindings: string;
  referenceTreatmentsPerformed: string;
  referenceRecommendedTreatment: string;
  counterReferenceSummary: string;
  notifiableDisease: boolean;
  publicHealthCondition: string;
  siveAlertCode: string;
  outbreakCluster: string;
  surveillanceNotes: string;
};

const bloodGroups = ["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const sexBiologicalOptions = ["", "masculino", "femenino", "intersexual", "no especificado"];
const genderOptions = [
  "",
  "masculino",
  "femenino",
  "no binario",
  "transmasculino",
  "transfemenino",
  "prefiere no indicar",
];
const nationalityOptions = [
  "Ecuatoriana",
  "Colombiana",
  "Peruana",
  "Venezolana",
  "Boliviana",
  "Argentina",
  "Chilena",
  "Cubana",
  "Estadounidense",
  "Otra",
];
const ethnicityOptions = [
  "",
  "Mestizo/a",
  "Montubio/a",
  "Afroecuatoriano/a",
  "Indigena",
  "Blanco/a",
  "Mulato/a",
  "Otro",
];
const civilStatusOptions = [
  "",
  "Soltero/a",
  "Casado/a",
  "Union de hecho",
  "Divorciado/a",
  "Viudo/a",
  "Separado/a",
];
const educationLevelOptions = [
  "",
  "Sin instruccion",
  "Inicial",
  "Basica",
  "Bachillerato",
  "Tecnico / tecnologico",
  "Superior",
  "Posgrado",
];
const occupationOptions = [
  "Estudiante",
  "Empleado publico",
  "Empleado privado",
  "Independiente",
  "Comerciante",
  "Agricultor/a",
  "Ama de casa",
  "Jubilado/a",
  "Desempleado/a",
  "Chofer",
  "Docente",
  "Enfermero/a",
  "Medico/a",
  "Obrero/a",
  "Administrativo/a",
  "Tecnico/a",
  "Policia",
  "Militar",
  "Artesano/a",
  "Otro",
];
const religionOptions = [
  "Catolica",
  "Evangelica",
  "Cristiana",
  "Adventista",
  "Testigos de Jehova",
  "Mormona",
  "Judia",
  "Islamica",
  "Agnostico/a",
  "Ninguna",
  "Otra",
];
const relationshipOptions = [
  "",
  "Madre",
  "Padre",
  "Hijo/a",
  "Hermano/a",
  "Esposo/a",
  "Pareja",
  "Abuelo/a",
  "Tio/a",
  "Tutor legal",
  "Amigo/a",
  "Vecino/a",
  "Otro",
];
const provinceOptions = [
  "",
  "Pichincha",
  "Guayas",
  "Azuay",
  "Manabi",
  "Tungurahua",
  "Loja",
  "El Oro",
  "Santo Domingo de los Tsachilas",
];
const cantonCatalogByProvince: Record<string, string[]> = {
  Pichincha: ["Quito", "Cayambe", "Mejia", "Pedro Moncayo", "Ruminahui"],
  Guayas: ["Guayaquil", "Duran", "Samborondon", "Milagro", "Daule"],
  Azuay: ["Cuenca", "Gualaceo", "Paute"],
  Manabi: ["Manta", "Portoviejo", "Chone", "Jipijapa"],
  Tungurahua: ["Ambato", "Banos", "Pelileo"],
  Loja: ["Loja", "Catamayo", "Saraguro"],
  "El Oro": ["Machala", "Santa Rosa", "Pasaje"],
  "Santo Domingo de los Tsachilas": ["Santo Domingo", "La Concordia"],
};
const parishCatalogByCanton: Record<string, string[]> = {
  Quito: ["Inaquito", "Belisario Quevedo", "Chillogallo", "Cotocollao", "Quitumbe"],
  Cayambe: ["Cayambe", "Ayora", "Cangahua"],
  Mejia: ["Machachi", "Aloag", "Tambillo"],
  Ruminahui: ["Sangolqui", "San Rafael", "Cotogchoa"],
  Guayaquil: ["Tarqui", "Ximena", "Febres Cordero", "Pascuales", "Urdaneta"],
  Duran: ["Eloy Alfaro", "El Recreo"],
  Samborondon: ["La Puntilla", "Samborondon"],
  Cuenca: ["El Sagrario", "Yanuncay", "Totoracocha", "Monay"],
  Manta: ["Manta", "Tarqui", "Los Esteros"],
  Portoviejo: ["12 de Marzo", "Portoviejo", "Andres de Vera"],
  Ambato: ["Atocha", "Ficoa", "Huachi Grande", "Izamba"],
  Loja: ["El Sagrario", "San Sebastian", "Sucre"],
  Machala: ["Machala", "Puerto Bolivar", "El Cambio"],
  "Santo Domingo": ["Santo Domingo", "Chiguilpe", "Rio Verde"],
};

type IntakeStepId = 1 | 2 | 3 | 4 | 5;

const intakeSteps: Array<{
  id: IntakeStepId;
  title: string;
  description: string;
}> = [
  {
    id: 1,
    title: "Identificacion",
    description: "Datos administrativos, contacto y financiamiento",
  },
  {
    id: 2,
    title: "Antecedentes",
    description: "Base clinica y alergias",
  },
  {
    id: 3,
    title: "Consulta",
    description: "Anamnesis, examen fisico y diagnostico",
  },
  {
    id: 4,
    title: "Plan",
    description: "Plan terapeutico y registro final",
  },
  {
    id: 5,
    title: "MSP",
    description: "Consentimiento, continuidad y vigilancia",
  },
];

const LAST_INTAKE_STEP: IntakeStepId = 5;

const intakeStepRequiredFields: Record<
  IntakeStepId,
  Array<{ key: keyof FormState; label: string }>
> = {
  1: [
    { key: "documentNumber", label: "Documento" },
    { key: "firstNames", label: "Nombres" },
    { key: "lastNames", label: "Apellidos" },
  ],
  2: [],
  3: [{ key: "literalReason", label: "Motivo de consulta" }],
  4: [],
  5: [],
};

const emptyForm: FormState = {
  source: "manual",
  documentType: "cedula",
  documentNumber: "",
  firstNames: "",
  lastNames: "",
  birthDate: "",
  sexBiological: "",
  gender: "",
  nationality: "Ecuatoriana",
  ethnicity: "",
  civilStatus: "",
  educationLevel: "",
  occupation: "",
  workplace: "",
  religion: "",
  establishment: "Hospital General Norte",
  service: "Consulta externa",
  professionalSenescyt: "",
  consultationDurationMinutes: "",
  address: "",
  parish: "",
  canton: "",
  province: "",
  gpsLat: "",
  gpsLng: "",
  phonePrimary: "",
  phoneSecondary: "",
  whatsapp: "",
  email: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  legalRepresentative: "",
  affiliationType: "particular",
  iessNumber: "",
  privateInsurer: "",
  privatePolicyNumber: "",
  employer: "",
  copayExemption: "",
  disabilityPercent: "",
  conadisNumber: "",
  bloodGroup: "",
  personalPathological: "",
  familyHistory: "",
  surgeries: "",
  previousHospitalizations: "",
  allergiesMedications: "",
  allergiesFoods: "",
  allergiesEnvironmental: "",
  allergiesContrastLatex: "",
  tobacco: "",
  alcohol: "",
  drugs: "",
  physicalActivityMinutesPerWeek: "",
  dietType: "",
  sleepHours: "",
  occupationalRiskExposure: "",
  consultationType: "primera_vez",
  literalReason: "",
  evolutionTime: "",
  mainSymptom: "",
  currentIllnessNarrative: "",
  previousEpisodeTreatments: "",
  reviewGeneral: "",
  reviewCardiovascular: "",
  reviewRespiratory: "",
  reviewDigestive: "",
  reviewGenitourinary: "",
  reviewNeurologic: "",
  reviewMusculoskeletal: "",
  reviewDermatologic: "",
  reviewPsychiatric: "",
  bloodPressure: "",
  heartRate: "",
  respiratoryRate: "",
  temperature: "",
  spo2: "",
  weightKg: "",
  heightCm: "",
  capillaryGlucose: "",
  painScale: "",
  glasgow: "",
  generalAppearance: "",
  skin: "",
  headNeck: "",
  ent: "",
  thoraxLungs: "",
  cardiovascularExam: "",
  abdomen: "",
  extremities: "",
  neurologicExam: "",
  genitourinaryExam: "",
  rectalExam: "",
  gynecoExam: "",
  cie11Code: "",
  diagnosisDescription: "",
  diagnosisType: "definitivo",
  diagnosisCondition: "principal",
  pregnancyRelated: false,
  nonPharmacological: "",
  followUpInstructions: "",
  alarmSignsExplained: "",
  referralDestination: "",
  prescriptionDci: "",
  prescriptionDose: "",
  prescriptionRoute: "",
  prescriptionFrequency: "",
  prescriptionDuration: "",
  prescriptionInstructions: "",
  arrivalMode: "",
  accompaniedBy: "",
  initialCondition: "",
  triageModel: "Manchester",
  triageDiscriminator: "",
  triageLevel: "",
  triageColor: "",
  maxWaitMinutes: "",
  retriageAutomatic: false,
  admissionArea: "",
  admissionSourceEstablishment: "Hospital General Norte",
  admissionSourceService: "",
  admissionBedOrDesk: "",
  labRequests: "",
  labCriticalResults: "",
  labPriority: "",
  labClinicalJustification: "",
  imagingRequests: "",
  imagingReports: "",
  imagingPriority: "",
  imagingClinicalJustification: "",
  consentRequired: false,
  consentObtained: false,
  consentType: "",
  consentScope: "",
  consentRisks: "",
  consentBenefits: "",
  consentAlternatives: "",
  consentObtainedBy: "",
  consentObtainedAt: "",
  consentWitnessName: "",
  consentRepresentativeName: "",
  consentRepresentativeRelationship: "",
  consentDecisionCapacity: "",
  consentRefusalReason: "",
  interconsultRequested: false,
  interconsultSpecialty: "",
  interconsultPriority: "",
  interconsultReason: "",
  interconsultSummary: "",
  interconsultRequestedAt: "",
  interconsultResponseSummary: "",
  referralType: "",
  referenceCode: "",
  referenceReason: "",
  referenceClinicalSummary: "",
  referenceFindings: "",
  referenceTreatmentsPerformed: "",
  referenceRecommendedTreatment: "",
  counterReferenceSummary: "",
  notifiableDisease: false,
  publicHealthCondition: "",
  siveAlertCode: "",
  outbreakCluster: "",
  surveillanceNotes: "",
};

export default function PatientIntakePage() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [cedulaLookupInput, setCedulaLookupInput] = useState("");
  const [cedulaLookupLoading, setCedulaLookupLoading] = useState(false);
  const [cedulaLookupMessage, setCedulaLookupMessage] = useState<string | null>(null);
  const [cedulaLookupError, setCedulaLookupError] = useState<string | null>(null);
  const [cedulaLookupExistingUrl, setCedulaLookupExistingUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<IntakeStepId>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdRecord, setCreatedRecord] = useState<RegisteredPatientRecord | null>(null);
  const [latest, setLatest] = useState<RegisteredPatientSummary[]>([]);
  const availableCantons = useMemo(
    () => (form.province ? (cantonCatalogByProvince[form.province] ?? []) : []),
    [form.province]
  );
  const availableParishes = useMemo(
    () => (form.canton ? (parishCatalogByCanton[form.canton] ?? []) : []),
    [form.canton]
  );

  useEffect(() => {
    const cedula = searchParams.get("cedula") ?? "";
    const nombres = searchParams.get("nombres") ?? "";
    const apellidos = searchParams.get("apellidos") ?? "";
    const fechaNacimiento = searchParams.get("fechaNacimiento") ?? "";
    const sexo = searchParams.get("sexo") ?? "";

    if (!cedula && !nombres && !apellidos) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      source: cedula ? "registro_civil" : "manual",
      documentNumber: cedula || prev.documentNumber,
      firstNames: nombres || prev.firstNames,
      lastNames: apellidos || prev.lastNames,
      birthDate: fechaNacimiento || prev.birthDate,
      sexBiological: sexo || prev.sexBiological,
      gender: sexo || prev.gender,
    }));
    if (cedula) {
      setCedulaLookupInput(cedula);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const response = await fetch("/api/paciente/registro", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: RegisteredPatientSummary[];
        };
        if (response.ok && payload.data) {
          setLatest(payload.data.slice(0, 6));
        }
      } catch {
        // Ignore list errors in form page.
      }
    };

    loadLatest();
  }, []);

  useEffect(() => {
    if (form.canton && availableCantons.length > 0 && !availableCantons.includes(form.canton)) {
      setForm((prev) => ({ ...prev, canton: "", parish: "" }));
    }
  }, [availableCantons, form.canton]);

  useEffect(() => {
    if (form.parish && availableParishes.length > 0 && !availableParishes.includes(form.parish)) {
      setForm((prev) => ({ ...prev, parish: "" }));
    }
  }, [availableParishes, form.parish]);

  const requiredMissing = useMemo(() => {
    const missing: string[] = [];
    if (!form.documentNumber.trim()) missing.push("Documento");
    if (!form.firstNames.trim()) missing.push("Nombres");
    if (!form.lastNames.trim()) missing.push("Apellidos");
    if (!form.literalReason.trim()) missing.push("Motivo de consulta");
    return missing;
  }, [form.documentNumber, form.firstNames, form.lastNames, form.literalReason]);
  const missingByStep = useMemo(() => {
    const byStep = {
      1: [] as string[],
      2: [] as string[],
      3: [] as string[],
      4: [] as string[],
      5: [] as string[],
    };

    intakeSteps.forEach((step) => {
      const missing = intakeStepRequiredFields[step.id]
        .filter((item) => {
          const value = form[item.key];
          return typeof value === "string" ? !value.trim() : !value;
        })
        .map((item) => item.label);
      byStep[step.id] = missing;
    });

    if (form.consentRequired) {
      if (form.consentObtained) {
        if (!form.consentType.trim()) byStep[5].push("Tipo de consentimiento");
        if (!form.consentScope.trim()) byStep[5].push("Alcance/procedimiento");
        if (!form.consentObtainedBy.trim()) byStep[5].push("Responsable del consentimiento");
        if (!form.consentObtainedAt.trim()) byStep[5].push("Fecha/hora del consentimiento");
      } else if (!form.consentRefusalReason.trim()) {
        byStep[5].push("Motivo de no obtencion del consentimiento");
      }
    }

    const hasReferral =
      form.referralType.trim() ||
      form.referenceCode.trim() ||
      form.referenceReason.trim() ||
      form.referralDestination.trim() ||
      form.referenceClinicalSummary.trim();
    if (hasReferral) {
      if (!form.referenceReason.trim()) byStep[5].push("Motivo de referencia");
      if (!form.referralDestination.trim()) byStep[5].push("Destino de referencia");
      if (!form.referenceClinicalSummary.trim()) byStep[5].push("Resumen clinico de referencia");
      if (!form.referenceFindings.trim()) byStep[5].push("Hallazgos relevantes");
      if (!form.referenceTreatmentsPerformed.trim()) byStep[5].push("Tratamiento realizado");
    }

    if (form.interconsultRequested) {
      if (!form.interconsultSpecialty.trim()) byStep[5].push("Especialidad de interconsulta");
      if (!form.interconsultReason.trim()) byStep[5].push("Motivo de interconsulta");
      if (!form.interconsultSummary.trim()) byStep[5].push("Resumen clinico de interconsulta");
    }

    if (form.notifiableDisease) {
      if (!form.publicHealthCondition.trim() && !form.siveAlertCode.trim()) {
        byStep[5].push("Evento o codigo SIVE");
      }
      if (!form.surveillanceNotes.trim()) byStep[5].push("Notas de vigilancia");
    }

    return byStep;
  }, [form]);
  const activeStepMeta = intakeSteps.find((step) => step.id === activeStep) ?? intakeSteps[0];
  const canGoNext = activeStep < LAST_INTAKE_STEP && missingByStep[activeStep].length === 0;

  const onChange =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        event.target instanceof HTMLInputElement && event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setWizardError(null);
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const goToStep = (stepId: IntakeStepId) => {
    if (stepId <= activeStep) {
      setWizardError(null);
      setActiveStep(stepId);
      return;
    }

    for (let current = activeStep; current < stepId; current += 1) {
      const stepIndex = current as IntakeStepId;
      if (missingByStep[stepIndex].length > 0) {
        const blockedStep = intakeSteps.find((step) => step.id === stepIndex);
        setWizardError(
          `Completa ${missingByStep[stepIndex].join(", ")} antes de avanzar desde ${blockedStep?.title ?? "el paso actual"}.`
        );
        return;
      }
    }

    setWizardError(null);
    setActiveStep(stepId);
  };

  const goNextStep = () => {
    if (activeStep >= LAST_INTAKE_STEP) {
      return;
    }

    if (missingByStep[activeStep].length > 0) {
      setWizardError(`Completa ${missingByStep[activeStep].join(", ")} para continuar.`);
      return;
    }

    setWizardError(null);
    setActiveStep((prev) => (prev + 1) as IntakeStepId);
  };

  const goPreviousStep = () => {
    setWizardError(null);
    setActiveStep((prev) => Math.max(1, prev - 1) as IntakeStepId);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatedRecord(null);

    if (requiredMissing.length > 0) {
      setError(`Completa campos obligatorios: ${requiredMissing.join(", ")}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload(form);
      const response = await fetch("/api/paciente/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as {
        data?: RegisteredPatientRecord;
        error?: string;
      };

      if (!response.ok || !responsePayload.data) {
        throw new Error(responsePayload.error ?? "No se pudo registrar el paciente.");
      }

      const created = responsePayload.data;
      setCreatedRecord(created);
      setSuccess(
        `Paciente ingresado correctamente con HC ${created.medicalRecordNumber}.`
      );
      setLatest((prev) => [toSummary(created), ...prev].slice(0, 6));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error inesperado al registrar paciente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCedulaLookup = async () => {
    const cedula = normalizeCedula(cedulaLookupInput);
    setCedulaLookupMessage(null);
    setCedulaLookupError(null);
    setCedulaLookupExistingUrl(null);

    if (cedula.length !== 10) {
      setCedulaLookupError("Ingresa una cedula valida de 10 digitos.");
      return;
    }

    setCedulaLookupLoading(true);
    try {
      const response = await fetch(
        `/api/paciente/cedula?cedula=${encodeURIComponent(cedula)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorPayload = (await response.json()) as CedulaLookupErrorResponse;
        throw new Error(errorPayload.error ?? "No se pudo consultar la cedula.");
      }

      const payload = (await response.json()) as CedulaLookupResponse;
      if (payload.estado === "found") {
        setCedulaLookupExistingUrl(
          payload.paciente.fichaUrl ?? `/portal/professional/patients/${payload.paciente.id}`
        );
        setCedulaLookupMessage(
          `Paciente ya existe en Vita: ${payload.paciente.nombreCompleto} (HC ${payload.paciente.historiaClinicaNumero}).`
        );
      } else {
        const hasRcNames =
          Boolean(payload.registroCivil.nombres.trim()) &&
          Boolean(payload.registroCivil.apellidos.trim());
        setCedulaLookupMessage(
          hasRcNames
            ? `Datos cargados desde Registro Civil para ${payload.registroCivil.nombres} ${payload.registroCivil.apellidos}.`
            : "Cedula valida. Completa nombres y apellidos manualmente para continuar."
        );
        setForm((prev) => ({
          ...prev,
          source: hasRcNames ? "registro_civil" : "manual",
          documentType: "cedula",
          documentNumber: payload.registroCivil.cedula,
          firstNames: payload.registroCivil.nombres || prev.firstNames,
          lastNames: payload.registroCivil.apellidos || prev.lastNames,
          birthDate: payload.registroCivil.fecha_nacimiento ?? prev.birthDate,
          sexBiological: payload.registroCivil.sexo ?? prev.sexBiological,
          gender: payload.registroCivil.sexo ?? prev.gender,
        }));
      }
    } catch (lookupError) {
      setCedulaLookupError(
        lookupError instanceof Error
          ? lookupError.message
          : "Error inesperado al buscar la cedula."
      );
    } finally {
      setCedulaLookupLoading(false);
    }
  };

  return (
    <ModulePage
      title="Ingreso de paciente"
      subtitle="Registro integral de historia clinica, antecedentes, consulta, diagnostico y plan terapeutico."
      actions={
        <div className="flex gap-2">
          <Link
            href="/portal/professional/patients"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver a pacientes
          </Link>
        </div>
      }
    >
      <Panel
        title="Busqueda por cedula (Registro Civil)"
        subtitle="Consulta server-side con webservices.ec usando token seguro y autocompleta datos de identificacion"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-sm">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Cedula ecuatoriana
            </label>
            <input
              value={cedulaLookupInput}
              onChange={(event) => setCedulaLookupInput(normalizeCedula(event.target.value))}
              maxLength={10}
              inputMode="numeric"
              placeholder="Ej. 1722334412"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onCedulaLookup}
            disabled={cedulaLookupLoading}
            className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cedulaLookupLoading ? "Consultando..." : "Buscar por cedula"}
          </button>
        </div>
        {cedulaLookupMessage ? <p className="mt-2 text-xs text-emerald-700">{cedulaLookupMessage}</p> : null}
        {cedulaLookupError ? <p className="mt-2 text-xs text-red-700">{cedulaLookupError}</p> : null}
        {cedulaLookupExistingUrl ? (
          <Link href={cedulaLookupExistingUrl} className="mt-2 inline-block text-xs font-semibold text-sky-700 underline">
            Abrir ficha existente
          </Link>
        ) : null}
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Campos obligatorios" value={4} hint="Documento, nombres, apellidos y motivo" />
        <StatCard label="Faltantes actuales" value={requiredMissing.length} hint={requiredMissing.join(", ") || "Formulario listo"} />
        <StatCard label="Registros recientes" value={latest.length} hint="Pacientes ingresados en esta sesion" />
        <StatCard label="Origen" value={form.source === "registro_civil" ? "Registro Civil" : "Manual"} hint="Trazabilidad de identificacion" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="sticky top-2 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Wizard de ingreso
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Paso {activeStepMeta.id} de {LAST_INTAKE_STEP} · {activeStepMeta.title}
              </p>
              <p className="text-[11px] text-slate-500">{activeStepMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {intakeSteps.map((step) => {
                const active = step.id === activeStep;
                const completed =
                  step.id < activeStep && missingByStep[step.id].length === 0;
                const missingCount = missingByStep[step.id].length;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={[
                      "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                      active
                        ? "border-sky-300 bg-sky-50 text-sky-800"
                        : completed
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {step.id}. {step.title}
                    {missingCount > 0 ? ` (${missingCount})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
          {wizardError ? <p className="mt-2 text-xs text-red-700">{wizardError}</p> : null}
        </div>

        {activeStep === 1 && (
          <>
            <Panel title="1) Identificacion del paciente" subtitle="Muestra primero solo los datos esenciales para crear la ficha">
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Los campos complementarios siguen disponibles, pero quedan plegados para que el ingreso inicial sea mas rapido y claro.
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <SelectField
                  label="Tipo documento"
                  value={form.documentType}
                  onChange={onChange("documentType")}
                  options={[
                    { value: "cedula", label: "Cedula" },
                    { value: "pasaporte", label: "Pasaporte" },
                    { value: "carne_refugiado", label: "Carne refugiado" },
                  ]}
                />
                <InputField label="Numero documento *" value={form.documentNumber} onChange={onChange("documentNumber")} />
                <InputField label="Nombres *" value={form.firstNames} onChange={onChange("firstNames")} />
                <InputField label="Apellidos *" value={form.lastNames} onChange={onChange("lastNames")} />
                <InputField label="Fecha nacimiento" type="date" value={form.birthDate} onChange={onChange("birthDate")} />
                <SelectField
                  label="Sexo biologico"
                  value={form.sexBiological}
                  onChange={onChange("sexBiological")}
                  options={sexBiologicalOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                />
                <SelectField
                  label="Grupo sanguineo"
                  value={form.bloodGroup}
                  onChange={onChange("bloodGroup")}
                  options={bloodGroups.map((item) => ({ value: item, label: item || "Seleccione" }))}
                />
              </div>

              <OptionalGroup
                title="Datos demograficos opcionales"
                description="Solo abrir si necesitas ampliar estadistica poblacional o contexto social del paciente."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <SelectField
                    label="Genero"
                    value={form.gender}
                    onChange={onChange("gender")}
                    options={genderOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                  />
                  <DatalistField
                    label="Nacionalidad"
                    value={form.nationality}
                    onChange={onChange("nationality")}
                    options={nationalityOptions}
                  />
                  <SelectField
                    label="Etnia"
                    value={form.ethnicity}
                    onChange={onChange("ethnicity")}
                    options={ethnicityOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                  />
                  <SelectField
                    label="Estado civil"
                    value={form.civilStatus}
                    onChange={onChange("civilStatus")}
                    options={civilStatusOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                  />
                  <SelectField
                    label="Nivel instruccion"
                    value={form.educationLevel}
                    onChange={onChange("educationLevel")}
                    options={educationLevelOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                  />
                  <DatalistField
                    label="Ocupacion"
                    value={form.occupation}
                    onChange={onChange("occupation")}
                    options={occupationOptions}
                  />
                  <InputField label="Lugar de trabajo" value={form.workplace} onChange={onChange("workplace")} />
                  <DatalistField
                    label="Religion"
                    value={form.religion}
                    onChange={onChange("religion")}
                    options={religionOptions}
                  />
                </div>
              </OptionalGroup>
            </Panel>

            <Panel title="2) Contacto y ubicacion" subtitle="Solo se muestran los datos de localizacion y contacto realmente utiles para abrir la atencion">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <InputField label="Telefono principal" value={form.phonePrimary} onChange={onChange("phonePrimary")} />
                <InputField label="Direccion" value={form.address} onChange={onChange("address")} />
                <SelectField
                  label="Provincia"
                  value={form.province}
                  onChange={onChange("province")}
                  options={provinceOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                />
                <DatalistField
                  label="Canton"
                  value={form.canton}
                  onChange={onChange("canton")}
                  options={availableCantons}
                  placeholder={form.province ? "Selecciona o escribe el canton" : "Primero selecciona la provincia"}
                />
                <DatalistField
                  label="Parroquia"
                  value={form.parish}
                  onChange={onChange("parish")}
                  options={availableParishes}
                  placeholder={form.canton ? "Selecciona o escribe la parroquia" : "Primero selecciona el canton"}
                />
                <InputField label="Contacto emergencia" value={form.emergencyName} onChange={onChange("emergencyName")} />
                <SelectField
                  label="Relacion"
                  value={form.emergencyRelationship}
                  onChange={onChange("emergencyRelationship")}
                  options={relationshipOptions.map((item) => ({ value: item, label: item || "Seleccione" }))}
                />
                <InputField label="Telefono emergencia" value={form.emergencyPhone} onChange={onChange("emergencyPhone")} />
              </div>

              <OptionalGroup
                title="Contacto ampliado y datos legales"
                description="Se recomienda llenarlo solo si aporta al seguimiento o si el caso lo requiere."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <InputField label="Telefono secundario" value={form.phoneSecondary} onChange={onChange("phoneSecondary")} />
                  <InputField label="WhatsApp" value={form.whatsapp} onChange={onChange("whatsapp")} />
                  <InputField label="Email" type="email" value={form.email} onChange={onChange("email")} />
                  <InputField label="Representante legal" value={form.legalRepresentative} onChange={onChange("legalRepresentative")} />
                  <InputField label="GPS lat" value={form.gpsLat} onChange={onChange("gpsLat")} />
                  <InputField label="GPS lng" value={form.gpsLng} onChange={onChange("gpsLng")} />
                </div>
              </OptionalGroup>
            </Panel>

            <Panel title="3) Afiliacion y financiamiento" subtitle="Se simplifica a la cobertura principal; el resto queda como dato complementario">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <SelectField
                  label="Tipo afiliacion"
                  value={form.affiliationType}
                  onChange={onChange("affiliationType")}
                  options={[
                    { value: "particular", label: "Particular" },
                    { value: "IESS", label: "IESS" },
                    { value: "ISSFA", label: "ISSFA" },
                    { value: "ISSPOL", label: "ISSPOL" },
                    { value: "privado", label: "Seguro privado" },
                    { value: "otro", label: "Otro" },
                  ]}
                />

                {form.affiliationType === "IESS" ? (
                  <InputField label="Numero IESS" value={form.iessNumber} onChange={onChange("iessNumber")} />
                ) : null}
                {form.affiliationType === "privado" ? (
                  <>
                    <InputField label="Aseguradora privada" value={form.privateInsurer} onChange={onChange("privateInsurer")} />
                    <InputField label="Poliza" value={form.privatePolicyNumber} onChange={onChange("privatePolicyNumber")} />
                  </>
                ) : null}
              </div>

              <OptionalGroup
                title="Condiciones administrativas opcionales"
                description="Mantengo estos campos disponibles, pero ya no estorban en el ingreso principal."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <InputField label="Empresa empleadora" value={form.employer} onChange={onChange("employer")} />
                  <InputField label="Copago/exoneracion" value={form.copayExemption} onChange={onChange("copayExemption")} />
                  <InputField label="% discapacidad" value={form.disabilityPercent} onChange={onChange("disabilityPercent")} />
                  <InputField label="Nro CONADIS" value={form.conadisNumber} onChange={onChange("conadisNumber")} />
                </div>
              </OptionalGroup>
            </Panel>
          </>
        )}

        {activeStep === 2 && (
          <Panel title="4) Antecedentes y alergias" subtitle="Base clinica para seguridad farmacologica y riesgo">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextAreaField
                label="Antecedentes patologicos (uno por linea)"
                value={form.personalPathological}
                onChange={onChange("personalPathological")}
              />
              <TextAreaField
                label="Antecedentes familiares"
                value={form.familyHistory}
                onChange={onChange("familyHistory")}
              />
              <TextAreaField label="Cirugias" value={form.surgeries} onChange={onChange("surgeries")} />
              <TextAreaField
                label="Hospitalizaciones previas"
                value={form.previousHospitalizations}
                onChange={onChange("previousHospitalizations")}
              />
              <TextAreaField
                label="Alergias medicamentosas"
                value={form.allergiesMedications}
                onChange={onChange("allergiesMedications")}
              />
              <TextAreaField
                label="Alergias alimentarias"
                value={form.allergiesFoods}
                onChange={onChange("allergiesFoods")}
              />
              <TextAreaField
                label="Alergias ambientales"
                value={form.allergiesEnvironmental}
                onChange={onChange("allergiesEnvironmental")}
              />
              <TextAreaField
                label="Alergias a contraste/latex"
                value={form.allergiesContrastLatex}
                onChange={onChange("allergiesContrastLatex")}
              />
            </div>
            <OptionalGroup
              title="Habitos y estilo de vida"
              description="Datos utiles para seguimiento, pero no indispensables para abrir el caso."
            >
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                <InputField label="Tabaco" value={form.tobacco} onChange={onChange("tobacco")} />
                <InputField label="Alcohol" value={form.alcohol} onChange={onChange("alcohol")} />
                <InputField label="Drogas" value={form.drugs} onChange={onChange("drugs")} />
                <InputField
                  label="Actividad fisica (min/sem)"
                  value={form.physicalActivityMinutesPerWeek}
                  onChange={onChange("physicalActivityMinutesPerWeek")}
                />
                <InputField label="Dieta" value={form.dietType} onChange={onChange("dietType")} />
                <InputField label="Sueno (horas)" value={form.sleepHours} onChange={onChange("sleepHours")} />
                <InputField
                  label="Riesgo ocupacional"
                  value={form.occupationalRiskExposure}
                  onChange={onChange("occupationalRiskExposure")}
                />
              </div>
            </OptionalGroup>
          </Panel>
        )}

        {activeStep === 3 && (
          <Panel title="5) Consulta, examen fisico y diagnostico" subtitle="Nucleo de atencion medica estructurada">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <SelectField
                label="Tipo consulta"
                value={form.consultationType}
                onChange={onChange("consultationType")}
                options={[
                  { value: "primera_vez", label: "Primera vez" },
                  { value: "subsecuente", label: "Subsecuente" },
                  { value: "urgencia", label: "Urgencia" },
                  { value: "teleconsulta", label: "Teleconsulta" },
                ]}
              />
              <InputField
                label="Establecimiento"
                value={form.establishment}
                onChange={onChange("establishment")}
              />
              <InputField label="Servicio" value={form.service} onChange={onChange("service")} />
              <InputField
                label="Codigo profesional / SENESCYT"
                value={form.professionalSenescyt}
                onChange={onChange("professionalSenescyt")}
              />
              <InputField
                label="Duracion consulta (min)"
                value={form.consultationDurationMinutes}
                onChange={onChange("consultationDurationMinutes")}
              />
              <InputField label="Motivo consulta *" value={form.literalReason} onChange={onChange("literalReason")} />
              <InputField label="Tiempo evolucion" value={form.evolutionTime} onChange={onChange("evolutionTime")} />
              <InputField label="Sintoma principal" value={form.mainSymptom} onChange={onChange("mainSymptom")} />
              <TextAreaField
                label="Enfermedad actual (cronologica)"
                value={form.currentIllnessNarrative}
                onChange={onChange("currentIllnessNarrative")}
              />
              <TextAreaField
                label="Tratamientos previos del episodio"
                value={form.previousEpisodeTreatments}
                onChange={onChange("previousEpisodeTreatments")}
              />
              <TextAreaField label="Rev. sistemas: General" value={form.reviewGeneral} onChange={onChange("reviewGeneral")} />
              <TextAreaField
                label="Rev. sistemas: Cardiovascular"
                value={form.reviewCardiovascular}
                onChange={onChange("reviewCardiovascular")}
              />
              <TextAreaField
                label="Rev. sistemas: Respiratorio"
                value={form.reviewRespiratory}
                onChange={onChange("reviewRespiratory")}
              />
              <TextAreaField
                label="Rev. sistemas: Digestivo"
                value={form.reviewDigestive}
                onChange={onChange("reviewDigestive")}
              />
              <TextAreaField
                label="Rev. sistemas: Genitourinario"
                value={form.reviewGenitourinary}
                onChange={onChange("reviewGenitourinary")}
              />
              <TextAreaField
                label="Rev. sistemas: Neurologico"
                value={form.reviewNeurologic}
                onChange={onChange("reviewNeurologic")}
              />
              <TextAreaField
                label="Rev. sistemas: Musculoesqueletico"
                value={form.reviewMusculoskeletal}
                onChange={onChange("reviewMusculoskeletal")}
              />
              <TextAreaField
                label="Rev. sistemas: Dermatologico"
                value={form.reviewDermatologic}
                onChange={onChange("reviewDermatologic")}
              />
              <TextAreaField
                label="Rev. sistemas: Psiquiatrico"
                value={form.reviewPsychiatric}
                onChange={onChange("reviewPsychiatric")}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
              <InputField label="PA" value={form.bloodPressure} onChange={onChange("bloodPressure")} />
              <InputField label="FC" value={form.heartRate} onChange={onChange("heartRate")} />
              <InputField label="FR" value={form.respiratoryRate} onChange={onChange("respiratoryRate")} />
              <InputField label="Temp" value={form.temperature} onChange={onChange("temperature")} />
              <InputField label="SpO2" value={form.spo2} onChange={onChange("spo2")} />
              <InputField label="Peso (kg)" value={form.weightKg} onChange={onChange("weightKg")} />
              <InputField label="Talla (cm)" value={form.heightCm} onChange={onChange("heightCm")} />
              <InputField label="Glucometria" value={form.capillaryGlucose} onChange={onChange("capillaryGlucose")} />
              <InputField label="Dolor (0-10)" value={form.painScale} onChange={onChange("painScale")} />
              <InputField label="Glasgow" value={form.glasgow} onChange={onChange("glasgow")} />
              <TextAreaField
                label="Aspecto general"
                value={form.generalAppearance}
                onChange={onChange("generalAppearance")}
              />
              <TextAreaField label="Piel y faneras" value={form.skin} onChange={onChange("skin")} />
              <TextAreaField label="Cabeza y cuello" value={form.headNeck} onChange={onChange("headNeck")} />
              <TextAreaField label="OONG" value={form.ent} onChange={onChange("ent")} />
              <TextAreaField label="Torax y pulmones" value={form.thoraxLungs} onChange={onChange("thoraxLungs")} />
              <TextAreaField
                label="Cardiovascular"
                value={form.cardiovascularExam}
                onChange={onChange("cardiovascularExam")}
              />
              <TextAreaField label="Abdomen" value={form.abdomen} onChange={onChange("abdomen")} />
              <TextAreaField label="Extremidades" value={form.extremities} onChange={onChange("extremities")} />
              <TextAreaField label="Neurologico" value={form.neurologicExam} onChange={onChange("neurologicExam")} />
              <TextAreaField
                label="Genitourinario"
                value={form.genitourinaryExam}
                onChange={onChange("genitourinaryExam")}
              />
              <TextAreaField label="Rectal" value={form.rectalExam} onChange={onChange("rectalExam")} />
              <TextAreaField label="Ginecologico" value={form.gynecoExam} onChange={onChange("gynecoExam")} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
              <InputField label="Codigo CIE-11" value={form.cie11Code} onChange={onChange("cie11Code")} />
              <InputField
                label="Descripcion diagnostico"
                value={form.diagnosisDescription}
                onChange={onChange("diagnosisDescription")}
              />
              <SelectField
                label="Tipo diagnostico"
                value={form.diagnosisType}
                onChange={onChange("diagnosisType")}
                options={[
                  { value: "definitivo", label: "Definitivo" },
                  { value: "presuntivo", label: "Presuntivo" },
                  { value: "descartado", label: "Descartado" },
                ]}
              />
              <SelectField
                label="Condicion"
                value={form.diagnosisCondition}
                onChange={onChange("diagnosisCondition")}
                options={[
                  { value: "principal", label: "Principal" },
                  { value: "secundario", label: "Secundario" },
                  { value: "complicacion", label: "Complicacion" },
                ]}
              />
              <CheckField
                label="Relacionado a embarazo"
                checked={form.pregnancyRelated}
                onChange={onChange("pregnancyRelated")}
              />
            </div>
          </Panel>
        )}

        {activeStep === 4 && (
          <Panel title="6) Plan terapeutico y prescripcion inicial" subtitle="Indicaciones farmacologicas y no farmacologicas">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextAreaField
                label="Indicaciones no farmacologicas"
                value={form.nonPharmacological}
                onChange={onChange("nonPharmacological")}
              />
              <TextAreaField
                label="Seguimiento y proximo control"
                value={form.followUpInstructions}
                onChange={onChange("followUpInstructions")}
              />
              <TextAreaField
                label="Signos de alarma explicados"
                value={form.alarmSignsExplained}
                onChange={onChange("alarmSignsExplained")}
              />
              <TextAreaField
                label="Referencia a otro nivel"
                value={form.referralDestination}
                onChange={onChange("referralDestination")}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <InputField
                label="DCI medicamento"
                value={form.prescriptionDci}
                onChange={onChange("prescriptionDci")}
              />
              <InputField label="Dosis" value={form.prescriptionDose} onChange={onChange("prescriptionDose")} />
              <InputField label="Via" value={form.prescriptionRoute} onChange={onChange("prescriptionRoute")} />
              <InputField
                label="Frecuencia"
                value={form.prescriptionFrequency}
                onChange={onChange("prescriptionFrequency")}
              />
              <InputField
                label="Duracion"
                value={form.prescriptionDuration}
                onChange={onChange("prescriptionDuration")}
              />
              <TextAreaField
                label="Instrucciones al paciente"
                value={form.prescriptionInstructions}
                onChange={onChange("prescriptionInstructions")}
              />
            </div>
          </Panel>
        )}

        {activeStep === 5 && (
          <>
            <Panel
              title="7) Admision, prioridad y continuidad asistencial"
              subtitle="Datos operativos para urgencias, derivaciones y trazabilidad MSP"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <InputField label="Modo de llegada" value={form.arrivalMode} onChange={onChange("arrivalMode")} />
                <InputField label="Acompaniante" value={form.accompaniedBy} onChange={onChange("accompaniedBy")} />
                <InputField label="Condicion inicial" value={form.initialCondition} onChange={onChange("initialCondition")} />
                <InputField label="Area de admision" value={form.admissionArea} onChange={onChange("admissionArea")} />
                <SelectField
                  label="Modelo de triaje"
                  value={form.triageModel}
                  onChange={onChange("triageModel")}
                  options={[
                    { value: "Manchester", label: "Manchester" },
                    { value: "ESI", label: "ESI" },
                    { value: "otro", label: "Otro" },
                  ]}
                />
                <InputField
                  label="Discriminador de triaje"
                  value={form.triageDiscriminator}
                  onChange={onChange("triageDiscriminator")}
                />
                <InputField label="Nivel de triaje" value={form.triageLevel} onChange={onChange("triageLevel")} />
                <InputField label="Color de triaje" value={form.triageColor} onChange={onChange("triageColor")} />
                <InputField
                  label="Espera maxima (min)"
                  value={form.maxWaitMinutes}
                  onChange={onChange("maxWaitMinutes")}
                />
                <CheckField
                  label="Re-triaje automatico"
                  checked={form.retriageAutomatic}
                  onChange={onChange("retriageAutomatic")}
                />
                <InputField
                  label="Establecimiento de origen"
                  value={form.admissionSourceEstablishment}
                  onChange={onChange("admissionSourceEstablishment")}
                />
                <InputField
                  label="Servicio de origen"
                  value={form.admissionSourceService}
                  onChange={onChange("admissionSourceService")}
                />
                <InputField
                  label="Cama / consultorio"
                  value={form.admissionBedOrDesk}
                  onChange={onChange("admissionBedOrDesk")}
                />
              </div>
            </Panel>

            <Panel
              title="8) Consentimiento informado"
              subtitle="Registro para consentimiento digital, rechazo o representacion legal"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <CheckField
                  label="Consentimiento requerido"
                  checked={form.consentRequired}
                  onChange={onChange("consentRequired")}
                />
                <CheckField
                  label="Consentimiento obtenido"
                  checked={form.consentObtained}
                  onChange={onChange("consentObtained")}
                />
                <InputField
                  label="Capacidad de decision"
                  value={form.consentDecisionCapacity}
                  onChange={onChange("consentDecisionCapacity")}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <InputField label="Tipo" value={form.consentType} onChange={onChange("consentType")} />
                <InputField label="Alcance / procedimiento" value={form.consentScope} onChange={onChange("consentScope")} />
                <InputField label="Responsable que informa" value={form.consentObtainedBy} onChange={onChange("consentObtainedBy")} />
                <InputField label="Fecha y hora" type="datetime-local" value={form.consentObtainedAt} onChange={onChange("consentObtainedAt")} />
                <InputField label="Testigo" value={form.consentWitnessName} onChange={onChange("consentWitnessName")} />
                <InputField
                  label="Representante legal"
                  value={form.consentRepresentativeName}
                  onChange={onChange("consentRepresentativeName")}
                />
                <InputField
                  label="Relacion del representante"
                  value={form.consentRepresentativeRelationship}
                  onChange={onChange("consentRepresentativeRelationship")}
                />
                <TextAreaField label="Riesgos explicados" value={form.consentRisks} onChange={onChange("consentRisks")} />
                <TextAreaField
                  label="Beneficios explicados"
                  value={form.consentBenefits}
                  onChange={onChange("consentBenefits")}
                />
                <TextAreaField
                  label="Alternativas explicadas"
                  value={form.consentAlternatives}
                  onChange={onChange("consentAlternatives")}
                />
                <TextAreaField
                  label="Motivo de rechazo / no obtencion"
                  value={form.consentRefusalReason}
                  onChange={onChange("consentRefusalReason")}
                />
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel
                title="9) Referencia y contrarreferencia"
                subtitle="Continuidad entre niveles con resumen clinico y tratamiento realizado"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InputField label="Tipo de referencia" value={form.referralType} onChange={onChange("referralType")} />
                  <InputField label="Codigo de referencia" value={form.referenceCode} onChange={onChange("referenceCode")} />
                  <InputField label="Motivo de referencia" value={form.referenceReason} onChange={onChange("referenceReason")} />
                  <InputField label="Destino" value={form.referralDestination} onChange={onChange("referralDestination")} />
                  <TextAreaField
                    label="Resumen clinico"
                    value={form.referenceClinicalSummary}
                    onChange={onChange("referenceClinicalSummary")}
                  />
                  <TextAreaField
                    label="Hallazgos relevantes"
                    value={form.referenceFindings}
                    onChange={onChange("referenceFindings")}
                  />
                  <TextAreaField
                    label="Tratamiento realizado"
                    value={form.referenceTreatmentsPerformed}
                    onChange={onChange("referenceTreatmentsPerformed")}
                  />
                  <TextAreaField
                    label="Tratamiento recomendado"
                    value={form.referenceRecommendedTreatment}
                    onChange={onChange("referenceRecommendedTreatment")}
                  />
                  <TextAreaField
                    label="Contrarreferencia / respuesta"
                    value={form.counterReferenceSummary}
                    onChange={onChange("counterReferenceSummary")}
                  />
                </div>
              </Panel>

              <Panel
                title="10) Interconsulta especializada"
                subtitle="Solicitud interna con prioridad, motivo y respuesta"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <CheckField
                    label="Interconsulta solicitada"
                    checked={form.interconsultRequested}
                    onChange={onChange("interconsultRequested")}
                  />
                  <InputField
                    label="Especialidad"
                    value={form.interconsultSpecialty}
                    onChange={onChange("interconsultSpecialty")}
                  />
                  <InputField
                    label="Prioridad"
                    value={form.interconsultPriority}
                    onChange={onChange("interconsultPriority")}
                  />
                  <InputField
                    label="Fecha/hora solicitud"
                    type="datetime-local"
                    value={form.interconsultRequestedAt}
                    onChange={onChange("interconsultRequestedAt")}
                  />
                  <TextAreaField label="Motivo" value={form.interconsultReason} onChange={onChange("interconsultReason")} />
                  <TextAreaField
                    label="Resumen clinico"
                    value={form.interconsultSummary}
                    onChange={onChange("interconsultSummary")}
                  />
                  <TextAreaField
                    label="Respuesta / conducta"
                    value={form.interconsultResponseSummary}
                    onChange={onChange("interconsultResponseSummary")}
                  />
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel
                title="11) Apoyos diagnosticos"
                subtitle="Solicitudes de laboratorio e imagen con justificacion clinica"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <TextAreaField
                    label="Solicitudes de laboratorio"
                    value={form.labRequests}
                    onChange={onChange("labRequests")}
                  />
                  <TextAreaField
                    label="Resultados criticos"
                    value={form.labCriticalResults}
                    onChange={onChange("labCriticalResults")}
                  />
                  <InputField
                    label="Prioridad laboratorio"
                    value={form.labPriority}
                    onChange={onChange("labPriority")}
                  />
                  <TextAreaField
                    label="Justificacion laboratorio"
                    value={form.labClinicalJustification}
                    onChange={onChange("labClinicalJustification")}
                  />
                  <TextAreaField
                    label="Solicitudes de imagen"
                    value={form.imagingRequests}
                    onChange={onChange("imagingRequests")}
                  />
                  <TextAreaField
                    label="Reportes de imagen"
                    value={form.imagingReports}
                    onChange={onChange("imagingReports")}
                  />
                  <InputField
                    label="Prioridad imagen"
                    value={form.imagingPriority}
                    onChange={onChange("imagingPriority")}
                  />
                  <TextAreaField
                    label="Justificacion imagen"
                    value={form.imagingClinicalJustification}
                    onChange={onChange("imagingClinicalJustification")}
                  />
                </div>
              </Panel>

              <Panel
                title="12) Vigilancia epidemiologica"
                subtitle="Eventos notificables, codigo SIVE y observaciones de salud publica"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <CheckField
                    label="Evento de notificacion obligatoria"
                    checked={form.notifiableDisease}
                    onChange={onChange("notifiableDisease")}
                  />
                  <InputField
                    label="Condicion / evento sospechoso"
                    value={form.publicHealthCondition}
                    onChange={onChange("publicHealthCondition")}
                  />
                  <InputField label="Codigo SIVE" value={form.siveAlertCode} onChange={onChange("siveAlertCode")} />
                  <InputField
                    label="Cluster / brote"
                    value={form.outbreakCluster}
                    onChange={onChange("outbreakCluster")}
                  />
                  <TextAreaField
                    label="Notas de vigilancia"
                    value={form.surveillanceNotes}
                    onChange={onChange("surveillanceNotes")}
                  />
                </div>
              </Panel>
            </div>
          </>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">
              {activeStep < LAST_INTAKE_STEP
                ? `Paso ${activeStep} de ${LAST_INTAKE_STEP} · faltan ${missingByStep[activeStep].length} campos obligatorios de este paso`
                : "Paso final · revisa y confirma el registro"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goPreviousStep}
                disabled={activeStep === 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Anterior
              </button>
              {activeStep < LAST_INTAKE_STEP ? (
                <button
                  type="button"
                  onClick={goNextStep}
                  disabled={!canGoNext}
                  className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Guardando..." : "Registrar paciente"}
                </button>
              )}
            </div>
          </div>
        </div>

        {activeStep === LAST_INTAKE_STEP && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setActiveStep(1);
                  setWizardError(null);
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Limpiar formulario
              </button>
              {createdRecord ? (
                <Link
                  href={`/portal/professional/patients/ingreso/${createdRecord.id}`}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Abrir ficha registrada
                </Link>
              ) : null}
              {createdRecord ? (
                <Link
                  href={`/portal/professional/reports?patientId=${createdRecord.id}`}
                  className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                >
                  Generar formularios MSP
                </Link>
              ) : null}
            </div>
            {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
            {success ? <p className="mt-2 text-xs text-emerald-700">{success}</p> : null}
          </div>
        )}
      </form>

      <Panel title="Registros recientes" subtitle="Ultimos pacientes creados desde ingreso clinico">
        {latest.length === 0 ? (
          <p className="text-xs text-slate-500">No hay registros todavia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">HC</th>
                  <th className="px-3 py-2 font-semibold">Paciente</th>
                  <th className="px-3 py-2 font-semibold">Documento</th>
                  <th className="px-3 py-2 font-semibold">Motivo</th>
                  <th className="px-3 py-2 font-semibold">Diagnostico</th>
                  <th className="px-3 py-2 font-semibold">MSP</th>
                  <th className="px-3 py-2 font-semibold">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latest.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">{item.medicalRecordNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{item.fullName}</td>
                    <td className="px-3 py-2 text-slate-700">{item.documentNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{item.consultationReason}</td>
                    <td className="px-3 py-2 text-slate-700">{item.principalDiagnosis}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.mspScore}% · {item.criticalPendingCount} pendientes
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/portal/professional/patients/ingreso/${item.id}`}
                        className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </ModulePage>
  );
}

function buildPayload(form: FormState) {
  return {
    source: form.source,
    identification: {
      documentType: form.documentType,
      documentNumber: form.documentNumber,
      firstNames: form.firstNames,
      lastNames: form.lastNames,
      birthDate: form.birthDate || null,
      sexBiological: form.sexBiological,
      gender: form.gender,
      nationality: form.nationality,
      ethnicity: form.ethnicity,
      civilStatus: form.civilStatus,
      educationLevel: form.educationLevel,
      occupation: form.occupation,
      workplace: form.workplace,
      religion: form.religion,
      bloodGroup: form.bloodGroup,
    },
    contact: {
      address: form.address,
      parish: form.parish,
      canton: form.canton,
      province: form.province,
      gpsLat: form.gpsLat,
      gpsLng: form.gpsLng,
      phonePrimary: form.phonePrimary,
      phoneSecondary: form.phoneSecondary,
      whatsapp: form.whatsapp,
      email: form.email,
      emergencyName: form.emergencyName,
      emergencyRelationship: form.emergencyRelationship,
      emergencyPhone: form.emergencyPhone,
      legalRepresentative: form.legalRepresentative,
    },
    financing: {
      affiliationType: form.affiliationType,
      iessNumber: form.iessNumber,
      privateInsurer: form.privateInsurer,
      privatePolicyNumber: form.privatePolicyNumber,
      employer: form.employer,
      copayExemption: form.copayExemption,
      disabilityPercent: form.disabilityPercent,
      conadisNumber: form.conadisNumber,
    },
    antecedentes: {
      personalPathological: splitMultiline(form.personalPathological),
      previousHospitalizations: splitMultiline(form.previousHospitalizations),
      surgeries: splitMultiline(form.surgeries),
      familyHistory: splitMultiline(form.familyHistory),
      lifestyle: {
        tobacco: form.tobacco,
        alcohol: form.alcohol,
        drugs: form.drugs,
        physicalActivityMinutesPerWeek: form.physicalActivityMinutesPerWeek,
        dietType: form.dietType,
        sleepHours: form.sleepHours,
        occupationalRiskExposure: form.occupationalRiskExposure,
      },
      allergies: {
        medications: splitMultiline(form.allergiesMedications),
        foods: splitMultiline(form.allergiesFoods),
        environmental: splitMultiline(form.allergiesEnvironmental),
        contrastOrLatex: splitMultiline(form.allergiesContrastLatex),
        visualAlertActive: Boolean(
          form.allergiesMedications.trim() ||
            form.allergiesFoods.trim() ||
            form.allergiesEnvironmental.trim() ||
            form.allergiesContrastLatex.trim()
        ),
      },
    },
    consultation: {
      consultedAt: new Date().toISOString(),
      establishment: form.establishment,
      service: form.service,
      professionalName: "",
      professionalSenescyt: form.professionalSenescyt,
      consultationType: form.consultationType,
      consultationDurationMinutes: form.consultationDurationMinutes,
      literalReason: form.literalReason,
      evolutionTime: form.evolutionTime,
      mainSymptom: form.mainSymptom,
      currentIllnessNarrative: form.currentIllnessNarrative,
      previousEpisodeTreatments: form.previousEpisodeTreatments,
      reviewBySystems: {
        general: form.reviewGeneral,
        cardiovascular: form.reviewCardiovascular,
        respiratory: form.reviewRespiratory,
        digestive: form.reviewDigestive,
        genitourinary: form.reviewGenitourinary,
        neurologic: form.reviewNeurologic,
        musculoskeletal: form.reviewMusculoskeletal,
        dermatologic: form.reviewDermatologic,
        psychiatric: form.reviewPsychiatric,
      },
      physicalExam: {
        bloodPressure: form.bloodPressure,
        heartRate: form.heartRate,
        respiratoryRate: form.respiratoryRate,
        temperature: form.temperature,
        spo2: form.spo2,
        weightKg: form.weightKg,
        heightCm: form.heightCm,
        bmi: "",
        abdominalPerimeterCm: "",
        capillaryGlucose: form.capillaryGlucose,
        painScale: form.painScale,
        glasgow: form.glasgow,
        generalAppearance: form.generalAppearance,
        skin: form.skin,
        headNeck: form.headNeck,
        ent: form.ent,
        thoraxLungs: form.thoraxLungs,
        cardiovascular: form.cardiovascularExam,
        abdomen: form.abdomen,
        extremities: form.extremities,
        neurologic: form.neurologicExam,
        genitourinary: form.genitourinaryExam,
        rectal: form.rectalExam,
        gyneco: form.gynecoExam,
      },
    },
    diagnostics:
      form.cie11Code || form.diagnosisDescription
        ? [
            {
              cie11Code: form.cie11Code,
              description: form.diagnosisDescription,
              type: form.diagnosisType,
              condition: form.diagnosisCondition,
              pregnancyRelated: form.pregnancyRelated,
            },
          ]
        : [],
    therapeuticPlan: {
      linkedDiagnosisCodes: form.cie11Code ? [form.cie11Code] : [],
      nonPharmacological: form.nonPharmacological,
      followUpInstructions: form.followUpInstructions,
      alarmSignsExplained: form.alarmSignsExplained,
      referralDestination: form.referralDestination,
    },
    prescriptions:
      form.prescriptionDci || form.prescriptionDose
        ? [
            {
              dciName: form.prescriptionDci,
              commercialName: "",
              concentration: "",
              pharmaceuticalForm: "",
              dose: form.prescriptionDose,
              route: form.prescriptionRoute,
              frequency: form.prescriptionFrequency,
              duration: form.prescriptionDuration,
              unitsToDispense: "",
              patientInstructions: form.prescriptionInstructions,
            },
          ]
        : [],
    laboratory: {
      requests: splitMultiline(form.labRequests),
      criticalResults: splitMultiline(form.labCriticalResults),
      criticalResultAcknowledged: splitMultiline(form.labCriticalResults).length === 0,
      priority: form.labPriority,
      clinicalJustification: form.labClinicalJustification,
    },
    imaging: {
      requests: splitMultiline(form.imagingRequests),
      reports: splitMultiline(form.imagingReports),
      pacsLinks: [],
      priority: form.imagingPriority,
      clinicalJustification: form.imagingClinicalJustification,
    },
    hospitalization: {
      admissionType: "",
      assignedService: "",
      assignedBed: "",
      admissionDiagnosisCie11: "",
      admissionCondition: "",
      dailySoapEvolutions: [],
      nursingShiftNotes: [],
      fluidBalanceNotes: [],
      medicalOrders: [],
      kardexAdministrationNotes: [],
      dischargeSummary: "",
    },
    urgency: {
      arrivalMode: form.arrivalMode,
      accompaniedBy: form.accompaniedBy,
      initialCondition: form.initialCondition,
      triageModel: form.triageModel,
      triageDiscriminator: form.triageDiscriminator,
      triageLevel: form.triageLevel,
      triageColor: form.triageColor,
      maxWaitMinutes: form.maxWaitMinutes,
      retriageAutomatic: form.retriageAutomatic,
    },
    admission: {
      admissionArea: form.admissionArea,
      sourceEstablishment: form.admissionSourceEstablishment,
      sourceService: form.admissionSourceService,
      bedOrDesk: form.admissionBedOrDesk,
    },
    consent: {
      required: form.consentRequired,
      obtained: form.consentObtained,
      type: form.consentType,
      scope: form.consentScope,
      explainedRisks: form.consentRisks,
      explainedBenefits: form.consentBenefits,
      explainedAlternatives: form.consentAlternatives,
      obtainedBy: form.consentObtainedBy,
      obtainedAt: form.consentObtainedAt,
      witnessName: form.consentWitnessName,
      representativeName: form.consentRepresentativeName,
      representativeRelationship: form.consentRepresentativeRelationship,
      decisionCapacity: form.consentDecisionCapacity,
      refusalReason: form.consentRefusalReason,
    },
    interconsultation: {
      requested: form.interconsultRequested,
      specialty: form.interconsultSpecialty,
      priority: form.interconsultPriority,
      reason: form.interconsultReason,
      clinicalSummary: form.interconsultSummary,
      requestedAt: form.interconsultRequestedAt,
      responseSummary: form.interconsultResponseSummary,
    },
    nursingReport: {
      shiftSummary: "",
      fallEvents: "",
      pressureUlcerRecord: "",
      physicalRestraintRecord: "",
      adverseEvents: "",
    },
    appointments: {
      scheduleNotes: "",
      reminderPreference: "",
      noShowHistory: "",
    },
    referrals: {
      referralType: form.referralType,
      referenceCode: form.referenceCode,
      referenceReason: form.referenceReason,
      destination: form.referralDestination,
      clinicalSummary: form.referenceClinicalSummary,
      relevantFindings: form.referenceFindings,
      treatmentsPerformed: form.referenceTreatmentsPerformed,
      recommendedTreatment: form.referenceRecommendedTreatment,
      counterReferenceSummary: form.counterReferenceSummary,
    },
    publicHealth: {
      notifiableDisease: form.notifiableDisease,
      suspectedCondition: form.publicHealthCondition,
      siveAlertCode: form.siveAlertCode,
      outbreakCluster: form.outbreakCluster,
      surveillanceNotes: form.surveillanceNotes,
      reportedAt: form.notifiableDisease ? new Date().toISOString() : null,
    },
    programTracking: {
      diabetes: false,
      hypertension: false,
      tuberculosis: false,
      maternalChild: false,
      olderAdult: false,
      mentalHealth: false,
      notes: "",
    },
    pharmacyContext: {
      stockControlNotes: "",
      psychotropicsDoubleSignature: false,
    },
    indicatorsContext: {
      administrative: form.bloodGroup ? `Grupo sanguineo: ${form.bloodGroup}` : "",
    },
    compliance: {
      twoFactorEnabled: true,
      autoLogout15m: true,
      immutableSignedNotes: true,
      aes256DataEncryption: true,
      informedConsentDigital: true,
      sensitiveDataConsent: true,
      backupEvery4h: true,
      disasterRecoveryValidated: true,
      offlineSyncEnabled: false,
    },
  };
}

function normalizeCedula(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function splitMultiline(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toSummary(record: RegisteredPatientRecord): RegisteredPatientSummary {
  const primaryDiagnosis =
    record.diagnostics.find((diag) => diag.condition === "principal") ??
    record.diagnostics[0];

  return {
    id: record.id,
    medicalRecordNumber: record.medicalRecordNumber,
    createdAt: record.createdAt,
    source: record.source,
    fullName: `${record.identification.firstNames} ${record.identification.lastNames}`.trim(),
    documentNumber: record.identification.documentNumber,
    age: record.identification.age,
    consultationReason: record.consultation.literalReason || "Sin motivo registrado",
    principalDiagnosis: primaryDiagnosis?.description || "Sin diagnostico registrado",
    mspScore: record.mspCompliance.score,
    criticalPendingCount: record.mspCompliance.criticalPendingItems.length,
  };
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DatalistField({
  label,
  value,
  onChange,
  options,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
}) {
  const listId = `list-${label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <input
        type={type}
        list={listId}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function OptionalGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-800">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <span>{title}</span>
          <span className="text-[11px] font-medium text-slate-500">{description}</span>
        </div>
      </summary>
      <div className="border-t border-slate-200 px-3 py-3">{children}</div>
    </details>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-slate-300" />
      {label}
    </label>
  );
}
