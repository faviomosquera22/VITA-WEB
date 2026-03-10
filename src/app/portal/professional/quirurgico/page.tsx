"use client";

import { useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { getPatientById } from "../_data/clinical-mock-data";
import {
  surgicalRooms,
  type SurgicalRoomState,
} from "../_data/facility-layout-mock-data";

type SurgicalStatus = "Programada" | "En curso" | "Finalizada";

type SurgicalCase = {
  id: string;
  patientId: string;
  procedure: string;
  roomId: string;
  team: string;
  estimatedTime: string;
  status: SurgicalStatus;
};

type AldretePoint = {
  label: string;
  score: 0 | 1 | 2;
  detail: string;
};

const surgerySchedule: SurgicalCase[] = [
  {
    id: "sx-1",
    patientId: "p-001",
    procedure: "Cateterismo cardiaco diagnostico",
    roomId: "or-2",
    team: "Cardiologia + Enfermeria hemodinamica",
    estimatedTime: "90 min",
    status: "Programada",
  },
  {
    id: "sx-2",
    patientId: "p-002",
    procedure: "Broncoscopia diagnostica",
    roomId: "or-1",
    team: "Neumologia + Anestesia",
    estimatedTime: "60 min",
    status: "En curso",
  },
  {
    id: "sx-3",
    patientId: "p-005",
    procedure: "Debridamiento de pie diabetico",
    roomId: "or-3",
    team: "Cirugia general + Enfermeria",
    estimatedTime: "75 min",
    status: "Finalizada",
  },
];

const operatingRoomSheet = {
  surgicalTeam: ["Cirujano principal", "Ayudante", "Anestesiologo", "Instrumentista", "Circulante"],
  materials: ["Set estandar esteril", "Suturas 3-0", "Gasas", "Solucion antiseptica"],
  startAt: "2026-03-10 10:05",
  endAt: "2026-03-10 11:14",
  incidents: "Sin incidentes intraoperatorios mayores.",
};

const aldreteRecovery: AldretePoint[] = [
  { label: "Actividad", score: 2, detail: "Mueve extremidades voluntariamente." },
  { label: "Respiracion", score: 2, detail: "Respira profundo y tose adecuadamente." },
  { label: "Circulacion", score: 1, detail: "TA dentro de 20-50% del basal." },
  { label: "Conciencia", score: 2, detail: "Completamente despierto." },
  { label: "Saturacion O2", score: 2, detail: "SpO2 > 92% con aire ambiente." },
];

const digitalConsents = [
  { id: "cons-1", title: "Consentimiento quirurgico general", patientId: "p-002", status: "Firmado" },
  { id: "cons-2", title: "Consentimiento anestesico", patientId: "p-002", status: "Firmado" },
  { id: "cons-3", title: "Consentimiento transfusional", patientId: "p-001", status: "Pendiente firma" },
];

export default function SurgicalPage() {
  const [selectedRoomId, setSelectedRoomId] = useState(surgicalRooms[0]?.id ?? "");
  const selectedRoom = surgicalRooms.find((room) => room.id === selectedRoomId) ?? surgicalRooms[0];
  const selectedCases = surgerySchedule.filter((item) => item.roomId === selectedRoom.id);
  const inProgress = surgerySchedule.filter((item) => item.status === "En curso").length;
  const completed = surgerySchedule.filter((item) => item.status === "Finalizada").length;
  const aldreteTotal = aldreteRecovery.reduce((acc, item) => acc + item.score, 0);
  const activeCase = selectedCases[0] ?? null;
  const activePatient = activeCase ? getPatientById(activeCase.patientId) : null;
  const consentRows = digitalConsents.filter((consent) =>
    activeCase ? consent.patientId === activeCase.patientId : true
  );

  return (
    <ModulePage
      title="Modulo quirurgico"
      subtitle="Seleccion por pabellon para visualizar casos, nota operatoria, recuperacion y consentimientos."
    >
      <Panel title="Pabellones quirurgicos" subtitle="Estado operativo y seleccion de sala quirurgica">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {surgicalRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelectedRoomId(room.id)}
              className={[
                "rounded-xl border p-3 text-left transition",
                room.id === selectedRoom.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              <p className="text-xs font-semibold">{room.label}</p>
              <p className="text-[11px] opacity-80">{room.specialty}</p>
              <p className="text-[11px] opacity-80">Proximo: {room.nextCaseAt ?? "Sin horario"}</p>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Cirugias programadas" value={surgerySchedule.length} hint="Agenda del dia" />
        <StatCard label="En curso" value={inProgress} hint="Pabellon activo" />
        <StatCard label="Finalizadas" value={completed} hint="Con cierre operatorio" />
        <StatCard label="Aldrete actual" value={`${aldreteTotal}/10`} hint="Recuperacion post-anestesica" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title={`Programacion - ${selectedRoom.label}`} subtitle="Pacientes/casos asociados al pabellon seleccionado">
          <div className="space-y-2">
            {selectedCases.length === 0 ? (
              <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700">Pabellon disponible</p>
                <p className="text-[11px] text-emerald-700">Sin cirugias asignadas para esta sala.</p>
              </article>
            ) : (
              selectedCases.map((item) => {
                const patient = getPatientById(item.patientId);
                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">{patient?.fullName ?? "Paciente"}</p>
                      <SurgeryStatusBadge status={item.status} />
                    </div>
                    <p className="text-[11px] text-slate-500">{item.procedure}</p>
                    <p className="text-[11px] text-slate-600">
                      {selectedRoom.label} · {item.team} · {item.estimatedTime}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title="Hoja de pabellon" subtitle="Equipo, materiales, tiempos y trazabilidad intraoperatoria">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">Pabellon activo: {selectedRoom.label}</p>
              <SurgicalRoomStateBadge state={selectedRoom.state} />
            </div>
            <p className="text-[11px] text-slate-500">{selectedRoom.specialty}</p>
            <p className="mt-2 font-semibold text-slate-900">Equipo quirurgico</p>
            <p className="text-[11px] text-slate-600">{operatingRoomSheet.surgicalTeam.join(", ")}</p>
            <p className="mt-2 font-semibold text-slate-900">Materiales utilizados</p>
            <p className="text-[11px] text-slate-600">{operatingRoomSheet.materials.join(", ")}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Inicio: {operatingRoomSheet.startAt} · Fin: {operatingRoomSheet.endAt}
            </p>
            <p className="text-[11px] text-slate-600">Incidentes: {operatingRoomSheet.incidents}</p>
          </article>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Nota operatoria estructurada" subtitle="Hallazgos, tecnica y plan postoperatorio por sala">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {activePatient ? (
              <>
                <p className="font-semibold text-slate-900">
                  Paciente: {activePatient.fullName} · HC {activePatient.medicalRecordNumber}
                </p>
                <p className="text-[11px] text-slate-500">Diagnostico base: {activePatient.primaryDiagnosis}</p>
              </>
            ) : (
              <p className="font-semibold text-emerald-700">Sala disponible sin caso activo.</p>
            )}
            <p className="mt-2 font-semibold text-slate-900">Hallazgos</p>
            <p className="text-[11px] text-slate-600">
              Lesion focal tratada segun plan quirurgico, sin sangrado activo al cierre.
            </p>
            <p className="mt-2 font-semibold text-slate-900">Tecnica</p>
            <p className="text-[11px] text-slate-600">
              Procedimiento realizado bajo tecnica esteril estandar con control hemodinamico continuo.
            </p>
            <p className="mt-2 font-semibold text-slate-900">Plan inmediato</p>
            <p className="text-[11px] text-slate-600">
              Vigilancia post-anestesica, analgesia protocolizada y reevaluacion de herida en 6 horas.
            </p>
          </article>
        </Panel>

        <Panel title="Recuperacion post-anestesica (Aldrete)" subtitle="Seguimiento inmediato para alta de sala de recuperacion">
          <div className="space-y-2">
            {aldreteRecovery.map((item) => (
              <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    {item.score}/2
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Consentimientos informados digitales" subtitle="Firma paciente o tutor y estado legal del documento">
        <div className="space-y-2">
          {consentRows.length === 0 ? (
            <p className="text-xs text-slate-500">No hay consentimientos asociados al caso activo de esta sala.</p>
          ) : (
            consentRows.map((consent) => {
              const patient = getPatientById(consent.patientId);
              return (
                <article key={consent.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{consent.title}</p>
                    <span
                      className={[
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        consent.status === "Firmado"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {consent.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">Paciente: {patient?.fullName ?? "Paciente"}</p>
                </article>
              );
            })
          )}
        </div>
      </Panel>
    </ModulePage>
  );
}

function SurgeryStatusBadge({ status }: { status: SurgicalStatus }) {
  const className: Record<SurgicalStatus, string> = {
    Programada: "border-amber-200 bg-amber-50 text-amber-700",
    "En curso": "border-sky-200 bg-sky-50 text-sky-700",
    Finalizada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[status]].join(" ")}>{status}</span>;
}

function SurgicalRoomStateBadge({ state }: { state: SurgicalRoomState }) {
  const className: Record<SurgicalRoomState, string> = {
    Disponible: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "En uso": "border-red-200 bg-red-50 text-red-700",
    Limpieza: "border-amber-200 bg-amber-50 text-amber-700",
    Reservada: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[state]].join(" ")}>{state}</span>;
}
