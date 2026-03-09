import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { SessionUser } from "@/lib/auth";

export type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

export interface PatientListItem {
  id: string;
  name: string;
  age: number;
  lastTriage: TriageKey;
  lastReason: string;
  lastDate: string;
}

export interface CaseItem {
  id: string;
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  date: string;
  origin: "app" | "web";
  status: "pendiente" | "en_atencion" | "finalizado";
  room?: string;
}

export type AlertSeverity = "Critica" | "Moderada" | "Leve";
export type AlertState = "Activa" | "En seguimiento" | "Resuelta";

export interface AlertItem {
  id: string;
  patientId: string;
  patientName: string;
  detail: string;
  severity: AlertSeverity;
  datetime: string;
  state: AlertState;
  type:
    | "Signos vitales alterados"
    | "Vacuna pendiente"
    | "Medicacion omitida"
    | "Balance hidrico alterado"
    | "Examen critico"
    | "Reporte faltante"
    | "Riesgo alto de triaje"
    | "Riesgo nutricional"
    | "Alerta emocional";
  comments: Array<{
    id: string;
    author: string;
    text: string;
    datetime: string;
  }>;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: SessionUser["role"];
  action:
    | "LOGIN_SUCCESS"
    | "LOGOUT"
    | "CASE_CREATED"
    | "ALERT_UPDATED"
    | "PATIENTS_READ"
    | "CASES_READ"
    | "ALERTS_READ";
  targetType: "auth" | "case" | "alert" | "patient";
  targetId: string;
  detail: string;
}

interface ClinicalStoreData {
  patients: PatientListItem[];
  cases: CaseItem[];
  alerts: AlertItem[];
  audit: AuditEvent[];
}

interface NewCaseInput {
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  origin: "app" | "web";
}

interface UpdateAlertInput {
  state: AlertState;
  comment?: string;
}

const DATA_DIR = path.join(process.cwd(), ".vita-data");
const DATA_FILE = path.join(DATA_DIR, "clinical-store.json");

const initialData: ClinicalStoreData = {
  patients: [
    {
      id: "c1",
      name: "Maria Lopez",
      age: 68,
      lastTriage: "rojo",
      lastReason: "Dolor toracico agudo",
      lastDate: "2026-03-09 08:10",
    },
    {
      id: "c2",
      name: "Juan Perez",
      age: 54,
      lastTriage: "amarillo",
      lastReason: "Disnea moderada",
      lastDate: "2026-03-09 08:42",
    },
    {
      id: "c3",
      name: "Ana Torres",
      age: 32,
      lastTriage: "verde",
      lastReason: "Cefalea tensional",
      lastDate: "2026-03-09 09:03",
    },
  ],
  cases: [
    {
      id: "1",
      triage: "rojo",
      patientName: "Maria Lopez",
      age: 68,
      reason: "Dolor toracico agudo",
      date: "2026-03-09 08:10",
      origin: "app",
      status: "en_atencion",
      room: "Sala de reanimacion 1",
    },
    {
      id: "2",
      triage: "amarillo",
      patientName: "Juan Perez",
      age: 54,
      reason: "Disnea moderada",
      date: "2026-03-09 08:42",
      origin: "web",
      status: "pendiente",
    },
  ],
  alerts: [
    {
      id: "al-1",
      patientId: "p-001",
      patientName: "Maria Lopez",
      detail: "Dolor toracico persistente",
      severity: "Critica",
      datetime: "2026-03-09 09:05",
      state: "Activa",
      type: "Signos vitales alterados",
      comments: [],
    },
    {
      id: "al-2",
      patientId: "p-002",
      patientName: "Juan Perez",
      detail: "Vacuna pendiente: Influenza 2026",
      severity: "Moderada",
      datetime: "2026-03-09 08:40",
      state: "En seguimiento",
      type: "Vacuna pendiente",
      comments: [],
    },
    {
      id: "al-3",
      patientId: "p-003",
      patientName: "Ana Torres",
      detail: "Medicacion pendiente u omitida",
      severity: "Moderada",
      datetime: "2026-03-09 08:55",
      state: "Activa",
      type: "Medicacion omitida",
      comments: [],
    },
  ],
  audit: [],
};

function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function readStore(): ClinicalStoreData {
  ensureStoreFile();

  const fileContent = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(fileContent) as ClinicalStoreData;
}

function writeStore(data: ClinicalStoreData) {
  ensureStoreFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function nowLabel() {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function appendAuditEvent(input: Omit<AuditEvent, "id" | "timestamp">) {
  const store = readStore();

  const event: AuditEvent = {
    id: newId("aud"),
    timestamp: nowLabel(),
    ...input,
  };

  store.audit = [event, ...store.audit].slice(0, 500);
  writeStore(store);

  return event;
}

export function listAuditEvents(limit = 30) {
  const store = readStore();
  return store.audit.slice(0, limit);
}

export function listPatients() {
  return readStore().patients;
}

export function listCases() {
  return readStore().cases;
}

export function createCase(input: NewCaseInput, actor: SessionUser) {
  const store = readStore();

  const item: CaseItem = {
    id: newId("case"),
    triage: input.triage,
    patientName: input.patientName.trim(),
    age: input.age,
    reason: input.reason.trim(),
    date: nowLabel(),
    origin: input.origin,
    status: "en_atencion",
    room: "Sala de observacion 1",
  };

  store.cases = [item, ...store.cases];
  writeStore(store);

  appendAuditEvent({
    actorName: actor.name,
    actorRole: actor.role,
    action: "CASE_CREATED",
    targetType: "case",
    targetId: item.id,
    detail: `Caso creado para ${item.patientName} con triaje ${item.triage}.`,
  });

  return item;
}

export function listAlerts() {
  return readStore().alerts;
}

export function updateAlert(id: string, input: UpdateAlertInput, actor: SessionUser) {
  const store = readStore();
  const alert = store.alerts.find((item) => item.id === id);

  if (!alert) {
    return null;
  }

  alert.state = input.state;
  alert.datetime = nowLabel();

  if (input.comment && input.comment.trim()) {
    alert.comments = [
      {
        id: newId("comment"),
        author: actor.name,
        text: input.comment.trim(),
        datetime: nowLabel(),
      },
      ...alert.comments,
    ];
  }

  writeStore(store);

  appendAuditEvent({
    actorName: actor.name,
    actorRole: actor.role,
    action: "ALERT_UPDATED",
    targetType: "alert",
    targetId: alert.id,
    detail: `Alerta ${alert.id} actualizada a estado ${alert.state}.`,
  });

  return alert;
}
