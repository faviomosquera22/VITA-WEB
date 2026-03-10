export type HospitalBedState = "Ocupada" | "Disponible" | "Limpieza" | "Reservada";

export interface HospitalRoom {
  id: string;
  label: string;
  floor: string;
  service: string;
}

export interface HospitalBedSlot {
  id: string;
  roomId: string;
  bedLabel: string;
  state: HospitalBedState;
  patientId?: string;
}

export const hospitalRooms: HospitalRoom[] = [
  {
    id: "sala-a",
    label: "Sala A",
    floor: "Piso 1",
    service: "Hospitalizacion adultos",
  },
  {
    id: "sala-b",
    label: "Sala B",
    floor: "Piso 1",
    service: "Hospitalizacion intermedia",
  },
  {
    id: "sala-c",
    label: "Sala C",
    floor: "Piso 2",
    service: "Observacion clinica",
  },
];

export const hospitalBedSlots: HospitalBedSlot[] = [
  { id: "bed-a-01", roomId: "sala-a", bedLabel: "A-01", state: "Ocupada", patientId: "p-001" },
  { id: "bed-a-02", roomId: "sala-a", bedLabel: "A-02", state: "Ocupada", patientId: "p-002" },
  { id: "bed-a-03", roomId: "sala-a", bedLabel: "A-03", state: "Limpieza" },
  { id: "bed-a-04", roomId: "sala-a", bedLabel: "A-04", state: "Disponible" },
  { id: "bed-b-01", roomId: "sala-b", bedLabel: "B-01", state: "Ocupada", patientId: "p-005" },
  { id: "bed-b-02", roomId: "sala-b", bedLabel: "B-02", state: "Reservada" },
  { id: "bed-b-03", roomId: "sala-b", bedLabel: "B-03", state: "Disponible" },
  { id: "bed-b-04", roomId: "sala-b", bedLabel: "B-04", state: "Disponible" },
  { id: "bed-c-01", roomId: "sala-c", bedLabel: "C-01", state: "Ocupada", patientId: "p-003" },
  { id: "bed-c-02", roomId: "sala-c", bedLabel: "C-02", state: "Disponible" },
  { id: "bed-c-03", roomId: "sala-c", bedLabel: "C-03", state: "Disponible" },
  { id: "bed-c-04", roomId: "sala-c", bedLabel: "C-04", state: "Limpieza" },
];

export type SurgicalRoomState = "Disponible" | "En uso" | "Limpieza" | "Reservada";

export interface SurgicalRoom {
  id: string;
  label: string;
  specialty: string;
  state: SurgicalRoomState;
  currentCaseId?: string;
  nextCaseAt?: string;
}

export const surgicalRooms: SurgicalRoom[] = [
  {
    id: "or-1",
    label: "Pabellon 1",
    specialty: "Cirugia general",
    state: "En uso",
    currentCaseId: "sx-2",
    nextCaseAt: "14:30",
  },
  {
    id: "or-2",
    label: "Pabellon 2",
    specialty: "Cardiovascular",
    state: "Reservada",
    currentCaseId: "sx-1",
    nextCaseAt: "16:00",
  },
  {
    id: "or-3",
    label: "Pabellon 3",
    specialty: "Trauma",
    state: "Limpieza",
    currentCaseId: "sx-3",
    nextCaseAt: "13:15",
  },
  {
    id: "or-4",
    label: "Pabellon 4",
    specialty: "Ambulatoria",
    state: "Disponible",
    nextCaseAt: "Sin cirugias programadas",
  },
];

