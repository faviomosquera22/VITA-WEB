import Link from "next/link";
import type { EChartsOption } from "echarts";

import ClinicalChart from "./_components/clinical-chart";
import { ModulePage, Panel, RiskBadge, TriageBadge } from "./_components/clinical-ui";
import { NotificationInboxPanel } from "./_components/notifications-center";
import { appointmentRecords, getAppointmentMetrics } from "./_data/appointments-mock-data";
import {
  currentClinicalContext,
  getCurrentCenter,
  getDashboardMetrics,
  getPatientServiceArea,
  getPatientsByTriagePriority,
  professionalSidebarModules,
  type ProfessionalModuleId,
  type SidebarSectionId,
} from "./_data/clinical-mock-data";
import {
  getMedicationAdherenceOverview,
  getPriorityPatientForDashboard,
  getRecentDashboardActivity,
  getServiceDistribution,
  getTriageDistribution,
  getVitalTrend,
} from "./_data/portal-insights";
import { backgroundJobCatalog } from "@/lib/background-jobs/catalog";
import { getMspComplianceDashboard } from "@/lib/msp-compliance";

export const dynamic = "force-dynamic";

const sectionOrder: SidebarSectionId[] = ["main", "clinical", "support", "system"];

const sectionMeta: Record<
  SidebarSectionId,
  {
    title: string;
    subtitle: string;
    accent: string;
  }
> = {
  main: {
    title: "Principal",
    subtitle: "Accesos base del flujo asistencial diario.",
    accent: "from-sky-500/15 to-cyan-500/10",
  },
  clinical: {
    title: "Clinica",
    subtitle: "Modulos operativos de atencion y seguimiento.",
    accent: "from-emerald-500/15 to-teal-500/10",
  },
  support: {
    title: "Gestion y apoyo",
    subtitle: "Reportes, alertas, programas y soporte institucional.",
    accent: "from-amber-500/15 to-orange-500/10",
  },
  system: {
    title: "Sistema",
    subtitle: "Configuracion, cumplimiento y gestion del equipo.",
    accent: "from-violet-500/15 to-indigo-500/10",
  },
};

const moduleDescriptions: Partial<Record<ProfessionalModuleId, string>> = {
  patients: "Busqueda, seleccion y trabajo clinico centrado en el paciente.",
  appointments: "Agenda operativa, disponibilidad y continuidad de citas.",
  triage: "Priorizacion, clasificacion y decision inicial del caso.",
  triage_intake: "Registro estructurado del ingreso de triaje.",
  follow_up: "Controles pendientes, seguimiento y continuidad asistencial.",
  shift: "Turnos, horarios y asignacion profesional.",
  hce: "Historia clinica estructurada y expediente longitudinal.",
  prescription: "Prescripciones, indicaciones y tratamiento.",
  lis_ris: "Laboratorio, imagenologia y resultados asociados.",
  hospitalization: "Camas, evolucion y cuidados de hospitalizacion.",
  surgery: "Flujo quirurgico y soporte perioperatorio.",
  population: "Programas poblacionales, gestion y seguimiento institucional.",
  vitals: "Controles de signos vitales y monitorizacion.",
  medication: "Administracion y trazabilidad de medicamentos.",
  vaccination: "Aplicacion, agenda y control de inmunizaciones.",
  nutrition: "Planes nutricionales y seguimiento dietetico.",
  emotional_health: "Intervenciones y seguimiento emocional.",
  reports: "Reportes imprimibles y formularios MSP.",
  health_centers: "Red de centros y capacidad operativa.",
  health_education: "Material educativo y actividades de promocion.",
  alerts: "Alertas clinicas, administrativas y de seguimiento.",
  care_team: "Estructura del equipo y responsables asistenciales.",
  compliance: "Cumplimiento MSP, seguridad y brechas del sistema.",
  settings: "Parametros generales y configuracion operativa.",
};

