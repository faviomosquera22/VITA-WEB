"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { DataTable } from "../_components/data-table";
import {
  appointmentRecords,
  availabilitySlots,
  getAppointmentMetrics,
  type AppointmentRecord,
} from "../_data/appointments-mock-data";

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentRecord["status"]>("all");
  const metrics = getAppointmentMetrics();

  const visibleAppointments = useMemo(() => {
    if (statusFilter === "all") {
      return appointmentRecords;
    }

    return appointmentRecords.filter((appointment) => appointment.status === statusFilter);
  }, [statusFilter]);

  const columns = useMemo<ColumnDef<AppointmentRecord>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Paciente",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-slate-950">{row.original.patientName}</p>
            <p className="text-xs text-slate-500">{row.original.specialty}</p>
          </div>
        ),
      },
      {
        id: "schedule",
        header: "Agenda",
        accessorFn: (row) => `${row.date} ${row.time}`,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-800">
              {row.original.date} · {row.original.time}
            </p>
            <p className="text-xs text-slate-500">{row.original.durationMinutes} min</p>
          </div>
        ),
      },
      {
        accessorKey: "clinician",
        header: "Profesional",
      },
      {
        accessorKey: "mode",
        header: "Modalidad",
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {row.original.mode}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold",
              row.original.status === "Confirmada"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : row.original.status === "Requiere confirmacion"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : row.original.status === "Pendiente"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "location",
        header: "Ubicacion",
      },
    ],
    []
  );

  return (
    <ModulePage
      title="Agenda y citas"
      subtitle="Base escalable para disponibilidad, confirmaciones, seguimiento de consulta y recordatorios."
      actions={
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | AppointmentRecord["status"])}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
        >
          <option value="all">Todos los estados</option>
          <option value="Confirmada">Confirmadas</option>
          <option value="Pendiente">Pendientes</option>
          <option value="Requiere confirmacion">Por confirmar</option>
          <option value="Completada">Completadas</option>
        </select>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Citas" value={metrics.total} hint="Agenda total disponible" />
        <StatCard label="Proximas" value={metrics.upcoming} hint="Pendientes de atencion" />
        <StatCard label="Por confirmar" value={metrics.needsConfirmation} hint="Recordatorios activos" />
        <StatCard label="Teleconsultas" value={metrics.remote} hint="Cobertura remota preparada" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Agenda operativa"
          subtitle="Patron inspirado en flujos de slot selection y reservas modulares."
        >
          <DataTable
            columns={columns}
            data={visibleAppointments}
            searchPlaceholder="Buscar por paciente, especialidad, profesional o ubicacion"
            getSearchText={(row) =>
              [row.patientName, row.specialty, row.clinician, row.location, row.status, row.mode].join(" ")
            }
            initialPageSize={6}
          />
        </Panel>

        <Panel
          title="Disponibilidad"
          subtitle="Slots listos para reserva futura o integracion con motor externo."
        >
          <div className="space-y-3">
            {availabilitySlots.map((slot) => (
              <article key={slot.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{slot.specialty}</p>
                    <p className="text-xs text-slate-500">
                      {slot.dayLabel} · {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      slot.status === "Disponible"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : slot.status === "Reservado"
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600",
                    ].join(" ")}
                  >
                    {slot.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{slot.clinician}</p>
                <p className="text-xs text-slate-500">{slot.mode}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
