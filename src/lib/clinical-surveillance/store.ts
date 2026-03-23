import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { SessionUser } from "@/lib/auth";
import {
  buildGenerationAuditEntry,
  buildStatusAuditEntry,
  createObservationAuditEntry,
} from "@/lib/clinical-surveillance/audit-log";
import type {
  ClinicalObservation,
  ObservationAuditEntry,
  ObservationReviewInput,
} from "@/lib/clinical-surveillance/types";

interface ClinicalSurveillanceStoreData {
  observations: ClinicalObservation[];
  auditEntries: ObservationAuditEntry[];
  lastGeneratedAt: string | null;
}

const DATA_DIR = process.env.VERCEL
  ? "/tmp/vita-data"
  : path.join(process.cwd(), ".vita-data");
const DATA_FILE = path.join(DATA_DIR, "clinical-surveillance-store.json");

const initialStoreData: ClinicalSurveillanceStoreData = {
  observations: [],
  auditEntries: [],
  lastGeneratedAt: null,
};

let memoryStore: ClinicalSurveillanceStoreData = clone(initialStoreData);

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialStoreData, null, 2), "utf8");
    }
  } catch {
    // Memory fallback remains available.
  }
}

function readStore() {
  try {
    ensureStoreFile();
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(content) as ClinicalSurveillanceStoreData;
  } catch {
    return clone(memoryStore);
  }
}

function writeStore(store: ClinicalSurveillanceStoreData) {
  memoryStore = clone(store);

  try {
    ensureStoreFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Memory fallback remains available.
  }
}

function clone<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildObservationId() {
  return `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findLatestObservationByDedupeKey(
  observations: ClinicalObservation[],
  dedupeKey: string
) {
  return observations
    .filter((item) => item.dedupeKey === dedupeKey)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;
}

function replaceObservation(
  observations: ClinicalObservation[],
  nextObservation: ClinicalObservation
) {
  return observations.map((item) => (item.id === nextObservation.id ? nextObservation : item));
}

export function syncClinicalSurveillanceObservations(input: {
  generatedAt: string;
  observations: ClinicalObservation[];
}) {
  const store = readStore();
  const currentDedupeKeys = new Set(input.observations.map((observation) => observation.dedupeKey));
  const currentObservations: ClinicalObservation[] = [];

  for (const generatedObservation of input.observations) {
    const latest = findLatestObservationByDedupeKey(store.observations, generatedObservation.dedupeKey);

    if (latest && ["new", "acknowledged"].includes(latest.status)) {
      const updatedObservation: ClinicalObservation = {
        ...latest,
        ...generatedObservation,
        id: latest.id,
        createdAt: latest.createdAt,
        updatedAt: input.generatedAt,
        status: latest.status,
        reviewedAt: latest.reviewedAt,
        reviewedBy: latest.reviewedBy,
      };

      store.observations = replaceObservation(store.observations, updatedObservation);
      currentObservations.push(updatedObservation);
      continue;
    }

    const createdObservation: ClinicalObservation = {
      ...generatedObservation,
      id: buildObservationId(),
      createdAt: input.generatedAt,
      updatedAt: input.generatedAt,
      reviewedAt: null,
      reviewedBy: null,
      status: "new",
    };

    store.observations = [createdObservation, ...store.observations];
    store.auditEntries = [
      buildGenerationAuditEntry(
        createdObservation,
        latest ? "regenerated" : "generated"
      ),
      ...store.auditEntries,
    ];
    currentObservations.push(createdObservation);
  }

  const observationsToResolve = store.observations.filter(
    (observation) =>
      ["new", "acknowledged"].includes(observation.status) &&
      !currentDedupeKeys.has(observation.dedupeKey)
  );

  for (const observation of observationsToResolve) {
    const resolvedObservation: ClinicalObservation = {
      ...observation,
      status: "resolved",
      updatedAt: input.generatedAt,
      reviewedAt: input.generatedAt,
      reviewedBy: "Sistema de vigilancia",
    };

    store.observations = replaceObservation(store.observations, resolvedObservation);
    store.auditEntries = [
      createObservationAuditEntry({
        observationId: resolvedObservation.id,
        action: "resolved",
        actorName: "Sistema de vigilancia",
        actorRole: "system",
        createdAt: input.generatedAt,
        detail:
          "La observacion se marco como resuelta porque el motor de reglas dejo de detectarla en la ejecucion actual.",
        metadata: {
          dedupeKey: resolvedObservation.dedupeKey,
        },
      }),
      ...store.auditEntries,
    ];
  }

  store.lastGeneratedAt = input.generatedAt;
  writeStore(store);

  return currentObservations.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function updateClinicalSurveillanceObservation(
  id: string,
  input: ObservationReviewInput,
  actor: SessionUser
) {
  const store = readStore();
  const observation = store.observations.find((item) => item.id === id);

  if (!observation) {
    return null;
  }

  const updatedObservation: ClinicalObservation = {
    ...observation,
    status: input.status,
    updatedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: actor.name,
  };

  store.observations = replaceObservation(store.observations, updatedObservation);
  store.auditEntries = [
    buildStatusAuditEntry(
      updatedObservation,
      actor,
      input.comment?.trim()
        ? `${input.comment.trim()}`
        : `Observacion marcada como ${updatedObservation.status}.`
    ),
    ...store.auditEntries,
  ];
  writeStore(store);

  return updatedObservation;
}

export function listObservationAuditEntries(observationIds?: string[]) {
  const store = readStore();
  if (!observationIds?.length) {
    return store.auditEntries;
  }

  const observationIdSet = new Set(observationIds);
  return store.auditEntries.filter((entry) => observationIdSet.has(entry.observationId));
}
