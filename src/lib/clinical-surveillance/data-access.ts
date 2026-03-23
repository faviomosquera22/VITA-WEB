import "server-only";

import {
  getKardexAdministrations,
  getPatientServiceArea,
  mockPatients,
  type FluidBalanceRecord,
  type PatientRecord,
} from "@/app/portal/professional/_data/clinical-mock-data";
import {
  parseBloodPressure,
  parseClinicalDate,
  resolveMedicationClass,
  toIsoTimestamp,
} from "@/lib/clinical-surveillance/helpers";
import type {
  ActivePatient,
  ClinicalNoteSummary,
  FluidBalanceSummary,
  MedicationAdministration,
  MedicationOrder,
  VitalSigns,
} from "@/lib/clinical-surveillance/types";

const inHospitalAreas = new Set(["Emergencia", "Observacion", "Hospitalizacion"]);

function isActiveHospitalizedPatient(patient: PatientRecord) {
  const serviceArea = getPatientServiceArea(patient);
  return patient.careMode === "Hospitalizacion" || inHospitalAreas.has(serviceArea);
}

function inferFluidBalanceRecordedAt(record: FluidBalanceRecord) {
  if (record.date.includes("T") || record.date.includes(" ")) {
    return toIsoTimestamp(record.date);
  }

  const shiftMap: Record<string, string> = {
    "24 horas": "23:00:00",
    Manana: "14:00:00",
    Tarde: "20:00:00",
    Noche: "06:00:00",
    Ambulatorio: "12:00:00",
  };

  return `${record.date}T${shiftMap[record.shift] ?? "12:00:00"}`;
}

function mapVitalSigns(patient: PatientRecord): VitalSigns[] {
  return patient.vitalSigns
    .map((item) => {
      const { systolic, diastolic } = parseBloodPressure(item.bloodPressure);

      return {
        recordedAt: toIsoTimestamp(item.recordedAt),
        systolicBloodPressure: systolic,
        diastolicBloodPressure: diastolic,
        heartRate: item.heartRate,
        respiratoryRate: item.respiratoryRate,
        temperature: item.temperature,
        spo2: item.spo2,
        painScale: item.painScale,
        glucose: item.glucose,
        professional: item.professional,
        outOfRangeFlags: item.outOfRangeFlags,
        rawBloodPressure: item.bloodPressure,
      };
    })
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
}

function mapMedicationOrders(patient: PatientRecord): MedicationOrder[] {
  return patient.medicationRecords.map((item) => ({
    id: item.id,
    name: item.name,
    normalizedName: item.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim(),
    className: resolveMedicationClass(item.name),
    dose: item.dose,
    frequency: item.frequency,
    route: item.route,
    schedule: item.schedule,
    startDate: item.startDate,
    indication: item.indication,
    prescriber: item.prescriber,
    administrationStatus: item.administrationStatus,
    notes: item.notes,
  }));
}

function mapMedicationAdministrations(patient: PatientRecord): MedicationAdministration[] {
  return getKardexAdministrations(patient)
    .filter((item) => item.type === "Medicacion")
    .map((item) => ({
      id: item.id,
      medicationName: item.itemName,
      normalizedMedicationName: item.itemName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim(),
      route: item.route,
      administeredAt: toIsoTimestamp(item.startedAt),
      responsible: item.responsible,
      status: item.status,
      notes: item.notes,
    }))
    .sort((left, right) => right.administeredAt.localeCompare(left.administeredAt));
}

function mapFluidBalances(patient: PatientRecord): FluidBalanceSummary[] {
  return patient.fluidBalances
    .map((item) => {
      const totalIntakeMl =
        item.intake.oral +
        item.intake.intravenous +
        item.intake.dilutedMedication +
        item.intake.enteralParenteral +
        item.intake.other;
      const totalOutputMl =
        item.output.diuresis +
        item.output.vomiting +
        item.output.drains +
        item.output.liquidStools +
        item.output.aspiration +
        item.output.insensibleLoss +
        item.output.other;

      return {
        id: item.id,
        recordedAt: inferFluidBalanceRecordedAt(item),
        shift: item.shift,
        totalIntakeMl,
        totalOutputMl,
        netBalanceMl: totalIntakeMl - totalOutputMl,
        observations: item.observations,
      };
    })
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
}

