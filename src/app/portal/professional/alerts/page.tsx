"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { mockPatients } from "../_data/clinical-mock-data";

type AlertState = "Activa" | "En seguimiento" | "Resuelta";

interface AlertRow {
  id: string;
  patientId: string;
  patientName: string;
  detail: string;
  severity: "Critica" | "Moderada" | "Leve";
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
}

export default function AlertsPage() {
  const [stateFilter, setStateFilter] = useState<"all" | AlertState>("all");

  const alertRows = useMemo<AlertRow[]>(() => {
    return mockPatients.flatMap((patient) => {
      const clinicalAlerts = patient.activeAlerts.map((alert, index) => {
        const severity: AlertRow["severity"] =
          patient.riskLevel === "alto"
            ? "Critica"
            : patient.riskLevel === "medio"
            ? "Moderada"
            : "Leve";

        return {
          id: `${patient.id}-alert-${index}`,
          patientId: patient.id,
          patientName: patient.fullName,
          detail: alert,
          severity,
          datetime: patient.lastControlAt,
          state: (index === 0 ? "Activa" : "En seguimiento") as AlertState,
          type: "Signos vitales alterados" as const,
        };
      });

      const vaccineAlert = patient.vaccination.pending.length
        ? [
            {
              id: `${patient.id}-vac-pending`,
              patientId: patient.id,
              patientName: patient.fullName,
              detail: `Vacuna pendiente: ${patient.vaccination.pending[0]?.vaccine}`,
              severity: "Moderada" as const,
              datetime: patient.lastControlAt,
              state: "Activa" as AlertState,
              type: "Vacuna pendiente" as const,
            },
          ]
        : [];

      const emotionalAlert = patient.emotionalHealth.emotionalAlerts.length
        ? [
            {
              id: `${patient.id}-emo-alert`,
              patientId: patient.id,
              patientName: patient.fullName,
              detail: patient.emotionalHealth.emotionalAlerts[0],
              severity: "Moderada" as const,
              datetime: patient.lastControlAt,
              state: "En seguimiento" as AlertState,
              type: "Alerta emocional" as const,
            },
          ]
        : [];

      const medicationAlert = patient.medicationRecords.some(
        (record) => record.administrationStatus !== "Administrado"
      )
        ? [
            {
              id: `${patient.id}-med-alert`,
              patientId: patient.id,
              patientName: patient.fullName,
              detail: "Medicacion pendiente u omitida",
              severity: "Critica" as const,
              datetime: patient.lastControlAt,
              state: "Activa" as AlertState,
              type: "Medicacion omitida" as const,
            },
          ]
        : [];

      return [...clinicalAlerts, ...vaccineAlert, ...emotionalAlert, ...medicationAlert];
    });
  }, []);

  const visibleRows =
    stateFilter === "all" ? alertRows : alertRows.filter((row) => row.state === stateFilter);

  return (
    <ModulePage
      title="Alertas"
      subtitle="Alertas clinicas y operativas con estado, prioridad y accion por paciente."
      actions={
        <select
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value as "all" | AlertState)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700"
        >
          <option value="all">Todas</option>
          <option value="Activa">Activas</option>
          <option value="En seguimiento">En seguimiento</option>
          <option value="Resuelta">Resueltas</option>
        </select>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Alertas totales" value={visibleRows.length} hint="Eventos en lista actual" />
        <StatCard
          label="Criticas"
          value={visibleRows.filter((row) => row.severity === "Critica").length}
          hint="Intervencion inmediata"
        />
        <StatCard
          label="En seguimiento"
          value={visibleRows.filter((row) => row.state === "En seguimiento").length}
          hint="Con acciones abiertas"
        />
        <StatCard
          label="Resueltas"
          value={visibleRows.filter((row) => row.state === "Resuelta").length}
          hint="Cerradas"
        />
      </div>

      <Panel title="Central de alertas" subtitle="Severidad, estado y acciones rapidas por paciente">
        <div className="space-y-2">
          {visibleRows.map((row) => (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.detail}</p>
                  <p className="text-xs text-slate-600">{row.patientName}</p>
                  <p className="text-[11px] text-slate-500">{row.type} · {row.datetime}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      row.severity === "Critica"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : row.severity === "Moderada"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-sky-200 bg-sky-50 text-sky-700",
                    ].join(" ")}
                  >
                    {row.severity}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {row.state}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <Link
                  href={`/portal/professional/patients/${row.patientId}?tab=summary`}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100"
                >
                  Abrir ficha
                </Link>
                <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100">
                  Marcar en seguimiento
                </button>
                <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100">
                  Resolver alerta
                </button>
                <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100">
                  Agregar comentario
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </ModulePage>
  );
}
