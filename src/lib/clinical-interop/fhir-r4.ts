export interface FhirIdentifier {
  system?: string;
  value: string;
}

export interface FhirReference {
  reference: string;
  display?: string;
}

export interface FhirHumanName {
  use?: "official";
  family?: string;
  given?: string[];
  text?: string;
}

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

interface FhirResourceBase {
  id: string;
  resourceType:
    | "Patient"
    | "Observation"
    | "Appointment"
    | "Condition"
    | "MedicationRequest"
    | "DocumentReference";
}

export interface VitaFhirPatient extends FhirResourceBase {
  resourceType: "Patient";
  identifier: FhirIdentifier[];
  name: FhirHumanName[];
  gender: "male" | "female" | "unknown";
  birthDate: string;
}

export interface VitaFhirObservation extends FhirResourceBase {
  resourceType: "Observation";
  status: "final";
  code: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime: string;
  valueString: string;
}

export interface VitaFhirAppointment extends FhirResourceBase {
  resourceType: "Appointment";
  status: "booked" | "pending" | "fulfilled";
  serviceCategory: FhirCodeableConcept[];
  start: string;
  end: string;
  participant: Array<{
    actor: FhirReference;
    status: "accepted" | "needs-action";
  }>;
}

export interface VitaFhirCondition extends FhirResourceBase {
  resourceType: "Condition";
  clinicalStatus: FhirCodeableConcept;
  code: FhirCodeableConcept;
  subject: FhirReference;
  recordedDate: string;
}

export interface VitaFhirMedicationRequest extends FhirResourceBase {
  resourceType: "MedicationRequest";
  status: "active" | "completed";
  medicationCodeableConcept: FhirCodeableConcept;
  subject: FhirReference;
  authoredOn: string;
  dosageInstruction: Array<{
    text: string;
  }>;
}

export interface VitaFhirDocumentReference extends FhirResourceBase {
  resourceType: "DocumentReference";
  status: "current";
  type: FhirCodeableConcept;
  subject: FhirReference;
  date: string;
  description: string;
}
