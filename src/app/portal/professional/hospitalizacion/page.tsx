"use client";

import { useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  getPatientById,
  mockPatients,
  type FluidBalanceRecord,
  type PatientRecord,
} from "../_data/clinical-mock-data";
import {
  hospitalBedSlots,
  hospitalRooms,
  type HospitalBedState,
} from "../_data/facility-layout-mock-data";

const adtEvents = [
  {
    id: "adt-1",
    datetime: "2026-03-10 07:25",
    action: "Admision",
    patientId: "p-005",
    roomId: "sala-b",
    detail: "Ingreso por control metabolico y vigilancia de glicemia.",
  },
  {
    id: "adt-2",
    datetime: "2026-03-10 09:10",
    action: "Traslado",
    patientId: "p-002",
    roomId: "sala-a",
    detail: "Traslado de observacion a cama de hospitalizacion.",
  },
  {
    id: "adt-3",
    datetime: "2026-03-10 11:45",
    action: "Alta",
    patientId: "p-003",
    roomId: "sala-c",
    detail: "Alta medica con control ambulatorio en 72h.",
  },
];

export default function HospitalizationPage() {
  const [selectedRoomId, setSelectedRoomId] = useState(hospitalRooms[0]?.id ?? "");

  const selectedRoom = hospitalRooms.find((room) => room.id === selectedRoomId) ?? hospitalRooms[0];
  const roomBeds = hospitalBedSlots.filter((slot) => slot.roomId === selectedRoom.id);
  const occupiedBeds = roomBeds.filter((slot) => slot.state === "Ocupada");
  const availableBeds = roomBeds.filter((slot) => slot.state === "Disponible");
  const roomPatients = occupiedBeds
    .map((slot) => (slot.patientId ? getPatientById(slot.patientId) : null))
    .filter((patient): patient is PatientRecord => patient !== null);
  const roomAdtEvents = adtEvents.filter((event) => event.roomId === selectedRoom.id);
  const fluidSummary = summarizeFluid(roomPatients);
  const epicrisisPatient = roomPatients[0] ?? mockPatients[0];

  return (
    <ModulePage
      title="Hospitalizacion y camas"
      subtitle="Seleccion por sala, mapa visual de camas y datos de pacientes hospitalizados."
    >
      <Panel title="Salas de hospitalizacion" subtitle="Selecciona una sala para visualizar camas y pacientes">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {hospitalRooms.map((room) => {
            const bedsInRoom = hospitalBedSlots.filter((slot) => slot.roomId === room.id);
            const busy = bedsInRoom.filter((slot) => slot.state === "Ocupada").length;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                className={[
                  "rounded-xl border p-3 text-left transition",
                  selectedRoom.id === room.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                <p className="text-xs font-semibold">{room.label}</p>
                <p className="text-[11px] opacity-80">{room.floor} · {room.service}</p>
                <p className="text-[11px] opacity-80">
                  Camas: {busy}/{bedsInRoom.length} ocupadas
                </p>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Sala activa" value={selectedRoom.label} hint={`${selectedRoom.floor} · ${selectedRoom.service}`} />
        <StatCard label="Camas ocupadas" value={occupiedBeds.length} hint={`Total sala: ${roomBeds.length}`} />
        <StatCard label="Camas disponibles" value={availableBeds.length} hint='Marcadas como "Disponible"' />
        <StatCard label="Balance 24h sala" value={`${fluidSummary.balance} ml`} hint="Ingreso menos egreso" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title={`Mapa visual de camas - ${selectedRoom.label}`} subtitle="Cada cama muestra estado y datos del paciente cuando esta ocupada">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roomBeds.map((slot) => {
              const patient = slot.patientId ? getPatientById(slot.patientId) : null;
              return (
                <article
                  key={slot.id}
                  className={[
                    "rounded-xl border p-3",
                    slot.state === "Ocupada" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">
                      Cama {slot.bedLabel}
                    </p>
                    <BedStateBadge state={slot.state} />
                  </div>
                  {patient ? (
                    <>
                      <p className="text-xs font-semibold text-slate-900">{patient.fullName}</p>
                      <p className="text-[11px] text-slate-600">HC {patient.medicalRecordNumber}</p>
                      <p className="text-[11px] text-slate-600">{patient.primaryDiagnosis}</p>
                    </>
                  ) : (
                    <p className="text-[11px] font-semibold text-slate-600">Disponible</p>
                  )}
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title={`Movimientos ADT - ${selectedRoom.label}`} subtitle="Admision, traslado y alta con trazabilidad por sala">
          <div className="space-y-2">
            {roomAdtEvents.length === 0 ? (
              <p className="text-xs text-slate-500">Sin movimientos recientes en esta sala.</p>
            ) : (
              roomAdtEvents.map((event) => {
                const patient = getPatientById(event.patientId);
                return (
                  <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">
                        {event.action} · {patient?.fullName ?? "Paciente"}
                      </p>
                      <span className="text-[11px] text-slate-500">{event.datetime}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{event.detail}</p>
                  </article>
                );
              })
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title={`Balance hidrico por paciente - ${selectedRoom.label}`} subtitle="Entradas, salidas y diuresis de pacientes ubicados en la sala">
          <div className="space-y-2">
            {roomPatients.length === 0 ? (
              <p className="text-xs text-slate-500">No hay pacientes ocupando camas en esta sala.</p>
            ) : (
              roomPatients.map((patient) => {
                const totals = summarizePatientFluid(patient.fluidBalances);

                return (
                  <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      Ingreso: {totals.intake} ml · Egreso: {totals.output} ml · Balance: {totals.balance} ml
                    </p>
                    <p className="text-[11px] text-slate-600">Diuresis acumulada: {totals.diuresis} ml</p>
                  </article>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title="Epicrisis preestructurada" subtitle="Borrador automatico para cierre de hospitalizacion del paciente seleccionado">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">
              Paciente: {epicrisisPatient.fullName} · HC {epicrisisPatient.medicalRecordNumber}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Diagnostico de ingreso: {epicrisisPatient.primaryDiagnosis}</p>
            <p className="text-[11px] text-slate-500">
              Diagnostico al alta: {epicrisisPatient.secondaryDiagnoses.join(", ") || "Sin diagnosticos secundarios"}
            </p>
            <p className="text-[11px] text-slate-500">Condicion al alta: Estable hemodinamicamente.</p>
            <p className="mt-2 text-[11px] text-slate-600">
              Resumen: Paciente con evolucion favorable, controles clinicos estables y plan de seguimiento por consulta externa.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Indicaciones: continuar tratamiento, control en 72h y signos de alarma explicados a familiar.
            </p>
          </article>
        </Panel>
      </div>
    </ModulePage>
  );
}

function summarizeFluid(patients: PatientRecord[]) {
  return patients.reduce(
    (acc, patient) => {
      const totals = summarizePatientFluid(patient.fluidBalances);
      acc.intake += totals.intake;
      acc.output += totals.output;
      acc.balance += totals.balance;
      acc.diuresis += totals.diuresis;
      return acc;
    },
    { intake: 0, output: 0, balance: 0, diuresis: 0 }
  );
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

function BedStateBadge({ state }: { state: HospitalBedState }) {
  const className: Record<HospitalBedState, string> = {
    Ocupada: "border-red-200 bg-red-50 text-red-700",
    Disponible: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Limpieza: "border-amber-200 bg-amber-50 text-amber-700",
    Reservada: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[state]].join(" ")}>{state}</span>;
}
