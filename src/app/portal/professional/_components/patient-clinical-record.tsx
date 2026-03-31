"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import PatientBundleAbcdef from "./patient-bundle-abcdef";
import { ClinicalSurveillancePanel } from "./clinical-surveillance-panel";
import { Panel, RiskBadge, TriageBadge } from "./clinical-ui";
import { getAvailableMspForms } from "@/lib/msp-form-reports";
import type { RegisteredPatientRecord, RegisteredPatientSummary } from "@/types/patient-intake";
import {
  type CarePlanRecord,
  educationResources,
  getKardexAdministrations,
  getPatientFunctionalPatterns,
  type KardexAdministrationRecord,
  type MedicationRecord,
  type PatientRecord,
  type TriageColor,
  type VitalSignRecord,
} from "../_data/clinical-mock-data";

type PatientTabId =
  | "summary"
  | "personal"
  | "background"
  | "triage"
  | "vitals"
  | "medication"
  | "nursing_notes"
  | "medical_notes"
  | "nursing_report"
  | "fluid_balance"
  | "kardex"
  | "exams"
  | "diagnoses"
  | "procedures"
  | "nutrition"
  | "vaccination"
  | "emotional"
  | "care_plan"
  | "bundle_abcdef"
  | "msp_forms"
  | "documents"
  | "timeline"
  | "education"
  | "reports";

const patientTabs: Array<{ id: PatientTabId; label: string; group: string }> = [
  { id: "summary", label: "Resumen", group: "Ficha del paciente" },
  { id: "diagnoses", label: "Diagnosticos", group: "Ficha del paciente" },
  { id: "timeline", label: "Historial clinico", group: "Ficha del paciente" },
  { id: "vitals", label: "Signos vitales", group: "Acciones del paciente" },
  { id: "fluid_balance", label: "Balance hidrico", group: "Acciones del paciente" },
  { id: "medication", label: "Medicacion", group: "Acciones del paciente" },
  { id: "kardex", label: "Kardex", group: "Acciones del paciente" },
  { id: "nursing_report", label: "Reporte enfermeria", group: "Acciones del paciente" },
  { id: "medical_notes", label: "Reporte medico", group: "Acciones del paciente" },
  { id: "vaccination", label: "Vacunacion", group: "Acciones del paciente" },
  { id: "msp_forms", label: "Formularios MSP", group: "Acciones del paciente" },
  { id: "reports", label: "Reportes del paciente", group: "Acciones del paciente" },
  { id: "triage", label: "Triaje", group: "Seguimiento clinico" },
  { id: "exams", label: "Examenes", group: "Seguimiento clinico" },
  { id: "procedures", label: "Procedimientos", group: "Seguimiento clinico" },
  { id: "nursing_notes", label: "Notas enfermeria", group: "Seguimiento clinico" },
  { id: "care_plan", label: "Plan de cuidados", group: "Seguimiento clinico" },
  { id: "bundle_abcdef", label: "Bundle ABCDEF", group: "Seguimiento clinico" },
  { id: "nutrition", label: "Nutricion", group: "Seguimiento clinico" },
  { id: "emotional", label: "Salud emocional", group: "Seguimiento clinico" },
  { id: "education", label: "Educacion", group: "Seguimiento clinico" },
  { id: "personal", label: "Datos personales", group: "Contexto y soporte" },
  { id: "background", label: "Antecedentes", group: "Contexto y soporte" },
  { id: "documents", label: "Documentos clinicos", group: "Contexto y soporte" },
];

const isTab = (value: string | null): value is PatientTabId =>
  patientTabs.some((tab) => tab.id === value);

const criticalHourSlots = [
  "7:00",
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "24:00",
  "1:00",
  "2:00",
  "3:00",
  "4:00",
  "5:00",
  "6:00",
];

const invasiveProcedureLabels = [
  "Tubo endotraqueal",
  "Traqueostomia",
  "Ventilacion mecanica",
  "Via central",
  "Linea arterial",
  "Cateter periferico",
  "Sonda nasogastrica",
  "Sonda vesical",
  "Gastrostomia",
  "Cateter hemodialisis",
  "Otros",
];

type ProfessionalAuditRecord = {
  id: string;
  tab: PatientTabId;
  timestamp: string;
  professional: string;
  title: string;
  details: string;
};

type NutritionPlanRecord = {
  id: string;
  date: string;
  dietName: string;
  dietType: string;
  allowedFoods: string;
  restrictedFoods: string;
  recommendedIntake: string;
  hydrationPlan: string;
  supplements: string;
  mealSchedule: string;
  objectives: string;
  observations: string;
  professional: string;
};

type ModuleHistoryEntry = {
  id: string;
  date: string;
  dateKey: string;
  title: string;
  detail: string;
  professional?: string;
  sections?: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
  }>;
};

type NursingHourEntry = {
  id: string;
  hour: string;
  focus: string;
  action: string;
  response: string;
};

type NursingShiftReportRecord = PatientRecord["nursingShiftReports"][number] & {
  hourlyEntries?: NursingHourEntry[];
};

type TimelineCategory = PatientRecord["timeline"][number]["category"];

type CarePlanHourEntry = {
  id: string;
  hour: string;
  focus: string;
  intervention: string;
  response: string;
  status: string;
};

type CarePlanEntryRecord = CarePlanRecord & {
  hourlyEntries?: CarePlanHourEntry[];
};

