import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { SessionUser } from "@/lib/auth";
import type {
  TriageAuditEntry,
  TriageFormData,
  TriagePriority,
  TriageResult,
  UnifiedTriageColor,
} from "@/lib/triage/triageTypes";

interface StoredTriageRecord {
  id: string;
  patientId: string;
  triageSessionId: string;
  formData: Omit<TriageFormData, "sexualViolence"> & {
    sexualViolence?: "__encrypted__";
  };
  encryptedSexualViolence?: string;
  suggestedColor: UnifiedTriageColor;
  suggestedPriority: TriagePriority;
  confirmedColor?: UnifiedTriageColor;
  confirmedPriority?: TriagePriority;
  triageNurseId: string;
  confirmedById?: string;
  confirmedAt?: string;
  reclassificationReason?: string;
  codePurple: boolean;
  mandatoryNotification: boolean;
  activatedSubprotocols: string[];
  auditTrail: TriageAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

interface TriageRecordStore {
  records: StoredTriageRecord[];
}

interface ConfirmTriageInput {
  confirmedLevel: UnifiedTriageColor;
  reclassificationReason?: string;
}

const DATA_DIR = process.env.VERCEL ? "/tmp/vita-data" : path.join(process.cwd(), ".vita-data");
const DATA_FILE = path.join(DATA_DIR, "triage-records.json");

const initialStore: TriageRecordStore = {
  records: [],
};

let memoryStore: TriageRecordStore = clone(initialStore);

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialStore, null, 2), "utf8");
    }
  } catch {
    // ignore and fallback to memory
  }
}

function readStore(): TriageRecordStore {
  try {
    ensureStoreFile();
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(content) as TriageRecordStore;
  } catch {
    return clone(memoryStore);
  }
}

function writeStore(store: TriageRecordStore) {
  memoryStore = clone(store);

  try {
    ensureStoreFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // ignore and keep memory fallback
  }
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `tri-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveEncryptionKey(): Buffer {
  const raw = process.env.VITA_SENSITIVE_DATA_KEY ?? process.env.VITA_SESSION_SECRET ?? "vita-dev-sensitive-key";
  return crypto.createHash("sha256").update(raw).digest();
}

function encryptSensitivePayload(payload: unknown): string {
  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  });
}

function decryptSensitivePayload<T>(ciphertext: string): T | null {
  try {
    const key = resolveEncryptionKey();
    const parsed = JSON.parse(ciphertext) as { iv: string; tag: string; data: string };
    const iv = Buffer.from(parsed.iv, "base64");
    const tag = Buffer.from(parsed.tag, "base64");
    const encrypted = Buffer.from(parsed.data, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

export function createTriageRecord(
  input: TriageFormData,
  actor: SessionUser,
  serverResult: TriageResult
): StoredTriageRecord {
  const store = readStore();
  const now = nowIso();

  const id = newId();
  const patientId = input.identification.patientId ?? input.identification.cedula ?? "unknown-patient";

  const formData = clone(input);
  let encryptedSexualViolence: string | undefined;

  if (formData.sexualViolence) {
    encryptedSexualViolence = encryptSensitivePayload(formData.sexualViolence);
    delete formData.sexualViolence;
    (formData as StoredTriageRecord["formData"]).sexualViolence = "__encrypted__";
  }

  const record: StoredTriageRecord = {
    id,
    patientId,
    triageSessionId: serverResult.triageSessionId,
    formData: formData as StoredTriageRecord["formData"],
    encryptedSexualViolence,
    suggestedColor: serverResult.suggestedColor,
    suggestedPriority: serverResult.suggestedPriority,
    confirmedColor: input.confirmedLevel,
    confirmedPriority: resolvePriorityFromColor(input.confirmedLevel),
    triageNurseId: actor.id,
    confirmedById: input.confirmedBy,
    confirmedAt: input.confirmedAt,
    reclassificationReason: input.reclassificationReason,
    codePurple: serverResult.codePurple,
    mandatoryNotification: serverResult.mandatoryNotification,
    activatedSubprotocols: serverResult.activatedSubprotocols,
    auditTrail: appendAuditTrail(input.auditTrail, {
      action: "modified",
      userId: actor.id,
      userName: actor.name,
      timestamp: now,
      reason: "Guardado server-side",
    }),
    createdAt: now,
    updatedAt: now,
  };

  store.records = [record, ...store.records].slice(0, 5000);
  writeStore(store);

  return record;
}

export function listTriageHistoryByPatient(patientId: string): Array<
  StoredTriageRecord & {
    decryptedSexualViolence?: TriageFormData["sexualViolence"];
  }
> {
  return readStore()
    .records
    .filter((record) => record.patientId === patientId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((record) => {
      if (!record.encryptedSexualViolence) {
        return record;
      }

      return {
        ...record,
        decryptedSexualViolence: decryptSensitivePayload<TriageFormData["sexualViolence"]>(
          record.encryptedSexualViolence
        ) ?? undefined,
      };
    });
}

export function confirmTriageRecord(
  triageId: string,
  input: ConfirmTriageInput,
  actor: SessionUser
) {
  const store = readStore();
  const record = store.records.find((item) => item.id === triageId);

  if (!record) {
    return null;
  }

  const previousColor = record.confirmedColor ?? record.suggestedColor;
  const nextColor = input.confirmedLevel;
  const nextPriority = resolvePriorityFromColor(nextColor);

  if (!nextPriority) {
    return null;
  }

  const isReclassification = nextColor !== record.suggestedColor;
  if (isReclassification && !input.reclassificationReason?.trim()) {
    throw new Error("La razon es obligatoria para reclasificar.");
  }

  const now = nowIso();
  record.confirmedColor = nextColor;
  record.confirmedPriority = nextPriority;
  record.confirmedById = actor.id;
  record.confirmedAt = now;
  record.reclassificationReason = input.reclassificationReason?.trim();
  record.updatedAt = now;
  record.auditTrail = appendAuditTrail(record.auditTrail, {
    action: isReclassification ? "reclassified" : "confirmed",
    userId: actor.id,
    userName: actor.name,
    timestamp: now,
    previousValue: previousColor,
    newValue: nextColor,
    reason: input.reclassificationReason?.trim(),
  });

  writeStore(store);
  return clone(record);
}

function appendAuditTrail(existing: TriageAuditEntry[], newEntry: TriageAuditEntry) {
  // Append-only: never mutate existing entries.
  return [...existing, newEntry];
}

function resolvePriorityFromColor(color?: UnifiedTriageColor): TriagePriority | undefined {
  switch (color) {
    case "RED":
      return 1;
    case "ORANGE":
      return 2;
    case "YELLOW":
      return 3;
    case "GREEN":
      return 4;
    case "BLUE":
      return 5;
    default:
      return undefined;
  }
}
