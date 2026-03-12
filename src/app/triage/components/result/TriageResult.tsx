"use client";

import type { TriageResult as TriageResultType } from "@/lib/triage/triageTypes";

import TriageResultActions from "./TriageResultActions";

interface TriageResultProps {
  result: TriageResultType;
  saving: boolean;
  onConfirm: () => void;
  onReclassify: (color: TriageResultType["suggestedColor"], reason: string) => void;
  onPrint: () => void;
}

export default function TriageResult({
  result,
  saving,
  onConfirm,
  onReclassify,
  onPrint,
}: TriageResultProps) {
  return (
    <section id="triage-result-print" className="space-y-4">
      <article
        className="rounded-2xl border p-4"
        style={{
          backgroundColor: `${result.assignedLevel.colorHex}20`,
          borderColor: result.assignedLevel.colorHex,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: result.assignedLevel.colorHex }}>
          Resultado final sugerido
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-3xl font-black text-slate-900">{result.assignedLevel.color}</p>
            <p className="text-sm text-slate-700">Prioridad {result.suggestedPriority}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{result.maxWaitMinutes} min</p>
            <p className="text-sm text-slate-700">Tiempo maximo de atencion</p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Motivos clinicos">
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
            {result.clinicalReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="Acciones inmediatas">
          <ol className="space-y-2 text-sm text-slate-700">
            {result.immediateActions.map((action) => (
              <li key={`${action.order}-${action.action}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <span className="font-semibold">{action.order}. </span>
                {action.action}
                <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-[10px] uppercase">
                  {action.responsible}
                </span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Alertas criticas">
          {result.criticalAlerts.length === 0 ? (
            <p className="text-sm text-slate-600">Sin alertas criticas adicionales.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {result.criticalAlerts.map((alert) => (
                <li
                  key={alert.message}
                  className={[
                    "rounded-lg border p-2",
                    alert.severity === "immediate"
                      ? "border-red-300 bg-red-50"
                      : alert.severity === "critical"
                        ? "border-amber-300 bg-amber-50"
                        : "border-sky-300 bg-sky-50",
                  ].join(" ")}
                >
                  {alert.message}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Datos faltantes / protocolos">
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold">Subprotocolos activados</p>
              <p>{result.activatedSubprotocols.length ? result.activatedSubprotocols.join(" | ") : "Ninguno"}</p>
            </div>
            <div>
              <p className="font-semibold">Datos faltantes</p>
              <p>{result.missingCriticalData.length ? result.missingCriticalData.join(" | ") : "Sin faltantes"}</p>
            </div>
            <div>
              <p className="font-semibold">Banderas legales</p>
              <p>
                Codigo Purpura: {result.codePurple ? "SI" : "NO"} | Notificacion obligatoria: {result.mandatoryNotification ? "SI" : "NO"}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <TriageResultActions
        suggestedColor={result.suggestedColor}
        saving={saving}
        onConfirm={onConfirm}
        onReclassify={onReclassify}
        onPrint={onPrint}
      />
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
      {children}
    </article>
  );
}
