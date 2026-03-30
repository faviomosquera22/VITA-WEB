export type AppointmentStatus =
  | "Confirmada"
  | "Pendiente"
  | "Requiere confirmacion"
  | "Completada";

export type AppointmentMode = "Presencial" | "Teleconsulta";

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  specialty: string;
  clinician: string;
  date: string;
  time: string;
  durationMinutes: number;
  mode: AppointmentMode;
  location: string;
  status: AppointmentStatus;
  reminderWorkflow: string;
  notes: string;
}

export interface AvailabilitySlot {
  id: string;
  dayLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  specialty: string;
  clinician: string;
  mode: AppointmentMode;
  status: "Disponible" | "Reservado" | "Bloqueado";
}

export const appointmentRecords: AppointmentRecord[] = [
  {
    id: "appt-001",
    patientId: "p-005",
    patientName: "Sofia Mendoza",
    specialty: "Medicina interna",
    clinician: "Dra. Camila Rojas",
    date: "2026-03-31",
    time: "09:00",
    durationMinutes: 30,
    mode: "Presencial",
    location: "Consultorio 2 · Hospital General Norte",
    status: "Confirmada",
    reminderWorkflow: "appointment-reminder-dispatch",
    notes: "Control de glicemia y ajuste de medicacion.",
  },
  {
    id: "appt-002",
    patientId: "p-002",
    patientName: "Carlos Vega",
    specialty: "Neumologia",
    clinician: "Dr. Martin Jara",
    date: "2026-03-31",
    time: "11:30",
    durationMinutes: 20,
    mode: "Teleconsulta",
    location: "Sala virtual Vita",
    status: "Requiere confirmacion",
    reminderWorkflow: "appointment-reminder-dispatch",
    notes: "Revision de saturacion y adherencia inhalatoria.",
  },
  {
    id: "appt-003",
    patientId: "p-001",
    patientName: "Maria Fernanda Lopez",
    specialty: "Cardiologia",
    clinician: "Dra. Elena Paredes",
    date: "2026-04-01",
    time: "08:15",
    durationMinutes: 40,
    mode: "Presencial",
    location: "Unidad Coronaria",
    status: "Pendiente",
    reminderWorkflow: "appointment-reminder-dispatch",
    notes: "Ecocardiograma y control post evento agudo.",
  },
  {
    id: "appt-004",
    patientId: "p-003",
    patientName: "Andrea Chango",
    specialty: "Neurologia",
    clinician: "Dr. Jorge Salas",
    date: "2026-04-01",
    time: "15:10",
    durationMinutes: 25,
    mode: "Teleconsulta",
    location: "Sala virtual Vita",
    status: "Confirmada",
    reminderWorkflow: "appointment-reminder-dispatch",
    notes: "Seguimiento de cefalea y respuesta al plan ambulatorio.",
  },
  {
    id: "appt-005",
    patientId: "p-004",
    patientName: "Juan Carlos Rivas",
    specialty: "Medicina familiar",
    clinician: "Lic. Daniela Naranjo",
    date: "2026-04-02",
    time: "10:20",
    durationMinutes: 20,
    mode: "Presencial",
    location: "Consulta externa 4",
    status: "Completada",
    reminderWorkflow: "appointment-reminder-dispatch",
    notes: "Control de egreso y educacion en autocuidado.",
  },
];

export const availabilitySlots: AvailabilitySlot[] = [
  {
    id: "slot-001",
    dayLabel: "Mar 31",
    date: "2026-03-31",
    startTime: "09:00",
    endTime: "09:30",
    specialty: "Medicina interna",
    clinician: "Dra. Camila Rojas",
    mode: "Presencial",
    status: "Reservado",
  },
  {
    id: "slot-002",
    dayLabel: "Mar 31",
    date: "2026-03-31",
    startTime: "10:00",
    endTime: "10:20",
    specialty: "Nutricion",
    clinician: "Lcda. Paula Mena",
    mode: "Teleconsulta",
    status: "Disponible",
  },
  {
    id: "slot-003",
    dayLabel: "Abr 01",
    date: "2026-04-01",
    startTime: "08:15",
    endTime: "08:55",
    specialty: "Cardiologia",
    clinician: "Dra. Elena Paredes",
    mode: "Presencial",
    status: "Reservado",
  },
  {
    id: "slot-004",
    dayLabel: "Abr 01",
    date: "2026-04-01",
    startTime: "11:00",
    endTime: "11:30",
    specialty: "Salud mental",
    clinician: "Lic. Andres Viteri",
    mode: "Teleconsulta",
    status: "Disponible",
  },
  {
    id: "slot-005",
    dayLabel: "Abr 02",
    date: "2026-04-02",
    startTime: "14:00",
    endTime: "14:30",
    specialty: "Control de enfermeria",
    clinician: "Lic. Daniela Naranjo",
    mode: "Presencial",
    status: "Bloqueado",
  },
];

export function getAppointmentMetrics() {
  return {
    total: appointmentRecords.length,
    upcoming: appointmentRecords.filter((item) => item.status !== "Completada").length,
    needsConfirmation: appointmentRecords.filter((item) => item.status === "Requiere confirmacion").length,
    remote: appointmentRecords.filter((item) => item.mode === "Teleconsulta").length,
  };
}
