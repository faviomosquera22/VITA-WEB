import type { ReactNode } from "react";

import type { RiskLevel, TriageColor } from "../_data/clinical-mock-data";

export function ModulePage({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">
              {title}
            </h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-4 px-4 py-5">{children}</section>
    </main>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </article>
  );
}

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </article>
  );
}

export function TriageBadge({ triage }: { triage: TriageColor }) {
  const styles: Record<TriageColor, string> = {
    rojo: "border-red-200 bg-red-50 text-red-700",
    naranja: "border-orange-200 bg-orange-50 text-orange-700",
    amarillo: "border-amber-200 bg-amber-50 text-amber-700",
    verde: "border-emerald-200 bg-emerald-50 text-emerald-700",
    azul: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        styles[triage],
      ].join(" ")}
    >
      {triage}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    alto: "border-red-200 bg-red-50 text-red-700",
    medio: "border-amber-200 bg-amber-50 text-amber-700",
    bajo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        styles[risk],
      ].join(" ")}
    >
      Riesgo {risk}
    </span>
  );
}
