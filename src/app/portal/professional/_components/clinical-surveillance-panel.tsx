"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import { Panel } from "./clinical-ui";
import type {
  ClinicalObservation,
  ClinicalSurveillancePayload,
  ObservationPriority,
  ObservationStatus,
} from "@/lib/clinical-surveillance/types";

type PriorityFilter = "all" | ObservationPriority;

const priorityMeta: Record<
  ObservationPriority,
  {
    label: string;
    badge: string;
    card: string;
  }
> = {
  critical: {
    label: "Critica",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    card: "border-rose-200 bg-rose-50/50",
  },
  high: {
    label: "Alta",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    card: "border-orange-200 bg-orange-50/40",
  },
  medium: {
    label: "Media",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    card: "border-amber-200 bg-amber-50/40",
  },
  informative: {
    label: "Informativa",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    card: "border-sky-200 bg-sky-50/40",
  },
};

const statusMeta: Record<ObservationStatus, { label: string; className: string }> = {
  new: {
    label: "Nueva",
    className: "border-slate-200 bg-white text-slate-700",
  },
  acknowledged: {
    label: "Revisada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  dismissed: {
    label: "Descartada",
    className: "border-slate-200 bg-slate-100 text-slate-500",
  },
  resolved: {
    label: "Resuelta",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
};

const sourceLabels: Record<string, string> = {
  vital_signs: "Signos vitales",
  diagnosis: "Diagnostico",
  medication_orders: "Prescripcion",
  medication_administrations: "Administracion",
  pain_scale: "Dolor",
  fluid_balance: "Balance hidrico",
  clinical_notes: "Notas clinicas",
  reevaluation: "Reevaluacion",
  allergies: "Alergias",
  grouping: "Agrupacion",
  rules_engine: "Motor de reglas",
  ai_adapter: "Capa IA",
};

export function ClinicalSurveillancePanel({
  patientId,
  title = "Vigilancia clinica",
  subtitle = "Hallazgos automatizados con reglas estructuradas para apoyar la revision clinica del paciente activo.",
  compact = false,
}: {
  patientId?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const [payload, setPayload] = useState<ClinicalSurveillancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadObservations = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
        const response = await fetch(`/api/clinical-surveillance${query}`, {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as ClinicalSurveillancePayload | { error: string };

        if (!response.ok || "error" in result) {
          throw new Error("error" in result ? result.error : "No se pudo cargar la vigilancia clinica.");
        }

        if (!cancelled) {
          setPayload(result);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "No se pudo cargar la vigilancia clinica."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadObservations();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const observations = useMemo(() => payload?.observations ?? [], [payload]);
  const countsByPriority = payload?.countsByPriority ?? {
    critical: 0,
    high: 0,
    medium: 0,
    informative: 0,
  };

  const visibleObservations = useMemo(() => {
    if (priorityFilter === "all") {
      return observations;
    }

    return observations.filter((observation) => observation.priority === priorityFilter);
  }, [observations, priorityFilter]);

  const handleStatusChange = async (
    observation: ClinicalObservation,
    status: Extract<ObservationStatus, "acknowledged" | "dismissed">
  ) => {
    setUpdatingId(observation.id);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/clinical-surveillance/${encodeURIComponent(observation.id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          }
        );

        const result = (await response.json()) as ClinicalObservation | { error: string };

        if (!response.ok || "error" in result) {
          throw new Error(
            "error" in result ? result.error : "No se pudo actualizar la observacion."
          );
        }

        setPayload((current) => {
          if (!current) {
            return current;
          }

          const nextObservations =
            status === "dismissed"
              ? current.observations.filter((item) => item.id !== observation.id)
              : current.observations.map((item) => (item.id === observation.id ? result : item));

          return {
            ...current,
            observations: nextObservations,
            total: nextObservations.length,
            countsByPriority: nextObservations.reduce(
              (accumulator, item) => {
                accumulator[item.priority] += 1;
                return accumulator;
              },
              {
                critical: 0,
                high: 0,
                medium: 0,
                informative: 0,
              }
            ),
          };
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudo actualizar la observacion."
        );
      } finally {
        setUpdatingId(null);
      }
    });
  };

  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <span>
            Motor principal: reglas clinicas estructuradas.
          </span>
          <span
            className={[
              "rounded-full border px-2.5 py-1 font-semibold",
              payload?.aiNarrativeEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600",
            ].join(" ")}
          >
            {payload?.aiNarrativeEnabled
              ? `Redaccion IA activa · ${payload.aiNarrativeProvider === "gemini" ? "Gemini" : "OpenAI"}`
              : "Redaccion IA inactiva"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricTile
            label="Observaciones"
            value={payload?.total ?? 0}
            hint={payload ? `Generadas ${formatDateTime(payload.generatedAt)}` : "Sin datos"}
          />
          <MetricTile label="Criticas" value={countsByPriority.critical} hint="Revisar primero" tone="critical" />
          <MetricTile label="Altas" value={countsByPriority.high} hint="Seguimiento prioritario" tone="high" />
          <MetricTile label="Medias" value={countsByPriority.medium} hint="Validar durante el turno" tone="medium" />
          <MetricTile
            label="Informativas"
            value={countsByPriority.informative}
            hint="Contexto del sistema"
            tone="informative"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="Todas"
            active={priorityFilter === "all"}
            onClick={() => setPriorityFilter("all")}
          />
          {(Object.keys(priorityMeta) as ObservationPriority[]).map((priority) => (
            <FilterChip
              key={priority}
              label={`${priorityMeta[priority].label} (${countsByPriority[priority]})`}
              active={priorityFilter === priority}
              onClick={() => setPriorityFilter(priority)}
            />
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
            Cargando observaciones clinicas...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {!loading && visibleObservations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
            No hay observaciones activas para el filtro actual.
          </div>
        ) : null}

        <div className="space-y-3">
          {visibleObservations.map((observation) => (
            <article
              key={observation.id}
              className={[
                "rounded-2xl border p-4",
                priorityMeta[observation.priority].card,
              ].join(" ")}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        priorityMeta[observation.priority].badge,
                      ].join(" ")}
                    >
                      {priorityMeta[observation.priority].label}
                    </span>
                    <span
                      className={[
                        "rounded-full border px-2.5 py-0.5 text-[11px]",
                        statusMeta[observation.status].className,
                      ].join(" ")}
                    >
                      {statusMeta[observation.status].label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatDateTime(observation.createdAt)}
                    </span>
                  </div>

                  {!compact ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {observation.patientName}
                    </p>
                  ) : null}

                  <h3 className="mt-1 text-base font-semibold text-slate-950">
                    {observation.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {observation.description}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/portal/professional/patients/${observation.patientId}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver expediente
                  </Link>
                  <button
                    type="button"
                    disabled={updatingId === observation.id || observation.status === "acknowledged"}
                    onClick={() => void handleStatusChange(observation, "acknowledged")}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Marcar revisada
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === observation.id}
                    onClick={() => void handleStatusChange(observation, "dismissed")}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Descartar
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                {observation.sourceModules.map((source) => (
                  <span
                    key={`${observation.id}-${source}`}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1"
                  >
                    {sourceLabels[source] ?? source}
                  </span>
                ))}
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                  {observation.narrativeSource === "ai_adapter"
                    ? "Texto refinado por IA"
                    : "Texto base por reglas"}
                </span>
              </div>

              <details className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  Ver detalle y reglas disparadas
                </summary>
                <div className="mt-3 space-y-3">
                  {observation.triggeredRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {rule.ruleName}
                        </span>
                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            priorityMeta[rule.priority].badge,
                          ].join(" ")}
                        >
                          {priorityMeta[rule.priority].label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{rule.description}</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        {Object.entries(rule.metadata).map(([key, value]) => (
                          <div
                            key={`${rule.id}-${key}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <p className="font-semibold text-slate-700">{humanizeKey(key)}</p>
                            <p className="mt-1 break-words text-slate-600">
                              {formatMetadataValue(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "neutral" | "critical" | "high" | "medium" | "informative";
}) {
  const toneClassName =
    tone === "critical"
      ? "text-rose-700"
      : tone === "high"
        ? "text-orange-700"
        : tone === "medium"
          ? "text-amber-700"
          : tone === "informative"
            ? "text-sky-700"
            : "text-slate-950";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className={["mt-2 text-3xl font-semibold", toneClassName].join(" ")}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "No disponible";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatMetadataValue(item)).join(" · ");
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => `${humanizeKey(key)}: ${formatMetadataValue(entryValue)}`)
    .join(" · ");
}
