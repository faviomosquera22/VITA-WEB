import { NextResponse } from "next/server";

type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

interface PatientItem {
  id: string;
  name: string;
  age: number;
  lastTriage: TriageKey;
  lastReason: string;
  lastDate?: string;
}

const demoPatients: PatientItem[] = [
  {
    id: "c1",
    name: "María López",
    age: 68,
    lastTriage: "rojo",
    lastReason: "Dolor torácico agudo",
    lastDate: "28 nov · 13:10",
  },
  {
    id: "c2",
    name: "Paciente iPhone",
    age: 30,
    lastTriage: "naranja",
    lastReason: "Fiebre y tos desde app móvil",
    lastDate: "29/11/2025, 5:26:56 p. m.",
  },
  {
    id: "c3",
    name: "Juan Pérez",
    age: 54,
    lastTriage: "amarillo",
    lastReason: "Disnea moderada",
    lastDate: "28 nov · 12:40",
  },
  {
    id: "c4",
    name: "Ana Torres",
    age: 32,
    lastTriage: "verde",
    lastReason: "Cefalea tensional",
    lastDate: "27 nov · 11:15",
  },
];

export async function GET() {
  return NextResponse.json(demoPatients);
}