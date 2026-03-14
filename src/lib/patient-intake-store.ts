import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { SessionUser } from "@/lib/auth";
import { normalizeRegisteredPatientRecord } from "@/lib/patient-intake-msp";
import type {
  PatientIntakePayload,
  RegisteredPatientRecord,
  RegisteredPatientSummary,
} from "@/types/patient-intake";

interface PatientIntakeStoreData {
  records: RegisteredPatientRecord[];
}

const DATA_DIR = process.env.VERCEL
  ? "/tmp/vita-data"
  : path.join(process.cwd(), ".vita-data");
const DATA_FILE = path.join(DATA_DIR, "patient-intake-store.json");

const initialData: PatientIntakeStoreData = {
  records: [],
};

let memoryStore: PatientIntakeStoreData = cloneData(initialData);

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
  } catch {
    // Ignore persistence issues and continue with in-memory fallback.
  }
}

function readStore(): PatientIntakeStoreData {
  try {
    ensureStoreFile();
    const fileContent = fs.readFileSync(DATA_FILE, "utf8");
    return normalizeStoreData(JSON.parse(fileContent) as PatientIntakeStoreData);
  } catch {
    return normalizeStoreData(cloneData(memoryStore));
  }
}

function writeStore(data: PatientIntakeStoreData) {
  const normalizedData = normalizeStoreData(data);
  memoryStore = cloneData(normalizedData);

  try {
    ensureStoreFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(normalizedData, null, 2), "utf8");
  } catch {
    // Ignore persistence errors; memory fallback remains available.
  }
}

function cloneData<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeDocumentNumber(documentNumber: string) {
  return documentNumber.replace(/\s+/g, "").toUpperCase();
}

function newPatientId() {
  return `pat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildMedicalRecordNumber(recordCount: number) {
  const year = new Date().getFullYear();
  const seq = String(recordCount + 1).padStart(5, "0");
  return `HC-${year}-${seq}`;
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) {
    return null;
  }

  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function buildSummary(record: RegisteredPatientRecord): RegisteredPatientSummary {
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

function normalizeStoreData(data: PatientIntakeStoreData): PatientIntakeStoreData {
  return {
    records: Array.isArray(data.records)
      ? data.records.map((record) => normalizeRegisteredPatientRecord(record))
      : [],
  };
}

/**
 * Crea un paciente de ingreso clinico y lo persiste localmente.
 * Rechaza duplicados por numero de documento.
 */
export function createRegisteredPatient(
  payload: PatientIntakePayload,
  actor: SessionUser
): RegisteredPatientRecord {
  const store = readStore();
  const normalizedDocument = normalizeDocumentNumber(
    payload.identification.documentNumber
  );

  const existing = store.records.find(
    (record) =>
      normalizeDocumentNumber(record.identification.documentNumber) ===
      normalizedDocument
  );
  if (existing) {
    return existing;
  }

  const createdAt = nowIso();
  const age = calculateAge(payload.identification.birthDate);

  const record = normalizeRegisteredPatientRecord({
    id: newPatientId(),
    medicalRecordNumber: buildMedicalRecordNumber(store.records.length),
    source: payload.source,
    createdAt,
    updatedAt: createdAt,
    createdByUserId: actor.id,
    createdByUserName: actor.name,
    identification: {
      ...payload.identification,
      documentNumber: normalizedDocument,
      age,
    },
    contact: payload.contact,
    financing: payload.financing,
    antecedentes: payload.antecedentes,
    consultation: payload.consultation,
    diagnostics: payload.diagnostics,
    therapeuticPlan: payload.therapeuticPlan,
    prescriptions: payload.prescriptions,
    laboratory: payload.laboratory,
    imaging: payload.imaging,
    hospitalization: payload.hospitalization,
    urgency: payload.urgency,
    admission: payload.admission,
    consent: payload.consent,
    interconsultation: payload.interconsultation,
    nursingReport: payload.nursingReport,
    appointments: payload.appointments,
    referrals: payload.referrals,
    publicHealth: payload.publicHealth,
    programTracking: payload.programTracking,
    pharmacyContext: payload.pharmacyContext,
    indicatorsContext: payload.indicatorsContext,
    compliance: payload.compliance,
    mspCompliance: {
      score: 0,
      criticalPendingItems: [],
      forms: [],
      generatedAt: createdAt,
    },
  });

  if (!record.consultation.establishment) {
    record.consultation.establishment = "Hospital General Norte";
  }

  if (!record.consultation.service) {
    record.consultation.service = "Consulta externa";
  }

  if (!record.consultation.professionalName) {
    record.consultation.professionalName = actor.name;
  }

  if (!record.consultation.professionalSenescyt) {
    record.consultation.professionalSenescyt = "SENESCYT-PENDIENTE";
  }

  if (!record.therapeuticPlan.linkedDiagnosisCodes.length && record.diagnostics.length) {
    record.therapeuticPlan.linkedDiagnosisCodes = record.diagnostics
      .map((item) => item.cie11Code)
      .filter(Boolean);
  }

  store.records = [record, ...store.records];
  writeStore(store);

  return record;
}

export function listRegisteredPatients() {
  return readStore().records;
}

export function listRegisteredPatientSummaries() {
  return readStore().records.map(buildSummary);
}

export function getRegisteredPatientById(id: string) {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return null;
  }

  return (
    readStore().records.find((record) => record.id === normalizedId) ?? null
  );
}

export function findRegisteredPatientByDocument(documentNumber: string) {
  const normalizedDocument = normalizeDocumentNumber(documentNumber);
  if (!normalizedDocument) {
    return null;
  }

  return (
    readStore().records.find(
      (record) =>
        normalizeDocumentNumber(record.identification.documentNumber) ===
        normalizedDocument
    ) ?? null
  );
}

export function toRegisteredPatientSummary(record: RegisteredPatientRecord) {
  return buildSummary(record);
}
