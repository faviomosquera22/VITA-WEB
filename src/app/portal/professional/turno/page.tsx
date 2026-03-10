import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  currentClinicalContext,
  professionalShiftCalendar,
  professionalShiftOverview,
  type ProfessionalShiftCalendarEntry,
} from "../_data/clinical-mock-data";

export default function ProfessionalShiftPage() {
  const scheduledDays = professionalShiftCalendar.filter((entry) => entry.status !== "Descanso").length;
  const onCallCount = professionalShiftCalendar.filter((entry) => entry.onCall).length;
  const todayShift =
    professionalShiftCalendar.find((entry) => entry.status === "En curso") ?? professionalShiftCalendar[0];

  return (
    <ModulePage
      title="Horarios y turno"
      subtitle="Agenda laboral del profesional, area asignada y estado de guardias."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Turno activo" value={todayShift.shiftRange} hint={todayShift.dayLabel} />
        <StatCard label="Area asignada" value={professionalShiftOverview.assignedArea} hint="Cobertura principal" />
        <StatCard
          label="Guardia hoy"
          value={professionalShiftOverview.onCallToday ? "Si" : "No"}
          hint={professionalShiftOverview.onCallWindow}
        />
        <StatCard label="Guardias semana" value={onCallCount} hint={`${scheduledDays} turnos programados`} />
      </div>

      <Panel title="Ficha de turno profesional" subtitle="Resumen operativo para la jornada actual">
        <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Profesional" value={currentClinicalContext.professionalName} />
          <Field label="Servicio" value={professionalShiftOverview.assignedService} />
          <Field label="Turno base" value={professionalShiftOverview.activeShift} />
          <Field label="Coordinacion" value={professionalShiftOverview.coordinator} />
          <Field label="Contrato" value={professionalShiftOverview.contract} />
          <Field label="Horas semanales" value={`${professionalShiftOverview.weeklyHours} horas`} />
          <Field label="Centro" value={currentClinicalContext.centerName} />
          <Field label="Proxima guardia" value={professionalShiftOverview.nextOnCall} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Agenda semanal" subtitle="Turnos, areas de cobertura y estado de guardia">
          <div className="space-y-2">
            {professionalShiftCalendar.map((entry) => (
              <ShiftRow key={entry.id} entry={entry} />
            ))}
          </div>
        </Panel>

        <Panel title="Detalles de guardia" subtitle="Estado de cobertura extraordinaria y observaciones">
          <div className="space-y-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Guardia del dia</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {professionalShiftOverview.onCallToday ? "Asignada" : "Sin guardia"}
              </p>
              <p className="text-[11px] text-slate-500">{professionalShiftOverview.onCallWindow}</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Siguiente cobertura</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{professionalShiftOverview.nextOnCall}</p>
              <p className="text-[11px] text-slate-500">Revisar dotacion y traspaso de pacientes criticos antes de iniciar.</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Checklist rapido</p>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                <li>Confirmar area de cobertura y equipo asignado.</li>
                <li>Validar disponibilidad para guardia nocturna.</li>
                <li>Registrar incidencias de turno para traspaso.</li>
              </ul>
            </article>
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function ShiftRow({ entry }: { entry: ProfessionalShiftCalendarEntry }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-900">{entry.dayLabel}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <ShiftStatusBadge status={entry.status} />
          <OnCallBadge onCall={entry.onCall} />
        </div>
      </div>

      <p className="mt-1 text-xs text-slate-700">
        {entry.shiftName} · {entry.shiftRange}
      </p>
      <p className="text-[11px] text-slate-500">
        Area: {entry.area} · Servicio: {entry.service}
      </p>
      {entry.onCallRange ? <p className="text-[11px] text-slate-500">Guardia: {entry.onCallRange}</p> : null}
      {entry.notes ? <p className="mt-1 text-[11px] text-slate-600">{entry.notes}</p> : null}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function ShiftStatusBadge({ status }: { status: ProfessionalShiftCalendarEntry["status"] }) {
  const styles: Record<ProfessionalShiftCalendarEntry["status"], string> = {
    "En curso": "border-emerald-200 bg-emerald-50 text-emerald-700",
    Programado: "border-sky-200 bg-sky-50 text-sky-700",
    Descanso: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", styles[status]].join(" ")}>
      {status}
    </span>
  );
}

function OnCallBadge({ onCall }: { onCall: boolean }) {
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        onCall ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500",
      ].join(" ")}
    >
      {onCall ? "Con guardia" : "Sin guardia"}
    </span>
  );
}
