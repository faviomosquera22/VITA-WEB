import Link from "next/link";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { getMspComplianceDashboard } from "@/lib/msp-compliance";

export const dynamic = "force-dynamic";

export default function CompliancePage() {
  const dashboard = getMspComplianceDashboard();

  return (
    <ModulePage
      title="Cumplimiento MSP y seguridad"
      subtitle="Estado real de protocolos, formularios, seguridad, trazabilidad y brechas para operacion profesional."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            Abrir ingreso clinico
          </Link>
          <Link
            href="/portal/professional"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver al inicio
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Dominios implementados"
          value={dashboard.summary.implementedDomains}
          hint={`${dashboard.summary.totalDomains} dominios evaluados`}
        />
        <StatCard
          label="Dominios parciales"
          value={dashboard.summary.partialDomains}
          hint="Requieren cierre funcional o integracion"
        />
        <StatCard
          label="Dominios pendientes"
          value={dashboard.summary.pendingDomains}
          hint="Imposibilitan declaracion 100% profesional"
        />
        <StatCard
          label="Promedio MSP"
          value={`${dashboard.summary.averageRecordScore}%`}
          hint="Checklist promedio por expediente real"
        />
        <StatCard
          label="Registros clinicos"
          value={dashboard.summary.totalClinicalRecords}
          hint="Base persistida para evaluacion"
        />
      </div>

      <Panel
        title="Lectura ejecutiva"
        subtitle="Estado actual del proyecto frente al objetivo de un HIS plenamente profesional"
      >
        <p className="text-sm text-slate-700">
          El sistema ya tiene una base seria para historia clinica, triaje, consentimiento,
          referencia y checklist MSP por expediente. Aun asi, no es correcto declararlo
          100% profesional mientras persistan datos mock en modulos clinicos y la
          persistencia principal siga fuera de una base transaccional institucional.
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel
          title="Evidencia operativa"
          subtitle="Metricas del expediente real y trazabilidad clinica registrada"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dashboard.metrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-1 text-[11px] text-slate-600">{metric.hint}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Brechas criticas"
          subtitle="Puntos que bloquean la declaracion de sistema de salud 100% profesional"
        >
          <div className="space-y-2">
            {dashboard.criticalGaps.map((gap) => (
              <article
                key={gap.title}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{gap.title}</p>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      gap.severity === "alta"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {gap.severity}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{gap.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Catalogo MSP implementado en el sistema"
        subtitle="Estado por dominio funcional, evidencia y siguiente paso tecnico"
      >
        <div className="space-y-3">
          {dashboard.domains.map((domain) => (
            <article
              key={domain.code}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold text-slate-900">
                    {domain.code} · {domain.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {domain.area} · {domain.reference}
                  </p>
                </div>
                <StatusBadge status={domain.status} />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
                <DetailCard label="Evidencia" value={domain.evidence} />
                <DetailCard label="Riesgo si falta" value={domain.riskIfMissing} />
                <DetailCard label="Siguiente paso" value={domain.nextStep} />
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </ModulePage>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "implementado" | "parcial" | "pendiente" }) {
  const tone =
    status === "implementado"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "parcial"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}
