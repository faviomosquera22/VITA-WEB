import type {
  DocumentRecord,
  MedicationRecord,
  PatientRecord,
  VitalSignRecord,
} from "@/app/portal/professional/_data/clinical-mock-data";
import type {
  VitaFhirCondition,
  VitaFhirDocumentReference,
  VitaFhirMedicationRequest,
  VitaFhirObservation,
  VitaFhirPatient,
} from "./fhir-r4";

export function patientRecordToFhirPatient(patient: PatientRecord): VitaFhirPatient {
  return {
    id: patient.id,
    resourceType: "Patient",
    identifier: [
      { system: "https://vita.ec/patients/document", value: patient.identification },
      { system: "https://vita.ec/patients/hc", value: patient.medicalRecordNumber },
    ],
    name: [
      {
        use: "official",
        family: patient.lastName,
        given: [patient.firstName],
        text: patient.fullName,
      },
    ],
    gender: patient.sex === "Femenino" ? "female" : "male",
    birthDate: patient.birthDate,
  };
}

export function vitalSignToObservation(
  patient: PatientRecord,
  vital: VitalSignRecord,
  code: string,
  label: string,
  value: string
): VitaFhirObservation {
  return {
    id: `${patient.id}-${code}-${vital.recordedAt}`,
    resourceType: "Observation",
    status: "final",
    code: {
      coding: [{ system: "http://loinc.org", code, display: label }],
      text: label,
    },
    subject: { reference: `Patient/${patient.id}`, display: patient.fullName },
    effectiveDateTime: vital.recordedAt,
    valueString: value,
  };
}

export function patientVitalsToFhirObservations(patient: PatientRecord): VitaFhirObservation[] {
  return patient.vitalSigns.flatMap((vital) => [
    vitalSignToObservation(patient, vital, "85354-9", "Blood pressure panel", vital.bloodPressure),
    vitalSignToObservation(patient, vital, "8867-4", "Heart rate", `${vital.heartRate} bpm`),
    vitalSignToObservation(patient, vital, "2339-0", "Glucose", `${vital.glucose} mg/dL`),
  ]);
}

export function diagnosisToFhirCondition(
  patient: PatientRecord,
  diagnosis: PatientRecord["diagnoses"][number]
): VitaFhirCondition {
  return {
    id: diagnosis.id,
    resourceType: "Condition",
    clinicalStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", display: diagnosis.status }],
      text: diagnosis.status,
    },
    code: { text: diagnosis.diagnosis },
    subject: { reference: `Patient/${patient.id}`, display: patient.fullName },
    recordedDate: diagnosis.registeredAt,
  };
}

export function medicationToFhirRequest(
  patient: PatientRecord,
  medication: MedicationRecord
): VitaFhirMedicationRequest {
  return {
    id: medication.id,
    resourceType: "MedicationRequest",
    status: medication.administrationStatus === "Administrado" ? "completed" : "active",
    medicationCodeableConcept: { text: medication.name },
    subject: { reference: `Patient/${patient.id}`, display: patient.fullName },
    authoredOn: medication.startDate,
    dosageInstruction: [{ text: `${medication.dose} · ${medication.frequency} · ${medication.route}` }],
  };
}

export function documentToFhirReference(
  patient: PatientRecord,
  document: DocumentRecord
): VitaFhirDocumentReference {
  return {
    id: document.id,
    resourceType: "DocumentReference",
    status: "current",
    type: { text: document.type },
    subject: { reference: `Patient/${patient.id}`, display: patient.fullName },
    date: document.date,
    description: document.title,
  };
}
