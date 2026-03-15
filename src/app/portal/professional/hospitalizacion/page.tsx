"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage } from "../_components/clinical-ui";
import {
  getPatientById,
  mockPatients,
  type CarePlanRecord,
  type FluidBalanceRecord,
  type PatientRecord,
} from "../_data/clinical-mock-data";
import {
  hospitalBedSlots,
  hospitalRooms,
  type HospitalBedSlot,
  type HospitalBedState,
} from "../_data/facility-layout-mock-data";

type HospitalizationTab = "beds" | "admissions" | "care_plan" | "discharge";
type ActionPanel = "report" | "admission" | "discharge" | null;
type AdtAction = "Admision" | "Traslado" | "Alta";
type StayStatus = "Activa" | "Alta planificada" | "Alta registrada";
type CareTaskStatus = "En curso" | "Pendiente" | "Programada" | "Completada";
type CareTaskSource = "Enfermeria" | "Medico" | "Laboratorio" | "Farmacia" | "Alta";

type HospitalAdtEvent = {
  id: string;
  datetime: string;
  action: AdtAction;
  patientId: string;
  roomId: string;
  bedLabel: string;
  detail: string;
  owner: string;
};

type HospitalStayMeta = {
  id: string;
  patientId: string;
  bedId: string;
  admittedAt: string;
  estimatedStayHours: number;
  plannedDischargeAt?: string;
  destinationPlan: string;
  attending: string;
  notes: string;
  status: StayStatus;
};

type CareTask = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  actionLabel: string;
  dueLabel: string;
  source: CareTaskSource;
  status: CareTaskStatus;
  urgent: boolean;
};

const referenceNow = "2026-03-15T12:50:00";

const initialAdtEvents: HospitalAdtEvent[] = [
  {
    id: "adt-001",
    datetime: "2026-03-14T20:10:00",
    action: "Admision",
    patientId: "p-001",
    roomId: "sala-a",
    bedLabel: "A-01",
    detail: "Ingreso por dolor toracico y protocolo SCA activado.",
    owner: "Lic. Daniela Naranjo",
  },
  {
    id: "adt-002",
    datetime: "2026-03-15T08:40:00",
    action: "Traslado",
    patientId: "p-002",
    roomId: "sala-a",
    bedLabel: "A-02",
    detail: "Traslado desde observacion a cama monitorizada por disnea persistente.",
    owner: "Dr. Luis Herrera",
  },
  {
    id: "adt-003",
    datetime: "2026-03-15T07:20:00",
    action: "Admision",
    patientId: "p-005",
    roomId: "sala-b",
    bedLabel: "B-01",
    detail: "Ingreso por hiperglucemia sintomatica y control metabolico intensivo.",
    owner: "Lic. Daniela Naranjo",
  },
  {
    id: "adt-004",
    datetime: "2026-03-14T18:20:00",
    action: "Admision",
    patientId: "p-003",
    roomId: "sala-c",
    bedLabel: "C-01",
    detail: "Ingreso a observacion clinica para control de dolor y vigilancia.",
    owner: "Dra. Sofia Montalvo",
  },
];

const initialStayMeta: HospitalStayMeta[] = [
  {
    id: "stay-001",
    patientId: "p-001",
    bedId: "bed-a-01",
    admittedAt: "2026-03-14T20:10:00",
    estimatedStayHours: 48,
    plannedDischargeAt: "2026-03-16T09:00:00",
    destinationPlan: "Observacion clinica y seguimiento cardiologico",
    attending: "Dr. Vargas",
    notes: "Subprotocolo SCA activo. Monitoreo continuo y control glucemico estricto.",
    status: "Alta planificada",
  },
  {
    id: "stay-002",
    patientId: "p-002",
    bedId: "bed-a-02",
    admittedAt: "2026-03-15T08:40:00",
    estimatedStayHours: 36,
    destinationPlan: "Hospitalizacion intermedia",
    attending: "Dr. Luis Herrera",
    notes: "Control respiratorio y seguimiento de respuesta a oxigenoterapia.",
    status: "Activa",
  },
  {
    id: "stay-003",
    patientId: "p-005",
    bedId: "bed-b-01",
    admittedAt: "2026-03-15T07:20:00",
    estimatedStayHours: 30,
    plannedDischargeAt: "2026-03-16T10:00:00",
    destinationPlan: "Alta con control DM + HTA",
    attending: "Dra. Camila Rojas",
    notes: "Ajuste insulinico y vigilancia de respuesta antes del alta.",
    status: "Alta planificada",
  },
  {
    id: "stay-004",
    patientId: "p-003",
    bedId: "bed-c-01",
    admittedAt: "2026-03-14T18:20:00",
    estimatedStayHours: 24,
    destinationPlan: "Observacion clinica corta estancia",
    attending: "Dra. Sofia Montalvo",
    notes: "Vigilar dolor, tolerancia oral y posibilidad de alta en 24 horas.",
    status: "Activa",
  },
];

const tabDefinitions: Array<{ id: HospitalizationTab; label: string }> = [
  { id: "beds", label: "Mapa de camas" },
  { id: "admissions", label: "Admisiones activas" },
  { id: "care_plan", label: "Plan de cuidados" },
  { id: "discharge", label: "Alta planificada" },
];

