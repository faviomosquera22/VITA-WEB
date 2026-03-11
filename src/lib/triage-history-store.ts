import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { SessionUser } from "@/lib/auth";
import type {
  TriageEngineResult,
  TriageInput,
  TriageManualOverride,
} from "@/lib/triage/triageTypes";

export interface TriageDecisionHistoryEntry {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorName: string;
  actorRole: SessionUser["role"];
  action: "confirmar" | "reclasificar";
  patientName: string;
  patientDocument: string;
  suggestedColor: TriageEngineResult["suggestedColor"];
  suggestedPriority: TriageEngineResult["priority"];
  suggestedMaxWaitMinutes: number;
  finalColor: TriageEngineResult["suggestedColor"];
  finalPriority: TriageEngineResult["priority"];
  finalMaxWaitMinutes: number;
  overrideReason: string;
  reasons: string[];
  protocolsActivated: string[];
  alerts: string[];
  immediateActions: string[];
  missingData: string[];
  inputSnapshot: TriageInput;
}

interface TriageHistoryStoreData {
  records: TriageDecisionHistoryEntry[];
}

interface CreateHistoryEntryInput {
  triageInput: TriageInput;
  engineResult: TriageEngineResult;
  manualOverride?: TriageManualOverride | null;
}

const DATA_DIR = process.env.VERCEL
  ? "/tmp/vita-data"
  : path.join(process.cwd(), ".vita-data");
const DATA_FILE = path.join(DATA_DIR, "triage-history-store.json");

const initialData: TriageHistoryStoreData = {
  records: [],
};

let memoryStore: TriageHistoryStoreData = clone(initialData);

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
  } catch {
    // Ignore persistence issue and use in-memory fallback.
  }
}

function readStore() {
  try {
    ensureStoreFile();
    const fileContent = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(fileContent) as TriageHistoryStoreData;
  } catch {
    return clone(memoryStore);
  }
}

function writeStore(data: TriageHistoryStoreData) {
  memoryStore = clone(data);

  try {
    ensureStoreFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Keep in-memory fallback.
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `triage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerTriageDecision(
  input: CreateHistoryEntryInput,
  actor: SessionUser
): TriageDecisionHistoryEntry {
  const store = readStore();
  const override = input.manualOverride ?? null;

  const entry: TriageDecisionHistoryEntry = {
    id: newId(),
    createdAt: nowIso(),
    actorUserId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: override ? "reclasificar" : "confirmar",
    patientName: input.triageInput.identification.patientName,
    patientDocument: input.triageInput.identification.documentNumber,
    suggestedColor: input.engineResult.suggestedColor,
    suggestedPriority: input.engineResult.priority,
    suggestedMaxWaitMinutes: input.engineResult.maxWaitMinutes,
    finalColor: override ? override.color : input.engineResult.suggestedColor,
    finalPriority: override ? override.priority : input.engineResult.priority,
    finalMaxWaitMinutes: override
      ? override.maxWaitMinutes
      : input.engineResult.maxWaitMinutes,
    overrideReason: override?.reason ?? "",
    reasons: input.engineResult.reasons,
    protocolsActivated: input.engineResult.protocolsActivated,
    alerts: input.engineResult.alerts,
    immediateActions: input.engineResult.immediateActions,
    missingData: input.engineResult.missingData,
    inputSnapshot: input.triageInput,
  };

  store.records = [entry, ...store.records].slice(0, 1000);
  writeStore(store);

  return entry;
}

export function listTriageDecisionHistory(limit = 50) {
  const safeLimit = Math.max(1, Math.min(200, limit));
  return readStore().records.slice(0, safeLimit);
}