function mapClinicalNotes(patient: PatientRecord): ClinicalNoteSummary[] {
  return [
    ...patient.nursingNotes.map((item) => ({
      id: item.id,
      datetime: toIsoTimestamp(item.datetime),
      author: item.professional,
      specialty: item.specialty,
      module: "nursing" as const,
      text: item.note,
    })),
    ...patient.medicalNotes.map((item) => ({
      id: item.id,
      datetime: toIsoTimestamp(item.datetime),
      author: item.professional,
      specialty: item.specialty,
      module: "medical" as const,
      text: item.note,
    })),
  ].sort((left, right) => right.datetime.localeCompare(left.datetime));
}

function resolveLastReevaluationAt(patient: PatientRecord, clinicalNotes: ClinicalNoteSummary[]) {
  const candidates = [
    patient.lastControlAt,
    clinicalNotes[0]?.datetime,
    patient.medicalNotes[0]?.datetime,
    patient.nursingNotes[0]?.datetime,
  ]
    .filter(Boolean)
    .map((value) => toIsoTimestamp(String(value)));

  return candidates.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function resolveLastRecordAt(patient: PatientRecord, notes: ClinicalNoteSummary[], fluids: FluidBalanceSummary[]) {
  const candidates = [
    patient.lastControlAt,
    patient.vitalSigns[0]?.recordedAt,
    notes[0]?.datetime,
    fluids[0]?.recordedAt,
  ]
    .filter(Boolean)
    .map((value) => toIsoTimestamp(String(value)));

  return candidates.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function requiresFluidBalance(patient: PatientRecord) {
  return (
    patient.careMode === "Hospitalizacion" ||
    getPatientServiceArea(patient) === "Hospitalizacion" ||
    getKardexAdministrations(patient).some((item) => item.type === "Infusion")
  );
}

function mapPatientRecordToActivePatient(patient: PatientRecord): ActivePatient {
  const vitalSigns = mapVitalSigns(patient);
  const medicationOrders = mapMedicationOrders(patient);
  const medicationAdministrations = mapMedicationAdministrations(patient);
  const fluidBalances = mapFluidBalances(patient);
  const clinicalNotes = mapClinicalNotes(patient);

  return {
    id: patient.id,
    patientName: patient.fullName,
    medicalRecordNumber: patient.medicalRecordNumber,
    currentDiagnosis: patient.primaryDiagnosis,
    diagnoses: [
      patient.primaryDiagnosis,
      ...patient.secondaryDiagnoses,
      ...patient.diagnoses.map((diagnosis) => diagnosis.diagnosis),
    ],
    serviceArea: getPatientServiceArea(patient),
    careMode: patient.careMode,
    currentStatus: patient.currentStatus,
    assignedProfessional: patient.assignedProfessional,
    allergies: patient.antecedentes.allergies,
    vitalSigns,
    medicationOrders,
    medicationAdministrations,
    fluidBalances,
    clinicalNotes,
    lastReevaluationAt: resolveLastReevaluationAt(patient, clinicalNotes),
    lastRecordAt: resolveLastRecordAt(patient, clinicalNotes, fluidBalances),
    requiresFluidBalance: requiresFluidBalance(patient),
    metadata: {
      activeAlerts: patient.activeAlerts,
      admissionDate: parseClinicalDate(patient.admissionDate)?.toISOString() ?? patient.admissionDate,
      diagnosisCount: patient.diagnoses.length,
      summary: patient.summary.reasonForConsultation,
    },
  };
}

export function listActiveHospitalizedPatients() {
  return mockPatients
    .filter(isActiveHospitalizedPatient)
    .map(mapPatientRecordToActivePatient)
    .sort((left, right) => {
      const leftRecord = left.lastRecordAt ?? "";
      const rightRecord = right.lastRecordAt ?? "";
      return rightRecord.localeCompare(leftRecord);
    });
}

export function getActiveHospitalizedPatientById(patientId: string) {
  return listActiveHospitalizedPatients().find((patient) => patient.id === patientId) ?? null;
}
