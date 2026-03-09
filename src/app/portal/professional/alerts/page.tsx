"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";

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

  const loadAlerts = async () => {
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
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const visibleRows = useMemo(
    () => (stateFilter === "all" ? rows : rows.filter((row) => row.state === stateFilter)),
    [rows, stateFilter]
  );

  const updateRow = async (row: AlertRow, state: AlertState, comment?: string) => {
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
  };

  const handleAddComment = async (row: AlertRow) => {
    const comment = window.prompt("Escribe un comentario para la alerta:");

    if (!comment || !comment.trim()) {
      return;
    }

    await updateRow(row, row.state, comment);
  };

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
        {loading ? <p className="text-xs text-slate-500">Cargando alertas...</p> : null}

        {errorMessage ? (
          <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          {visibleRows.map((row) => (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.detail}</p>
                  <p className="text-xs text-slate-600">{row.patientName}</p>
                  <p className="text-[11px] text-slate-500">
                    {row.type} · {row.datetime}
                  </p>
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

              {row.comments.length ? (
                <p className="mt-2 text-[11px] text-slate-600">
                  Ultimo comentario: {row.comments[0].author} · {row.comments[0].text}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <Link
                  href={`/portal/professional/patients/${row.patientId}?tab=summary`}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100"
                >
                  Abrir ficha
                </Link>
                <button
                  type="button"
                  disabled={updatingId === row.id}
                  onClick={() => updateRow(row, "En seguimiento")}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Marcar en seguimiento
                </button>
                <button
                  type="button"
                  disabled={updatingId === row.id}
                  onClick={() => updateRow(row, "Resuelta")}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resolver alerta
                </button>
                <button
                  type="button"
                  disabled={updatingId === row.id}
                  onClick={() => {
                    void handleAddComment(row);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Agregar comentario
                </button>
              </div>
            </article>
          ))}

          {!loading && visibleRows.length === 0 ? (
            <p className="text-xs text-slate-500">No hay alertas para este filtro.</p>
          ) : null}
        </div>
      </Panel>
    </ModulePage>
  );
}