export default function HospitalizationPage() {
  const [activeTab, setActiveTab] = useState<HospitalizationTab>("beds");
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null);
  const [beds, setBeds] = useState<HospitalBedSlot[]>(hospitalBedSlots);
  const [adtEvents, setAdtEvents] = useState<HospitalAdtEvent[]>(initialAdtEvents);
  const [stayMeta, setStayMeta] = useState<HospitalStayMeta[]>(initialStayMeta);
  const [selectedBedId, setSelectedBedId] = useState<string>(
    hospitalBedSlots.find((slot) => slot.patientId)?.id ?? hospitalBedSlots[0]?.id ?? ""
  );
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState(referenceNow);
  const [admissionForm, setAdmissionForm] = useState({
    patientId: "p-004",
    targetBedId:
      hospitalBedSlots.find((slot) => slot.state === "Disponible")?.id ?? hospitalBedSlots[0]?.id ?? "",
    origin: "Emergencia",
    note: "",
  });
  const [dischargeForm, setDischargeForm] = useState({
    patientId: "",
    dischargeAt: "2026-03-15T15:00",
    destination: "Alta a domicilio",
    summary: "",
  });

  const occupiedBeds = useMemo(() => beds.filter((slot) => slot.state === "Ocupada"), [beds]);
  const availableBeds = useMemo(() => beds.filter((slot) => slot.state === "Disponible"), [beds]);
  const cleaningBeds = useMemo(() => beds.filter((slot) => slot.state === "Limpieza"), [beds]);
  const activeAdmissions = useMemo(
    () => stayMeta.filter((stay) => stay.status !== "Alta registrada"),
    [stayMeta]
  );
  const plannedDischarges = useMemo(
    () =>
      stayMeta.filter(
        (stay) => stay.status === "Alta planificada" && Boolean(stay.plannedDischargeAt)
      ),
    [stayMeta]
  );
  const occupancyPercent = beds.length ? Math.round((occupiedBeds.length / beds.length) * 100) : 0;
  const selectedBed =
    beds.find((slot) => slot.id === selectedBedId) ??
    beds.find((slot) => slot.patientId) ??
    beds[0] ??
    null;
  const selectedRoom = selectedBed
    ? hospitalRooms.find((room) => room.id === selectedBed.roomId) ?? hospitalRooms[0] ?? null
    : null;
  const selectedPatient = selectedBed?.patientId ? getPatientById(selectedBed.patientId) : null;
  const selectedStay = selectedPatient
    ? stayMeta.find((stay) => stay.patientId === selectedPatient.id && stay.status !== "Alta registrada") ?? null
    : null;
  const selectedFluidSummary = selectedPatient
    ? summarizePatientFluid(selectedPatient.fluidBalances)
    : null;
  const selectedCareTasks = selectedPatient
    ? buildCareTasks(selectedPatient, selectedStay, completedTaskIds)
    : [];
  const selectedStayTimeline = selectedPatient
    ? buildStayTimeline(selectedPatient, adtEvents)
    : [];
  const wardCareBoard = useMemo(
    () =>
      activeAdmissions
        .map((stay) => {
          const patient = getPatientById(stay.patientId);
          if (!patient) {
            return null;
          }

          const tasks = buildCareTasks(patient, stay, completedTaskIds);
          return {
            stay,
            patient,
            dueCount: tasks.filter((task) => task.status !== "Completada").length,
            urgentCount: tasks.filter((task) => task.urgent && task.status !== "Completada").length,
            nextTask: tasks.find((task) => task.status !== "Completada") ?? null,
          };
        })
        .filter(
          (
            entry
          ): entry is {
            stay: HospitalStayMeta;
            patient: PatientRecord;
            dueCount: number;
            urgentCount: number;
            nextTask: CareTask | null;
          } => entry !== null
        ),
    [activeAdmissions, completedTaskIds]
  );
  const dischargeBoard = useMemo(
    () =>
      plannedDischarges
        .map((stay) => {
          const patient = getPatientById(stay.patientId);
          if (!patient) {
            return null;
          }

          return {
            stay,
            patient,
            readiness: buildDischargeReadiness(patient, stay),
          };
        })
        .filter(
          (
            entry
          ): entry is {
            stay: HospitalStayMeta;
            patient: PatientRecord;
            readiness: ReturnType<typeof buildDischargeReadiness>;
          } => entry !== null
        ),
    [plannedDischarges]
  );
  const bedReport = useMemo(
    () =>
      hospitalRooms.map((room) => {
        const roomBeds = beds.filter((slot) => slot.roomId === room.id);
        return {
          room,
          total: roomBeds.length,
          occupied: roomBeds.filter((slot) => slot.state === "Ocupada").length,
          available: roomBeds.filter((slot) => slot.state === "Disponible").length,
          cleaning: roomBeds.filter((slot) => slot.state === "Limpieza").length,
          reserved: roomBeds.filter((slot) => slot.state === "Reservada").length,
        };
      }),
    [beds]
  );
  const availablePatientOptions = useMemo(
    () =>
      mockPatients.filter(
        (patient) => !beds.some((slot) => slot.patientId === patient.id && slot.state === "Ocupada")
      ),
    [beds]
  );

  const openActionPanel = (panel: ActionPanel) => {
    setActionPanel(panel);
    setActionFeedback(null);
    if (panel === "report") {
      setReportGeneratedAt(referenceNow);
    }
    if (panel === "admission") {
      setActiveTab("admissions");
      setAdmissionForm((current) => ({
        ...current,
        targetBedId:
          selectedBed && selectedBed.state === "Disponible"
            ? selectedBed.id
            : availableBeds[0]?.id ?? current.targetBedId,
      }));
    }
    if (panel === "discharge") {
      setActiveTab("discharge");
      setDischargeForm({
        patientId: selectedPatient?.id ?? "",
        dischargeAt:
          selectedStay?.plannedDischargeAt?.slice(0, 16) ??
          "2026-03-15T15:00",
        destination: selectedStay?.destinationPlan ?? "Alta a domicilio",
        summary:
          selectedPatient?.summary.latestNursingReport ??
          "Paciente estable, se coordina alta y seguimiento.",
      });
    }
  };

  const handleSelectBed = (bedId: string) => {
    setSelectedBedId(bedId);
    setActionFeedback(null);
  };

  const handleCareTaskAction = (taskId: string) => {
    setCompletedTaskIds((current) => ({
      ...current,
      [taskId]: true,
    }));
    setActionFeedback("Actividad registrada en el plan de cuidados del paciente.");
  };

  const handleTransferBed = () => {
    if (!selectedBed || !selectedPatient || !selectedStay) {
      setActionFeedback("Selecciona primero una cama ocupada para trasladar al paciente.");
      return;
    }

    const targetBed = beds.find(
      (slot) => slot.state === "Disponible" && slot.id !== selectedBed.id
    );

    if (!targetBed) {
      setActionFeedback("No hay camas disponibles para realizar el traslado.");
      return;
    }

    setBeds((current) =>
      current.map((slot) => {
        if (slot.id === selectedBed.id) {
          return { ...slot, state: "Limpieza", patientId: undefined };
        }
        if (slot.id === targetBed.id) {
          return { ...slot, state: "Ocupada", patientId: selectedPatient.id };
        }
        return slot;
      })
    );
    setStayMeta((current) =>
      current.map((stay) =>
        stay.id === selectedStay.id ? { ...stay, bedId: targetBed.id } : stay
      )
    );
    setAdtEvents((current) => [
      {
        id: `adt-transfer-${Date.now()}`,
        datetime: referenceNow,
        action: "Traslado",
        patientId: selectedPatient.id,
        roomId: targetBed.roomId,
        bedLabel: targetBed.bedLabel,
        detail: `Traslado desde ${selectedBed.bedLabel} hacia ${targetBed.bedLabel} por reorganizacion de camas.`,
        owner: "Lic. Daniela Naranjo",
      },
      ...current,
    ]);
    setSelectedBedId(targetBed.id);
    setActionFeedback(`Paciente trasladado a la cama ${targetBed.bedLabel}.`);
  };

  const handleRegisterDischarge = () => {
    const patient = getPatientById(dischargeForm.patientId);
    if (!patient) {
      setActionFeedback("Selecciona un paciente valido para registrar el alta.");
      return;
    }

    const stay = stayMeta.find(
      (entry) => entry.patientId === patient.id && entry.status !== "Alta registrada"
    );
    const bed = stay ? beds.find((slot) => slot.id === stay.bedId) : null;

    if (!stay || !bed) {
      setActionFeedback("No hay una estancia activa para el paciente seleccionado.");
      return;
    }

    setStayMeta((current) =>
      current.map((entry) =>
        entry.id === stay.id
          ? {
              ...entry,
              status: "Alta registrada",
              plannedDischargeAt: dischargeForm.dischargeAt,
              destinationPlan: dischargeForm.destination,
              notes: dischargeForm.summary,
            }
          : entry
      )
    );
    setBeds((current) =>
      current.map((slot) =>
        slot.id === bed.id
          ? { ...slot, state: "Limpieza", patientId: undefined }
          : slot
      )
    );
    setAdtEvents((current) => [
      {
        id: `adt-discharge-${Date.now()}`,
        datetime: dischargeForm.dischargeAt,
        action: "Alta",
        patientId: patient.id,
        roomId: bed.roomId,
        bedLabel: bed.bedLabel,
        detail: `${dischargeForm.destination}. ${dischargeForm.summary}`,
        owner: "Dra. Sofia Montalvo",
      },
      ...current,
    ]);
    setActionFeedback(`Alta registrada para ${patient.fullName}. La cama ${bed.bedLabel} pasa a limpieza.`);
    setActionPanel(null);

    const nextBed = beds.find(
      (slot) => slot.id !== bed.id && (slot.patientId || slot.state === "Disponible")
    );
    if (nextBed) {
      setSelectedBedId(nextBed.id);
    }
  };

  const handleRegisterAdmission = () => {
    const patient = getPatientById(admissionForm.patientId);
    const targetBed = beds.find((slot) => slot.id === admissionForm.targetBedId);

    if (!patient || !targetBed) {
      setActionFeedback("Completa paciente y cama objetivo para registrar la admision.");
      return;
    }

    if (beds.some((slot) => slot.patientId === patient.id && slot.state === "Ocupada")) {
      setActionFeedback("El paciente ya tiene una cama asignada en hospitalizacion.");
      return;
    }

    if (targetBed.state !== "Disponible") {
      setActionFeedback("La cama seleccionada no esta libre para un nuevo ingreso.");
      return;
    }

    setBeds((current) =>
      current.map((slot) =>
        slot.id === targetBed.id
          ? { ...slot, state: "Ocupada", patientId: patient.id }
          : slot
      )
    );
    setStayMeta((current) => [
      {
        id: `stay-${Date.now()}`,
        patientId: patient.id,
        bedId: targetBed.id,
        admittedAt: referenceNow,
        estimatedStayHours: 36,
        destinationPlan: "Hospitalizacion general",
        attending: patient.assignedProfessional,
        notes: admissionForm.note || "Admision registrada desde hospitalizacion.",
        status: "Activa",
      },
      ...current,
    ]);
    setAdtEvents((current) => [
      {
        id: `adt-admission-${Date.now()}`,
        datetime: referenceNow,
        action: "Admision",
        patientId: patient.id,
        roomId: targetBed.roomId,
        bedLabel: targetBed.bedLabel,
        detail: `${admissionForm.origin}. ${admissionForm.note || "Ingreso directo a cama."}`,
        owner: "Lic. Daniela Naranjo",
      },
      ...current,
    ]);
    setSelectedBedId(targetBed.id);
    setActionFeedback(`Admision registrada para ${patient.fullName} en ${targetBed.bedLabel}.`);
    setActionPanel(null);
  };

  const renderActionPanel = () => {
    if (actionPanel === "report") {
      return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Reporte de camas
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Resumen de ocupacion por sala</h2>
              <p className="text-xs text-slate-500">
                Generado el {formatClinicalDate(reportGeneratedAt)} con corte operativo del servicio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActionPanel(null)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {bedReport.map((entry) => (
              <article key={entry.room.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{entry.room.label}</p>
                <p className="text-xs text-slate-500">
                  {entry.room.floor} - {entry.room.service}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <SummaryStat label="Total" value={entry.total} />
                  <SummaryStat label="Ocupadas" value={entry.occupied} />
                  <SummaryStat label="Libres" value={entry.available} />
                  <SummaryStat label="Limpieza" value={entry.cleaning} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Reservadas: {entry.reserved}
                </p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (actionPanel === "admission") {
      return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Nueva admision
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Registrar ingreso a cama</h2>
              <p className="text-xs text-slate-500">
                Usa una cama libre y deja la trazabilidad ADT en la misma pantalla.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActionPanel(null)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Paciente">
              <select
                value={admissionForm.patientId}
                onChange={(event) =>
                  setAdmissionForm((current) => ({
                    ...current,
                    patientId: event.target.value,
                  }))
                }
                className={fieldClassName}
              >
                {availablePatientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName} - {patient.medicalRecordNumber}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Cama objetivo">
              <select
                value={admissionForm.targetBedId}
                onChange={(event) =>
                  setAdmissionForm((current) => ({
                    ...current,
                    targetBedId: event.target.value,
                  }))
                }
                className={fieldClassName}
              >
                {availableBeds.map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {bed.bedLabel} - {resolveRoomLabel(bed.roomId)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Origen">
              <input
                value={admissionForm.origin}
                onChange={(event) =>
                  setAdmissionForm((current) => ({
                    ...current,
                    origin: event.target.value,
                  }))
                }
                className={fieldClassName}
              />
            </FormField>
            <FormField label="Nota de ingreso">
              <input
                value={admissionForm.note}
                onChange={(event) =>
                  setAdmissionForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Motivo clinico, prioridad y observaciones..."
                className={fieldClassName}
              />
            </FormField>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegisterAdmission}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Registrar admision
            </button>
            <button
              type="button"
              onClick={() => setActionPanel(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      );
    }

    if (actionPanel === "discharge") {
      return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Registrar alta
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Cierre de estancia y liberacion de cama</h2>
              <p className="text-xs text-slate-500">
                Confirma destino, resumen y hora de salida del paciente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActionPanel(null)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Paciente">
              <select
                value={dischargeForm.patientId}
                onChange={(event) =>
                  setDischargeForm((current) => ({
                    ...current,
                    patientId: event.target.value,
                  }))
                }
                className={fieldClassName}
              >
                <option value="">Seleccionar paciente</option>
                {activeAdmissions.map((stay) => {
                  const patient = getPatientById(stay.patientId);
                  if (!patient) {
                    return null;
                  }

                  return (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} - {resolveBedLabel(stay.bedId, beds)}
                    </option>
                  );
                })}
              </select>
            </FormField>
            <FormField label="Hora de alta">
              <input
                type="datetime-local"
                value={dischargeForm.dischargeAt}
                onChange={(event) =>
                  setDischargeForm((current) => ({
                    ...current,
                    dischargeAt: event.target.value,
                  }))
                }
                className={fieldClassName}
              />
            </FormField>
            <FormField label="Destino">
              <input
                value={dischargeForm.destination}
                onChange={(event) =>
                  setDischargeForm((current) => ({
                    ...current,
                    destination: event.target.value,
                  }))
                }
                className={fieldClassName}
              />
            </FormField>
            <FormField label="Resumen clinico">
              <input
                value={dischargeForm.summary}
                onChange={(event) =>
                  setDischargeForm((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                placeholder="Condicion al alta, controles e indicaciones..."
                className={fieldClassName}
              />
            </FormField>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegisterDischarge}
              className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Confirmar alta
            </button>
            <button
              type="button"
              onClick={() => setActionPanel(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <ModulePage
      title="Hospitalizacion - Gestion de camas y estancias"
      subtitle="Mapa de camas, admisiones activas, plan de cuidados y alta planificada en una misma estacion."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openActionPanel("report")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reporte de camas
          </button>
          <button
            type="button"
            onClick={() => openActionPanel("discharge")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Registrar alta
          </button>
          <button
            type="button"
            onClick={() => openActionPanel("admission")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            + Nueva admision
          </button>
        </div>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-4">
          {tabDefinitions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "rounded-[24px] border px-4 py-4 text-left transition",
                activeTab === tab.id
                  ? "border-emerald-200 bg-emerald-50 shadow-sm"
                  : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tab.label}</p>
                  <p className="text-xs text-slate-500">
                    {tab.id === "beds"
                      ? "Mapa visual y seleccion de cama"
                      : tab.id === "admissions"
                      ? "Trazabilidad ADT y nuevos ingresos"
                      : tab.id === "care_plan"
                      ? "Intervenciones activas por paciente"
                      : "Salida segura y liberacion de camas"}
                  </p>
                </div>
                <StatusChip tone={activeTab === tab.id ? "success" : "neutral"}>
                  {tab.id === "beds"
                    ? `${occupiedBeds.length} ocupadas`
                    : tab.id === "admissions"
                    ? `${activeAdmissions.length} activas`
                    : tab.id === "care_plan"
                    ? `${wardCareBoard.reduce((sum, item) => sum + item.dueCount, 0)} tareas`
                    : `${plannedDischarges.length} altas`}
                </StatusChip>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Camas totales" value={beds.length} hint="Hospitalizacion y observacion" tone="neutral" />
        <MetricCard label="Ocupadas" value={occupiedBeds.length} hint={`${occupancyPercent}% ocupacion`} tone="info" />
        <MetricCard label="Disponibles" value={availableBeds.length} hint="Listas para ingreso" tone="success" />
        <MetricCard label="Limpieza" value={cleaningBeds.length} hint="Preparacion de cama" tone="warning" />
        <MetricCard label="Alta planificada" value={plannedDischarges.length} hint="Liberar hoy / manana" tone="danger" />
      </section>

      {renderActionPanel()}

      {actionFeedback ? (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          {actionFeedback}
        </section>
      ) : null}

      {activeTab === "beds" ? (
        <section className="space-y-4">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Mapa de camas
                </p>
                <h2 className="text-lg font-semibold text-slate-900">Selecciona una cama para abrir su contexto</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <LegendChip tone="danger">Critico</LegendChip>
                <LegendChip tone="info">Ocupada</LegendChip>
                <LegendChip tone="success">Libre</LegendChip>
                <LegendChip tone="warning">Limpieza</LegendChip>
                <LegendChip tone="neutral">Reservada</LegendChip>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {hospitalRooms.map((room) => {
                const roomBeds = beds.filter((slot) => slot.roomId === room.id);
                return (
                  <div key={room.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {room.label} - {room.service}
                        </p>
                        <p className="text-xs text-slate-500">{room.floor}</p>
                      </div>
                      <StatusChip tone="neutral">{roomBeds.length} camas</StatusChip>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {roomBeds.map((bed) => {
                        const patient = bed.patientId ? getPatientById(bed.patientId) : null;
                        const isCritical = patient?.riskLevel === "alto" || patient?.triageColor === "rojo";
                        return (
                          <button
                            key={bed.id}
                            type="button"
                            onClick={() => handleSelectBed(bed.id)}
                            className={[
                              "rounded-[24px] border p-4 text-left transition",
                              bedTileClassName(bed.state, isCritical, selectedBed?.id === bed.id),
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-lg font-semibold text-slate-900">{bed.bedLabel}</p>
                              <BedBadge state={bed.state} critical={isCritical} />
                            </div>
                            {patient ? (
                              <>
                                <p className="mt-4 text-base font-semibold text-slate-900">
                                  {patient.fullName}
                                </p>
                                <p className="text-sm text-slate-600">{patient.primaryDiagnosis}</p>
                                <p className="mt-3 text-xs text-slate-500">
                                  {patient.currentStatus} - {patient.assignedProfessional}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="mt-4 text-base font-semibold text-slate-800">
                                  {bed.state === "Disponible"
                                    ? "Cama libre"
                                    : bed.state === "Limpieza"
                                    ? "Preparacion"
                                    : "Reservada"}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {bed.state === "Disponible"
                                    ? "Lista para nuevo ingreso"
                                    : bed.state === "Limpieza"
                                    ? "Esperando liberacion"
                                    : "Pendiente definicion"}
                                </p>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              {selectedPatient && selectedStay && selectedFluidSummary ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-600">
                        {initialsOf(selectedPatient.fullName)}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          Cama {selectedBed?.bedLabel} - {selectedPatient.fullName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {selectedPatient.primaryDiagnosis} - Nivel {selectedPatient.triageColor}
                        </p>
                        <p className="text-sm text-slate-500">
                          Ingreso {formatClinicalDate(selectedStay.admittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusChip tone={selectedPatient.riskLevel === "alto" ? "danger" : "warning"}>
                        {selectedPatient.riskLevel === "alto" ? "Riesgo alto" : "Riesgo medio"}
                      </StatusChip>
                      <StatusChip tone="info">{selectedStay.attending}</StatusChip>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <SummaryCard label="Tiempo de estancia" value={`${calculateStayHours(selectedStay.admittedAt)} h`} />
                    <SummaryCard label="Estancia estimada" value={`${selectedStay.estimatedStayHours} h`} />
                    <SummaryCard
                      label="Alta planificada"
                      value={selectedStay.plannedDischargeAt ? formatShortDate(selectedStay.plannedDischargeAt) : "Sin fecha"}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedPatient.antecedentes.allergies.slice(0, 1).map((item) => (
                      <StatusChip key={item} tone="danger">Alergia: {item}</StatusChip>
                    ))}
                    {selectedPatient.secondaryDiagnoses.map((diagnosis) => (
                      <StatusChip key={diagnosis} tone="warning">{diagnosis}</StatusChip>
                    ))}
                    <StatusChip tone="info">Balance {selectedFluidSummary.balance} ml</StatusChip>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Evolucion de estancia
                    </p>
                    <div className="mt-4 space-y-3">
                      {selectedStayTimeline.map((event) => (
                        <TimelineItemCard key={event.id} item={event} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/portal/professional/patients/${selectedPatient.id}`}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Registrar evolucion
                    </Link>
                    <button
                      type="button"
                      onClick={handleTransferBed}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Traslado de cama
                    </button>
                    <button
                      type="button"
                      onClick={() => openActionPanel("discharge")}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Gestionar alta
                    </button>
                  </div>
                </>
              ) : selectedBed ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        Cama {selectedBed.bedLabel}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedRoom?.label} - {selectedRoom?.service}
                      </p>
                    </div>
                    <BedBadge state={selectedBed.state} critical={false} />
                  </div>
                  <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">
                      {selectedBed.state === "Disponible"
                        ? "La cama esta libre y puede utilizarse para una nueva admision."
                        : selectedBed.state === "Limpieza"
                        ? "La cama aun esta en proceso de limpieza antes de quedar operativa."
                        : "La cama esta reservada para un proximo ingreso."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedBed.state === "Disponible" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAdmissionForm((current) => ({
                              ...current,
                              targetBedId: selectedBed.id,
                            }));
                            openActionPanel("admission");
                          }}
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Usar para admision
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openActionPanel("report")}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Ver reporte de sala
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Plan de cuidados activo
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedPatient ? "Intervenciones programadas" : "Sin paciente asignado"}
                  </h2>
                </div>
                {selectedPatient ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("care_plan")}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    Ver plan completo
                  </button>
                ) : null}
              </div>
              <div className="mt-4 space-y-3">
                {selectedCareTasks.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Selecciona una cama ocupada para ver tareas activas del paciente.
                  </p>
                ) : (
                  selectedCareTasks.map((task) => (
                    <CareTaskCard
                      key={task.id}
                      task={task}
                      onAction={() => handleCareTaskAction(task.id)}
                    />
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === "admissions" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Admisiones activas
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Pacientes con cama asignada</h2>
            </div>
            <div className="mt-4 space-y-3">
              {activeAdmissions.map((stay) => {
                const patient = getPatientById(stay.patientId);
                const bed = beds.find((slot) => slot.id === stay.bedId);
                if (!patient || !bed) {
                  return null;
                }

                return (
                  <button
                    key={stay.id}
                    type="button"
                    onClick={() => {
                      setSelectedBedId(bed.id);
                      setActiveTab("beds");
                    }}
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{patient.fullName}</p>
                        <p className="text-sm text-slate-600">
                          {bed.bedLabel} - {resolveRoomLabel(bed.roomId)} - {patient.primaryDiagnosis}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusChip tone={patient.riskLevel === "alto" ? "danger" : "warning"}>
                          {patient.currentStatus}
                        </StatusChip>
                        <StatusChip tone="info">{calculateStayHours(stay.admittedAt)} h</StatusChip>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{stay.notes}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Ingreso: {formatClinicalDate(stay.admittedAt)}</span>
                      <span>Atiende: {stay.attending}</span>
                      <span>Destino: {stay.destinationPlan}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Trazabilidad ADT
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Movimientos recientes</h2>
            </div>
            <div className="mt-4 space-y-3">
              {adtEvents.map((event) => {
                const patient = getPatientById(event.patientId);
                return (
                  <article key={event.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {event.action} - {patient?.fullName ?? "Paciente"}
                      </p>
                      <StatusChip tone={event.action === "Alta" ? "danger" : "neutral"}>
                        {formatClinicalDate(event.datetime)}
                      </StatusChip>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {event.detail}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {event.bedLabel} - {resolveRoomLabel(event.roomId)} - {event.owner}
                    </p>
                  </article>
                );
              })}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "care_plan" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Tablero de cuidados
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Prioridad por paciente hospitalizado</h2>
            </div>
            <div className="mt-4 space-y-3">
              {wardCareBoard.map((entry) => (
                <button
                  key={entry.stay.id}
                  type="button"
                  onClick={() => {
                    setSelectedBedId(entry.stay.bedId);
                    setActiveTab("beds");
                  }}
                  className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{entry.patient.fullName}</p>
                      <p className="text-sm text-slate-600">
                        {resolveBedLabel(entry.stay.bedId, beds)} - {entry.patient.primaryDiagnosis}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusChip tone={entry.urgentCount > 0 ? "danger" : "warning"}>
                        {entry.urgentCount > 0 ? `${entry.urgentCount} urgente` : `${entry.dueCount} tareas`}
                      </StatusChip>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <PlanSummaryCard
                      title="Diagnostico NANDA"
                      body={entry.patient.carePlan[0]?.nursingDiagnosis ?? "Sin diagnostico registrado"}
                    />
                    <PlanSummaryCard
                      title="Proxima accion"
                      body={entry.nextTask?.title ?? "Sin tareas pendientes"}
                    />
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Plan del paciente seleccionado
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedPatient ? selectedPatient.fullName : "Sin seleccion"}
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {selectedPatient ? (
                <>
                  {(selectedPatient.carePlan.length > 0
                    ? selectedPatient.carePlan
                    : [
                        {
                          id: "empty",
                          nursingDiagnosis: "Sin plan estructurado",
                          objective: "Completar plan",
                          interventions: ["Registrar intervenciones"],
                          evaluation: "Pendiente",
                          observations: "Sin datos actuales",
                        } as CarePlanRecord,
                      ]).map((plan) => (
                    <article
                      key={plan.id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{plan.nursingDiagnosis}</p>
                      <p className="mt-2 text-sm text-slate-600">{plan.objective}</p>
                      <ul className="mt-3 space-y-1 text-sm text-slate-700">
                        {plan.interventions.map((intervention) => (
                          <li key={intervention}>- {intervention}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-slate-500">
                        {plan.evaluation} - {plan.observations}
                      </p>
                    </article>
                  ))}
                  <Link
                    href={`/portal/professional/patients/${selectedPatient.id}`}
                    className="inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Abrir ficha completa
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Selecciona una cama ocupada para revisar el plan de cuidados detallado.
                </p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "discharge" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Altas planificadas
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Pacientes listos para coordinar salida</h2>
            </div>
            <div className="mt-4 space-y-3">
              {dischargeBoard.length === 0 ? (
                <p className="text-sm text-slate-500">No hay altas planificadas activas.</p>
              ) : (
                dischargeBoard.map((entry) => (
                  <button
                    key={entry.stay.id}
                    type="button"
                    onClick={() => {
                      setSelectedBedId(entry.stay.bedId);
                      setDischargeForm({
                        patientId: entry.patient.id,
                        dischargeAt: entry.stay.plannedDischargeAt?.slice(0, 16) ?? "2026-03-15T15:00",
                        destination: entry.stay.destinationPlan,
                        summary: entry.patient.summary.latestNursingReport,
                      });
                      setActionPanel("discharge");
                    }}
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{entry.patient.fullName}</p>
                        <p className="text-sm text-slate-600">
                          {resolveBedLabel(entry.stay.bedId, beds)} - {entry.stay.destinationPlan}
                        </p>
                      </div>
                      <StatusChip tone="danger">
                        {entry.stay.plannedDischargeAt
                          ? formatClinicalDate(entry.stay.plannedDischargeAt)
                          : "Sin fecha"}
                      </StatusChip>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {entry.readiness.map((item) => (
                        <ReadinessItem key={item.label} label={item.label} ready={item.ready} />
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Lista de salida segura
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedPatient ? selectedPatient.fullName : "Sin paciente"}
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {selectedPatient && selectedStay ? (
                buildDischargeReadiness(selectedPatient, selectedStay).map((item) => (
                  <ReadinessItem key={item.label} label={item.label} ready={item.ready} detail={item.detail} />
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Selecciona una alta planificada para revisar la lista de salida.
                </p>
              )}
            </div>
          </article>
        </section>
      ) : null}
    </ModulePage>
  );
}

function buildCareTasks(
  patient: PatientRecord,
  stay: HospitalStayMeta | null,
  completedTaskIds: Record<string, boolean>
) {
  const firstPlan = patient.carePlan[0];
  const latestVital = patient.vitalSigns[0];
  const pendingExam = patient.exams.find((exam) => exam.status === "Pendiente");
  const medication = patient.medicationRecords[0];

  const tasks: CareTask[] = [];

  if (firstPlan) {
    tasks.push({
      id: `care-${patient.id}-plan`,
      icon: "[]",
      title: firstPlan.nursingDiagnosis,
      detail: `${firstPlan.interventions.join(" · ")}.`,
      actionLabel: "Registrar",
      dueLabel: firstPlan.evaluation,
      source: "Enfermeria",
      status: completedTaskIds[`care-${patient.id}-plan`] ? "Completada" : "En curso",
      urgent: patient.riskLevel === "alto",
    });
  }

  if (latestVital) {
    tasks.push({
      id: `care-${patient.id}-monitor`,
      icon: "<3",
      title: "Monitorizacion clinica",
      detail: `PA ${latestVital.bloodPressure} · FC ${latestVital.heartRate} · SpO2 ${latestVital.spo2}%.`,
      actionLabel: "Control",
      dueLabel: `Prox. ${formatShortHour(addHoursToReference(1))}`,
      source: "Medico",
      status: completedTaskIds[`care-${patient.id}-monitor`] ? "Completada" : "En curso",
      urgent: latestVital.spo2 < 94 || patient.triageColor === "rojo",
    });
  }

  if (latestVital && latestVital.glucose >= 180) {
    tasks.push({
      id: `care-${patient.id}-glucose`,
      icon: "[]",
      title: "Control glucemico estricto",
      detail: `Ultima glucosa ${latestVital.glucose} mg/dL. Meta operativa 140-180 mg/dL.`,
      actionLabel: "Registrar",
      dueLabel: `Prox. ${formatShortHour(addHoursToReference(2))}`,
      source: "Enfermeria",
      status: completedTaskIds[`care-${patient.id}-glucose`] ? "Completada" : "Pendiente",
      urgent: true,
    });
  }

  if (medication) {
    tasks.push({
      id: `care-${patient.id}-medication`,
      icon: "()",
      title: `Administracion ${medication.name} ${medication.dose}`,
      detail: `${medication.route} · ${medication.frequency} · verificar alergias.`,
      actionLabel: "Administrar",
      dueLabel: `Prox. dosis ${medication.schedule}`,
      source: "Farmacia",
      status: completedTaskIds[`care-${patient.id}-medication`] ? "Completada" : "Pendiente",
      urgent: patient.antecedentes.allergies.length > 0,
    });
  }

  if (pendingExam) {
    tasks.push({
      id: `care-${patient.id}-exam`,
      icon: "+",
      title: `Toma de muestra - ${pendingExam.name}`,
      detail: `${pendingExam.summary}. ${pendingExam.observations}`,
      actionLabel: "Tomar muestra",
      dueLabel: "Pendiente de proceso",
      source: "Laboratorio",
      status: completedTaskIds[`care-${patient.id}-exam`] ? "Completada" : "Pendiente",
      urgent: true,
    });
  }

  if (stay?.plannedDischargeAt) {
    tasks.push({
      id: `care-${patient.id}-discharge`,
      icon: "[]",
      title: "Evaluacion para alta",
      detail: `${stay.destinationPlan}. Coordinar plan ambulatorio e indicaciones.`,
      actionLabel: "Ver plan",
      dueLabel: `Programada ${formatClinicalDate(stay.plannedDischargeAt)}`,
      source: "Alta",
      status: completedTaskIds[`care-${patient.id}-discharge`] ? "Completada" : "Programada",
      urgent: false,
    });
  }

  return tasks;
}

function buildStayTimeline(patient: PatientRecord, adtEvents: HospitalAdtEvent[]) {
  const events = [
    ...patient.timeline.map((entry) => ({
      id: `timeline-${entry.id}`,
      datetime: toComparableDate(entry.datetime),
      display: entry.datetime,
      title: entry.category,
      detail: entry.detail,
      tone: entry.category === "Alerta" ? "danger" : entry.category === "Ingreso" ? "warning" : "neutral",
    })),
    ...adtEvents
      .filter((event) => event.patientId === patient.id)
      .map((event) => ({
        id: `adt-${event.id}`,
        datetime: event.datetime,
        display: formatClinicalDate(event.datetime),
        title: event.action,
        detail: event.detail,
        tone: event.action === "Alta" ? "danger" : event.action === "Traslado" ? "warning" : "neutral",
      })),
    ...patient.vitalSigns.slice(0, 1).map((vital, index) => ({
      id: `vital-${patient.id}-${index}`,
      datetime: toComparableDate(vital.recordedAt),
      display: vital.recordedAt,
      title: "Control signos vitales",
      detail: `PA ${vital.bloodPressure} · FC ${vital.heartRate} · SpO2 ${vital.spo2}% · Glucosa ${vital.glucose} mg/dL.`,
      tone: vital.glucose >= 200 ? "danger" : "warning",
    })),
  ];

  return events.sort((left, right) => right.datetime.localeCompare(left.datetime));
}

function buildDischargeReadiness(patient: PatientRecord, stay: HospitalStayMeta) {
  const latestVital = patient.vitalSigns[0];
  return [
    {
      label: "Signos estables",
      ready: Boolean(latestVital) && latestVital.spo2 >= 93 && latestVital.heartRate <= 110,
      detail: latestVital
        ? `FC ${latestVital.heartRate} · SpO2 ${latestVital.spo2}%`
        : "Sin control reciente",
    },
    {
      label: "Plan terapeutico conciliado",
      ready: patient.medicationRecords.length > 0,
      detail: `${patient.medicationRecords.length} medicamentos activos`,
    },
    {
      label: "Controles post alta definidos",
      ready: Boolean(stay.destinationPlan),
      detail: stay.destinationPlan,
    },
    {
      label: "Educacion y signos de alarma",
      ready: patient.carePlan.length > 0 || patient.summary.latestNursingReport.length > 0,
      detail: patient.summary.latestNursingReport,
    },
  ];
}

function summarizePatientFluid(entries: FluidBalanceRecord[]) {
  return entries.reduce(
    (acc, entry) => {
      const intake =
        entry.intake.oral +
        entry.intake.intravenous +
        entry.intake.dilutedMedication +
        entry.intake.enteralParenteral +
        entry.intake.other;
      const output =
        entry.output.diuresis +
        entry.output.vomiting +
        entry.output.drains +
        entry.output.liquidStools +
        entry.output.aspiration +
        entry.output.insensibleLoss +
        entry.output.other;

      acc.intake += intake;
      acc.output += output;
      acc.balance += intake - output;
      acc.diuresis += entry.output.diuresis;
      return acc;
    },
    { intake: 0, output: 0, balance: 0, diuresis: 0 }
  );
}

function resolveRoomLabel(roomId: string) {
  return hospitalRooms.find((room) => room.id === roomId)?.label ?? "Sala";
}

function resolveBedLabel(bedId: string, beds: HospitalBedSlot[]) {
  return beds.find((bed) => bed.id === bedId)?.bedLabel ?? "Cama";
}

function addHoursToReference(hours: number) {
  const date = new Date(referenceNow);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function calculateStayHours(admittedAt: string) {
  const start = new Date(admittedAt);
  const end = new Date(referenceNow);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
}

function toComparableDate(value: string) {
  if (value.includes("T")) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2} /.test(value)) {
    return value.replace(" ", "T");
  }

  return value;
}

function formatClinicalDate(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatShortHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initialsOf(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}

function bedTileClassName(state: HospitalBedState, critical: boolean, selected: boolean) {
  if (critical) {
    return selected
      ? "border-red-300 bg-red-50 shadow-sm ring-2 ring-emerald-400"
      : "border-red-200 bg-red-50";
  }

  if (state === "Ocupada") {
    return selected
      ? "border-sky-300 bg-sky-50 shadow-sm ring-2 ring-sky-300"
      : "border-sky-200 bg-sky-50";
  }

  if (state === "Disponible") {
    return selected
      ? "border-emerald-300 bg-emerald-50 shadow-sm ring-2 ring-emerald-300"
      : "border-emerald-200 bg-emerald-50";
  }

  if (state === "Limpieza") {
    return selected
      ? "border-amber-300 bg-amber-50 shadow-sm ring-2 ring-amber-300"
      : "border-amber-200 bg-amber-50";
  }

  return selected
    ? "border-slate-300 bg-slate-100 shadow-sm ring-2 ring-slate-300"
    : "border-slate-200 bg-slate-100";
}

function toneClasses(tone: "danger" | "warning" | "success" | "info" | "neutral") {
  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (tone === "info") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p
        className={[
          "mt-3 text-4xl font-semibold",
          tone === "danger"
            ? "text-red-600"
            : tone === "warning"
            ? "text-amber-600"
            : tone === "success"
            ? "text-emerald-600"
            : tone === "info"
            ? "text-sky-600"
            : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

function StatusChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses(tone),
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function LegendChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  return <StatusChip tone={tone}>{children}</StatusChip>;
}

function BedBadge({
  state,
  critical,
}: {
  state: HospitalBedState;
  critical: boolean;
}) {
  if (critical) {
    return <StatusChip tone="danger">Critico</StatusChip>;
  }

  if (state === "Ocupada") {
    return <StatusChip tone="info">Ocupada</StatusChip>;
  }
  if (state === "Disponible") {
    return <StatusChip tone="success">Libre</StatusChip>;
  }
  if (state === "Limpieza") {
    return <StatusChip tone="warning">Limpieza</StatusChip>;
  }
  return <StatusChip tone="neutral">Reservada</StatusChip>;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineItemCard({
  item,
}: {
  item: { id: string; display: string; title: string; detail: string; tone: string };
}) {
  return (
    <article className="flex gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div
        className={[
          "mt-1 h-3 w-3 rounded-full",
          item.tone === "danger"
            ? "bg-red-500"
            : item.tone === "warning"
            ? "bg-amber-500"
            : "bg-slate-400",
        ].join(" ")}
      />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{item.display}</p>
        <p className="mt-1 text-base font-semibold text-slate-900">{item.title}</p>
        <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
      </div>
    </article>
  );
}

function CareTaskCard({
  task,
  onAction,
}: {
  task: CareTask;
  onAction: () => void;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-white px-2 py-1 text-xs font-semibold text-slate-500">
              {task.icon}
            </span>
            <p className="text-base font-semibold text-slate-900">{task.title}</p>
          </div>
          <p className="mt-2 text-sm text-slate-700">{task.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip tone={task.urgent ? "danger" : task.status === "Completada" ? "success" : "warning"}>
              {task.status}
            </StatusChip>
            <StatusChip tone="neutral">{task.source}</StatusChip>
          </div>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {task.actionLabel}
        </button>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{task.dueLabel}</p>
    </article>
  );
}

function PlanSummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm text-slate-800">{body}</p>
    </div>
  );
}

function ReadinessItem({
  label,
  ready,
  detail,
}: {
  label: string;
  ready: boolean;
  detail?: string;
}) {
  return (
    <article
      className={[
        "rounded-[24px] border p-4",
        ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <StatusChip tone={ready ? "success" : "warning"}>
          {ready ? "Listo" : "Pendiente"}
        </StatusChip>
      </div>
      {detail ? <p className="mt-2 text-sm text-slate-700">{detail}</p> : null}
    </article>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none";
