import Link from "next/link";

import { ModulePage, Panel, RiskBadge, StatCard, TriageBadge } from "./_components/clinical-ui";
import {
  currentClinicalContext,
  getCenterOperationalSummary,
  getCurrentCenter,
  getDashboardMetrics,
  getDailyPendingTasks,
  getPatientServiceArea,
  getRecentClinicalActivity,
  getTotalPendingVaccines,
  getPatientsByTriagePriority,
  nursingReportRecords,
  type PatientRecord,
} from "./_data/clinical-mock-data";
import { listAuditEvents } from "@/lib/clinical-store";

export const dynamic = "force-dynamic";

export default function ProfessionalHomePage() {
  const metrics = getDashboardMetrics();
  const center = getCurrentCenter();
  const operational = getCenterOperationalSummary();
  const prioritizedPatients = getPatientsByTriagePriority().slice(0, 6);
  const activity = getRecentClinicalActivity();
  const pendingTasks = getDailyPendingTasks();
  const auditEvents = listAuditEvents(6);

  const todayLabel = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  return (
    <ModulePage
      title="Inicio"
      subtitle="Resumen operativo de la jornada clinica con prioridad asistencial en tiempo real."
      actions={
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
          {todayLabel}
        </div>
      }
    >
      <Panel title="Resumen de turno" subtitle="Contexto del servicio y del profesional en sesion">
        <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCell label="Centro de salud" value={currentClinicalContext.centerName} />
          <SummaryCell label="Servicio activo" value={currentClinicalContext.service} />
          <SummaryCell label="Rol actual" value={currentClinicalContext.role} />
          <SummaryCell label="Profesional" value={currentClinicalContext.professionalName} />
          <SummaryCell label="Turno" value={currentClinicalContext.activeShift} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Pacientes activos" value={metrics.activePatients} hint="Censados en jornada actual" />
        <StatCard label="Pacientes criticos" value={metrics.criticalPatients} hint="Riesgo alto o estado critico" />
        <StatCard label="En observacion" value={metrics.observationPatients} hint="Requieren reevaluacion continua" />
        <StatCard label="Alertas activas" value={metrics.activeAlerts} hint="Alertas clinicas abiertas" />
        <StatCard label="Medicaciones pendientes" value={metrics.pendingMedication} hint="Administraciones por registrar" />
        <StatCard label="Vacunas pendientes" value={getTotalPendingVaccines()} hint="Pendientes por aplicar o agendar" />
        <StatCard label="Reportes de enfermeria pendientes" value={metrics.pendingNursingReports} hint="Pacientes sin cierre de turno" />
        <StatCard label="Balances hidricos incompletos" value={metrics.incompleteFluidBalances} hint="Hospitalizacion sin cierre 24h" />
        <StatCard label="Examenes pendientes" value={metrics.pendingExamReview} hint="Resultados sin revision" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Pacientes prioritarios" subtitle="Prioridad clinica por triaje, riesgo y ultima actualizacion">
          <div className="space-y-2">
            {prioritizedPatients.map((patient) => (
              <PrioritizedPatientRow key={patient.id} patient={patient} />
            ))}
          </div>
        </Panel>

        <Panel title="Actividad reciente" subtitle="Controles, notas, medicacion, vacunas, examenes y reportes">
          <div className="space-y-2">
            {activity.slice(0, 8).map((entry) => (
              <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{entry.category}</p>
                  <span className="text-[11px] text-slate-500">{entry.datetime}</span>
                </div>
                <p className="text-xs text-slate-700">{entry.patientName}</p>
                <p className="text-[11px] text-slate-500">{entry.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Pendientes del dia" subtitle="Tareas clinicas que requieren cierre durante el turno">
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{task.label}</p>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {task.count}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {task.patients.slice(0, 3).join(", ") || "Sin pacientes en este bloque"}
                </p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Accesos rapidos" subtitle="Acciones directas para trabajo clinico del turno">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <QuickAction href="/portal/professional/patients" label="Buscar paciente" />
            <QuickAction href="/portal/professional/vitals" label="Registrar signos vitales" />
            <QuickAction href="/portal/professional/nursing-report" label="Agregar nota / reporte enfermeria" />
            <QuickAction href="/portal/professional/medication" label="Registrar medicacion" />
            <QuickAction href="/portal/professional/vaccination" label="Aplicar vacuna" />
            <QuickAction href="/portal/professional/reports" label="Crear reporte" />
            <QuickAction href="/portal/professional/alerts" label="Ver alertas" />
            <QuickAction href="/portal/professional/triage" label="Abrir triaje" />
          </div>
        </Panel>

        <Panel title="Resumen institucional" subtitle="Capacidad del centro y estado del servicio">
          <div className="space-y-2 text-xs text-slate-700">
            <SummaryCell label="Centro actual" value={center.name} />
            <SummaryCell label="Capacidad" value={operational.capacity} />
            <SummaryCell label="Vacunas disponibles hoy" value={`${operational.availableVaccines}`} />
            <SummaryCell label="Profesionales en turno" value={`${operational.professionalsInShift}`} />
            <SummaryCell label="Servicios activos" value={operational.services.join(", ")} />
            <SummaryCell label="Reportes de enfermeria hoy" value={`${nursingReportRecords.length}`} />
          </div>
        </Panel>
      </div>

      <Panel title="Auditoria reciente" subtitle="Eventos de acceso y acciones clinicas registradas">
        <div className="space-y-2">
          {auditEvents.length ? (
            auditEvents.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">
                    {event.actorName} · {event.action}
                  </p>
                  <span className="text-[11px] text-slate-500">{event.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {event.targetType}:{event.targetId}
                </p>
                <p className="text-[11px] text-slate-500">{event.detail}</p>
              </article>
            ))
          ) : (
            <p className="text-xs text-slate-500">Aun no hay eventos en la bitacora.</p>
          )}
        </div>
      </Panel>
    </ModulePage>
  );
}

function PrioritizedPatientRow({ patient }: { patient: PatientRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
          <p className="text-xs text-slate-600">
            {patient.age} anios · {patient.primaryDiagnosis}
          </p>
          <p className="text-[11px] text-slate-500">
            Servicio: {getPatientServiceArea(patient)} · Responsable: {patient.assignedProfessional}
          </p>
          <p className="text-[11px] text-slate-500">
            Estado: {patient.currentStatus} · Ultima actualizacion: {patient.lastControlAt}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge risk={patient.riskLevel} />
          <TriageBadge triage={patient.triageColor} />
          <Link
            href={`/portal/professional/patients/${patient.id}`}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
          >
            Abrir ficha
          </Link>
        </div>
      </div>
    </article>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}
