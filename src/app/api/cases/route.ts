import { NextResponse } from "next/server";

type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

export interface CaseItem {
  id: string;
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  date: string;
  origin: "app" | "web";
  status?: "pendiente" | "en_atencion" | "finalizado";
  room?: string;
}

interface NewCasePayload {
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  origin: "app" | "web";
}

// 🧪 Datos demo iniciales
let demoCases: CaseItem[] = [
  {
    id: "1",
    triage: "rojo",
    patientName: "María López",
    age: 68,
    reason: "Dolor torácico agudo",
    date: "28 nov · 13:10",
    origin: "app",
    status: "en_atencion",
    room: "Sala de reanimación 1",
  },
  {
    id: "2",
    triage: "amarillo",
    patientName: "Juan Pérez",
    age: 54,
    reason: "Disnea moderada",
    date: "28 nov · 12:40",
    origin: "web",
    status: "pendiente",
  },
  {
    id: "3",
    triage: "verde",
    patientName: "Ana Torres",
    age: 32,
    reason: "Dolor lumbar",
    date: "27 nov · 11:15",
    origin: "app",
    status: "finalizado",
  },
  {
    id: "4",
    triage: "azul",
    patientName: "Carlos Gómez",
    age: 21,
    reason: "Dolor de garganta leve",
    date: "27 nov · 10:05",
    origin: "web",
    status: "pendiente",
  },
];

// GET /api/cases → devuelve todos los casos
export async function GET() {
  return NextResponse.json(demoCases);
}

// POST /api/cases → crea un caso nuevo (por ejemplo desde la app móvil)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NewCasePayload;

    // Validación básica
    if (!body.triage || !body.patientName || !body.reason) {
      return NextResponse.json(
        { error: "Faltan campos en el payload" },
        { status: 400 }
      );
    }

    const now = new Date();
    const formattedDate = now.toLocaleString("es-EC", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newCase: CaseItem = {
      id: String(Date.now()),
      triage: body.triage,
      patientName: body.patientName,
      age: body.age,
      reason: body.reason,
      date: formattedDate,
      origin: body.origin ?? "app",
      status: "en_atencion",
      room: "Sala de observación 1",
    };

    // Lo ponemos al inicio para que se vea primero
    demoCases = [newCase, ...demoCases];

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/cases:", error);
    return NextResponse.json(
      { error: "Error procesando el caso" },
      { status: 500 }
    );
  }
}