export default function PatientClinicalRecord({ patient }: { patient: PatientRecord }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [selectedTab, setSelectedTab] = useState<PatientTabId | null>(null);
  const [selectedNursingNoteId, setSelectedNursingNoteId] = useState<string | null>(null);
  const [selectedMedicalNoteId, setSelectedMedicalNoteId] = useState<string | null>(null);
  const [selectedNursingShiftReportId, setSelectedNursingShiftReportId] = useState<string | null>(
    null
  );
  const [selectedCarePlanId, setSelectedCarePlanId] = useState<string | null>(null);
  const [currentProfessional, setCurrentProfessional] = useState(patient.assignedProfessional);

  const [addedVitals, setAddedVitals] = useState<VitalSignRecord[]>([]);
  const [addedMedicationRecords, setAddedMedicationRecords] = useState<PatientRecord["medicationRecords"]>([]);
  const [addedFluidBalances, setAddedFluidBalances] = useState<PatientRecord["fluidBalances"]>([]);
  const [addedNursingNotes, setAddedNursingNotes] = useState<PatientRecord["nursingNotes"]>([]);
  const [addedMedicalNotes, setAddedMedicalNotes] = useState<PatientRecord["medicalNotes"]>([]);
  const [addedNursingShiftReports, setAddedNursingShiftReports] = useState<NursingShiftReportRecord[]>([]);
  const [addedCarePlans, setAddedCarePlans] = useState<CarePlanEntryRecord[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanRecord[]>([
    createInitialNutritionPlan(patient),
  ]);
  const [auditRecords, setAuditRecords] = useState<ProfessionalAuditRecord[]>([]);

  const [vitalForm, setVitalForm] = useState({
    hour: "7:00",
    heartRate: "",
    respiratoryRate: "",
    pas: "",
    pad: "",
    temperature: "",
    spo2: "",
    glucose: "",
    painScale: "",
  });
  const [fluidForm, setFluidForm] = useState({
    shift: "Manana",
    oral: "",
    intravenous: "",
    dilutedMedication: "",
    enteralParenteral: "",
    intakeOther: "",
    diuresis: "",
    vomiting: "",
    drain1: "",
    drain2: "",
    drain3: "",
    drain4: "",
    drain5: "",
    catarsis: "",
    aspiration: "",
    outputOther: "",
    observations: "",
  });
  const [medicationForm, setMedicationForm] = useState<{
    name: string;
    dose: string;
    frequency: string;
    route: string;
    schedule: string;
    indication: string;
    prescriber: string;
    adherence: string;
    administrationStatus: MedicationRecord["administrationStatus"];
    notes: string;
  }>({
    name: "",
    dose: "",
    frequency: "",
    route: "Oral",
    schedule: "",
    indication: "",
    prescriber: patient.assignedProfessional,
    adherence: "En seguimiento",
    administrationStatus: "Pendiente",
    notes: "",
  });
  const [medicationOverrides, setMedicationOverrides] = useState<
    Record<string, Partial<MedicationRecord>>
  >({});
  const [nursingNoteDraft, setNursingNoteDraft] = useState("");
  const [medicalNoteDraft, setMedicalNoteDraft] = useState("");
  const [nursingReportForm, setNursingReportForm] = useState<{
    shift: string;
    service: string;
    generalStatus: string;
    proceduresDone: string;
    incidents: string;
    carePlan: string;
  }>({
    shift: "Manana",
    service: patient.serviceArea ?? "Observacion",
    generalStatus: "",
    proceduresDone: "",
    incidents: "",
    carePlan: "",
  });
  const [nursingHourForm, setNursingHourForm] = useState({
    hour: "07:00",
    focus: "Monitoreo",
    action: "",
    response: "",
  });
  const [nursingHourEntries, setNursingHourEntries] = useState<NursingHourEntry[]>([]);
  const [carePlanForm, setCarePlanForm] = useState({
    nursingDiagnosis: "",
    objective: "",
    baseInterventions: "",
    evaluation: "",
    observations: "",
  });
  const [carePlanHourForm, setCarePlanHourForm] = useState({
    hour: "07:00",
    focus: "Intervencion",
    intervention: "",
    response: "",
    status: "Pendiente",
  });
  const [carePlanHourEntries, setCarePlanHourEntries] = useState<CarePlanHourEntry[]>([]);
  const [nutritionForm, setNutritionForm] = useState({
    dietName: patient.nutrition.diet,
    dietType: patient.nutrition.nutritionalStatus,
    allowedFoods: patient.nutrition.recommendations.join("; "),
    restrictedFoods: "Azucares refinados, bebidas azucaradas, ultraprocesados.",
    recommendedIntake: patient.nutrition.estimatedIntake,
    hydrationPlan: "Agua fraccionada durante el dia, objetivo 2 L/24h salvo contraindicacion.",
    supplements: "Suplemento segun tolerancia y evaluacion nutricional.",
    mealSchedule: "Desayuno, media manana, almuerzo, media tarde, cena y colacion nocturna.",
    objectives: patient.nutrition.evolution,
    observations: "",
  });
  const [moduleRecordForm, setModuleRecordForm] = useState({
    title: "",
    details: "",
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [timelineFilter, setTimelineFilter] = useState<"all" | TimelineCategory>("all");
  const [timelineSearch, setTimelineSearch] = useState("");
  const [quickActionFeedback, setQuickActionFeedback] = useState("");
  const [linkedRegisteredSummary, setLinkedRegisteredSummary] = useState<RegisteredPatientSummary | null>(
    null
  );
  const [linkedRegisteredRecord, setLinkedRegisteredRecord] = useState<RegisteredPatientRecord | null>(
    null
  );
  const [linkedRecordLoading, setLinkedRecordLoading] = useState(false);
  const [linkedRecordError, setLinkedRecordError] = useState<string | null>(null);
  const [bundleNavigatorOpen, setBundleNavigatorOpen] = useState(false);

  const activeTab = selectedTab ?? (isTab(requestedTab) ? requestedTab : "summary");
  const isBundleWorkspace = activeTab === "bundle_abcdef";
  const showClinicalAside = !isBundleWorkspace || bundleNavigatorOpen;

  useEffect(() => {
    if (isBundleWorkspace) {
      setBundleNavigatorOpen(false);
    }
  }, [isBundleWorkspace]);

  useEffect(() => {
    let cancelled = false;

    const loadLinkedRegisteredRecord = async () => {
      setLinkedRecordLoading(true);
      setLinkedRecordError(null);

      try {
        const response = await fetch("/api/paciente/registro", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: RegisteredPatientSummary[];
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "No se pudo consultar el expediente MSP.");
        }

        const normalizedIdentification = normalizeMatchingValue(patient.identification);
        const normalizedMedicalRecord = normalizeMatchingValue(patient.medicalRecordNumber);
        const match =
          payload.data.find(
            (entry) =>
              normalizeMatchingValue(entry.documentNumber) === normalizedIdentification ||
              normalizeMatchingValue(entry.medicalRecordNumber) === normalizedMedicalRecord
          ) ?? null;

        if (cancelled) {
          return;
        }

        setLinkedRegisteredSummary(match);

        if (!match) {
          setLinkedRegisteredRecord(null);
          return;
        }

        const recordResponse = await fetch(`/api/paciente/registro/${match.id}`, {
          method: "GET",
          cache: "no-store",
        });
        const recordPayload = (await recordResponse.json()) as {
          data?: RegisteredPatientRecord;
          error?: string;
        };

        if (!recordResponse.ok || !recordPayload.data) {
          throw new Error(recordPayload.error ?? "No se pudo abrir el expediente vinculado.");
        }

        if (!cancelled) {
          setLinkedRegisteredRecord(recordPayload.data);
        }
      } catch (error) {
        if (!cancelled) {
          setLinkedRegisteredSummary(null);
          setLinkedRegisteredRecord(null);
          setLinkedRecordError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el expediente MSP vinculado."
          );
        }
      } finally {
        if (!cancelled) {
          setLinkedRecordLoading(false);
        }
      }
    };

    loadLinkedRegisteredRecord();

    return () => {
      cancelled = true;
    };
  }, [patient.identification, patient.medicalRecordNumber]);

  const effectiveVitals = useMemo(
    () =>
      [...addedVitals, ...patient.vitalSigns].sort((a, b) =>
        b.recordedAt.localeCompare(a.recordedAt)
      ),
    [addedVitals, patient.vitalSigns]
  );
  const effectiveFluidBalances = useMemo(
    () =>
      [...addedFluidBalances, ...patient.fluidBalances].sort((a, b) =>
        `${b.date}-${b.shift}`.localeCompare(`${a.date}-${a.shift}`)
      ),
    [addedFluidBalances, patient.fluidBalances]
  );
  const effectiveMedicationRecords = useMemo(
    () =>
      [...addedMedicationRecords, ...patient.medicationRecords]
        .map((record) => ({
          ...record,
          ...(medicationOverrides[record.id] ?? {}),
        }))
        .sort((a, b) => `${b.startDate}-${b.schedule}`.localeCompare(`${a.startDate}-${a.schedule}`)),
    [addedMedicationRecords, medicationOverrides, patient.medicationRecords]
  );
  const effectiveNursingNotes = useMemo(
    () =>
      [...addedNursingNotes, ...patient.nursingNotes].sort((a, b) =>
        b.datetime.localeCompare(a.datetime)
      ),
    [addedNursingNotes, patient.nursingNotes]
  );
  const effectiveMedicalNotes = useMemo(
    () =>
      [...addedMedicalNotes, ...patient.medicalNotes].sort((a, b) =>
        b.datetime.localeCompare(a.datetime)
      ),
    [addedMedicalNotes, patient.medicalNotes]
  );
  const effectiveNursingShiftReports = useMemo<NursingShiftReportRecord[]>(
    () =>
      [
        ...addedNursingShiftReports,
        ...patient.nursingShiftReports.map((report) => ({ ...report })),
      ].sort((a, b) =>
        `${b.date}-${b.shift}`.localeCompare(`${a.date}-${a.shift}`)
      ),
    [addedNursingShiftReports, patient.nursingShiftReports]
  );
  const nursingShiftHourOptions = useMemo(
    () => getNursingShiftHours(nursingReportForm.shift),
    [nursingReportForm.shift]
  );
  const effectiveCarePlans = useMemo<CarePlanEntryRecord[]>(
    () => [
      ...addedCarePlans,
      ...patient.carePlan.map((entry) => ({ ...entry })),
    ],
    [addedCarePlans, patient.carePlan]
  );
  const carePlanHourOptions = useMemo(() => getCarePlanHourOptions(), []);

  const latestVital = effectiveVitals[0] ?? null;
  const functionalPatterns = getPatientFunctionalPatterns(patient);

  const timelineSorted = useMemo(
    () => [...patient.timeline].sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [patient.timeline]
  );
  const timelineFiltered = useMemo(() => {
    const normalizedSearch = timelineSearch.trim().toLowerCase();

    return timelineSorted.filter((event) => {
      if (timelineFilter !== "all" && event.category !== timelineFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      return `${event.category} ${event.detail} ${event.datetime}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [timelineFilter, timelineSearch, timelineSorted]);
  const kardexAdministrations = getKardexAdministrations(patient);
  const medicationAllergies = patient.antecedentes.allergies.filter(
    (item) => !isNoKnownAllergy(item)
  );
  const vitalsByHour = groupVitalsByHour(effectiveVitals);
  const latestVitalDate = splitDateTime(effectiveVitals[0]?.recordedAt ?? patient.admissionDate).date;
  const invasiveRows = buildInvasiveProcedureRows(patient);
  const fluidBalanceSheet = buildFluidBalanceSheet(effectiveFluidBalances, patient.admissionDate);
  const insensibleLossModel = useMemo(() => {
    const weightKg = latestVital?.weightKg ?? 70;
    const shiftHours = 8;

    const vitalInShift =
      [...effectiveVitals]
        .filter((vital) => {
          const hour = getHourFromDateTime(vital.recordedAt);
          if (hour === null) {
            return false;
          }
          return isHourInShift(hour, fluidForm.shift);
        })
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? latestVital;

    const temperature = vitalInShift?.temperature ?? latestVital?.temperature ?? 37;
    const feverFactor = temperature > 37 ? 1 + (temperature - 37) * 0.1 : 1;
    const totalMl = Math.round(weightKg * 0.5 * shiftHours * feverFactor);

    return {
      totalMl,
      weightKg,
      temperature,
      shiftHours,
    };
  }, [effectiveVitals, fluidForm.shift, latestVital]);
  const fluidDraftSummary = useMemo(() => {
    const intake = {
      oral: parseMlValue(fluidForm.oral),
      intravenous: parseMlValue(fluidForm.intravenous),
      dilutedMedication: parseMlValue(fluidForm.dilutedMedication),
      enteralParenteral: parseMlValue(fluidForm.enteralParenteral),
      other: parseMlValue(fluidForm.intakeOther),
    };

    const output = {
      diuresis: parseMlValue(fluidForm.diuresis),
      vomiting: parseMlValue(fluidForm.vomiting),
      drains:
        parseMlValue(fluidForm.drain1) +
        parseMlValue(fluidForm.drain2) +
        parseMlValue(fluidForm.drain3) +
        parseMlValue(fluidForm.drain4) +
        parseMlValue(fluidForm.drain5),
      liquidStools: parseMlValue(fluidForm.catarsis),
      aspiration: parseMlValue(fluidForm.aspiration),
      insensibleLoss: insensibleLossModel.totalMl,
      other: parseMlValue(fluidForm.outputOther),
    };

    const intakeTotal =
      intake.oral +
      intake.intravenous +
      intake.dilutedMedication +
      intake.enteralParenteral +
      intake.other;
    const outputTotal =
      output.diuresis +
      output.vomiting +
      output.drains +
      output.liquidStools +
      output.aspiration +
      output.insensibleLoss +
      output.other;

    return {
      intake,
      output,
      intakeTotal,
      outputTotal,
      balance: intakeTotal - outputTotal,
    };
  }, [fluidForm, insensibleLossModel.totalMl]);
  const selectedNursingNote =
    effectiveNursingNotes.find((note) => note.id === selectedNursingNoteId) ??
    effectiveNursingNotes[0] ??
    null;
  const selectedMedicalNote =
    effectiveMedicalNotes.find((note) => note.id === selectedMedicalNoteId) ??
    effectiveMedicalNotes[0] ??
    null;
  const selectedNursingShiftReport =
    effectiveNursingShiftReports.find((report) => report.id === selectedNursingShiftReportId) ??
    effectiveNursingShiftReports[0] ??
    null;
  const selectedCarePlan =
    effectiveCarePlans.find((entry) => entry.id === selectedCarePlanId) ??
    effectiveCarePlans[0] ??
    null;
  const activeTabLabel = patientTabs.find((tab) => tab.id === activeTab)?.label ?? activeTab;
  const tabAuditRecords = auditRecords.filter((record) => record.tab === activeTab);
  const recentTimeline = timelineSorted.slice(0, 6);
  const availableMspForms = useMemo(
    () => (linkedRegisteredRecord ? getAvailableMspForms(linkedRegisteredRecord) : []),
    [linkedRegisteredRecord]
  );
  const emergencyForm = useMemo(
    () => availableMspForms.find((form) => form.id === "008") ?? null,
    [availableMspForms]
  );
  const diagnosisByType = useMemo(
    () => ({
      Principal: patient.diagnoses.filter((item) => item.type === "Principal"),
      Secundario: patient.diagnoses.filter((item) => item.type === "Secundario"),
      Presuntivo: patient.diagnoses.filter((item) => item.type === "Presuntivo"),
    }),
    [patient.diagnoses]
  );
  const activeDiagnosisCount = useMemo(
    () => patient.diagnoses.filter((item) => /activo/i.test(item.status)).length,
    [patient.diagnoses]
  );
  const triageWaitTargetMinutes = getTriageWaitTargetMinutes(
    patient.triageAssessment.triageColor
  );
  const timelineGroups = useMemo(() => {
    const grouped = new Map<string, PatientRecord["timeline"]>();

    for (const event of timelineFiltered) {
      const dateKey = splitDateTime(event.datetime).date;
      const current = grouped.get(dateKey) ?? [];
      current.push(event);
      grouped.set(dateKey, current);
    }

    return Array.from(grouped.entries()).map(([date, events]) => ({
      date,
      events,
    }));
  }, [timelineFiltered]);
  const timelineCategoryCounts = useMemo(() => {
    const counts = new Map<TimelineCategory, number>();

    for (const event of timelineSorted) {
      counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [timelineSorted]);
  const timelineFilteredCategoryCounts = useMemo(() => {
    const counts = new Map<TimelineCategory, number>();

    for (const event of timelineFiltered) {
      counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [timelineFiltered]);
  const timelineCategoryOptions = useMemo(
    () => timelineCategoryCounts.map((item) => item.category),
    [timelineCategoryCounts]
  );
  const timelineCategoryCountMap = useMemo(() => {
    const counts = new Map<TimelineCategory, number>();
    for (const item of timelineCategoryCounts) {
      counts.set(item.category, item.count);
    }
    return counts;
  }, [timelineCategoryCounts]);
  const moduleHistoryEntries = useMemo<ModuleHistoryEntry[]>(() => {
    const makeEntry = (
      id: string,
      date: string,
      title: string,
      detail: string,
      professional?: string,
      sections?: ModuleHistoryEntry["sections"]
    ): ModuleHistoryEntry => ({
      id,
      date,
      dateKey: extractDateKey(date),
      title,
      detail,
      professional,
      sections,
    });

    const fromAudit = tabAuditRecords.map((record) =>
      makeEntry(`audit-${record.id}`, record.timestamp, record.title, record.details, record.professional)
    );

    let entries: ModuleHistoryEntry[] = [];

    if (activeTab === "summary") {
      entries = timelineSorted.map((event) =>
        makeEntry(
          `timeline-${event.id}`,
          event.datetime,
          `${event.category}`,
          event.detail,
          patient.assignedProfessional
        )
      );
    }

    if (activeTab === "personal") {
      entries = [
        makeEntry(
          `personal-${patient.id}`,
          patient.admissionDate,
          "Registro de datos personales",
          `Direccion ${patient.personalData.address} · Contacto ${patient.personalData.phone}`,
          patient.assignedProfessional
        ),
      ];
    }

    if (activeTab === "background") {
      entries = [
        makeEntry(
          `background-${patient.id}`,
          patient.admissionDate,
          "Registro de antecedentes",
          `Patologicos: ${patient.antecedentes.pathological.join(", ") || "Sin registros"}`,
          patient.assignedProfessional
        ),
      ];
    }

    if (activeTab === "triage") {
      entries = [
        makeEntry(
          `triage-${patient.id}`,
          patient.triageAssessment.evaluatedAt,
          `Triaje ${patient.triageAssessment.triageColor}`,
          `${patient.triageAssessment.consultationReason} · Riesgo ${patient.triageAssessment.riskClassification}`,
          patient.assignedProfessional
        ),
      ];
    }

    if (activeTab === "vitals") {
      entries = effectiveVitals.map((vital) =>
        makeEntry(
          `vital-${vital.recordedAt}`,
          vital.recordedAt,
          "Control de signos vitales",
          `TA ${vital.bloodPressure} · FC ${vital.heartRate} · FR ${vital.respiratoryRate} · T° ${vital.temperature} · SpO2 ${vital.spo2}%`,
          vital.professional
        )
      );
    }

    if (activeTab === "fluid_balance") {
      entries = effectiveFluidBalances.map((entry) => {
        const intake = sumObjectValues(entry.intake);
        const output = sumObjectValues(entry.output);
        const balance = intake - output;

        return makeEntry(
          `fluid-${entry.id}`,
          `${entry.date} ${entry.shift}`,
          `Balance hidrico ${entry.shift}`,
          `Ingreso ${intake} ml · Egreso ${output} ml · Balance ${balance} ml`,
          patient.assignedProfessional,
          [
            {
              title: "Ingresos",
              items: [
                { label: "Oral", value: `${entry.intake.oral} ml` },
                { label: "Intravenoso", value: `${entry.intake.intravenous} ml` },
                { label: "Medicacion diluida", value: `${entry.intake.dilutedMedication} ml` },
                { label: "Enteral/Parenteral", value: `${entry.intake.enteralParenteral} ml` },
                { label: "Otros", value: `${entry.intake.other} ml` },
                { label: "Total", value: `${intake} ml` },
              ],
            },
            {
              title: "Egresos",
              items: [
                { label: "Diuresis", value: `${entry.output.diuresis} ml` },
                { label: "Vomitos / SNG", value: `${entry.output.vomiting} ml` },
                { label: "Drenajes", value: `${entry.output.drains} ml` },
                { label: "Catarsis", value: `${entry.output.liquidStools} ml` },
                { label: "Aspiracion", value: `${entry.output.aspiration} ml` },
                { label: "Perdidas insensibles", value: `${entry.output.insensibleLoss} ml` },
                { label: "Otros", value: `${entry.output.other} ml` },
                { label: "Total", value: `${output} ml` },
              ],
            },
            {
              title: "Resumen",
              items: [
                { label: "Turno", value: entry.shift },
                { label: "Balance", value: `${balance} ml` },
                { label: "Observaciones", value: entry.observations || "Sin observaciones" },
              ],
            },
          ]
        );
      });
    }

    if (activeTab === "medication") {
      entries = effectiveMedicationRecords.map((record) =>
        makeEntry(
          `med-${record.id}`,
          record.startDate,
          `${record.name} ${record.dose}`,
          `${record.frequency} · ${record.route} · Estado ${record.administrationStatus}`,
          record.prescriber
        )
      );
    }

    if (activeTab === "nursing_notes") {
      entries = effectiveNursingNotes.map((note) =>
        makeEntry(`nn-${note.id}`, note.datetime, "Nota de enfermeria", note.note, note.professional)
      );
    }

    if (activeTab === "medical_notes") {
      entries = effectiveMedicalNotes.map((note) =>
        makeEntry(`mn-${note.id}`, note.datetime, "Nota medica", note.note, note.professional)
      );
    }

    if (activeTab === "nursing_report") {
      entries = effectiveNursingShiftReports.map((report) =>
        makeEntry(
          `nr-${report.id}`,
          `${report.date} ${report.shift}`,
          `Reporte de enfermeria ${report.shift}`,
          `${report.generalStatus} · ${report.carePlan}`,
          patient.assignedProfessional,
          report.hourlyEntries?.length
            ? [
                {
                  title: "Registro horario",
                  items: report.hourlyEntries.map((entry) => ({
                    label: `${entry.hour} · ${entry.focus}`,
                    value: `${entry.action} · Respuesta: ${entry.response}`,
                  })),
                },
              ]
            : undefined
        )
      );
    }

    if (activeTab === "kardex") {
      entries = patient.kardex.map((entry) =>
        makeEntry(
          `kardex-${entry.id}`,
          entry.date,
          "Registro kardex",
          `${entry.diagnosis} · ${entry.medicationPlan}`,
          patient.assignedProfessional
        )
      );
    }

    if (activeTab === "exams") {
      entries = patient.exams.map((exam) =>
        makeEntry(
          `exam-${exam.id}`,
          exam.resultAt ?? exam.requestedAt,
          `${exam.name} (${exam.category})`,
          `${exam.status} · ${exam.summary}`,
          exam.requestedBy
        )
      );
    }

    if (activeTab === "diagnoses") {
      entries = patient.diagnoses.map((diagnosis) =>
        makeEntry(
          `diagnosis-${diagnosis.id}`,
          diagnosis.registeredAt,
          `${diagnosis.type}`,
          `${diagnosis.diagnosis} · ${diagnosis.status}`,
          patient.assignedProfessional
        )
      );
    }

    if (activeTab === "procedures") {
      entries = patient.procedures.map((procedure) =>
        makeEntry(
          `procedure-${procedure.id}`,
          procedure.placedAt,
          procedure.type,
          `${procedure.status} · ${procedure.daysInstalled} dias instalado`,
          procedure.responsibleProfessional
        )
      );
    }

    if (activeTab === "nutrition") {
      entries = nutritionPlans.map((plan) =>
        makeEntry(
          `nutrition-${plan.id}`,
          plan.date,
          `Plan nutricional ${plan.dietName}`,
          `${plan.dietType} · Objetivo: ${plan.objectives}`,
          plan.professional
        )
      );
    }

    if (activeTab === "vaccination") {
      entries = [
        ...patient.vaccination.applied.map((item) =>
          makeEntry(
            `vac-applied-${item.vaccine}-${item.date}`,
            item.date,
            `Vacuna aplicada: ${item.vaccine}`,
            item.observations,
            patient.assignedProfessional
          )
        ),
        ...patient.vaccination.pending.map((item) =>
          makeEntry(
            `vac-pending-${item.vaccine}-${item.suggestedDate}`,
            item.suggestedDate,
            `Vacuna pendiente: ${item.vaccine}`,
            `${item.availability} · ${item.observations}`,
            patient.assignedProfessional
          )
        ),
      ];
    }

    if (activeTab === "emotional") {
      entries = patient.emotionalHealth.moodFollowUp.map((entry) =>
        makeEntry(
          `emotional-${entry.date}-${entry.mood}`,
          entry.date,
          `Seguimiento emocional: ${entry.mood}`,
          `${entry.stressFactor} · ${entry.observations}`,
          patient.assignedProfessional
        )
      );
    }

    if (activeTab === "care_plan") {
      entries = effectiveCarePlans.map((entry) =>
        makeEntry(
          `careplan-${entry.id}`,
          patient.admissionDate,
          entry.nursingDiagnosis,
          `Objetivo: ${entry.objective} · Evaluacion: ${entry.evaluation}`,
          patient.assignedProfessional,
          [
            {
              title: "Intervenciones",
              items: entry.interventions.map((intervention, index) => ({
                label: `Intervencion ${index + 1}`,
                value: intervention,
              })),
            },
            ...(entry.hourlyEntries?.length
              ? [
                  {
                    title: "Seguimiento horario",
                    items: entry.hourlyEntries.map((hourly) => ({
                      label: `${hourly.hour} · ${hourly.focus}`,
                      value: `${hourly.intervention} · ${hourly.response} · ${hourly.status}`,
                    })),
                  },
                ]
              : []),
          ]
        )
      );
    }

    if (activeTab === "msp_forms") {
      entries = linkedRegisteredRecord
        ? availableMspForms.map((form) =>
            makeEntry(
              `msp-${form.id}`,
              linkedRegisteredRecord.mspCompliance.generatedAt || linkedRegisteredRecord.createdAt,
              `Formulario ${form.id}`,
              `${form.title} · ${form.availabilityNote}`,
              linkedRegisteredRecord.consultation.professionalName || patient.assignedProfessional,
              [
                {
                  title: "Estado documental",
                  items: [
                    { label: "Codigo", value: form.code },
                    { label: "Disponibilidad", value: form.availability },
                    { label: "Observacion", value: form.description },
                  ],
                },
              ]
            )
          )
        : [];
    }

    if (activeTab === "documents" || activeTab === "reports") {
      entries = patient.documents.map((document) =>
        makeEntry(
          `document-${document.id}`,
          document.date,
          document.title,
          `${document.type} · ${document.status}`,
          document.uploadedBy
        )
      );
    }

    if (activeTab === "timeline") {
      entries = timelineSorted.map((event) =>
        makeEntry(
          `timeline-${event.id}`,
          event.datetime,
          `${event.category}`,
          event.detail,
          patient.assignedProfessional
        )
      );
    }

    if (activeTab === "education") {
      entries = educationResources.map((resource) =>
        makeEntry(
          `education-${resource.id}`,
          resource.updatedAt,
          resource.title,
          `${resource.condition} · ${resource.format}`,
          patient.assignedProfessional
        )
      );
    }

    return [...fromAudit, ...entries]
      .sort((a, b) => {
        if (a.dateKey === b.dateKey) {
          return b.date.localeCompare(a.date);
        }
        return b.dateKey.localeCompare(a.dateKey);
      })
      .slice(0, 200);
  }, [
    activeTab,
    availableMspForms,
    effectiveCarePlans,
    effectiveFluidBalances,
    effectiveMedicationRecords,
    effectiveMedicalNotes,
    effectiveNursingNotes,
    effectiveNursingShiftReports,
    effectiveVitals,
    linkedRegisteredRecord,
    nutritionPlans,
    patient,
    tabAuditRecords,
    timelineSorted,
  ]);
  const filteredModuleHistoryEntries = useMemo(
    () =>
      historyDateFilter
        ? moduleHistoryEntries.filter((entry) => entry.dateKey === historyDateFilter)
        : moduleHistoryEntries,
    [historyDateFilter, moduleHistoryEntries]
  );

  const addAuditRecord = (tab: PatientTabId, title: string, details: string) => {
    const professional = currentProfessional.trim() || patient.assignedProfessional;
    const tabLabel = patientTabs.find((tabItem) => tabItem.id === tab)?.label ?? activeTabLabel;

    setAuditRecords((prev) => [
      {
        id: `audit-${tab}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tab,
        timestamp: getCurrentDateTimeLabel(),
        professional,
        title: title.trim() || `Actualizacion en ${tabLabel}`,
        details: details.trim(),
      },
      ...prev,
    ]);
  };

  const openTabFromQuickAction = (tab: PatientTabId) => {
    setSelectedTab(tab);
    setHistoryOpen(false);
  };

  const handleSearchAnotherPatient = () => {
    router.push("/portal/professional/patients");
  };

  const handleExportPdf = () => {
    if (linkedRegisteredRecord && emergencyForm && typeof window !== "undefined") {
      const exportUrl = `/portal/professional/reports/forms/${emergencyForm.id}?patientId=${linkedRegisteredRecord.id}&print=1`;
      addAuditRecord(
        "msp_forms",
        "Exportacion PDF MSP 008",
        `Se abrio el formulario ${emergencyForm.code} en modo imprimible para exportacion PDF.`
      );
      setQuickActionFeedback(`Se abrio el formulario ${emergencyForm.code} listo para imprimir o exportar.`);
      window.open(exportUrl, "_blank", "noopener,noreferrer");
      return;
    }

    openTabFromQuickAction("msp_forms");
    addAuditRecord(
      "msp_forms",
      "Exportacion PDF MSP 008 no disponible",
      linkedRegisteredRecord
        ? "El expediente vinculado no tiene disponible el formulario 008 para exportacion."
        : "No existe aun un expediente MSP vinculado para exportar el formulario 008."
    );
    setQuickActionFeedback(
      linkedRegisteredRecord
        ? "No se encontro el formulario 008 disponible para este expediente."
        : "Vincula primero un expediente MSP para exportar el formulario 008."
    );
  };

  const handleGenerateClinicalSummary = () => {
    openTabFromQuickAction("reports");
    setModuleRecordForm((prev) => ({
      title: prev.title || `Resumen clinico ${patient.fullName}`,
      details:
        prev.details ||
        `Resumen clinico generado para ${patient.fullName}. Incluir diagnosticos, evolucion y plan terapeutico.`,
    }));
    addAuditRecord(
      "reports",
      "Generacion de resumen clinico",
      "Se preparo un borrador de resumen clinico en el modulo de reportes."
    );
    setQuickActionFeedback("Se preparo un borrador de resumen clinico en Reportes.");
  };

  const handleHeaderEditData = () => {
    openTabFromQuickAction("personal");
    addAuditRecord("personal", "Acceso rapido: editar datos", "Se abrio el modulo de datos personales.");
    setQuickActionFeedback("Edita datos desde el modulo Datos personales.");
  };

  const handleHeaderGenerateReport = () => {
    handleGenerateClinicalSummary();
  };

  const handleHeaderOpenMspForms = () => {
    openTabFromQuickAction("msp_forms");
    addAuditRecord(
      "msp_forms",
      "Acceso rapido: formularios MSP",
      linkedRegisteredSummary
        ? "Se abrio el catalogo MSP vinculado al paciente."
        : "Se abrio el modulo MSP sin expediente estructurado vinculado."
    );
    setQuickActionFeedback(
      linkedRegisteredSummary
        ? "Se abrio el catalogo de formularios MSP del paciente."
        : "No existe aun un expediente MSP vinculado para este paciente."
    );
  };

  const handleHeaderViewAlerts = () => {
    openTabFromQuickAction("summary");
    const hasAlerts = patient.activeAlerts.length > 0;
    addAuditRecord(
      "summary",
      "Revision de alertas",
      hasAlerts ? "Se revisaron alertas activas del paciente." : "Paciente sin alertas activas."
    );
    setQuickActionFeedback(
      hasAlerts ? "Mostrando bloque de alertas activas." : "Paciente sin alertas activas registradas."
    );
    if (hasAlerts && typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("patient-alerts-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 60);
    }
  };

  const handleHeaderAddNote = () => {
    openTabFromQuickAction("medical_notes");
    addAuditRecord("medical_notes", "Acceso rapido: agregar nota", "Se abrio el modulo de notas medicas.");
    setQuickActionFeedback("Ahora puedes registrar la nota en el modulo Medicina.");
  };

  const handleGenerateNursingReport = () => {
    openTabFromQuickAction("nursing_report");
    addAuditRecord(
      "nursing_report",
      "Generacion de reporte de enfermeria",
      "Se abrio el modulo de reporte de enfermeria para generar el registro."
    );
    setQuickActionFeedback("Se abrio Reporte de enfermeria para generar el registro.");
  };

  const registerVitalRecord = () => {
    if (
      !vitalForm.heartRate ||
      !vitalForm.respiratoryRate ||
      !vitalForm.pas ||
      !vitalForm.pad ||
      !vitalForm.temperature ||
      !vitalForm.spo2 ||
      !vitalForm.glucose
    ) {
      return;
    }

    const numeric = {
      heartRate: Number(vitalForm.heartRate),
      respiratoryRate: Number(vitalForm.respiratoryRate),
      pas: Number(vitalForm.pas),
      pad: Number(vitalForm.pad),
      temperature: Number(vitalForm.temperature),
      spo2: Number(vitalForm.spo2),
      glucose: Number(vitalForm.glucose),
      painScale: Number(vitalForm.painScale || 0),
    };
    if (Object.values(numeric).some((value) => !Number.isFinite(value))) {
      return;
    }

    const flags = computeVitalFlags(numeric);
    const hourForRecord = vitalForm.hour === "24:00" ? "00:00" : vitalForm.hour;

    setAddedVitals((prev) => [
      {
        recordedAt: `${latestVitalDate} ${hourForRecord}`,
        bloodPressure: `${numeric.pas}/${numeric.pad}`,
        heartRate: numeric.heartRate,
        respiratoryRate: numeric.respiratoryRate,
        temperature: numeric.temperature,
        spo2: numeric.spo2,
        glucose: numeric.glucose,
        painScale: numeric.painScale,
        weightKg: latestVital?.weightKg ?? 0,
        heightCm: latestVital?.heightCm ?? 0,
        bmi: latestVital?.bmi ?? 0,
        professional: currentProfessional.trim() || patient.assignedProfessional,
        outOfRangeFlags: flags,
      },
      ...prev,
    ]);

    addAuditRecord(
      "vitals",
      "Registro de signos vitales",
      `Hora ${vitalForm.hour}. FC ${numeric.heartRate}, FR ${numeric.respiratoryRate}, TA ${numeric.pas}/${numeric.pad}, T ${numeric.temperature}, SO2 ${numeric.spo2}, HGT ${numeric.glucose}.`
    );
    setVitalForm((prev) => ({
      ...prev,
      heartRate: "",
      respiratoryRate: "",
      pas: "",
      pad: "",
      temperature: "",
      spo2: "",
      glucose: "",
      painScale: "",
    }));
  };

  const updateMedicationRecord = (recordId: string, patch: Partial<MedicationRecord>) => {
    setMedicationOverrides((prev) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] ?? {}),
        ...patch,
      },
    }));
  };

  const setMedicationAdministrationStatus = (
    record: MedicationRecord,
    status: MedicationRecord["administrationStatus"]
  ) => {
    updateMedicationRecord(record.id, {
      administrationStatus: status,
      adherence: status === "Administrado" ? "Alta" : record.adherence,
    });
    addAuditRecord(
      "medication",
      "Actualizacion de administracion",
      `${record.name} ${record.dose} marcado como ${status}.`
    );
  };

  const registerMedicationRecord = () => {
    if (
      !medicationForm.name.trim() ||
      !medicationForm.dose.trim() ||
      !medicationForm.frequency.trim() ||
      !medicationForm.route.trim() ||
      !medicationForm.schedule.trim()
    ) {
      return;
    }

    const newMedication: MedicationRecord = {
      id: `med-local-${Date.now()}`,
      name: medicationForm.name.trim(),
      dose: medicationForm.dose.trim(),
      frequency: medicationForm.frequency.trim(),
      route: medicationForm.route.trim(),
      schedule: medicationForm.schedule.trim(),
      startDate: getCurrentDateLabel(),
      indication: medicationForm.indication.trim() || "Indicacion clinica pendiente de detalle.",
      prescriber: medicationForm.prescriber.trim() || currentProfessional.trim() || patient.assignedProfessional,
      adherence: medicationForm.adherence.trim() || "En seguimiento",
      administrationStatus: medicationForm.administrationStatus,
      notes: medicationForm.notes.trim() || "Sin observaciones.",
    };

    setAddedMedicationRecords((prev) => [newMedication, ...prev]);
    addAuditRecord(
      "medication",
      "Registro de medicamento",
      `${newMedication.name} ${newMedication.dose} · ${newMedication.frequency} · Via ${newMedication.route} · Estado ${newMedication.administrationStatus}.`
    );
    setMedicationForm((prev) => ({
      ...prev,
      name: "",
      dose: "",
      frequency: "",
      schedule: "",
      indication: "",
      notes: "",
      administrationStatus: "Pendiente",
    }));
  };

  const registerFirstPendingMedication = () => {
    const pendingRecord = effectiveMedicationRecords.find(
      (record) => record.administrationStatus === "Pendiente"
    );
    if (!pendingRecord) {
      return;
    }
    setMedicationAdministrationStatus(pendingRecord, "Administrado");
  };

  const registerFluidBalance = () => {
    if (fluidDraftSummary.intakeTotal <= 0 && fluidDraftSummary.outputTotal <= 0) {
      return;
    }

    if (fluidDraftSummary.output.diuresis <= 0) {
      return;
    }

    setAddedFluidBalances((prev) => [
      {
        id: `fb-local-${Date.now()}`,
        shift: fluidForm.shift,
        date: latestVitalDate,
        intake: fluidDraftSummary.intake,
        output: fluidDraftSummary.output,
        observations: fluidForm.observations || "Registro manual de balance por turno.",
      },
      ...prev,
    ]);

    addAuditRecord(
      "fluid_balance",
      "Registro de balance hidrico",
      `Turno ${fluidForm.shift}. Ingreso ${fluidDraftSummary.intakeTotal} ml, egreso ${fluidDraftSummary.outputTotal} ml, diuresis ${fluidDraftSummary.output.diuresis} ml, balance ${fluidDraftSummary.balance} ml. ${fluidForm.observations}`
    );
    setFluidForm({
      shift: fluidForm.shift,
      oral: "",
      intravenous: "",
      dilutedMedication: "",
      enteralParenteral: "",
      intakeOther: "",
      diuresis: "",
      vomiting: "",
      drain1: "",
      drain2: "",
      drain3: "",
      drain4: "",
      drain5: "",
      catarsis: "",
      aspiration: "",
      outputOther: "",
      observations: "",
    });
  };

  const registerNursingNote = () => {
    if (!nursingNoteDraft.trim()) {
      return;
    }

    const datetime = getCurrentDateTimeLabel();
    setAddedNursingNotes((prev) => [
      {
        id: `nn-local-${Date.now()}`,
        datetime,
        professional: currentProfessional.trim() || patient.assignedProfessional,
        specialty: "Enfermeria",
        note: nursingNoteDraft.trim(),
      },
      ...prev,
    ]);
    addAuditRecord("nursing_notes", "Nota de enfermeria", nursingNoteDraft.trim());
    setNursingNoteDraft("");
  };

  const registerMedicalNote = () => {
    if (!medicalNoteDraft.trim()) {
      return;
    }

    const datetime = getCurrentDateTimeLabel();
    setAddedMedicalNotes((prev) => [
      {
        id: `mn-local-${Date.now()}`,
        datetime,
        professional: currentProfessional.trim() || patient.assignedProfessional,
        specialty: "Medicina",
        note: medicalNoteDraft.trim(),
      },
      ...prev,
    ]);
    addAuditRecord("medical_notes", "Nota medica", medicalNoteDraft.trim());
    setMedicalNoteDraft("");
  };

  const addNursingHourEntry = () => {
    if (!nursingHourForm.action.trim()) {
      return;
    }

    const newEntry: NursingHourEntry = {
      id: `nhr-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      hour: nursingHourForm.hour,
      focus: nursingHourForm.focus.trim() || "Monitoreo",
      action: nursingHourForm.action.trim(),
      response: nursingHourForm.response.trim() || "Sin cambios relevantes.",
    };

    setNursingHourEntries((prev) =>
      sortNursingHourEntriesByShift([...prev, newEntry], nursingReportForm.shift)
    );
    setNursingHourForm((prev) => ({
      ...prev,
      action: "",
      response: "",
    }));
  };

  const removeNursingHourEntry = (entryId: string) => {
    setNursingHourEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const registerNursingShiftReport = () => {
    const timelineSummary = nursingHourEntries
      .map(
        (entry) =>
          `${entry.hour} ${entry.focus}: ${entry.action}${
            entry.response ? ` (Respuesta: ${entry.response})` : ""
          }`
      )
      .join(" | ");

    const generalStatus =
      nursingReportForm.generalStatus.trim() ||
      (nursingHourEntries.length > 0 ? "Seguimiento de enfermeria por horas." : "");
    const proceduresDone = [nursingReportForm.proceduresDone.trim(), timelineSummary ? `Registro horario: ${timelineSummary}` : ""]
      .filter(Boolean)
      .join(" · ");
    const carePlan =
      nursingReportForm.carePlan.trim() ||
      (nursingHourEntries.length > 0
        ? "Continuar vigilancia y cuidados de enfermeria segun registro por horas."
        : "");

    if (!generalStatus || !proceduresDone || !carePlan) {
      return;
    }

    const lastHourlyResponse =
      nursingHourEntries.length > 0 ? nursingHourEntries[nursingHourEntries.length - 1].response : "";
    const reference = selectedNursingShiftReport;
    setAddedNursingShiftReports((prev) => [
      {
        id: `nsr-local-${Date.now()}`,
        shift: nursingReportForm.shift,
        service: nursingReportForm.service,
        date: latestVitalDate,
        generalStatus,
        consciousness: reference?.consciousness ?? "Alerta",
        breathing: reference?.breathing ?? "Sin dificultad respiratoria",
        pain: reference?.pain ?? "0/10",
        oralTolerance: reference?.oralTolerance ?? "Adecuada",
        elimination: reference?.elimination ?? "Conservada",
        mobility: reference?.mobility ?? "Asistida",
        skin: reference?.skin ?? "Integra",
        proceduresDone,
        patientResponse: reference?.patientResponse ?? (lastHourlyResponse || "Cooperador/a"),
        incidents: nursingReportForm.incidents.trim() || "Sin incidencias",
        carePlan,
        hourlyEntries: nursingHourEntries.length > 0 ? nursingHourEntries : undefined,
      },
      ...prev,
    ]);
    addAuditRecord(
      "nursing_report",
      "Reporte de enfermeria",
      `Turno ${nursingReportForm.shift}. ${generalStatus}. Procedimientos: ${proceduresDone}. Plan: ${carePlan}. Registros horarios: ${nursingHourEntries.length}.`
    );
    setNursingReportForm((prev) => ({
      ...prev,
      generalStatus: "",
      proceduresDone: "",
      incidents: "",
      carePlan: "",
    }));
    setNursingHourEntries([]);
    setNursingHourForm((prev) => ({
      ...prev,
      hour: nursingShiftHourOptions[0] ?? prev.hour,
      action: "",
      response: "",
    }));
  };

  const addCarePlanHourEntry = () => {
    if (!carePlanHourForm.intervention.trim()) {
      return;
    }

    const newEntry: CarePlanHourEntry = {
      id: `cph-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      hour: carePlanHourForm.hour,
      focus: carePlanHourForm.focus.trim() || "Intervencion",
      intervention: carePlanHourForm.intervention.trim(),
      response: carePlanHourForm.response.trim() || "Sin cambios relevantes.",
      status: carePlanHourForm.status.trim() || "Pendiente",
    };

    setCarePlanHourEntries((prev) => sortCarePlanHourEntries([...prev, newEntry]));
    setCarePlanHourForm((prev) => ({
      ...prev,
      intervention: "",
      response: "",
    }));
  };

  const removeCarePlanHourEntry = (entryId: string) => {
    setCarePlanHourEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const registerCarePlan = () => {
    const baseInterventions = carePlanForm.baseInterventions
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
    const hourlyInterventions = carePlanHourEntries.map(
      (entry) => `${entry.hour} ${entry.focus}: ${entry.intervention}`
    );
    const interventions = [...baseInterventions, ...hourlyInterventions];

    if (
      !carePlanForm.nursingDiagnosis.trim() ||
      !carePlanForm.objective.trim() ||
      interventions.length === 0
    ) {
      return;
    }

    const latestHourlyResponse =
      carePlanHourEntries.length > 0
        ? carePlanHourEntries[carePlanHourEntries.length - 1].response
        : "";
    const evaluation =
      carePlanForm.evaluation.trim() ||
      latestHourlyResponse ||
      "Pendiente de evaluacion en siguiente control.";
    const observations =
      carePlanForm.observations.trim() ||
      `Plan generado con ${carePlanHourEntries.length} registros horarios.`;

    const newCarePlan: CarePlanEntryRecord = {
      id: `careplan-local-${Date.now()}`,
      nursingDiagnosis: carePlanForm.nursingDiagnosis.trim(),
      objective: carePlanForm.objective.trim(),
      interventions,
      evaluation,
      observations,
      hourlyEntries: carePlanHourEntries.length > 0 ? carePlanHourEntries : undefined,
    };

    setAddedCarePlans((prev) => [newCarePlan, ...prev]);
    setSelectedCarePlanId(newCarePlan.id);
    addAuditRecord(
      "care_plan",
      "Plan de cuidados",
      `${newCarePlan.nursingDiagnosis}. Objetivo: ${newCarePlan.objective}. Intervenciones: ${newCarePlan.interventions.length}. Registros horarios: ${carePlanHourEntries.length}.`
    );
    setCarePlanForm({
      nursingDiagnosis: "",
      objective: "",
      baseInterventions: "",
      evaluation: "",
      observations: "",
    });
    setCarePlanHourEntries([]);
    setCarePlanHourForm((prev) => ({
      ...prev,
      hour: carePlanHourOptions[7] ?? prev.hour,
      intervention: "",
      response: "",
      status: "Pendiente",
    }));
  };

  const registerNutritionPlan = () => {
    if (
      !nutritionForm.dietName.trim() ||
      !nutritionForm.dietType.trim() ||
      !nutritionForm.allowedFoods.trim() ||
      !nutritionForm.objectives.trim()
    ) {
      return;
    }

    const newPlan: NutritionPlanRecord = {
      id: `nut-local-${Date.now()}`,
      date: getCurrentDateLabel(),
      dietName: nutritionForm.dietName.trim(),
      dietType: nutritionForm.dietType.trim(),
      allowedFoods: nutritionForm.allowedFoods.trim(),
      restrictedFoods: nutritionForm.restrictedFoods.trim(),
      recommendedIntake: nutritionForm.recommendedIntake.trim(),
      hydrationPlan: nutritionForm.hydrationPlan.trim(),
      supplements: nutritionForm.supplements.trim(),
      mealSchedule: nutritionForm.mealSchedule.trim(),
      objectives: nutritionForm.objectives.trim(),
      observations: nutritionForm.observations.trim(),
      professional: currentProfessional.trim() || patient.assignedProfessional,
    };

    setNutritionPlans((prev) => [newPlan, ...prev]);
    addAuditRecord(
      "nutrition",
      "Plan nutricional",
      `Dieta ${newPlan.dietName} (${newPlan.dietType}). Objetivo: ${newPlan.objectives}.`
    );
    setNutritionForm((prev) => ({
      ...prev,
      observations: "",
    }));
  };

  const registerModuleEntry = () => {
    if (!moduleRecordForm.details.trim()) {
      return;
    }

    addAuditRecord(
      activeTab,
      moduleRecordForm.title.trim() || `Actualizacion ${activeTabLabel}`,
      moduleRecordForm.details.trim()
    );
    setModuleRecordForm({ title: "", details: "" });
  };

  const groupedTabs = useMemo(() => {
    return patientTabs.reduce<Record<string, Array<{ id: PatientTabId; label: string }>>>(
      (acc, tab) => {
        if (!acc[tab.group]) {
          acc[tab.group] = [];
        }
        acc[tab.group].push({ id: tab.id, label: tab.label });
        return acc;
      },
      {}
    );
  }, []);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <ActionChip label="Buscar otro paciente" onClick={handleSearchAnotherPatient} />
              <ActionChip label="Editar datos" onClick={handleHeaderEditData} />
              <ActionChip label="Formularios MSP" onClick={handleHeaderOpenMspForms} />
              <ActionChip label="Exportar PDF MSP 008" onClick={handleExportPdf} />
              <ActionChip label="Generar reporte" onClick={handleHeaderGenerateReport} />
              <ActionChip label="Ver alertas" onClick={handleHeaderViewAlerts} />
              <ActionChip label="Agregar nota" onClick={handleHeaderAddNote} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge risk={patient.riskLevel} />
              <TriageBadge triage={patient.triageColor} />
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                Estado: {patient.currentStatus}
              </span>
            </div>
          </div>

          {quickActionFeedback ? (
            <p className="text-[11px] text-slate-500">{quickActionFeedback}</p>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-lg font-semibold text-white">
              {toInitials(patient.fullName)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{patient.fullName}</h1>
              <p className="text-xs text-slate-600">
                {patient.age} anios · {patient.sex} · ID {patient.identification}
              </p>
              <p className="text-xs text-slate-500">
                Historia clinica: {patient.medicalRecordNumber} · Codigo: {patient.code}
              </p>
              <p className="mt-1 text-xs text-slate-700">
                Diagnostico principal: <span className="font-semibold">{patient.primaryDiagnosis}</span>
              </p>
              <p className="text-xs text-slate-500">
                Diagnosticos secundarios:{" "}
                {patient.secondaryDiagnoses.length
                  ? patient.secondaryDiagnoses.join(", ")
                  : "Sin diagnosticos secundarios"}
              </p>
              <p className="text-xs text-slate-500">
                Profesional responsable: {patient.assignedProfessional} · Ingreso: {patient.admissionDate} · Ultimo
                control: {patient.lastControlAt}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
            Patron funcional alterado
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(functionalPatterns.length ? functionalPatterns : ["Sin patron registrado"]).map(
              (pattern) => (
                <span
                  key={pattern}
                  className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] text-sky-700"
                >
                  {pattern}
                </span>
              )
            )}
          </div>
        </div>

        {patient.activeAlerts.length > 0 && (
          <div id="patient-alerts-panel" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Alertas activas
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {patient.activeAlerts.map((alert) => (
                <span
                  key={alert}
                  className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[11px] text-amber-700"
                >
                  {alert}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <div
        className={[
          "sticky top-2 z-20 rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85",
          isBundleWorkspace ? "px-3 py-2" : "p-3",
        ].join(" ")}
      >
        <div
          className={[
            "flex flex-col xl:flex-row xl:items-center xl:justify-between",
            isBundleWorkspace ? "gap-2" : "gap-3",
          ].join(" ")}
        >
          <div className={isBundleWorkspace ? "space-y-0.5" : "space-y-1"}>
            <p className={isBundleWorkspace ? "text-[13px] font-semibold text-slate-900" : "text-sm font-semibold text-slate-900"}>
              {patient.fullName} · {patient.age} anios · HC {patient.medicalRecordNumber}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {isBundleWorkspace ? (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                    {patient.serviceArea ?? patient.careMode}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                    {patient.currentStatus}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                    {patient.lastControlAt}
                  </span>
                  <RiskBadge risk={patient.riskLevel} />
                  <TriageBadge triage={patient.triageColor} />
                </>
              ) : (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                    Area: {patient.serviceArea ?? patient.careMode}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                    Estado: {patient.currentStatus}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                    Ultimo control: {patient.lastControlAt}
                  </span>
                  <RiskBadge risk={patient.riskLevel} />
                  <TriageBadge triage={patient.triageColor} />
                  {medicationAllergies.length > 0 ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                      Alergias: {medicationAllergies.slice(0, 2).join(" · ")}
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      Sin alergias medicamentosas
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={["flex flex-wrap", isBundleWorkspace ? "gap-1" : "gap-1.5"].join(" ")}>
            <StickyTabButton
              label="Resumen"
              active={activeTab === "summary"}
              onClick={() => setSelectedTab("summary")}
            />
            <StickyTabButton
              label="Signos"
              active={activeTab === "vitals"}
              onClick={() => setSelectedTab("vitals")}
            />
            <StickyTabButton
              label="Balance"
              active={activeTab === "fluid_balance"}
              onClick={() => setSelectedTab("fluid_balance")}
            />
            <StickyTabButton
              label="Kardex"
              active={activeTab === "kardex"}
              onClick={() => setSelectedTab("kardex")}
            />
            <StickyTabButton
              label="Reporte medico"
              active={activeTab === "medical_notes"}
              onClick={() => setSelectedTab("medical_notes")}
            />
            <StickyTabButton
              label="MSP"
              active={activeTab === "msp_forms"}
              onClick={() => setSelectedTab("msp_forms")}
            />
            <StickyTabButton
              label="Bundle ABCDEF"
              active={activeTab === "bundle_abcdef"}
              onClick={() => setSelectedTab("bundle_abcdef")}
            />
          </div>
        </div>
      </div>

      <div
        className={[
          "grid grid-cols-1 gap-4",
          showClinicalAside ? "xl:grid-cols-[300px_minmax(0,1fr)]" : "",
        ].join(" ")}
      >
        {showClinicalAside ? (
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 xl:sticky xl:top-24">
          <div className="mb-3 border-b border-slate-200 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Acciones del paciente
            </p>
            <p className="text-[11px] text-slate-500">
              Desde este lateral trabajas toda la ficha clinica del paciente.
            </p>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">
              Activo: <span className="font-semibold text-slate-800">{activeTabLabel}</span>
            </div>
          </div>

          <div className="space-y-3 xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto xl:pr-1">
            {Object.entries(groupedTabs).map(([groupName, tabs]) => (
              <section key={groupName}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {groupName}
                  </p>
                  <span className="text-[10px] text-slate-400">{tabs.length}</span>
                </div>

                <div className="space-y-1.5">
                  {tabs.map((tab) => {
                    const active = tab.id === activeTab;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTab(tab.id)}
                        aria-pressed={active}
                        className={[
                          "flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition",
                          active
                            ? "border-sky-300 bg-sky-50 text-sky-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span className="font-medium">{tab.label}</span>
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            active ? "bg-sky-600" : "bg-slate-300",
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">Modulo actual: {activeTabLabel}</p>
              <p className="text-[11px] text-slate-500">
                Registro y consulta historica por fecha en el modulo seleccionado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHistoryDateFilter("");
                setHistoryOpen(true);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Ver historico
            </button>
          </div>

          {isBundleWorkspace ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-sky-900">Modo enfoque del Bundle ABCDEF</p>
                <p className="text-[11px] text-sky-700">
                  La navegacion clinica lateral se oculta para ganar ancho util de registro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBundleNavigatorOpen((current) => !current)}
                className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
              >
                {bundleNavigatorOpen ? "Ocultar navegacion clinica" : "Mostrar navegacion clinica"}
              </button>
            </div>
          ) : null}

      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickStatCard label="Estado actual" value={patient.currentStatus} hint={`Servicio: ${patient.serviceArea ?? patient.careMode}`} />
            <QuickStatCard label="Riesgo clinico" value={`Riesgo ${patient.riskLevel}`} hint={`Triaje ${patient.triageColor}`} />
            <QuickStatCard label="Diagnosticos activos" value={activeDiagnosisCount} hint={`Total registrados: ${patient.diagnoses.length}`} />
            <QuickStatCard
              label="Ultimo control"
              value={latestVital ? latestVital.recordedAt : "Sin control"}
              hint={
                latestVital
                  ? `TA ${latestVital.bloodPressure} · FC ${latestVital.heartRate} · SpO2 ${latestVital.spo2}%`
                  : "Pendiente de signos vitales"
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title="Resumen clinico principal" subtitle="Lo indispensable para decidir en menos de 30 segundos">
              <div className="space-y-3">
                <SummaryRow label="Motivo de consulta" value={patient.summary.reasonForConsultation} />
                <SummaryRow label="Diagnostico principal" value={patient.primaryDiagnosis} />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Diagnosticos secundarios
                  </p>
                  {patient.secondaryDiagnoses.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-600">Sin diagnosticos secundarios.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patient.secondaryDiagnoses.map((item) => (
                        <InfoTag key={item} label={item} tone="slate" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Alergias registradas
                  </p>
                  {patient.antecedentes.allergies.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-800">No registradas.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patient.antecedentes.allergies.map((item) => (
                        <InfoTag key={item} label={item} tone="amber" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Seguimiento y alertas" subtitle="Lo reciente del turno: medicacion, enfermeria y eventos">
              <div className="space-y-2 text-xs text-slate-700">
                <SummaryRow
                  label="Medicacion actual"
                  value={
                    patient.summary.activeMedicationSummary.length
                      ? patient.summary.activeMedicationSummary.join(" · ")
                      : "Sin medicacion activa"
                  }
                />
                <SummaryRow
                  label="Ultimo reporte de enfermeria"
                  value={patient.summary.latestNursingReport}
                />
                <SummaryRow
                  label="Vacunas pendientes"
                  value={
                    patient.summary.vaccinationPendingSummary.length
                      ? patient.summary.vaccinationPendingSummary.join(", ")
                      : "Sin pendientes"
                  }
                />
                <SummaryRow
                  label="Resumen nutricional"
                  value={patient.summary.nutritionalSummary}
                />
                <SummaryRow
                  label="Resumen emocional"
                  value={patient.summary.emotionalSummary}
                />
              </div>
            </Panel>
          </div>

          <ClinicalSurveillancePanel
            patientId={patient.id}
            compact
            title="Observaciones del sistema"
            subtitle="Hallazgos automatizados del motor de vigilancia clinica. Requieren validacion profesional antes de cualquier decision."
          />

          <Panel title="Eventos clinicos recientes" subtitle="Ultimos hitos del paciente ordenados por tiempo">
            {recentTimeline.length === 0 ? (
              <p className="text-xs text-slate-500">Sin eventos recientes registrados.</p>
            ) : (
              <div className="space-y-2">
                {recentTimeline.map((event) => (
                  <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <TimelineCategoryTag category={event.category} />
                      <span className="text-[11px] text-slate-500">{event.datetime}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-700">{event.detail}</p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {activeTab === "personal" && (
        <Panel title="Datos personales e identificacion" subtitle="Informacion administrativa y de contacto">
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-3">
            <SummaryRow label="Nombres" value={`${patient.firstName} ${patient.lastName}`} />
            <SummaryRow label="Fecha nacimiento" value={patient.birthDate} />
            <SummaryRow label="Edad" value={`${patient.age} anios`} />
            <SummaryRow label="Sexo" value={patient.sex} />
            <SummaryRow label="Cedula" value={patient.identification} />
            <SummaryRow label="Direccion" value={patient.personalData.address} />
            <SummaryRow label="Telefono" value={patient.personalData.phone} />
            <SummaryRow
              label="Contacto emergencia"
              value={patient.personalData.emergencyContact}
            />
            <SummaryRow label="Tipo sangre" value={patient.personalData.bloodType} />
            <SummaryRow label="Aseguradora" value={patient.personalData.insurance} />
            <SummaryRow label="Estado civil" value={patient.personalData.civilStatus} />
            <SummaryRow label="Ocupacion" value={patient.personalData.occupation} />
            <SummaryRow label="Procedencia" value={patient.personalData.origin} />
            <SummaryRow label="Responsable" value={patient.personalData.guardian} />
          </div>
        </Panel>
      )}

      {activeTab === "background" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Antecedentes clinicos" subtitle="Patologicos, quirurgicos, familiares y alergias">
            <ListBlock title="Patologicos" items={patient.antecedentes.pathological} />
            <ListBlock title="Quirurgicos" items={patient.antecedentes.surgical} />
            <ListBlock title="Farmacologicos" items={patient.antecedentes.pharmacological} />
            <ListBlock title="Alergias" items={patient.antecedentes.allergies} />
            <ListBlock title="Familiares" items={patient.antecedentes.family} />
            <ListBlock title="Gineco-obstetricos" items={patient.antecedentes.gynecoObstetric} />
          </Panel>

          <Panel title="Habitos y enfermedades cronicas" subtitle="Contexto para seguimiento longitudinal">
            <div className="space-y-2 text-xs text-slate-700">
              <SummaryRow label="Tabaco" value={patient.antecedentes.habits.tobacco} />
              <SummaryRow label="Alcohol" value={patient.antecedentes.habits.alcohol} />
              <SummaryRow label="Otras sustancias" value={patient.antecedentes.habits.substances} />
              <SummaryRow
                label="Actividad fisica"
                value={patient.antecedentes.habits.physicalActivity}
              />
              <SummaryRow label="Alimentacion" value={patient.antecedentes.habits.feeding} />
            </div>
            <ListBlock
              title="Hospitalizaciones previas"
              items={patient.antecedentes.hospitalizations}
            />
            <ListBlock
              title="Enfermedades cronicas"
              items={patient.antecedentes.chronicDiseases}
            />
          </Panel>
        </div>
      )}

      {activeTab === "triage" && (
        <div className="space-y-4">
          <Panel title="Triaje y evaluacion inicial" subtitle="Clasificacion de riesgo explicada de forma operativa">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div
                className={[
                  "rounded-xl border p-3",
                  getTriageColorCardTone(patient.triageAssessment.triageColor),
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  Color de triaje
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {patient.triageAssessment.triageColor}
                </p>
              </div>
              <QuickStatCard
                label="Riesgo"
                value={patient.triageAssessment.riskClassification}
                hint="Clasificacion de enfermeria"
              />
              <QuickStatCard
                label="Tiempo de evolucion"
                value={patient.triageAssessment.evolutionTime}
                hint="Reportado por paciente"
              />
              <QuickStatCard
                label="Meta de espera"
                value={`${triageWaitTargetMinutes} min`}
                hint="Referencia segun color de triaje"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Motivo y sintomas clave
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  {patient.triageAssessment.consultationReason}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {patient.triageAssessment.symptoms.map((symptom) => (
                    <InfoTag key={symptom} label={symptom} tone="sky" />
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Decision clinica
                </p>
                <SummaryRow
                  label="Conducta sugerida"
                  value={patient.triageAssessment.suggestedConduct}
                />
                <div className="mt-2">
                  <SummaryRow label="Derivacion" value={patient.triageAssessment.referral} />
                </div>
              </article>

              <article className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                  Signos de alarma
                </p>
                {patient.triageAssessment.warningSigns.length === 0 ? (
                  <p className="mt-1 text-xs text-rose-800">Sin signos de alarma registrados.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {patient.triageAssessment.warningSigns.map((item) => (
                      <InfoTag key={item} label={item} tone="rose" />
                    ))}
                  </div>
                )}
              </article>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Observaciones del profesional
              </p>
              <p className="mt-1 text-xs text-slate-700">
                {patient.triageAssessment.professionalObservations}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Evaluado en: {patient.triageAssessment.evaluatedAt}
              </p>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "vitals" && (
        <Panel
          title="Signos vitales"
          subtitle="Formato de registro de paciente critico con grilla horaria y procedimientos invasivos"
        >
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="min-w-[1180px] text-[11px] text-slate-700">
              <div className="grid grid-cols-12 border-b border-slate-300 bg-slate-50">
                <HeaderField
                  className="col-span-4"
                  label="Apellidos y nombres"
                  value={patient.fullName}
                />
                <HeaderField className="col-span-3" label="HC" value={patient.medicalRecordNumber} />
                <HeaderField className="col-span-2" label="Cama" value={patient.code} />
                <HeaderField className="col-span-3" label="Fecha" value={latestVitalDate} />
                <HeaderField className="col-span-2" label="Edad" value={`${patient.age} anios`} />
                <HeaderField className="col-span-2" label="Sexo" value={patient.sex} />
                <HeaderField className="col-span-3" label="Area" value={patient.serviceArea ?? patient.careMode} />
                <HeaderField className="col-span-5" label="Diagnostico" value={patient.primaryDiagnosis} />
                <HeaderField
                  className="col-span-2"
                  label="Peso"
                  value={`${latestVital?.weightKg ?? "-"} kg`}
                />
              </div>

              <div className="grid grid-cols-[2.2fr_1fr]">
                <div className="border-r border-slate-300">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        <th className="border border-slate-300 px-1 py-1 text-center">Horas</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">FC</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">FR</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">PAS</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">PAD</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">PAM</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">T°</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">SO2</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">INI</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">FUN</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">Aseo/Bano</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">Act. fisica</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">HGT</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">Insulina</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">INI</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">FUN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalHourSlots.map((hour) => {
                        const vital = vitalsByHour[hour] ?? null;
                        const { pas, pad, pam } = parseBloodPressure(vital?.bloodPressure);

                        return (
                          <tr key={hour}>
                            <td className="border border-slate-300 px-1 py-1 text-center font-semibold">
                              {hour}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              {vital ? vital.heartRate : "-"}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              {vital ? vital.respiratoryRate : "-"}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">{pas}</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">{pad}</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">{pam}</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              {vital ? vital.temperature : "-"}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              {vital ? vital.spo2 : "-"}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              {vital ? vital.glucose : "-"}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              {getInsulinLabel(effectiveMedicationRecords, vital)}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                            <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Tipo de procedimiento
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Fecha colocacion
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-center">Dias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invasiveRows.map((row) => (
                        <tr key={row.label}>
                          <td className="border border-slate-300 px-2 py-1">{row.label}</td>
                          <td className="border border-slate-300 px-2 py-1 whitespace-nowrap">
                            {row.placedAt}
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">{row.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid grid-cols-2 border-x border-b border-slate-300">
                    <div className="border-r border-slate-300 p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Dieta artesanal
                      </p>
                      <p className="mt-1 text-[11px] text-slate-700">{patient.nutrition.diet}</p>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Suplemento nutricional
                      </p>
                      <p className="mt-1 text-[11px] text-slate-700">
                        {patient.nutrition.estimatedIntake}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-300 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-600">
                <HeaderField
                  className="border-r border-slate-300"
                  label="Elaborado por"
                  value={patient.assignedProfessional}
                />
                <HeaderField className="border-r border-slate-300" label="Revisado por" value="-" />
                <HeaderField label="Aprobado por" value="-" />
              </div>

              <div className="border-t border-slate-300 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Registrar nuevo control de signos vitales
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <InputText
                    label="Hora"
                    value={vitalForm.hour}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, hour: value }))}
                    placeholder="7:00"
                  />
                  <InputText
                    label="FC"
                    value={vitalForm.heartRate}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, heartRate: value }))}
                    placeholder="88"
                  />
                  <InputText
                    label="FR"
                    value={vitalForm.respiratoryRate}
                    onChange={(value) =>
                      setVitalForm((prev) => ({ ...prev, respiratoryRate: value }))
                    }
                    placeholder="18"
                  />
                  <InputText
                    label="PAS"
                    value={vitalForm.pas}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, pas: value }))}
                    placeholder="120"
                  />
                  <InputText
                    label="PAD"
                    value={vitalForm.pad}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, pad: value }))}
                    placeholder="70"
                  />
                  <InputText
                    label="Temperatura"
                    value={vitalForm.temperature}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, temperature: value }))}
                    placeholder="36.8"
                  />
                  <InputText
                    label="SO2"
                    value={vitalForm.spo2}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, spo2: value }))}
                    placeholder="98"
                  />
                  <InputText
                    label="HGT"
                    value={vitalForm.glucose}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, glucose: value }))}
                    placeholder="140"
                  />
                  <InputText
                    label="Dolor"
                    value={vitalForm.painScale}
                    onChange={(value) => setVitalForm((prev) => ({ ...prev, painScale: value }))}
                    placeholder="2"
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={registerVitalRecord}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Guardar control
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "medication" && (
        <Panel title="Medicacion" subtitle="Plan farmacologico, adherencia y estado de administracion">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={registerMedicationRecord}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Agregar medicamento
            </button>
            <button
              type="button"
              onClick={registerFirstPendingMedication}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Registrar administracion
            </button>
            <button
              type="button"
              onClick={() => {
                setHistoryDateFilter("");
                setHistoryOpen(true);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Ver historial de cambios
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-800">Registrar medicamento</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              <InputText
                label="Farmaco"
                value={medicationForm.name}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, name: value }))}
                placeholder="Metformina"
              />
              <InputText
                label="Dosis"
                value={medicationForm.dose}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, dose: value }))}
                placeholder="850 mg"
              />
              <InputText
                label="Frecuencia"
                value={medicationForm.frequency}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, frequency: value }))}
                placeholder="c/12h"
              />
              <InputText
                label="Via"
                value={medicationForm.route}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, route: value }))}
                placeholder="Oral"
              />
              <InputText
                label="Horario"
                value={medicationForm.schedule}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, schedule: value }))}
                placeholder="08:00 - 20:00"
              />
              <InputText
                label="Indicacion"
                value={medicationForm.indication}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, indication: value }))}
                placeholder="Control glucemico"
              />
              <InputText
                label="Prescriptor"
                value={medicationForm.prescriber}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, prescriber: value }))}
                placeholder="Dra. Camila Rojas"
              />
              <InputSelect
                label="Adherencia"
                value={medicationForm.adherence}
                onChange={(value) => setMedicationForm((prev) => ({ ...prev, adherence: value }))}
                options={["Alta", "Buena", "En seguimiento", "Baja"]}
              />
              <InputSelect
                label="Estado"
                value={medicationForm.administrationStatus}
                onChange={(value) =>
                  setMedicationForm((prev) => ({
                    ...prev,
                    administrationStatus: value as MedicationRecord["administrationStatus"],
                  }))
                }
                options={["Pendiente", "Administrado", "Omitido"]}
              />
            </div>
            <div className="mt-2">
              <label>
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Observaciones</span>
                <textarea
                  value={medicationForm.notes}
                  onChange={(event) =>
                    setMedicationForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Notas de administracion o seguimiento..."
                  className="min-h-[88px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-300 focus:bg-white"
                />
              </label>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={registerMedicationRecord}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Guardar medicamento
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {effectiveMedicationRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                No hay medicamentos registrados en esta ficha.
              </p>
            ) : (
              effectiveMedicationRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {record.name} · {record.dose}
                    </p>
                    <span
                      className={[
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        record.administrationStatus === "Pendiente"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : record.administrationStatus === "Administrado"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700",
                      ].join(" ")}
                    >
                      {record.administrationStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {record.frequency} · Via {record.route} · Horario {record.schedule}
                  </p>
                  <p className="text-[11px] text-slate-500">Indicacion: {record.indication}</p>
                  <p className="text-[11px] text-slate-500">
                    Prescribe: {record.prescriber} · Adherencia: {record.adherence}
                  </p>
                  <p className="text-[11px] text-slate-500">Observaciones: {record.notes}</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <InputSelect
                      label="Estado"
                      value={record.administrationStatus}
                      onChange={(value) =>
                        updateMedicationRecord(record.id, {
                          administrationStatus: value as MedicationRecord["administrationStatus"],
                        })
                      }
                      options={["Pendiente", "Administrado", "Omitido"]}
                    />
                    <InputSelect
                      label="Adherencia"
                      value={record.adherence}
                      onChange={(value) => updateMedicationRecord(record.id, { adherence: value })}
                      options={["Alta", "Buena", "En seguimiento", "Baja"]}
                    />
                    <InputText
                      label="Horario"
                      value={record.schedule}
                      onChange={(value) => updateMedicationRecord(record.id, { schedule: value })}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMedicationAdministrationStatus(record, "Pendiente")}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Marcar pendiente
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedicationAdministrationStatus(record, "Administrado")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Marcar administrado
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedicationAdministrationStatus(record, "Omitido")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Marcar omitido
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      )}

      {activeTab === "nursing_notes" && (
        <Panel title="Notas de enfermeria" subtitle="Vista narrativa tipo reporte con bloque de texto clinico">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Fechas de registro
              </p>
              <div className="space-y-1">
                {effectiveNursingNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedNursingNoteId(note.id)}
                    className={[
                      "w-full rounded-lg border px-2 py-1.5 text-left text-[11px]",
                      selectedNursingNote?.id === note.id
                        ? "border-sky-300 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <p className="font-semibold">{note.datetime}</p>
                    <p className="text-[10px]">{note.professional}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <SummaryRow label="Fecha" value={selectedNursingNote?.datetime ?? "-"} />
                <SummaryRow label="Profesional" value={selectedNursingNote?.professional ?? "-"} />
                <SummaryRow label="Area" value={selectedNursingNote?.specialty ?? "Enfermeria"} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">Nota de enfermeria</p>
                <textarea
                  value={selectedNursingNote?.note ?? "Sin notas de enfermeria registradas."}
                  readOnly
                  className="min-h-[180px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Agregar nota de enfermeria
                </p>
                <textarea
                  value={nursingNoteDraft}
                  onChange={(event) => setNursingNoteDraft(event.target.value)}
                  placeholder="Escribe la evolucion de enfermeria, procedimientos y respuesta del paciente..."
                  className="min-h-[110px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={registerNursingNote}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Guardar nota
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "medical_notes" && (
        <Panel title="Notas medicas" subtitle="Vista narrativa tipo reporte con bloque de texto clinico">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Fechas de registro
              </p>
              <div className="space-y-1">
                {effectiveMedicalNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedMedicalNoteId(note.id)}
                    className={[
                      "w-full rounded-lg border px-2 py-1.5 text-left text-[11px]",
                      selectedMedicalNote?.id === note.id
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <p className="font-semibold">{note.datetime}</p>
                    <p className="text-[10px]">{note.professional}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <SummaryRow label="Fecha" value={selectedMedicalNote?.datetime ?? "-"} />
                <SummaryRow label="Profesional" value={selectedMedicalNote?.professional ?? "-"} />
                <SummaryRow label="Area" value={selectedMedicalNote?.specialty ?? "Medicina"} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">Nota medica</p>
                <textarea
                  value={selectedMedicalNote?.note ?? "Sin notas medicas registradas."}
                  readOnly
                  className="min-h-[180px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Agregar nota medica
                </p>
                <textarea
                  value={medicalNoteDraft}
                  onChange={(event) => setMedicalNoteDraft(event.target.value)}
                  placeholder="Escribe valoracion medica, conducta y plan terapeutico..."
                  className="min-h-[110px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={registerMedicalNote}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Guardar nota
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "nursing_report" && (
        <Panel
          title="Reporte de enfermeria"
          subtitle="Ingreso rapido por turno con registro horario y resumen clinico"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Reportes por turno
              </p>
              {effectiveNursingShiftReports.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-500">
                  Aun no hay reportes. Registra el primero en el panel derecho.
                </p>
              ) : (
                <div className="space-y-1">
                  {effectiveNursingShiftReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedNursingShiftReportId(report.id)}
                      className={[
                        "w-full rounded-lg border px-2 py-1.5 text-left text-[11px]",
                        selectedNursingShiftReport?.id === report.id
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <p className="font-semibold">{report.date}</p>
                      <p className="text-[10px]">
                        Turno {report.shift} · {report.service}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <SummaryRow label="Fecha" value={selectedNursingShiftReport?.date ?? "-"} />
                <SummaryRow label="Turno" value={selectedNursingShiftReport?.shift ?? "-"} />
                <SummaryRow label="Servicio" value={selectedNursingShiftReport?.service ?? "-"} />
                <SummaryRow label="Paciente" value={patient.fullName} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Cuerpo narrativo del reporte
                </p>
                <textarea
                  value={formatNursingShiftNarrative(selectedNursingShiftReport)}
                  readOnly
                  className="min-h-[180px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Registro horario del reporte seleccionado
                </p>
                {selectedNursingShiftReport?.hourlyEntries?.length ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
                    <table className="min-w-[620px] w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="border border-slate-200 px-2 py-1 text-left">Hora</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Foco</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Registro</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Respuesta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedNursingShiftReport.hourlyEntries.map((entry) => (
                          <tr key={`${selectedNursingShiftReport.id}-${entry.id}`}>
                            <td className="border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700">
                              {entry.hour}
                            </td>
                            <td className="border border-slate-200 bg-white px-2 py-1 text-slate-600">
                              {entry.focus}
                            </td>
                            <td className="border border-slate-200 bg-white px-2 py-1 text-slate-700">
                              {entry.action}
                            </td>
                            <td className="border border-slate-200 bg-white px-2 py-1 text-slate-600">
                              {entry.response}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                    Este reporte no tiene detalle horario.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Registrar reporte de turno
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <InputSelect
                    label="Turno"
                    value={nursingReportForm.shift}
                    onChange={(value) => {
                      const nextHours = getNursingShiftHours(value);
                      setNursingReportForm((prev) => ({ ...prev, shift: value }));
                      setNursingHourForm((prev) => ({
                        ...prev,
                        hour: nextHours.includes(prev.hour) ? prev.hour : nextHours[0] ?? prev.hour,
                      }));
                      setNursingHourEntries((prev) => sortNursingHourEntriesByShift(prev, value));
                    }}
                    options={["Manana", "Tarde", "Noche"]}
                  />
                  <InputText
                    label="Servicio"
                    value={nursingReportForm.service}
                    onChange={(value) =>
                      setNursingReportForm((prev) => ({ ...prev, service: value }))
                    }
                    placeholder="Observacion / Emergencia"
                  />
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] font-semibold text-slate-700">Carga rapida por hora</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {nursingShiftHourOptions.map((hour) => (
                      <button
                        key={`hour-pill-${hour}`}
                        type="button"
                        onClick={() => setNursingHourForm((prev) => ({ ...prev, hour }))}
                        className={[
                          "rounded-lg border px-2 py-0.5 text-[11px] transition",
                          nursingHourForm.hour === hour
                            ? "border-sky-300 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <InputSelect
                      label="Hora"
                      value={nursingHourForm.hour}
                      onChange={(value) => setNursingHourForm((prev) => ({ ...prev, hour: value }))}
                      options={nursingShiftHourOptions}
                    />
                    <InputSelect
                      label="Foco"
                      value={nursingHourForm.focus}
                      onChange={(value) => setNursingHourForm((prev) => ({ ...prev, focus: value }))}
                      options={[
                        "Monitoreo",
                        "Medicacion",
                        "Procedimiento",
                        "Incidencia",
                        "Respuesta paciente",
                      ]}
                    />
                    <InputText
                      label="Registro"
                      value={nursingHourForm.action}
                      onChange={(value) => setNursingHourForm((prev) => ({ ...prev, action: value }))}
                      placeholder="Que se realizo o evaluo"
                    />
                    <InputText
                      label="Respuesta"
                      value={nursingHourForm.response}
                      onChange={(value) =>
                        setNursingHourForm((prev) => ({ ...prev, response: value }))
                      }
                      placeholder="Respuesta del paciente"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500">
                      Registros por hora en borrador: {nursingHourEntries.length}
                    </p>
                    <button
                      type="button"
                      onClick={addNursingHourEntry}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Agregar hora
                    </button>
                  </div>
                  {nursingHourEntries.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {nursingHourEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
                        >
                          <p className="text-[11px] text-slate-700">
                            <span className="font-semibold">{entry.hour}</span> · {entry.focus}: {entry.action}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">{entry.response}</span>
                            <button
                              type="button"
                              onClick={() => removeNursingHourEntry(entry.id)}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <InputText
                    label="Estado general"
                    value={nursingReportForm.generalStatus}
                    onChange={(value) =>
                      setNursingReportForm((prev) => ({ ...prev, generalStatus: value }))
                    }
                    placeholder="Paciente estable, en observacion..."
                  />
                  <InputText
                    label="Procedimientos generales"
                    value={nursingReportForm.proceduresDone}
                    onChange={(value) =>
                      setNursingReportForm((prev) => ({ ...prev, proceduresDone: value }))
                    }
                    placeholder="Curaciones, controles o apoyos del turno"
                  />
                  <InputText
                    label="Incidencias"
                    value={nursingReportForm.incidents}
                    onChange={(value) =>
                      setNursingReportForm((prev) => ({ ...prev, incidents: value }))
                    }
                    placeholder="Sin incidencias / eventos..."
                  />
                  <InputText
                    label="Plan de cuidados"
                    value={nursingReportForm.carePlan}
                    onChange={(value) =>
                      setNursingReportForm((prev) => ({ ...prev, carePlan: value }))
                    }
                    placeholder="Continuar vigilancia y plan..."
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={registerNursingShiftReport}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Guardar reporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "fluid_balance" && (
        <Panel
          title="Balance hidrico"
          subtitle="Formato de hoja de balance con control por horas, 12 horas y 24 horas"
        >
          {effectiveFluidBalances.length === 0 ? (
            <p className="text-xs text-slate-500">No hay registros de balance hidrico.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <div className="min-w-[1180px] text-[11px] text-slate-700">
                <div className="grid grid-cols-4 border-b border-slate-300 bg-slate-50">
                  <HeaderField label="Paciente" value={patient.fullName} />
                  <HeaderField label="HC" value={patient.medicalRecordNumber} />
                  <HeaderField label="Fecha" value={fluidBalanceSheet.date} />
                  <HeaderField label="Area" value={patient.serviceArea ?? patient.careMode} />
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      <th className="border border-slate-300 px-2 py-1 text-left">Concepto</th>
                      {criticalHourSlots.map((hour) => (
                        <th key={`hour-fluid-${hour}`} className="border border-slate-300 px-1 py-1 text-center">
                          {hour}
                        </th>
                      ))}
                      <th className="border border-slate-300 px-2 py-1 text-center">Total 12h</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-2 py-1 font-semibold">
                        Ingresos (ml)
                      </td>
                      {fluidBalanceSheet.intakeByHour.map((value, index) => (
                        <td
                          key={`in-${criticalHourSlots[index]}`}
                          className="border border-slate-300 px-1 py-1 text-center"
                        >
                          {value}
                        </td>
                      ))}
                      <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                        M: {fluidBalanceSheet.morningIntake} / N: {fluidBalanceSheet.nightIntake}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-2 py-1 font-semibold">
                        Egresos (ml)
                      </td>
                      {fluidBalanceSheet.outputByHour.map((value, index) => (
                        <td
                          key={`out-${criticalHourSlots[index]}`}
                          className="border border-slate-300 px-1 py-1 text-center"
                        >
                          {value}
                        </td>
                      ))}
                      <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                        M: {fluidBalanceSheet.morningOutput} / N: {fluidBalanceSheet.nightOutput}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-2 py-1 font-semibold">
                        Diuresis (ml)
                      </td>
                      {fluidBalanceSheet.diuresisByHour.map((value, index) => (
                        <td
                          key={`diu-${criticalHourSlots[index]}`}
                          className="border border-slate-300 px-1 py-1 text-center"
                        >
                          {value}
                        </td>
                      ))}
                      <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                        M: {fluidBalanceSheet.morningDiuresis} / N: {fluidBalanceSheet.nightDiuresis}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-1 gap-2 border-t border-slate-300 p-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Egresos detallados 12 horas
                    </p>
                    <p className="mt-1 text-[11px]">
                      Perdidas insensibles: M {fluidBalanceSheet.morningInsensible} / N {fluidBalanceSheet.nightInsensible}
                    </p>
                    <p className="text-[11px]">
                      Vomitos-SNG: M {fluidBalanceSheet.morningVomiting} / N {fluidBalanceSheet.nightVomiting}
                    </p>
                    <p className="text-[11px]">
                      Drenajes: M {fluidBalanceSheet.morningDrains} / N {fluidBalanceSheet.nightDrains}
                    </p>
                    <p className="text-[11px]">
                      Catarsis: M {fluidBalanceSheet.morningCatarsis} / N {fluidBalanceSheet.nightCatarsis}
                    </p>
                    <p className="text-[11px]">
                      Otros egresos: M {fluidBalanceSheet.morningOtherOutput} / N {fluidBalanceSheet.nightOtherOutput}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Cierre de balance
                    </p>
                    <p className="mt-1 text-[11px]">Balance 12h manana: {fluidBalanceSheet.morningBalance} ml</p>
                    <p className="text-[11px]">Balance 12h noche: {fluidBalanceSheet.nightBalance} ml</p>
                    <p className="text-[11px]">Ingreso 24h: {fluidBalanceSheet.intake24} ml</p>
                    <p className="text-[11px]">Egreso 24h: {fluidBalanceSheet.output24} ml</p>
                    <p className="text-[11px]">Diuresis 24h: {fluidBalanceSheet.diuresis24} ml</p>
                    <p className="text-[11px] font-semibold">
                      Balance 24h: {fluidBalanceSheet.balance24} ml
                    </p>
                    <p className="text-[11px]">Diuresis horaria: {fluidBalanceSheet.hourlyDiuresis} ml/h</p>
                  </div>
                </div>

                <div className="border-t border-slate-300 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Registrar balance hidrico por turno
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1.15fr_0.9fr]">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Ingresos (ml)
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <InputText
                          type="number"
                          label="Oral"
                          value={fluidForm.oral}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, oral: value }))}
                          placeholder="450"
                        />
                        <InputText
                          type="number"
                          label="Intravenoso"
                          value={fluidForm.intravenous}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, intravenous: value }))
                          }
                          placeholder="700"
                        />
                        <InputText
                          type="number"
                          label="Medicacion diluida"
                          value={fluidForm.dilutedMedication}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, dilutedMedication: value }))
                          }
                          placeholder="120"
                        />
                        <InputText
                          type="number"
                          label="Enteral/Parenteral"
                          value={fluidForm.enteralParenteral}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, enteralParenteral: value }))
                          }
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Otros ingresos"
                          value={fluidForm.intakeOther}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, intakeOther: value }))
                          }
                          placeholder="0"
                        />
                        <div className="flex items-end">
                          <div className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Total ingresos
                            </p>
                            <p className="text-xs font-semibold text-slate-800">
                              {fluidDraftSummary.intakeTotal} ml
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Egresos (ml)
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <InputText
                          type="number"
                          label="Diuresis"
                          value={fluidForm.diuresis}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, diuresis: value }))}
                          placeholder="620"
                        />
                        <InputText
                          type="number"
                          label="Vomitos / SNG"
                          value={fluidForm.vomiting}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, vomiting: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Dren 1"
                          value={fluidForm.drain1}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, drain1: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Dren 2"
                          value={fluidForm.drain2}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, drain2: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Dren 3"
                          value={fluidForm.drain3}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, drain3: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Dren 4"
                          value={fluidForm.drain4}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, drain4: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Dren 5"
                          value={fluidForm.drain5}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, drain5: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Catarsis"
                          value={fluidForm.catarsis}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, catarsis: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Aspiracion"
                          value={fluidForm.aspiration}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, aspiration: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Otros egresos"
                          value={fluidForm.outputOther}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, outputOther: value }))
                          }
                          placeholder="0"
                        />
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 sm:col-span-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Perdidas insensibles (auto)
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-800">
                            {insensibleLossModel.totalMl} ml
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Peso {insensibleLossModel.weightKg} kg · T° {insensibleLossModel.temperature.toFixed(1)} ·
                            {` ${insensibleLossModel.shiftHours}h`}
                          </p>
                        </div>
                        <div className="flex items-end">
                          <div className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Total egresos
                            </p>
                            <p className="text-xs font-semibold text-slate-800">
                              {fluidDraftSummary.outputTotal} ml
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <InputSelect
                        label="Turno"
                        value={fluidForm.shift}
                        onChange={(value) => setFluidForm((prev) => ({ ...prev, shift: value }))}
                        options={["Manana", "Tarde", "Noche"]}
                      />

                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Balance del turno
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          Ingreso: <span className="font-semibold">{fluidDraftSummary.intakeTotal} ml</span>
                        </p>
                        <p className="text-xs text-slate-700">
                          Egreso: <span className="font-semibold">{fluidDraftSummary.outputTotal} ml</span>
                        </p>
                        <p
                          className={[
                            "text-xs font-semibold",
                            fluidDraftSummary.balance < 0 ? "text-rose-700" : "text-emerald-700",
                          ].join(" ")}
                        >
                          Balance: {fluidDraftSummary.balance} ml
                        </p>
                      </div>

                      <div className="mt-2">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Observaciones
                        </label>
                        <textarea
                          value={fluidForm.observations}
                          onChange={(event) =>
                            setFluidForm((prev) => ({ ...prev, observations: event.target.value }))
                          }
                          placeholder="Paciente tolera via oral, sin complicaciones..."
                          className="min-h-[88px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={registerFluidBalance}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Guardar balance hidrico
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>
      )}

      {activeTab === "kardex" && (
        <Panel
          title="Kardex de enfermeria"
          subtitle="Administracion de medicamentos (estructura segun formato institucional)"
        >
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="min-w-[1040px] text-[11px] text-slate-700">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold uppercase tracking-wide text-slate-700">
                  Administracion de medicamentos · SNS-MSP/HCU-form.022/2021
                </p>
              </div>

              <section className="border-b border-slate-200 px-3 py-3">
                <p className="font-semibold uppercase tracking-wide text-slate-700">
                  A. Datos del establecimiento y usuario / paciente
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <KardexDataCell
                    label="Primer apellido"
                    value={getPrimarySurname(patient.lastName)}
                  />
                  <KardexDataCell
                    label="Primer nombre"
                    value={getPrimaryName(patient.firstName)}
                  />
                  <KardexDataCell label="Edad" value={`${patient.age}`} />
                  <KardexDataCell
                    label="Numero de historia clinica unica"
                    value={patient.medicalRecordNumber}
                  />
                  <KardexDataCell label="Numero de archivo" value={patient.code} />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <KardexDataCell
                    label="Alergia a medicamentos"
                    value={medicationAllergies.length > 0 ? "SI" : "NO"}
                  />
                  <KardexDataCell
                    className="md:col-span-4"
                    label="Describa"
                    value={
                      medicationAllergies.length > 0
                        ? medicationAllergies.join(", ")
                        : "No registra alergia medicamentosa."
                    }
                  />
                </div>
              </section>

              <section className="px-3 py-3">
                <p className="font-semibold uppercase tracking-wide text-slate-700">
                  B. Administracion de medicamentos prescritos
                </p>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        <th
                          className="border border-slate-300 px-2 py-1 text-left"
                          rowSpan={2}
                        >
                          1. Medicamento
                        </th>
                        <th
                          className="border border-slate-300 px-2 py-1 text-left"
                          rowSpan={2}
                        >
                          Fecha
                        </th>
                        <th
                          className="border border-slate-300 px-2 py-1 text-left"
                          rowSpan={2}
                        >
                          Dosis, via, frecuencia
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-center" colSpan={8}>
                          2. Administracion
                        </th>
                      </tr>
                      <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        <th className="border border-slate-300 px-1 py-1 text-center">Hora</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">
                          Responsable
                        </th>
                        <th className="border border-slate-300 px-1 py-1 text-center">Hora</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">
                          Responsable
                        </th>
                        <th className="border border-slate-300 px-1 py-1 text-center">Hora</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">
                          Responsable
                        </th>
                        <th className="border border-slate-300 px-1 py-1 text-center">Hora</th>
                        <th className="border border-slate-300 px-1 py-1 text-center">
                          Responsable
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {kardexAdministrations.length === 0 ? (
                        <tr>
                          <td
                            className="border border-slate-300 px-2 py-2 text-center text-[11px] text-slate-500"
                            colSpan={11}
                          >
                            No hay administraciones registradas para este paciente.
                          </td>
                        </tr>
                      ) : (
                        kardexAdministrations.map((entry) => {
                          const slots = buildAdministrationSlots(entry);
                          const { date } = splitDateTime(entry.startedAt);

                          return (
                            <tr key={entry.id} className="align-top text-[11px]">
                              <td className="border border-slate-300 px-2 py-2">
                                <p className="font-semibold text-slate-900">{entry.itemName}</p>
                                <p className="text-[10px] text-slate-500">{entry.type}</p>
                                {entry.notes ? (
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    Obs: {entry.notes}
                                  </p>
                                ) : null}
                              </td>
                              <td className="border border-slate-300 px-2 py-2 whitespace-nowrap">
                                {date}
                              </td>
                              <td className="border border-slate-300 px-2 py-2">
                                {buildDoseRouteFrequency(entry)}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center whitespace-nowrap">
                                {slots[0].hour}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center">
                                {slots[0].responsible}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center whitespace-nowrap">
                                {slots[1].hour}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center">
                                {slots[1].responsible}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center whitespace-nowrap">
                                {slots[2].hour}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center">
                                {slots[2].responsible}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center whitespace-nowrap">
                                {slots[3].hour}
                              </td>
                              <td className="border border-slate-300 px-1 py-2 text-center">
                                {slots[3].responsible}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "exams" && (
        <Panel title="Examenes" subtitle="Laboratorio, imagenologia y estudios complementarios">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Agregar examen" />
            <ActionChip label="Filtrar por categoria" />
          </div>
          <div className="space-y-2">
            {patient.exams.length === 0 && (
              <p className="text-xs text-slate-500">No hay examenes registrados.</p>
            )}
            {patient.exams.map((exam) => (
              <article key={exam.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{exam.name}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {exam.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{exam.category}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Solicita: {exam.requestedBy} · Solicitado: {exam.requestedAt}
                </p>
                <p className="text-[11px] text-slate-500">
                  Resultado: {exam.resultAt ?? "Pendiente"} · {exam.summary}
                </p>
                <p className="text-[11px] text-slate-500">Obs: {exam.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "diagnoses" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickStatCard label="Total diagnosticos" value={patient.diagnoses.length} hint="Registrados en ficha" />
            <QuickStatCard label="Activos" value={activeDiagnosisCount} hint="Estado actual" />
            <QuickStatCard label="Principales" value={diagnosisByType.Principal.length} hint="Eje de tratamiento" />
            <QuickStatCard label="Secundarios/presuntivos" value={diagnosisByType.Secundario.length + diagnosisByType.Presuntivo.length} hint="Contexto clinico" />
          </div>

          <Panel title="Diagnosticos" subtitle="Ordenados por tipo, estado y fecha para lectura rapida">
            <div className="space-y-4">
              {(["Principal", "Secundario", "Presuntivo"] as const).map((type) => {
                const items = diagnosisByType[type];

                return (
                  <section key={type}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{type}</p>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                        {items.length}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        Sin diagnosticos {type.toLowerCase()}.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">{item.diagnosis}</p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <DiagnosisTypeTag type={item.type} />
                                <DiagnosisStatusTag status={item.status} />
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Registro: {item.registeredAt}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600">{item.observations}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "procedures" && (
        <Panel title="Procedimientos e invasivos" subtitle="Control de dispositivos y procedimientos activos">
          <div className="space-y-2">
            {patient.procedures.length === 0 && (
              <p className="text-xs text-slate-500">Sin procedimientos registrados para este paciente.</p>
            )}
            {patient.procedures.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                <p className="text-[11px] text-slate-500">
                  Colocacion: {item.placedAt} · Dias: {item.daysInstalled} · Estado: {item.status}
                </p>
                <p className="text-[11px] text-slate-500">Responsable: {item.responsibleProfessional}</p>
                <p className="text-[11px] text-slate-500">{item.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "nutrition" && (
        <Panel
          title="Plan nutricional"
          subtitle="Registro de dieta terapeutica, tipo de dieta, consumo indicado y seguimiento profesional"
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Plan vigente
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
                <SummaryRow label="Dieta" value={nutritionPlans[0]?.dietName ?? "-"} />
                <SummaryRow label="Tipo de dieta" value={nutritionPlans[0]?.dietType ?? "-"} />
                <SummaryRow
                  label="Ingesta recomendada"
                  value={nutritionPlans[0]?.recommendedIntake ?? "-"}
                />
                <SummaryRow
                  label="Profesional responsable"
                  value={nutritionPlans[0]?.professional ?? "-"}
                />
                <SummaryRow
                  label="Horario alimentario"
                  value={nutritionPlans[0]?.mealSchedule ?? "-"}
                />
                <SummaryRow label="Fecha de plan" value={nutritionPlans[0]?.date ?? "-"} />
              </div>
              <p className="mt-2 text-[11px] text-emerald-800">
                <span className="font-semibold">Debe consumir:</span>{" "}
                {nutritionPlans[0]?.allowedFoods ?? "-"}
              </p>
              <p className="text-[11px] text-emerald-800">
                <span className="font-semibold">Evitar:</span>{" "}
                {nutritionPlans[0]?.restrictedFoods ?? "-"}
              </p>
              <p className="text-[11px] text-emerald-800">
                <span className="font-semibold">Objetivo:</span>{" "}
                {nutritionPlans[0]?.objectives ?? "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Registrar nuevo plan nutricional
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                <InputText
                  label="Dieta"
                  value={nutritionForm.dietName}
                  onChange={(value) => setNutritionForm((prev) => ({ ...prev, dietName: value }))}
                  placeholder="Ej. Dieta diabetica hipocalorica"
                />
                <InputText
                  label="Tipo de dieta"
                  value={nutritionForm.dietType}
                  onChange={(value) => setNutritionForm((prev) => ({ ...prev, dietType: value }))}
                  placeholder="Blanda / liquida / hipoproteica..."
                />
                <InputText
                  label="Ingesta recomendada"
                  value={nutritionForm.recommendedIntake}
                  onChange={(value) =>
                    setNutritionForm((prev) => ({ ...prev, recommendedIntake: value }))
                  }
                  placeholder="1800 kcal/dia fraccionadas"
                />
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Debe consumir
                  </label>
                  <textarea
                    value={nutritionForm.allowedFoods}
                    onChange={(event) =>
                      setNutritionForm((prev) => ({ ...prev, allowedFoods: event.target.value }))
                    }
                    className="min-h-[80px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Evitar consumo
                  </label>
                  <textarea
                    value={nutritionForm.restrictedFoods}
                    onChange={(event) =>
                      setNutritionForm((prev) => ({
                        ...prev,
                        restrictedFoods: event.target.value,
                      }))
                    }
                    className="min-h-[80px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                <InputText
                  label="Hidratacion"
                  value={nutritionForm.hydrationPlan}
                  onChange={(value) =>
                    setNutritionForm((prev) => ({ ...prev, hydrationPlan: value }))
                  }
                  placeholder="2 litros/dia salvo indicacion"
                />
                <InputText
                  label="Suplementos"
                  value={nutritionForm.supplements}
                  onChange={(value) =>
                    setNutritionForm((prev) => ({ ...prev, supplements: value }))
                  }
                  placeholder="Modulos proteicos / fibra..."
                />
                <InputText
                  label="Horario"
                  value={nutritionForm.mealSchedule}
                  onChange={(value) =>
                    setNutritionForm((prev) => ({ ...prev, mealSchedule: value }))
                  }
                  placeholder="6 tiempos de comida"
                />
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <InputText
                  label="Objetivos del plan"
                  value={nutritionForm.objectives}
                  onChange={(value) =>
                    setNutritionForm((prev) => ({ ...prev, objectives: value }))
                  }
                  placeholder="Control glucemico y mejora de tolerancia"
                />
                <InputText
                  label="Observaciones"
                  value={nutritionForm.observations}
                  onChange={(value) =>
                    setNutritionForm((prev) => ({ ...prev, observations: value }))
                  }
                  placeholder="Seguimiento semanal por nutricion"
                />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={registerNutritionPlan}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Guardar plan nutricional
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {nutritionPlans.map((plan) => (
                <article key={plan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {plan.date} · {plan.dietName}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Tipo: {plan.dietType} · Profesional: {plan.professional}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Debe consumir: {plan.allowedFoods}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Evitar: {plan.restrictedFoods}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Objetivo: {plan.objectives}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "vaccination" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Vacunas aplicadas" subtitle="Registro de dosis administradas">
            <div className="space-y-2 text-xs text-slate-700">
              {patient.vaccination.applied.length === 0 && (
                <p className="text-slate-500">No registra vacunas aplicadas en este periodo.</p>
              )}
              {patient.vaccination.applied.map((item) => (
                <article key={`${item.vaccine}-${item.date}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{item.vaccine}</p>
                  <p className="text-[11px] text-slate-500">Fecha: {item.date}</p>
                  <p className="text-[11px] text-slate-500">Lote: {item.lot ?? "No aplica"}</p>
                  <p className="text-[11px] text-slate-500">{item.observations}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Vacunas pendientes" subtitle="Proximas fechas y disponibilidad">
            <div className="space-y-2 text-xs text-slate-700">
              {patient.vaccination.pending.length === 0 && (
                <p className="text-slate-500">No hay vacunas pendientes.</p>
              )}
              {patient.vaccination.pending.map((item) => (
                <article key={`${item.vaccine}-${item.suggestedDate}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="font-semibold text-amber-800">{item.vaccine}</p>
                  <p className="text-[11px] text-amber-700">Sugerida: {item.suggestedDate}</p>
                  <p className="text-[11px] text-amber-700">Centro: {item.availability}</p>
                  <p className="text-[11px] text-amber-700">{item.observations}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "emotional" && (
        <Panel title="Salud emocional" subtitle="Estado actual, seguimiento de animo y recomendaciones">
          <SummaryRow label="Estado emocional actual" value={patient.emotionalHealth.currentState} />
          <ListBlock title="Alertas emocionales" items={patient.emotionalHealth.emotionalAlerts} />
          <ListBlock title="Recomendaciones" items={patient.emotionalHealth.recommendations} />
          <div className="mt-3 space-y-2">
            {patient.emotionalHealth.moodFollowUp.map((entry) => (
              <article key={`${entry.date}-${entry.mood}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{entry.date} · {entry.mood}</p>
                <p className="text-[11px] text-slate-500">Factor: {entry.stressFactor}</p>
                <p className="text-[11px] text-slate-500">{entry.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "care_plan" && (
        <Panel
          title="Plan de cuidados"
          subtitle="Ingreso estructurado por hora, objetivos e intervenciones de enfermeria"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Planes registrados
              </p>
              {effectiveCarePlans.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-500">
                  No hay plan de cuidados estructurado.
                </p>
              ) : (
                <div className="space-y-1">
                  {effectiveCarePlans.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedCarePlanId(entry.id)}
                      className={[
                        "w-full rounded-lg border px-2 py-1.5 text-left text-[11px]",
                        selectedCarePlan?.id === entry.id
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <p className="font-semibold">{entry.nursingDiagnosis}</p>
                      <p className="text-[10px]">{entry.objective}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <SummaryRow label="Diagnostico" value={selectedCarePlan?.nursingDiagnosis ?? "-"} />
                <SummaryRow label="Objetivo" value={selectedCarePlan?.objective ?? "-"} />
                <SummaryRow label="Evaluacion" value={selectedCarePlan?.evaluation ?? "-"} />
                <SummaryRow
                  label="Intervenciones"
                  value={`${selectedCarePlan?.interventions.length ?? 0}`}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Detalle del plan seleccionado
                </p>
                {selectedCarePlan ? (
                  <div className="space-y-2">
                    <ListBlock title="Intervenciones" items={selectedCarePlan.interventions} />
                    {selectedCarePlan.hourlyEntries?.length ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
                        <table className="min-w-[620px] w-full border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600">
                              <th className="border border-slate-200 px-2 py-1 text-left">Hora</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Foco</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">
                                Intervencion
                              </th>
                              <th className="border border-slate-200 px-2 py-1 text-left">
                                Respuesta
                              </th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCarePlan.hourlyEntries.map((entry) => (
                              <tr key={`${selectedCarePlan.id}-${entry.id}`}>
                                <td className="border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700">
                                  {entry.hour}
                                </td>
                                <td className="border border-slate-200 bg-white px-2 py-1 text-slate-600">
                                  {entry.focus}
                                </td>
                                <td className="border border-slate-200 bg-white px-2 py-1 text-slate-700">
                                  {entry.intervention}
                                </td>
                                <td className="border border-slate-200 bg-white px-2 py-1 text-slate-600">
                                  {entry.response}
                                </td>
                                <td className="border border-slate-200 bg-white px-2 py-1 text-slate-600">
                                  {entry.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                        Este plan no tiene seguimiento horario.
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">Observaciones: {selectedCarePlan.observations}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Selecciona un plan para ver su detalle.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold text-slate-600">
                  Registrar plan de cuidados
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <InputText
                    label="Diagnostico de enfermeria"
                    value={carePlanForm.nursingDiagnosis}
                    onChange={(value) =>
                      setCarePlanForm((prev) => ({ ...prev, nursingDiagnosis: value }))
                    }
                    placeholder="Riesgo de perfusion ineficaz..."
                  />
                  <InputText
                    label="Objetivo"
                    value={carePlanForm.objective}
                    onChange={(value) => setCarePlanForm((prev) => ({ ...prev, objective: value }))}
                    placeholder="Mantener estabilidad hemodinamica..."
                  />
                  <InputText
                    label="Intervenciones base"
                    value={carePlanForm.baseInterventions}
                    onChange={(value) =>
                      setCarePlanForm((prev) => ({ ...prev, baseInterventions: value }))
                    }
                    placeholder="Separar por ; Ej: Control TA ; Control diuresis"
                  />
                  <InputText
                    label="Evaluacion"
                    value={carePlanForm.evaluation}
                    onChange={(value) => setCarePlanForm((prev) => ({ ...prev, evaluation: value }))}
                    placeholder="Evolucion parcial favorable..."
                  />
                </div>

                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Seguimiento horario del plan
                  </p>
                  <div className="mt-1 max-h-20 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">
                    <div className="flex flex-wrap gap-1">
                      {carePlanHourOptions.map((hour) => (
                        <button
                          key={`care-hour-pill-${hour}`}
                          type="button"
                          onClick={() => setCarePlanHourForm((prev) => ({ ...prev, hour }))}
                          className={[
                            "rounded-lg border px-2 py-0.5 text-[11px] transition",
                            carePlanHourForm.hour === hour
                              ? "border-sky-300 bg-sky-50 text-sky-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {hour}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                    <InputSelect
                      label="Hora"
                      value={carePlanHourForm.hour}
                      onChange={(value) => setCarePlanHourForm((prev) => ({ ...prev, hour: value }))}
                      options={carePlanHourOptions}
                    />
                    <InputSelect
                      label="Foco"
                      value={carePlanHourForm.focus}
                      onChange={(value) => setCarePlanHourForm((prev) => ({ ...prev, focus: value }))}
                      options={[
                        "Intervencion",
                        "Monitoreo",
                        "Educacion",
                        "Seguridad",
                        "Reevaluacion",
                      ]}
                    />
                    <InputText
                      label="Intervencion"
                      value={carePlanHourForm.intervention}
                      onChange={(value) =>
                        setCarePlanHourForm((prev) => ({ ...prev, intervention: value }))
                      }
                      placeholder="Accion de enfermeria"
                    />
                    <InputText
                      label="Respuesta"
                      value={carePlanHourForm.response}
                      onChange={(value) => setCarePlanHourForm((prev) => ({ ...prev, response: value }))}
                      placeholder="Respuesta del paciente"
                    />
                    <InputSelect
                      label="Estado"
                      value={carePlanHourForm.status}
                      onChange={(value) => setCarePlanHourForm((prev) => ({ ...prev, status: value }))}
                      options={["Pendiente", "En curso", "Cumplido", "Requiere ajuste"]}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500">
                      Registros horarios en borrador: {carePlanHourEntries.length}
                    </p>
                    <button
                      type="button"
                      onClick={addCarePlanHourEntry}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Agregar hora
                    </button>
                  </div>
                  {carePlanHourEntries.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {carePlanHourEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
                        >
                          <p className="text-[11px] text-slate-700">
                            <span className="font-semibold">{entry.hour}</span> · {entry.focus}:{" "}
                            {entry.intervention}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">
                              {entry.response} · {entry.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCarePlanHourEntry(entry.id)}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-2">
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Observaciones
                    </span>
                    <textarea
                      value={carePlanForm.observations}
                      onChange={(event) =>
                        setCarePlanForm((prev) => ({ ...prev, observations: event.target.value }))
                      }
                      placeholder="Observaciones del plan y respuesta general..."
                      className="min-h-[88px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-300 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={registerCarePlan}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Guardar plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "documents" && (
        <Panel title="Documentos y archivos" subtitle="Reportes PDF, examenes, consentimientos y adjuntos clinicos">
          <div className="space-y-2">
            {patient.documents.length === 0 && (
              <p className="text-xs text-slate-500">Sin documentos disponibles.</p>
            )}
            {patient.documents.map((document) => (
              <article key={document.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">{document.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {document.type} · {document.date} · {document.uploadedBy}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                  {document.status}
                </span>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "msp_forms" && (
        <Panel
          title="Formularios MSP del paciente"
          subtitle="Catalogo oficial vinculado al expediente estructurado del paciente"
        >
          {linkedRecordLoading ? (
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
              <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            </div>
          ) : linkedRecordError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {linkedRecordError}
            </div>
          ) : !linkedRegisteredRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Este paciente aun no tiene un expediente MSP estructurado vinculado.
                </p>
                <p className="mt-2 text-xs leading-6 text-amber-800">
                  Para generar formularios como el 008, 005, 007, 010A, 012A, 024 o 053, primero debe existir
                  un ingreso clinico estructurado asociado al documento o historia clinica del paciente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/portal/professional/patients/ingreso"
                  className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                >
                  Crear ingreso estructurado
                </Link>
                <Link
                  href="/portal/professional/reports"
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ir a reportes MSP
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {linkedRegisteredRecord.identification.firstNames}{" "}
                      {linkedRegisteredRecord.identification.lastNames}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      HC {linkedRegisteredRecord.medicalRecordNumber} ·{" "}
                      {linkedRegisteredRecord.identification.documentNumber}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                      {linkedRegisteredRecord.consultation.literalReason || "Sin motivo de consulta registrado"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      MSP {linkedRegisteredRecord.mspCompliance.score}%
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {linkedRegisteredRecord.mspCompliance.criticalPendingItems.length} pendientes
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/portal/professional/patients/ingreso/${linkedRegisteredRecord.id}`}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Abrir expediente estructurado
                  </Link>
                  <Link
                    href={`/portal/professional/reports?patientId=${linkedRegisteredRecord.id}`}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Ver catalogo MSP
                  </Link>
                  {emergencyForm ? (
                    <Link
                      href={`/portal/professional/reports/forms/008?patientId=${linkedRegisteredRecord.id}`}
                      className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                    >
                      Abrir formulario 008
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {availableMspForms.map((form) => (
                  <article key={form.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {form.id} · {form.title}
                      </p>
                      <AvailabilityPill availability={form.availability} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{form.code}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-600">{form.description}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{form.availabilityNote}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/portal/professional/reports/forms/${form.id}?patientId=${linkedRegisteredRecord.id}`}
                        className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                      >
                        Abrir formulario
                      </Link>
                      <Link
                        href={`/portal/professional/reports?patientId=${linkedRegisteredRecord.id}`}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ver en reportes
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {activeTab === "bundle_abcdef" && (
        <PatientBundleAbcdef
          patient={patient}
          currentProfessional={currentProfessional}
          onAudit={(title, details) => addAuditRecord("bundle_abcdef", title, details)}
        />
      )}

      {activeTab === "education" && (
        <Panel
          title="Educacion en salud"
          subtitle="Material entregado al paciente/familia y nivel de comprension"
        >
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Registro de educacion brindada</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              <SummaryRow label="Tema" value="Medicacion y autocuidado" />
              <SummaryRow label="Fecha" value="2026-03-08" />
              <SummaryRow label="Profesional" value={patient.assignedProfessional} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Comprension reportada: adecuada con apoyo familiar.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {educationResources.map((resource) => (
              <article key={resource.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                <p className="text-xs text-slate-600">{resource.condition}</p>
                <p className="text-[11px] text-slate-500">
                  Formato: {resource.format} · Actualizado: {resource.updatedAt}
                </p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "reports" && (
        <Panel title="Reportes clinicos del paciente" subtitle="Generacion y trazabilidad documental">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Generar resumen clinico" onClick={handleGenerateClinicalSummary} />
            <ActionChip label="Exportar PDF MSP 008" onClick={handleExportPdf} />
            <ActionChip label="Generar reporte de enfermeria" onClick={handleGenerateNursingReport} />
          </div>
          <div className="space-y-2">
            {patient.documents.map((document) => (
              <article
                key={`rep-${document.id}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
              >
                <p className="font-semibold text-slate-900">{document.title}</p>
                <p className="text-[11px] text-slate-500">
                  Tipo: {document.type} · Fecha: {document.date} · Estado: {document.status}
                </p>
              </article>
            ))}
            {patient.documents.length === 0 && (
              <p className="text-xs text-slate-500">Sin reportes generados para este paciente.</p>
            )}
          </div>
        </Panel>
      )}

      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickStatCard label="Eventos totales" value={timelineSorted.length} hint="Timeline completa del paciente" />
            <QuickStatCard
              label="Eventos visibles"
              value={timelineFiltered.length}
              hint="Resultado de filtros activos"
            />
            <QuickStatCard
              label="Categorias visibles"
              value={timelineFilteredCategoryCounts.length}
              hint="Tipos de evento filtrados"
            />
            <QuickStatCard
              label="Ultimo evento visible"
              value={timelineFiltered[0]?.datetime ?? "-"}
              hint="Registro mas reciente en pantalla"
            />
          </div>

          <Panel
            title="Timeline clinica unificada"
            subtitle="Un solo historial cronologico con filtros por categoria y busqueda por texto"
          >
            <div className="mb-3 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Buscar en historial
                <input
                  value={timelineSearch}
                  onChange={(event) => setTimelineSearch(event.target.value)}
                  placeholder="Ej. dolor toracico, medicacion, triaje"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setTimelineFilter("all");
                  setTimelineSearch("");
                }}
                className="h-fit self-end rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTimelineFilter("all")}
                className={[
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                  timelineFilter === "all"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                Todas ({timelineSorted.length})
              </button>
              {timelineCategoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setTimelineFilter(category)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                    timelineFilter === category
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {category}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
                    {timelineCategoryCountMap.get(category) ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {timelineGroups.length === 0 ? (
              <p className="text-xs text-slate-500">
                No hay eventos para los filtros actuales. Ajusta categoria o texto de busqueda.
              </p>
            ) : (
              <div className="space-y-4">
                {timelineGroups.map((group) => (
                  <section key={group.date}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {group.date}
                      </span>
                      <span className="text-[11px] text-slate-500">{group.events.length} eventos</span>
                    </div>

                    <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                      {group.events.map((event) => {
                        const { time } = splitDateTime(event.datetime);
                        return (
                          <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <TimelineCategoryTag category={event.category} />
                              <span className="text-[11px] text-slate-500">{time}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-700">{event.detail}</p>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      <Panel
        title={`Registro profesional · ${activeTabLabel}`}
        subtitle="Cada registro queda trazado con profesional, fecha y detalle en este modulo"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <InputText
              label="Profesional que registra"
              value={currentProfessional}
              onChange={setCurrentProfessional}
              placeholder="Ej. Dra. Camila Rojas"
            />
            <InputText
              label="Titulo del registro"
              value={moduleRecordForm.title}
              onChange={(value) => setModuleRecordForm((prev) => ({ ...prev, title: value }))}
              placeholder={`Actualizacion de ${activeTabLabel}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Detalle del registro
            </label>
            <textarea
              value={moduleRecordForm.details}
              onChange={(event) =>
                setModuleRecordForm((prev) => ({ ...prev, details: event.target.value }))
              }
              placeholder={`Detalle de la actualizacion en ${activeTabLabel.toLowerCase()}...`}
              className="min-h-[96px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Registros visibles del modulo actual: {tabAuditRecords.length}
            </p>
            <button
              type="button"
              onClick={registerModuleEntry}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Guardar registro
            </button>
          </div>
          {tabAuditRecords.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Aun no hay registros de este modulo.
            </p>
          ) : (
            <div className="space-y-2">
              {tabAuditRecords.map((record) => (
                <article key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{record.title}</p>
                    <span className="text-[11px] text-slate-500">{record.timestamp}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-700">{record.details}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Profesional: {record.professional}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <footer className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] text-slate-500">
          Ficha clinica digital preparada para integracion con backend y flujos multirol.
        </p>
        <Link
          href="/portal/professional/patients"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
        >
          Volver al listado
        </Link>
      </footer>

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Historico de {activeTabLabel}</p>
                <p className="text-[11px] text-slate-500">Paciente: {patient.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </header>

            <div className="border-b border-slate-200 px-4 py-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
                <InputText
                  label="Filtrar por fecha"
                  value={historyDateFilter}
                  onChange={setHistoryDateFilter}
                  type="date"
                />
                <p className="text-xs text-slate-500">
                  Registros encontrados: {filteredModuleHistoryEntries.length}
                </p>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
              {filteredModuleHistoryEntries.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                  No hay registros historicos para esta fecha o modulo.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredModuleHistoryEntries.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{entry.title}</p>
                        <span className="text-[11px] text-slate-500">{entry.date}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-700">{entry.detail}</p>
                      {entry.sections?.length ? (
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                          {entry.sections.map((section) => (
                            <section
                              key={`${entry.id}-${section.title}`}
                              className="rounded-lg border border-slate-200 bg-white p-2"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {section.title}
                              </p>
                              <dl className="mt-1 space-y-1">
                                {section.items.map((item) => {
                                  const isSummaryField = /(total|balance)/i.test(item.label);

                                  return (
                                    <div
                                      key={`${entry.id}-${section.title}-${item.label}`}
                                      className="flex items-start justify-between gap-2 text-[11px]"
                                    >
                                      <dt className="text-slate-500">{item.label}</dt>
                                      <dd
                                        className={`text-right ${
                                          isSummaryField
                                            ? "font-semibold text-slate-900"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        {item.value}
                                      </dd>
                                    </div>
                                  );
                                })}
                              </dl>
                            </section>
                          ))}
                        </div>
                      ) : null}
                      {entry.professional ? (
                        <p className="mt-1 text-[11px] text-slate-500">Profesional: {entry.professional}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
        </section>
      </div>
    </div>
  );
}

function InputText({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-300 focus:bg-white"
      />
    </label>
  );
}

function InputSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-300 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function createInitialNutritionPlan(patient: PatientRecord): NutritionPlanRecord {
  return {
    id: `nut-base-${patient.id}`,
    date: splitDateTime(patient.lastControlAt).date,
    dietName: patient.nutrition.diet,
    dietType: patient.nutrition.nutritionalStatus,
    allowedFoods: patient.nutrition.recommendations.join("; "),
    restrictedFoods: "Azucares refinados, bebidas azucaradas, ultraprocesados.",
    recommendedIntake: patient.nutrition.estimatedIntake,
    hydrationPlan: "Agua fraccionada durante el dia, objetivo 2 L/24h salvo contraindicacion.",
    supplements: "Suplemento segun tolerancia y evaluacion nutricional.",
    mealSchedule: "Desayuno, media manana, almuerzo, media tarde, cena y colacion nocturna.",
    objectives: patient.nutrition.evolution,
    observations: "Plan inicial importado desde ficha clinica.",
    professional: patient.assignedProfessional,
  };
}

function getCurrentDateTimeLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function getCurrentDateLabel() {
  return getCurrentDateTimeLabel().split(" ")[0] ?? "-";
}

function parseMlValue(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function computeVitalFlags({
  heartRate,
  respiratoryRate,
  pas,
  pad,
  temperature,
  spo2,
  glucose,
  painScale,
}: {
  heartRate: number;
  respiratoryRate: number;
  pas: number;
  pad: number;
  temperature: number;
  spo2: number;
  glucose: number;
  painScale: number;
}) {
  const flags: string[] = [];

  if (heartRate < 50 || heartRate > 110) {
    flags.push("FC alterada");
  }
  if (respiratoryRate < 10 || respiratoryRate > 24) {
    flags.push("FR alterada");
  }
  if (pas < 90 || pas > 160 || pad < 50 || pad > 100) {
    flags.push("TA fuera de rango");
  }
  if (temperature < 36 || temperature > 38) {
    flags.push("Temperatura alterada");
  }
  if (spo2 < 92) {
    flags.push("Desaturacion");
  }
  if (glucose < 70 || glucose > 180) {
    flags.push("Glucosa alterada");
  }
  if (painScale >= 7) {
    flags.push("Dolor intenso");
  }

  return flags;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function QuickStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </article>
  );
}

function InfoTag({
  label,
  tone,
}: {
  label: string;
  tone: "slate" | "amber" | "sky" | "rose";
}) {
  const className: Record<typeof tone, string> = {
    slate: "border-slate-200 bg-white text-slate-700",
    amber: "border-amber-200 bg-amber-100 text-amber-800",
    sky: "border-sky-200 bg-sky-100 text-sky-800",
    rose: "border-rose-200 bg-rose-100 text-rose-800",
  };

  return (
    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-medium", className[tone]].join(" ")}>
      {label}
    </span>
  );
}

function DiagnosisTypeTag({
  type,
}: {
  type: PatientRecord["diagnoses"][number]["type"];
}) {
  const className: Record<PatientRecord["diagnoses"][number]["type"], string> = {
    Principal: "border-red-200 bg-red-50 text-red-700",
    Secundario: "border-amber-200 bg-amber-50 text-amber-700",
    Presuntivo: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[type]].join(" ")}>
      {type}
    </span>
  );
}

function DiagnosisStatusTag({ status }: { status: string }) {
  const isActive = /activo/i.test(status);
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function TimelineCategoryTag({
  category,
}: {
  category: PatientRecord["timeline"][number]["category"];
}) {
  const className = getTimelineCategoryTone(category);

  return (
    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className].join(" ")}>
      {category}
    </span>
  );
}

function KardexDataCell({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 ${className ?? ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-[11px] text-slate-700">{value}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">Sin registros.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HeaderField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`border-b border-slate-300 px-2 py-1.5 ${className ?? ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-[11px] text-slate-700">{value}</p>
    </div>
  );
}

function ActionChip({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
        onClick
          ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
          : "cursor-default border-slate-200 bg-slate-100 text-slate-400",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function StickyTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "border-sky-300 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function getTriageWaitTargetMinutes(color: TriageColor) {
  const map: Record<TriageColor, number> = {
    rojo: 0,
    naranja: 10,
    amarillo: 60,
    verde: 120,
    azul: 240,
  };
  return map[color];
}

function getTriageColorCardTone(color: TriageColor) {
  const map: Record<TriageColor, string> = {
    rojo: "border-red-200 bg-red-50 text-red-700",
    naranja: "border-orange-200 bg-orange-50 text-orange-700",
    amarillo: "border-amber-200 bg-amber-50 text-amber-700",
    verde: "border-emerald-200 bg-emerald-50 text-emerald-700",
    azul: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return map[color];
}

function getTimelineCategoryTone(category: PatientRecord["timeline"][number]["category"]) {
  const map: Record<PatientRecord["timeline"][number]["category"], string> = {
    Ingreso: "border-sky-200 bg-sky-50 text-sky-700",
    Triaje: "border-orange-200 bg-orange-50 text-orange-700",
    Signos: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Medicacion: "border-violet-200 bg-violet-50 text-violet-700",
    "Nota enfermeria": "border-cyan-200 bg-cyan-50 text-cyan-700",
    "Nota medica": "border-indigo-200 bg-indigo-50 text-indigo-700",
    Procedimiento: "border-amber-200 bg-amber-50 text-amber-700",
    Examen: "border-teal-200 bg-teal-50 text-teal-700",
    Reporte: "border-slate-200 bg-slate-50 text-slate-700",
    Alerta: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return map[category];
}

function isNoKnownAllergy(value: string) {
  return /(ninguna|no conocida|no conocidas|sin alergia)/i.test(value);
}

function normalizeHourLabel(datetime: string) {
  const { time } = splitDateTime(datetime);
  const [hourRaw] = time.split(":");
  const hour = Number(hourRaw);

  if (!Number.isFinite(hour)) {
    return null;
  }
  if (hour === 0) {
    return "24:00";
  }
  if (hour >= 1 && hour <= 23) {
    return `${hour}:00`;
  }
  return null;
}

function getHourFromDateTime(datetime: string) {
  const { time } = splitDateTime(datetime);
  const [hourRaw] = time.split(":");
  const hour = Number(hourRaw);

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return null;
  }

  return hour;
}

function isHourInShift(hour: number, shift: string) {
  if (/manana|mañana/i.test(shift)) {
    return hour >= 7 && hour <= 14;
  }

  if (/tarde/i.test(shift)) {
    return hour >= 15 && hour <= 22;
  }

  return hour >= 23 || hour <= 6;
}

function getNursingShiftHours(shift: string) {
  if (/manana|mañana/i.test(shift)) {
    return ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
  }

  if (/tarde/i.test(shift)) {
    return ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
  }

  return ["23:00", "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"];
}

function sortNursingHourEntriesByShift(entries: NursingHourEntry[], shift: string) {
  const hourOrder = new Map(getNursingShiftHours(shift).map((hour, index) => [hour, index]));

  return [...entries].sort((a, b) => {
    const aIndex = hourOrder.get(a.hour) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = hourOrder.get(b.hour) ?? Number.MAX_SAFE_INTEGER;

    if (aIndex === bIndex) {
      return a.hour.localeCompare(b.hour);
    }
    return aIndex - bIndex;
  });
}

function getCarePlanHourOptions() {
  return Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
}

function sortCarePlanHourEntries(entries: CarePlanHourEntry[]) {
  return [...entries].sort((a, b) => a.hour.localeCompare(b.hour));
}

function groupVitalsByHour(vitals: VitalSignRecord[]) {
  return vitals.reduce<Record<string, VitalSignRecord>>((acc, vital) => {
    const hourLabel = normalizeHourLabel(vital.recordedAt);
    if (!hourLabel || !criticalHourSlots.includes(hourLabel)) {
      return acc;
    }

    if (!acc[hourLabel] || acc[hourLabel].recordedAt < vital.recordedAt) {
      acc[hourLabel] = vital;
    }
    return acc;
  }, {});
}

function parseBloodPressure(value?: string) {
  if (!value) {
    return { pas: "-", pad: "-", pam: "-" };
  }

  const match = value.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) {
    return { pas: "-", pad: "-", pam: "-" };
  }

  const pasValue = Number(match[1]);
  const padValue = Number(match[2]);
  const pamValue = Math.round((pasValue + 2 * padValue) / 3);

  return {
    pas: `${pasValue}`,
    pad: `${padValue}`,
    pam: `${pamValue}`,
  };
}

function getInsulinLabel(medicationRecords: MedicationRecord[], vital: VitalSignRecord | null) {
  if (!vital) {
    return "-";
  }

  const insulinMedication = medicationRecords.find((record) =>
    /insulina/i.test(record.name)
  );
  if (!insulinMedication) {
    return "-";
  }

  if (vital.glucose >= 180) {
    return insulinMedication.dose;
  }
  return "-";
}

function mapProcedureTypeToLabel(type: string) {
  const normalized = type.trim().toLowerCase();
  if (normalized === "traqueostomia") {
    return "Traqueostomia";
  }
  if (normalized === "ventilacion mecanica") {
    return "Ventilacion mecanica";
  }
  if (normalized === "cateter central") {
    return "Via central";
  }
  if (normalized === "cateter periferico") {
    return "Cateter periferico";
  }
  if (normalized === "sonda nasogastrica") {
    return "Sonda nasogastrica";
  }
  if (normalized === "sonda vesical") {
    return "Sonda vesical";
  }
  if (normalized === "gastrostomia") {
    return "Gastrostomia";
  }
  return "Otros";
}

function buildInvasiveProcedureRows(patient: PatientRecord) {
  return invasiveProcedureLabels.map((label) => {
    const procedure = patient.procedures.find(
      (item) => mapProcedureTypeToLabel(item.type) === label
    );

    return {
      label,
      placedAt: procedure?.placedAt ?? "-",
      days: procedure ? `${procedure.daysInstalled}` : "-",
    };
  });
}

function buildFluidBalanceSheet(
  balances: PatientRecord["fluidBalances"],
  fallbackDate: string
) {
  const fallback = splitDateTime(fallbackDate).date;
  const latestDate =
    [...balances]
      .map((entry) => entry.date)
      .sort((a, b) => a.localeCompare(b))
      .at(-1) ?? fallback;
  const balancesOnDate = balances.filter((entry) => entry.date === latestDate);
  const morningEntries = balancesOnDate.filter((entry) => /manana|mañana|morning/i.test(entry.shift));
  const nightEntries = balancesOnDate.filter((entry) => !/manana|mañana|morning/i.test(entry.shift));

  const summarizeShift = (entries: PatientRecord["fluidBalances"]) =>
    entries.reduce(
      (acc, entry) => {
        acc.intake += sumObjectValues(entry.intake);
        acc.output += sumObjectValues(entry.output);
        acc.diuresis += entry.output.diuresis;
        acc.insensible += entry.output.insensibleLoss;
        acc.vomiting += entry.output.vomiting;
        acc.drains += entry.output.drains;
        acc.catarsis += entry.output.liquidStools;
        acc.otherOutput += entry.output.other;
        return acc;
      },
      {
        intake: 0,
        output: 0,
        diuresis: 0,
        insensible: 0,
        vomiting: 0,
        drains: 0,
        catarsis: 0,
        otherOutput: 0,
      }
    );

  const morning = summarizeShift(morningEntries);
  const night = summarizeShift(nightEntries);
  const morningIntake = morning.intake;
  const nightIntake = night.intake;
  const morningOutput = morning.output;
  const nightOutput = night.output;
  const morningDiuresis = morning.diuresis;
  const nightDiuresis = night.diuresis;

  const intakeByHour = Array.from({ length: criticalHourSlots.length }, () => "-");
  const outputByHour = Array.from({ length: criticalHourSlots.length }, () => "-");
  const diuresisByHour = Array.from({ length: criticalHourSlots.length }, () => "-");

  if (morning) {
    intakeByHour[0] = `${morningIntake}`;
    outputByHour[0] = `${morningOutput}`;
    diuresisByHour[0] = `${morningDiuresis}`;
  }
  if (night) {
    intakeByHour[12] = `${nightIntake}`;
    outputByHour[12] = `${nightOutput}`;
    diuresisByHour[12] = `${nightDiuresis}`;
  }

  const intake24 = morningIntake + nightIntake;
  const output24 = morningOutput + nightOutput;
  const diuresis24 = morningDiuresis + nightDiuresis;
  const balance24 = intake24 - output24;

  return {
    date: latestDate,
    intakeByHour,
    outputByHour,
    diuresisByHour,
    morningIntake,
    nightIntake,
    morningOutput,
    nightOutput,
    morningDiuresis,
    nightDiuresis,
    morningInsensible: morning.insensible,
    nightInsensible: night.insensible,
    morningVomiting: morning.vomiting,
    nightVomiting: night.vomiting,
    morningDrains: morning.drains,
    nightDrains: night.drains,
    morningCatarsis: morning.catarsis,
    nightCatarsis: night.catarsis,
    morningOtherOutput: morning.otherOutput,
    nightOtherOutput: night.otherOutput,
    morningBalance: morningIntake - morningOutput,
    nightBalance: nightIntake - nightOutput,
    intake24,
    output24,
    diuresis24,
    balance24,
    hourlyDiuresis: Math.round((diuresis24 / 24) * 10) / 10,
  };
}

function getPrimarySurname(lastName: string) {
  return lastName.split(" ").filter(Boolean)[0] ?? lastName;
}

function getPrimaryName(firstName: string) {
  return firstName.split(" ").filter(Boolean)[0] ?? firstName;
}

function splitDateTime(value: string) {
  const normalized = value.trim().replace("T", " ");
  const [date = "-", time = "-"] = normalized.split(" ");
  return { date, time };
}

function extractDateKey(value: string) {
  const datePart = splitDateTime(value).date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function buildDoseRouteFrequency(entry: KardexAdministrationRecord) {
  if (entry.type === "Infusion") {
    return `Vol. total ${entry.totalVolumeMl} ml · Via ${entry.route} · ${entry.volumePerHourMl} ml/h por ${entry.durationHours} h`;
  }

  const frequencyLabel = entry.durationHours <= 1 ? "Dosis unica" : `Cada ${entry.durationHours} h`;
  return `${entry.totalVolumeMl} ml · Via ${entry.route} · ${frequencyLabel}`;
}

function buildAdministrationSlots(entry: KardexAdministrationRecord) {
  const { time } = splitDateTime(entry.startedAt);
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  const hasValidTime =
    Number.isFinite(hours) && Number.isFinite(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
  const intervalHours = entry.durationHours >= 8 ? 2 : entry.durationHours >= 4 ? 1 : 0;

  return Array.from({ length: 4 }, (_, index) => {
    if (!hasValidTime) {
      return {
        hour: index === 0 ? time : "-",
        responsible: index === 0 ? entry.responsible : "-",
      };
    }

    if (index > 0 && intervalHours === 0) {
      return { hour: "-", responsible: "-" };
    }

    const totalMinutes = hours * 60 + minutes + index * intervalHours * 60;
    const wrappedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const slotHour = String(Math.floor(wrappedMinutes / 60)).padStart(2, "0");
    const slotMinute = String(wrappedMinutes % 60).padStart(2, "0");

    return {
      hour: `${slotHour}:${slotMinute}`,
      responsible: index === 0 ? entry.responsible : "-",
    };
  });
}

function formatNursingShiftNarrative(report: NursingShiftReportRecord | null) {
  if (!report) {
    return "Sin reporte de enfermeria disponible para este paciente.";
  }

  return [
    `Turno ${report.shift} (${report.date}) en ${report.service}.`,
    `Paciente con estado general ${report.generalStatus}, conciencia ${report.consciousness} y respiracion ${report.breathing}.`,
    `Dolor reportado: ${report.pain}. Tolerancia oral: ${report.oralTolerance}.`,
    `Eliminacion: ${report.elimination}. Movilidad: ${report.mobility}. Piel: ${report.skin}.`,
    `Procedimientos realizados: ${report.proceduresDone}.`,
    `Respuesta del paciente: ${report.patientResponse}.`,
    `Incidencias: ${report.incidents}.`,
    `Plan de cuidados: ${report.carePlan}.`,
  ].join(" ");
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function sumObjectValues(values: Record<string, number>) {
  return Object.values(values).reduce((total, current) => total + current, 0);
}

function AvailabilityPill({
  availability,
}: {
  availability: "listo" | "parcial" | "sin_datos";
}) {
  const tone =
    availability === "listo"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : availability === "parcial"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {availability}
    </span>
  );
}

function normalizeMatchingValue(value: string) {
  return value.trim().toLowerCase();
}
