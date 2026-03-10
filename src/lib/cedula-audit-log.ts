import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { CedulaAuditResult } from "@/types/paciente-cedula";

export interface CedulaAuditLogEntry {
  id: string;
  cedula_consultada: string;
  profesional_id: string;
  timestamp: string;
  resultado: CedulaAuditResult;
}

const DATA_DIR = process.env.VERCEL ? "/tmp/vita-data" : path.join(process.cwd(), ".vita-data");
const DATA_FILE = path.join(DATA_DIR, "cedula-audit-log.json");

function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readEntries(): CedulaAuditLogEntry[] {
  try {
    ensureStoreFile();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as CedulaAuditLogEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: CedulaAuditLogEntry[]) {
  try {
    ensureStoreFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
  } catch {
    // Se evita interrumpir el flujo clínico si falla la persistencia local.
  }
}

function buildId() {
  return `ced-aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Registra auditoría legal de consulta de cédula.
 * Este log se guarda server-side y nunca se expone al cliente.
 */
export function appendCedulaAuditLog(input: {
  cedula_consultada: string;
  profesional_id: string;
  resultado: CedulaAuditResult;
}) {
  const entries = readEntries();
  const entry: CedulaAuditLogEntry = {
    id: buildId(),
    cedula_consultada: input.cedula_consultada,
    profesional_id: input.profesional_id,
    resultado: input.resultado,
    timestamp: new Date().toISOString(),
  };

  entries.unshift(entry);
  writeEntries(entries.slice(0, 5000));
  return entry;
}

export function listCedulaAuditLog(limit = 100) {
  return readEntries().slice(0, limit);
}