export default function ProfessionalHomePage() {
  const metrics = getDashboardMetrics();
  const center = getCurrentCenter();
  const prioritizedPatients = getPatientsByTriagePriority().slice(0, 4);
  const compliance = getMspComplianceDashboard();
  const appointmentMetrics = getAppointmentMetrics();
  const priorityPatient = getPriorityPatientForDashboard();
  const vitalTrend = getVitalTrend(priorityPatient);
  const triageDistribution = getTriageDistribution();
  const serviceDistribution = getServiceDistribution();
  const medicationAdherence = getMedicationAdherenceOverview();
  const recentActivity = getRecentDashboardActivity();
  const operationalJobs = backgroundJobCatalog.filter((job) => job.status === "ready").slice(0, 3);
  const modules = professionalSidebarModules.filter(
    (module) => module.roles.includes("professional") && module.id !== "home"
  );
  const modulesBySection = sectionOrder.map((sectionId) => ({
    sectionId,
    items: modules.filter((module) => module.section === sectionId),
  }));

  const todayLabel = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const moduleBadgeMap: Partial<Record<ProfessionalModuleId, string>> = {
    patients: `${metrics.activePatients} activos`,
    appointments: `${appointmentMetrics.upcoming} proximas`,
    triage: `${metrics.criticalPatients} criticos`,
    follow_up: `${metrics.dayPending} pendientes`,
    vitals: `${metrics.observationPatients} en observacion`,
    medication: `${metrics.pendingMedication} pendientes`,
    vaccination: `${metrics.pendingVaccines} pendientes`,
    reports: `${compliance.summary.averageRecordScore}% MSP`,
    alerts: `${metrics.activeAlerts} alertas`,
    compliance: `${compliance.summary.pendingDomains} brechas`,
  };

  return (
    <ModulePage
      title="Dashboard"
      subtitle="Centro operativo del portal profesional con accesos modulares y prioridad asistencial."
      actions={
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
          {todayLabel}
        </div>
      }
    >
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_45%,#f8fafc_100%)] p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Centro operativo
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              {currentClinicalContext.centerName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Inicio del portal convertido en dashboard de modulos: desde aqui deberia ser claro a que area
              entrar, que esta urgente y que acciones requieren seguimiento inmediato.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <QuickLaunchLink href="/portal/professional/patients" label="Pacientes" tone="dark" />
              <QuickLaunchLink href="/portal/professional/appointments" label="Agenda" tone="sky" />
              <QuickLaunchLink href="/portal/professional/patients/ingreso" label="Nuevo ingreso" />
              <QuickLaunchLink href="/portal/professional/clinical-documents" label="Documentos" />
              <QuickLaunchLink href="/portal/professional/reports" label="Formularios MSP" tone="sky" />
              <QuickLaunchLink href="/portal/professional/cumplimiento" label="Cumplimiento" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroMetric label="Servicio activo" value={currentClinicalContext.service} />
              <HeroMetric label="Profesional" value={currentClinicalContext.professionalName} />
              <HeroMetric label="Turno" value={currentClinicalContext.activeShift} />
              <HeroMetric label="Centro" value={center.name} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <SummaryMetricCard
              title="Pacientes activos"
              value={metrics.activePatients}
              detail="Base clinica en jornada actual"
              tone="slate"
            />
            <SummaryMetricCard
              title="Alertas activas"
              value={metrics.activeAlerts}
              detail="Eventos clinicos abiertos"
              tone="amber"
            />
            <SummaryMetricCard
              title="Pendientes del dia"
              value={metrics.dayPending}
              detail="Casos que requieren cierre"
              tone="sky"
            />
            <SummaryMetricCard
              title="Cumplimiento MSP"
              value={`${compliance.summary.averageRecordScore}%`}
              detail={`${compliance.summary.implementedDomains}/${compliance.summary.totalDomains} dominios`}
              tone="emerald"
            />
          </div>
        </div>
      </section>

      <Panel
        title="Modulos del sistema"
        subtitle="Acceso visual por area, mas cercano a un dashboard clinico que a una pagina de reportes"
      >
        <div className="space-y-6">
          {modulesBySection.map(({ sectionId, items }) => {
            if (!items.length) {
              return null;
            }

            const section = sectionMeta[sectionId];

            return (
              <section key={sectionId} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
                <div className={`rounded-[24px] bg-gradient-to-r ${section.accent} px-4 py-4`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {section.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{section.subtitle}</p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((module) => (
                    <DashboardModuleTile
                      key={module.id}
                      id={module.id}
                      label={module.label}
                      description={moduleDescriptions[module.id] ?? "Modulo operativo del portal profesional."}
                      href={module.path}
                      badge={moduleBadgeMap[module.id] ?? null}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Panel
          title="Monitor clinico prioritario"
          subtitle={
            priorityPatient
              ? `Tendencia reciente de presion arterial y glucosa para ${priorityPatient.fullName}.`
              : "No hay paciente prioritario disponible."
          }
        >
          <ClinicalChart option={buildVitalTrendOption(vitalTrend)} height={340} />
        </Panel>

        <Panel
          title="Distribucion asistencial"
          subtitle="Panorama rapido de prioridades de triaje y carga por servicio."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ClinicalChart option={buildTriageOption(triageDistribution)} height={220} />
            <ClinicalChart option={buildServiceOption(serviceDistribution)} height={220} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Panel
          title="Actividad reciente y adherencia"
          subtitle="Eventos clinicos cercanos al tiempo real junto con estado de administracion farmacologica."
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.patientName}</p>
                      <p className="text-xs text-slate-500">
                        {item.category} · {item.datetime}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
              <ClinicalChart option={buildMedicationOption(medicationAdherence)} height={260} />
            </div>
          </div>
        </Panel>

        <Panel
          title="Recordatorios y operaciones"
          subtitle="Base inicial para notificaciones clinicas, agenda y trabajos en segundo plano."
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <NotificationInboxPanel />
            <div className="space-y-3">
              <section className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Backlog asincrono</p>
                <div className="mt-3 space-y-3">
                  {operationalJobs.map((job) => (
                    <article key={job.id} className="rounded-[18px] border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{job.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{job.description}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {job.queue} · {job.trigger}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Agenda proxima</p>
                <div className="mt-3 space-y-2">
                  {appointmentRecords.slice(0, 3).map((appointment) => (
                    <article key={appointment.id} className="rounded-[18px] border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{appointment.patientName}</p>
                      <p className="text-xs text-slate-500">
                        {appointment.specialty} · {appointment.date} · {appointment.time}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{appointment.clinician}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Pacientes prioritarios"
          subtitle="Casos a revisar primero desde el dashboard"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {prioritizedPatients.map((patient) => (
              <article key={patient.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {patient.age} anios · {getPatientServiceArea(patient)}
                    </p>
                  </div>
                  <TriageBadge triage={patient.triageColor} />
                </div>

                <p className="mt-3 text-sm text-slate-700">{patient.primaryDiagnosis}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Responsable: {patient.assignedProfessional}
                </p>
                <p className="text-[11px] text-slate-500">
                  Ultima actualizacion: {patient.lastControlAt}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <RiskBadge risk={patient.riskLevel} />
                  <Link
                    href={`/portal/professional/patients/${patient.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Abrir ficha
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Atajos de jornada"
            subtitle="Entradas comunes del dia a dia"
          >
            <div className="space-y-3">
              <ShortcutRow
                label="Ingreso clinico"
                detail="Crear expediente estructurado y vincular MSP."
                href="/portal/professional/patients/ingreso"
              />
              <ShortcutRow
                label="Lista de pacientes"
                detail="Buscar paciente, sala, HC o documento."
                href="/portal/professional/patients"
              />
              <ShortcutRow
                label="Reportes MSP"
                detail="Abrir 008 y demas formularios oficiales."
                href="/portal/professional/reports"
              />
              <ShortcutRow
                label="Tablero MSP"
                detail="Revisar cumplimiento y brechas del sistema."
                href="/portal/professional/cumplimiento"
              />
            </div>
          </Panel>

          <Panel
            title="Estado del sistema"
            subtitle="Lectura rapida del dia"
          >
            <div className="space-y-3">
              <CompactStatusRow label="Criticos" value={`${metrics.criticalPatients} pacientes`} />
              <CompactStatusRow label="Medicacion" value={`${metrics.pendingMedication} pendientes`} />
              <CompactStatusRow label="Vacunacion" value={`${metrics.pendingVaccines} pendientes`} />
              <CompactStatusRow label="Examenes" value={`${metrics.pendingExamReview} sin revision`} />
              <CompactStatusRow label="MSP" value={`${compliance.summary.pendingDomains} dominios pendientes`} />
            </div>
          </Panel>
        </div>
      </div>
    </ModulePage>
  );
}

function QuickLaunchLink({
  href,
  label,
  tone = "default",
}: {
  href: string;
  label: string;
  tone?: "default" | "dark" | "sky";
}) {
  const className =
    tone === "dark"
      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${className}`}
    >
      {label}
    </Link>
  );
}

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/85 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryMetricCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string | number;
  detail: string;
  tone: "slate" | "amber" | "sky" | "emerald";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : tone === "emerald"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-800";

  return (
    <article className={`rounded-3xl border p-4 ${toneClassName}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-6 opacity-80">{detail}</p>
    </article>
  );
}

function DashboardModuleTile({
  id,
  label,
  description,
  href,
  badge,
}: {
  id: ProfessionalModuleId;
  label: string;
  description: string;
  href: string;
  badge: string | null;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f3f7fb_68%,#e2e8f0_100%)] shadow-sm">
          <DashboardModuleIcon id={id} />
        </div>
        {badge ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-900">{label}</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

function DashboardModuleIcon({ id }: { id: ProfessionalModuleId }) {
  const iconClassName = "h-9 w-9 text-slate-700";

  if (id === "patients" || id === "care_team") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0" />
      </svg>
    );
  }

  if (id === "appointments") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 3v4M17 3v4M4 8h16" />
        <path d="M5 5h14v16H5z" />
        <path d="M8.5 12.5h3M8.5 16h7" />
      </svg>
    );
  }

  if (id === "triage" || id === "alerts") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="m12 3 9 16H3L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }

  if (id === "triage_intake" || id === "hce" || id === "reports" || id === "compliance") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 4h7l5 5v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M14 4v5h5M9 13h6M9 17h4M9 9h2" />
      </svg>
    );
  }

  if (id === "follow_up" || id === "settings") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  }

  if (id === "shift" || id === "health_centers") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }

  if (id === "prescription" || id === "medication" || id === "vaccination") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 8.5 11.5 4a3 3 0 1 1 4.2 4.2L11.2 12.7A3 3 0 1 1 7 8.5Z" />
        <path d="M9 6.5 14.5 12" />
      </svg>
    );
  }

  if (id === "lis_ris" || id === "health_education") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M9 3h6l5 8-8 10L4 11 9 3Z" />
        <path d="M9 3l3 8 3-8" />
      </svg>
    );
  }

  if (id === "hospitalization") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 14h18v4H3v-4ZM6 10h5a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2Z" />
        <path d="M3 18v2M21 18v2" />
      </svg>
    );
  }

  if (id === "surgery") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 4 10 10M5 10l5-5M14 4c3 2 4 4 4 7 0 2.8-1.5 5.2-4 9" />
        <path d="M14 13 20 7" />
      </svg>
    );
  }

  if (id === "population") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 20h16M7 17V9M12 17V5M17 17v-6" />
      </svg>
    );
  }

  if (id === "vitals" || id === "emotional_health") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 12h4l2-4 4 8 2-4h6" />
      </svg>
    );
  }

  if (id === "nutrition") {
    return (
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3c4 4 5 6.5 5 9a5 5 0 1 1-10 0c0-2.5 1-5 5-9Z" />
        <path d="M12 8c-1 2-2 3-2 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function ShortcutRow({
  label,
  detail,
  href,
}: {
  label: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:bg-white"
    >
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-6 text-slate-500">{detail}</p>
    </Link>
  );
}

function CompactStatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-xs text-slate-700">{value}</span>
    </div>
  );
}

function buildVitalTrendOption(
  points: Array<{ label: string; systolic: number; diastolic: number; heartRate: number; glucose: number }>
): EChartsOption {
  return {
    animationDuration: 500,
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0f172a",
      borderWidth: 0,
      textStyle: { color: "#f8fafc" },
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#475569" },
    },
    grid: { left: 18, right: 18, top: 24, bottom: 42, containLabel: true },
    xAxis: {
      type: "category",
      data: points.map((point) => point.label),
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisLabel: { color: "#64748b" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
      axisLabel: { color: "#64748b" },
    },
    series: [
      {
        name: "Sistolica",
        type: "line",
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: "#0f172a" },
        itemStyle: { color: "#0f172a" },
        data: points.map((point) => point.systolic),
      },
      {
        name: "Diastolica",
        type: "line",
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: "#0284c7" },
        itemStyle: { color: "#0284c7" },
        data: points.map((point) => point.diastolic),
      },
      {
        name: "Glucosa",
        type: "line",
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: "#14b8a6" },
        itemStyle: { color: "#14b8a6" },
        data: points.map((point) => point.glucose),
      },
    ],
  };
}

function buildTriageOption(points: Array<{ label: string; value: number }>): EChartsOption {
  const colorMap: Record<string, string> = {
    rojo: "#dc2626",
    naranja: "#f97316",
    amarillo: "#f59e0b",
    verde: "#10b981",
    azul: "#0284c7",
  };

  return {
    animationDuration: 500,
    tooltip: { trigger: "item" },
    grid: { left: 16, right: 16, top: 12, bottom: 28, containLabel: true },
    xAxis: {
      type: "category",
      data: points.map((point) => point.label),
      axisLabel: { color: "#64748b" },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    series: [
      {
        type: "bar",
        barWidth: 28,
        data: points.map((point) => ({
          value: point.value,
          itemStyle: { color: colorMap[point.label] ?? "#0f172a", borderRadius: [12, 12, 0, 0] },
        })),
      },
    ],
  };
}

function buildServiceOption(
  points: Array<{ label: string; total: number; highRisk: number }>
): EChartsOption {
  return {
    animationDuration: 500,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { bottom: 0, textStyle: { color: "#475569" } },
    grid: { left: 16, right: 16, top: 18, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: points.map((point) => point.label),
      axisLabel: { color: "#64748b", interval: 0, rotate: 12 },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    series: [
      {
        name: "Pacientes",
        type: "bar",
        barGap: "20%",
        data: points.map((point) => point.total),
        itemStyle: { color: "#0f172a", borderRadius: [12, 12, 0, 0] },
      },
      {
        name: "Alto riesgo",
        type: "bar",
        data: points.map((point) => point.highRisk),
        itemStyle: { color: "#0284c7", borderRadius: [12, 12, 0, 0] },
      },
    ],
  };
}

function buildMedicationOption(points: Array<{ label: string; value: number }>): EChartsOption {
  const colors = ["#0f172a", "#0284c7", "#f97316"];

  return {
    animationDuration: 500,
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: "#475569" } },
    series: [
      {
        type: "pie",
        radius: ["52%", "76%"],
        avoidLabelOverlap: true,
        label: { color: "#475569" },
        itemStyle: { borderColor: "#ffffff", borderWidth: 4 },
        data: points.map((point, index) => ({
          name: point.label,
          value: point.value,
          itemStyle: { color: colors[index] ?? "#94a3b8" },
        })),
      },
    ],
  };
}
