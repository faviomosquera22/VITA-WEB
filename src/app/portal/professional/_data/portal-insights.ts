import {
  getPatientServiceArea,
  getPatientsByTriagePriority,
  getRecentClinicalActivity,
  mockPatients,
  type PatientRecord,
  type TriageColor,
} from "./clinical-mock-data";

export interface VitalTrendPoint {
  label: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  glucose: number;
}

export function getPriorityPatientForDashboard() {
  return getPatientsByTriagePriority()[0] ?? null;
}

export function getVitalTrend(patient: PatientRecord | null, limit = 6): VitalTrendPoint[] {
  if (!patient) {
    return [];
  }

  return [...patient.vitalSigns]
    .slice(0, limit)
    .reverse()
    .map((record) => {
      const [systolic, diastolic] = record.bloodPressure.split("/").map((value) => Number(value));

      return {
        label: record.recordedAt.slice(11, 16),
        systolic,
        diastolic,
        heartRate: record.heartRate,
        glucose: record.glucose,
      };
    });
}

export function getTriageDistribution() {
  const colors: TriageColor[] = ["rojo", "naranja", "amarillo", "verde", "azul"];

  return colors.map((color) => ({
    label: color,
    value: mockPatients.filter((patient) => patient.triageColor === color).length,
  }));
}

export function getServiceDistribution() {
  const services = Array.from(new Set(mockPatients.map((patient) => getPatientServiceArea(patient))));

  return services.map((service) => ({
    label: service,
    total: mockPatients.filter((patient) => getPatientServiceArea(patient) === service).length,
    highRisk: mockPatients.filter(
      (patient) => getPatientServiceArea(patient) === service && patient.riskLevel === "alto"
    ).length,
  }));
}

export function getMedicationAdherenceOverview() {
  const administered = mockPatients.reduce(
    (total, patient) =>
      total + patient.medicationRecords.filter((item) => item.administrationStatus === "Administrado").length,
    0
  );
  const pending = mockPatients.reduce(
    (total, patient) =>
      total + patient.medicationRecords.filter((item) => item.administrationStatus === "Pendiente").length,
    0
  );
  const omitted = mockPatients.reduce(
    (total, patient) =>
      total + patient.medicationRecords.filter((item) => item.administrationStatus === "Omitido").length,
    0
  );

  return [
    { label: "Administrado", value: administered },
    { label: "Pendiente", value: pending },
    { label: "Omitido", value: omitted },
  ];
}

export function getRecentDashboardActivity() {
  return getRecentClinicalActivity().slice(0, 6);
}
