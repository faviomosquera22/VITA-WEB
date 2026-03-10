"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Panel, RiskBadge, TriageBadge } from "./clinical-ui";
import {
  educationResources,
  getKardexAdministrations,
  getPatientFunctionalPatterns,
  type KardexAdministrationRecord,
  type PatientRecord,
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
  | "documents"
  | "timeline"
  | "education"
  | "reports";

const patientTabs: Array<{ id: PatientTabId; label: string; group: string }> = [
  { id: "summary", label: "Resumen", group: "Vision clinica rapida" },
  { id: "diagnoses", label: "Diagnosticos", group: "Vision clinica rapida" },
  { id: "triage", label: "Triaje", group: "Vision clinica rapida" },
  { id: "timeline", label: "Historial", group: "Vision clinica rapida" },
  { id: "vitals", label: "Signos vitales", group: "Monitoreo" },
  { id: "fluid_balance", label: "Balance hidrico", group: "Monitoreo" },
  { id: "exams", label: "Examenes", group: "Monitoreo" },
  { id: "procedures", label: "Procedimientos", group: "Monitoreo" },
  { id: "medication", label: "Medicacion", group: "Tratamiento y cuidados" },
  { id: "nursing_notes", label: "Enfermeria", group: "Tratamiento y cuidados" },
  { id: "medical_notes", label: "Medicina", group: "Tratamiento y cuidados" },
  { id: "kardex", label: "Kardex", group: "Tratamiento y cuidados" },
  { id: "nursing_report", label: "Reporte enfermeria", group: "Tratamiento y cuidados" },
  { id: "care_plan", label: "Plan de cuidados", group: "Tratamiento y cuidados" },
  { id: "nutrition", label: "Nutricion", group: "Enfoque integral" },
  { id: "vaccination", label: "Vacunacion", group: "Enfoque integral" },
  { id: "emotional", label: "Salud emocional", group: "Enfoque integral" },
  { id: "education", label: "Educacion", group: "Enfoque integral" },
  { id: "personal", label: "Datos personales", group: "Apoyo documental" },
  { id: "background", label: "Antecedentes", group: "Apoyo documental" },
  { id: "documents", label: "Documentos", group: "Apoyo documental" },
  { id: "reports", label: "Reportes", group: "Apoyo documental" },
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

export default function PatientClinicalRecord({ patient }: { patient: PatientRecord }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [selectedTab, setSelectedTab] = useState<PatientTabId | null>(null);
  const [selectedNursingNoteId, setSelectedNursingNoteId] = useState<string | null>(null);
  const [selectedMedicalNoteId, setSelectedMedicalNoteId] = useState<string | null>(null);
  const [selectedNursingShiftReportId, setSelectedNursingShiftReportId] = useState<string | null>(
    null
  );
  const [currentProfessional, setCurrentProfessional] = useState(patient.assignedProfessional);

  const [addedVitals, setAddedVitals] = useState<VitalSignRecord[]>([]);
  const [addedFluidBalances, setAddedFluidBalances] = useState<PatientRecord["fluidBalances"]>([]);
  const [addedNursingNotes, setAddedNursingNotes] = useState<PatientRecord["nursingNotes"]>([]);
  const [addedMedicalNotes, setAddedMedicalNotes] = useState<PatientRecord["medicalNotes"]>([]);
  const [addedNursingShiftReports, setAddedNursingShiftReports] = useState<
    PatientRecord["nursingShiftReports"]
  >([]);
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
    drains: "",
    liquidStools: "",
    aspiration: "",
    insensibleLoss: "",
    outputOther: "",
    observations: "",
  });
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

  const activeTab = selectedTab ?? (isTab(requestedTab) ? requestedTab : "summary");

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
  const effectiveNursingShiftReports = useMemo(
    () =>
      [...addedNursingShiftReports, ...patient.nursingShiftReports].sort((a, b) =>
        `${b.date}-${b.shift}`.localeCompare(`${a.date}-${a.shift}`)
      ),
    [addedNursingShiftReports, patient.nursingShiftReports]
  );

  const latestVital = effectiveVitals[0] ?? null;
  const functionalPatterns = getPatientFunctionalPatterns(patient);

  const timelineSorted = useMemo(
    () => [...patient.timeline].sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [patient.timeline]
  );
  const kardexAdministrations = getKardexAdministrations(patient);
  const medicationAllergies = patient.antecedentes.allergies.filter(
    (item) => !isNoKnownAllergy(item)
  );
  const vitalsByHour = groupVitalsByHour(effectiveVitals);
  const latestVitalDate = splitDateTime(effectiveVitals[0]?.recordedAt ?? patient.admissionDate).date;
  const invasiveRows = buildInvasiveProcedureRows(patient);
  const fluidBalanceSheet = buildFluidBalanceSheet(effectiveFluidBalances, patient.admissionDate);
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
      drains: parseMlValue(fluidForm.drains),
      liquidStools: parseMlValue(fluidForm.liquidStools),
      aspiration: parseMlValue(fluidForm.aspiration),
      insensibleLoss: parseMlValue(fluidForm.insensibleLoss),
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
  }, [fluidForm]);
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
  const activeTabLabel = patientTabs.find((tab) => tab.id === activeTab)?.label ?? activeTab;
  const tabAuditRecords = auditRecords.filter((record) => record.tab === activeTab);

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
      drains: "",
      liquidStools: "",
      aspiration: "",
      insensibleLoss: "",
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

  const registerNursingShiftReport = () => {
    if (
      !nursingReportForm.generalStatus.trim() ||
      !nursingReportForm.proceduresDone.trim() ||
      !nursingReportForm.carePlan.trim()
    ) {
      return;
    }

    const reference = selectedNursingShiftReport;
    setAddedNursingShiftReports((prev) => [
      {
        id: `nsr-local-${Date.now()}`,
        shift: nursingReportForm.shift,
        service: nursingReportForm.service,
        date: latestVitalDate,
        generalStatus: nursingReportForm.generalStatus.trim(),
        consciousness: reference?.consciousness ?? "Alerta",
        breathing: reference?.breathing ?? "Sin dificultad respiratoria",
        pain: reference?.pain ?? "0/10",
        oralTolerance: reference?.oralTolerance ?? "Adecuada",
        elimination: reference?.elimination ?? "Conservada",
        mobility: reference?.mobility ?? "Asistida",
        skin: reference?.skin ?? "Integra",
        proceduresDone: nursingReportForm.proceduresDone.trim(),
        patientResponse: reference?.patientResponse ?? "Cooperador/a",
        incidents: nursingReportForm.incidents.trim() || "Sin incidencias",
        carePlan: nursingReportForm.carePlan.trim(),
      },
      ...prev,
    ]);
    addAuditRecord(
      "nursing_report",
      "Reporte de enfermeria",
      `Turno ${nursingReportForm.shift}. ${nursingReportForm.generalStatus}. Procedimientos: ${nursingReportForm.proceduresDone}. Plan: ${nursingReportForm.carePlan}.`
    );
    setNursingReportForm((prev) => ({
      ...prev,
      generalStatus: "",
      proceduresDone: "",
      incidents: "",
      carePlan: "",
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge risk={patient.riskLevel} />
              <TriageBadge triage={patient.triageColor} />
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                Estado: {patient.currentStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <ActionChip label="Editar datos" />
              <ActionChip label="Generar reporte" />
              <ActionChip label="Exportar PDF" />
              <ActionChip label="Ver alertas" />
              <ActionChip label="Agregar nota" />
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
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 xl:sticky xl:top-3">
          <div className="mb-3 border-b border-slate-200 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Submodulos de ficha
            </p>
            <p className="text-[11px] text-slate-500">
              Navegacion clinica del paciente por area.
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

        <section className="space-y-4">

      {activeTab === "summary" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Resumen general" subtitle="Vista rapida del estado actual del paciente">
            <div className="space-y-2 text-xs text-slate-700">
              <SummaryRow label="Motivo de consulta" value={patient.summary.reasonForConsultation} />
              <SummaryRow label="Diagnostico principal" value={patient.primaryDiagnosis} />
              <SummaryRow
                label="Diagnosticos secundarios"
                value={patient.secondaryDiagnoses.length ? patient.secondaryDiagnoses.join(", ") : "Sin diagnosticos secundarios"}
              />
              <SummaryRow
                label="Alergias"
                value={patient.antecedentes.allergies.join(", ") || "No registradas"}
              />
              <SummaryRow
                label="Signos vitales recientes"
                value={
                  latestVital
                    ? `${latestVital.recordedAt} · TA ${latestVital.bloodPressure} · FC ${latestVital.heartRate} · SpO2 ${latestVital.spo2}%`
                    : "Sin registros recientes"
                }
              />
            </div>
          </Panel>

          <Panel title="Resumen clinico complementario" subtitle="Alertas, notas recientes y seguimiento">
            <div className="space-y-2 text-xs text-slate-700">
              <SummaryRow
                label="Medicacion actual"
                value={patient.summary.activeMedicationSummary.join(" · ")}
              />
              <SummaryRow
                label="Ultimo reporte de enfermeria"
                value={patient.summary.latestNursingReport}
              />
              <SummaryRow
                label="Vacunas pendientes"
                value={patient.summary.vaccinationPendingSummary.join(", ") || "Sin pendientes"}
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
        <Panel title="Triaje y evaluacion inicial" subtitle="Clasificacion de riesgo y conducta sugerida">
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2">
            <SummaryRow label="Fecha evaluacion" value={patient.triageAssessment.evaluatedAt} />
            <SummaryRow
              label="Motivo consulta"
              value={patient.triageAssessment.consultationReason}
            />
            <SummaryRow
              label="Tiempo evolucion"
              value={patient.triageAssessment.evolutionTime}
            />
            <SummaryRow
              label="Clasificacion de riesgo"
              value={patient.triageAssessment.riskClassification}
            />
            <SummaryRow
              label="Color triaje"
              value={patient.triageAssessment.triageColor}
            />
            <SummaryRow
              label="Conducta sugerida"
              value={patient.triageAssessment.suggestedConduct}
            />
            <SummaryRow label="Derivacion" value={patient.triageAssessment.referral} />
            <SummaryRow
              label="Observaciones"
              value={patient.triageAssessment.professionalObservations}
            />
          </div>
          <ListBlock title="Sintomas reportados" items={patient.triageAssessment.symptoms} />
          <ListBlock title="Signos de alarma" items={patient.triageAssessment.warningSigns} />
        </Panel>
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
                              {getInsulinLabel(patient, vital)}
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
            <ActionChip label="Agregar medicamento" />
            <ActionChip label="Registrar administracion" />
            <ActionChip label="Ver historial de cambios" />
          </div>
          <div className="space-y-2">
            {patient.medicationRecords.map((record) => (
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
                        : "border-slate-200 bg-slate-100 text-slate-700",
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
              </article>
            ))}
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
          subtitle="Vista narrativa del turno con estructura tipo nota clinica"
        >
          {effectiveNursingShiftReports.length === 0 ? (
            <p className="text-xs text-slate-500">Sin reportes estructurados registrados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Reportes por turno
                </p>
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
                    className="min-h-[220px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                  <p className="mb-1 text-[11px] font-semibold text-slate-600">
                    Registrar reporte de turno
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <InputSelect
                      label="Turno"
                      value={nursingReportForm.shift}
                      onChange={(value) =>
                        setNursingReportForm((prev) => ({ ...prev, shift: value }))
                      }
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
                    <InputText
                      label="Estado general"
                      value={nursingReportForm.generalStatus}
                      onChange={(value) =>
                        setNursingReportForm((prev) => ({ ...prev, generalStatus: value }))
                      }
                      placeholder="Paciente estable, en observacion..."
                    />
                    <InputText
                      label="Procedimientos"
                      value={nursingReportForm.proceduresDone}
                      onChange={(value) =>
                        setNursingReportForm((prev) => ({ ...prev, proceduresDone: value }))
                      }
                      placeholder="Control signos, curacion, medicacion..."
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
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
                  <div className="mt-2">
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
          )}
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
                          label="Vomitos"
                          value={fluidForm.vomiting}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, vomiting: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Drenajes"
                          value={fluidForm.drains}
                          onChange={(value) => setFluidForm((prev) => ({ ...prev, drains: value }))}
                          placeholder="0"
                        />
                        <InputText
                          type="number"
                          label="Deposiciones liquidas"
                          value={fluidForm.liquidStools}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, liquidStools: value }))
                          }
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
                          label="Perdidas insensibles"
                          value={fluidForm.insensibleLoss}
                          onChange={(value) =>
                            setFluidForm((prev) => ({ ...prev, insensibleLoss: value }))
                          }
                          placeholder="250"
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
        <Panel title="Diagnosticos" subtitle="Principal, secundarios y presuntivos">
          <div className="space-y-2">
            {patient.diagnoses.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.diagnosis}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {item.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Registro: {item.registeredAt} · Estado: {item.status}
                </p>
                <p className="text-[11px] text-slate-500">{item.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
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
        <Panel title="Plan de cuidados" subtitle="Diagnosticos de enfermeria, objetivos e intervenciones">
          <div className="space-y-2">
            {patient.carePlan.length === 0 && (
              <p className="text-xs text-slate-500">No hay plan de cuidados estructurado.</p>
            )}
            {patient.carePlan.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{entry.nursingDiagnosis}</p>
                <p className="text-xs text-slate-600">Objetivo: {entry.objective}</p>
                <ListBlock title="Intervenciones" items={entry.interventions} />
                <p className="text-[11px] text-slate-500">Evaluacion: {entry.evaluation}</p>
                <p className="text-[11px] text-slate-500">Observaciones: {entry.observations}</p>
              </article>
            ))}
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
            <ActionChip label="Generar resumen clinico" />
            <ActionChip label="Exportar PDF" />
            <ActionChip label="Generar reporte de enfermeria" />
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
        <Panel title="Historial / linea de tiempo clinica" subtitle="Secuencia de eventos clinicos relevantes">
          <div className="space-y-2">
            {timelineSorted.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{event.category}</p>
                  <span className="text-[11px] text-slate-500">{event.datetime}</span>
                </div>
                <p className="mt-1 text-xs text-slate-700">{event.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
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
  type?: "text" | "number";
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

function ActionChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
    >
      {label}
    </button>
  );
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

function getInsulinLabel(patient: PatientRecord, vital: VitalSignRecord | null) {
  if (!vital) {
    return "-";
  }

  const insulinMedication = patient.medicationRecords.find((record) =>
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

function formatNursingShiftNarrative(report: PatientRecord["nursingShiftReports"][number] | null) {
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
