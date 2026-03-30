"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { DataTable } from "../_components/data-table";

type AlertState = "Activa" | "En seguimiento" | "Resuelta";

interface AlertComment {
  id: string;
  author: string;
  text: string;
  datetime: string;
}

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
  comments: AlertComment[];
}

export default function AlertsPage() {
  const [stateFilter, setStateFilter] = useState<"all" | AlertState>("all");
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/alerts", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la central de alertas.");
      }

      const result = (await response.json()) as AlertRow[];
      setRows(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const visibleRows = useMemo(
    () => (stateFilter === "all" ? rows : rows.filter((row) => row.state === stateFilter)),
    [rows, stateFilter]
  );

  const updateRow = useCallback(async (row: AlertRow, state: AlertState, comment?: string) => {
    setUpdatingId(row.id);

    try {
      const response = await fetch(`/api/alerts/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state, comment }),
      });

      const updated = (await response.json()) as AlertRow | { error: string };

      if (!response.ok || "error" in updated) {
        throw new Error("error" in updated ? updated.error : "No se pudo actualizar alerta");
      }

      setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(message);
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleAddComment = useCallback(async (row: AlertRow) => {
    const comment = window.prompt("Escribe un comentario para la alerta:");

    if (!comment || !comment.trim()) {
      return;
    }

    await updateRow(row, row.state, comment);
  }, [updateRow]);

  const columns = useMemo<ColumnDef<AlertRow>[]>(
    () => [
      {
        accessorKey: "detail",
        header: "Alerta",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-slate-950">{row.original.detail}</p>
            <p className="text-xs text-slate-500">{row.original.type}</p>
          </div>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Paciente",
      },
      {
        accessorKey: "severity",
        header: "Severidad",
        cell: ({ row }) => (
          <span
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold",
              row.original.severity === "Critica"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : row.original.severity === "Moderada"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-sky-200 bg-sky-50 text-sky-700",
            ].join(" ")}
          >
            {row.original.severity}
          </span>
        ),
      },
      {
        accessorKey: "state",
        header: "Estado",
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {row.original.state}
          </span>
        ),
      },
      {
        accessorKey: "datetime",
        header: "Fecha",
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/portal/professional/patients/${row.original.patientId}?tab=summary`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Abrir ficha
            </Link>
            <button
              type="button"
              disabled={updatingId === row.original.id}
              onClick={() => updateRow(row.original, "En seguimiento")}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
            >
              Seguimiento
            </button>
            <button
              type="button"
              disabled={updatingId === row.original.id}
              onClick={() => updateRow(row.original, "Resuelta")}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
            >
              Resolver
            </button>
            <button
              type="button"
              disabled={updatingId === row.original.id}
              onClick={() => {
                void handleAddComment(row.original);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
            >
              Comentario
            </button>
          </div>
        ),
      },
    ],
    [handleAddComment, updateRow, updatingId]
  );

  return (
    <ModulePage
      title="Alertas"
      subtitle="Central profesional con tabla operativa, filtros de estado y acciones rapidas por paciente."
      actions={
        <select
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value as "all" | AlertState)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
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

      <Panel title="Central de alertas" subtitle="Severidad, estado y accion trazable por paciente">
        {loading ? <p className="mb-3 text-sm text-slate-500">Cargando alertas...</p> : null}

        {errorMessage ? (
          <p className="mb-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {!loading ? (
          <DataTable
            columns={columns}
            data={visibleRows}
            initialPageSize={8}
            searchPlaceholder="Buscar por paciente, detalle, tipo o severidad"
            getSearchText={(row) => [row.patientName, row.detail, row.type, row.severity, row.state].join(" ")}
          />
        ) : null}
      </Panel>
    </ModulePage>
  );
}
