"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  currentClinicalContext,
  professionalShiftCalendar,
  professionalShiftOverview,
  type ProfessionalShiftCalendarEntry,
} from "../_data/clinical-mock-data";

type RequestTypeId =
  | "shift_change"
  | "day_off"
  | "vacation"
  | "delay_notice"
  | "emergency_notice";

type RequestStatus = "Recibida" | "En revision" | "Aprobada" | "Observada" | "Resuelta";
type RequestPriority = "normal" | "alta" | "critica";
type TrackingFilter = "all" | "open" | "approved" | "critical";

type StaffRequestRecord = {
  id: string;
  trackingCode: string;
  type: RequestTypeId;
  title: string;
  submittedAt: string;
  requestedWindow: string;
  status: RequestStatus;
  priority: RequestPriority;
  summary: string;
  detail: string;
  nextStep: string;
  owner: string;
  attachmentName?: string;
};

const requestReferenceNow = "2026-03-15 11:40";

const requestTypes: Array<{
  id: RequestTypeId;
  label: string;
  shortLabel: string;
  helper: string;
}> = [
  {
    id: "shift_change",
    label: "Cambio de turno",
    shortLabel: "Cambio",
    helper: "Intercambio, permuta o ajuste de cobertura con seguimiento de aprobacion.",
  },
  {
    id: "day_off",
    label: "Solicitud de dia libre",
    shortLabel: "Dia libre",
    helper: "Solicitud puntual de descanso con propuesta de cobertura.",
  },
  {
    id: "vacation",
    label: "Solicitud de vacaciones",
    shortLabel: "Vacaciones",
    helper: "Periodo programado con validacion de talento humano y jefatura.",
  },
  {
    id: "delay_notice",
    label: "Notificar atraso",
    shortLabel: "Atraso",
    helper: "Aviso inmediato de retraso con hora estimada de llegada e impacto.",
  },
  {
    id: "emergency_notice",
    label: "Notificar emergencia",
    shortLabel: "Emergencia",
    helper: "Incidente con explicacion, nivel de criticidad y evidencia fotografica.",
  },
];

const initialRequests: StaffRequestRecord[] = [
  {
    id: "req-001",
    trackingCode: "TUR-20260315-001",
    type: "shift_change",
    title: "Cambio de turno del miercoles 19 mar",
    submittedAt: "2026-03-14 18:10",
    requestedWindow: "19 mar · 15:00 - 23:00",
    status: "En revision",
    priority: "alta",
    summary: "Permuta solicitada con Lic. Gabriela Viteri por cobertura academica.",
    detail: "Coordinacion revisa si la permuta mantiene cobertura de observacion clinica.",
    nextStep: "Pendiente respuesta de coordinacion antes de las 18:00.",
    owner: "Coordinacion de turno",
  },
  {
    id: "req-002",
    trackingCode: "TUR-20260313-002",
    type: "day_off",
    title: "Dia libre compensatorio",
    submittedAt: "2026-03-13 09:20",
    requestedWindow: "21 mar · jornada completa",
    status: "Aprobada",
    priority: "normal",
    summary: "Descanso compensatorio posterior a guardia nocturna.",
    detail: "Solicitud aprobada con cobertura confirmada por equipo de emergencia adultos.",
    nextStep: "No requiere accion adicional.",
    owner: "Jefatura de enfermeria",
  },
  {
    id: "req-003",
    trackingCode: "TUR-20260312-003",
    type: "vacation",
    title: "Vacaciones abril 2026",
    submittedAt: "2026-03-12 15:45",
    requestedWindow: "06 abr - 12 abr",
    status: "Observada",
    priority: "normal",
    summary: "Solicitud enviada para 7 dias con relevo aun no confirmado.",
    detail: "Talento humano solicita completar plan de relevo y traspaso de pacientes cronicos.",
    nextStep: "Adjuntar profesional de reemplazo y reenviar hoy.",
    owner: "Talento humano",
  },
  {
    id: "req-004",
    trackingCode: "INC-20260315-004",
    type: "delay_notice",
    title: "Atraso notificado por movilidad",
    submittedAt: "2026-03-15 06:42",
    requestedWindow: "Llegada estimada 07:20",
    status: "Resuelta",
    priority: "alta",
    summary: "Supervisor reordeno ingreso inicial del turno por 20 min.",
    detail: "Se notifico a observacion clinica y se cubrio recepcion de pacientes criticos.",
    nextStep: "Cierre registrado.",
    owner: "Supervisor de turno",
  },
  {
    id: "req-005",
    trackingCode: "INC-20260315-005",
    type: "emergency_notice",
    title: "Incidente con monitor multiparametro",
    submittedAt: "2026-03-15 10:55",
    requestedWindow: "Emergencia adultos",
    status: "Recibida",
    priority: "critica",
    summary: "Monitor sin lectura estable en box 3; se activa respaldo del servicio.",
    detail: "Ingenieria clinica y coordinacion ya recibieron la novedad y la evidencia.",
    nextStep: "Esperando confirmacion de reemplazo del equipo.",
    owner: "Ingenieria clinica",
    attachmentName: "monitor-box3.jpg",
  },
];

export default function ProfessionalShiftPage() {
  const [activeRequestType, setActiveRequestType] = useState<RequestTypeId>("shift_change");
  const [trackingFilter, setTrackingFilter] = useState<TrackingFilter>("all");
  const [requests, setRequests] = useState<StaffRequestRecord[]>(initialRequests);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const [shiftChangeForm, setShiftChangeForm] = useState({
    currentShiftId: professionalShiftCalendar.find((entry) => entry.status === "En curso")?.id ?? professionalShiftCalendar[0]?.id ?? "",
    desiredShiftId: professionalShiftCalendar.find((entry) => entry.status === "Programado")?.id ?? professionalShiftCalendar[1]?.id ?? "",
    exchangeWith: "Lic. Gabriela Viteri",
    reason: "",
    coveragePlan: "",
  });
  const [dayOffForm, setDayOffForm] = useState({
    date: "2026-03-22",
    duration: "Jornada completa",
    reason: "",
    coveragePlan: "",
  });
  const [vacationForm, setVacationForm] = useState({
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    replacement: "",
    handoffPlan: "",
    reason: "",
  });
  const [delayForm, setDelayForm] = useState({
    delayedMinutes: "20",
    estimatedArrival: "2026-03-15T07:20",
    reason: "Movilidad / trafico",
    impact: "",
  });
  const [emergencyForm, setEmergencyForm] = useState({
    category: "Incidente operativo",
    area: professionalShiftOverview.assignedArea,
    explanation: "",
    supportNeeded: "",
    attachmentName: "",
  });

  const scheduledDays = professionalShiftCalendar.filter((entry) => entry.status !== "Descanso").length;
  const onCallCount = professionalShiftCalendar.filter((entry) => entry.onCall).length;
  const todayShift =
    professionalShiftCalendar.find((entry) => entry.status === "En curso") ?? professionalShiftCalendar[0];

  const openRequestsCount = useMemo(
    () => requests.filter((request) => request.status === "Recibida" || request.status === "En revision" || request.status === "Observada").length,
    [requests]
  );
  const approvedRequestsCount = useMemo(
    () => requests.filter((request) => request.status === "Aprobada" || request.status === "Resuelta").length,
    [requests]
  );
  const criticalIncidentsCount = useMemo(
    () => requests.filter((request) => request.type === "emergency_notice" && request.priority === "critica" && request.status !== "Resuelta").length,
    [requests]
  );
  const filteredRequests = useMemo(() => {
    if (trackingFilter === "all") {
      return requests;
    }

    if (trackingFilter === "open") {
      return requests.filter(
        (request) => request.status === "Recibida" || request.status === "En revision" || request.status === "Observada"
      );
    }

    if (trackingFilter === "approved") {
      return requests.filter((request) => request.status === "Aprobada" || request.status === "Resuelta");
    }

    return requests.filter((request) => request.priority === "critica" || request.type === "emergency_notice");
  }, [requests, trackingFilter]);

  const activeTypeMeta = requestTypes.find((item) => item.id === activeRequestType) ?? requestTypes[0];

  const submitRequest = (request: Omit<StaffRequestRecord, "id" | "trackingCode" | "submittedAt">) => {
    const newRecord: StaffRequestRecord = {
      ...request,
      id: `req-${Date.now()}`,
      trackingCode: buildTrackingCode(request.type, requests.length + 1),
      submittedAt: requestReferenceNow,
    };

    setRequests((prev) => [newRecord, ...prev]);
    setSubmissionFeedback(`${newRecord.title} enviada con folio ${newRecord.trackingCode}.`);
  };

  const handleSubmitShiftChange = () => {
    const currentShift = professionalShiftCalendar.find((entry) => entry.id === shiftChangeForm.currentShiftId);
    const desiredShift = professionalShiftCalendar.find((entry) => entry.id === shiftChangeForm.desiredShiftId);

    if (!currentShift || !desiredShift || !shiftChangeForm.reason.trim()) {
      return;
    }

    submitRequest({
      type: "shift_change",
      title: `Cambio de turno ${currentShift.dayLabel}`,
      requestedWindow: `${desiredShift.dayLabel} · ${desiredShift.shiftRange}`,
      status: "Recibida",
      priority: "alta",
      summary: `Permuta propuesta con ${shiftChangeForm.exchangeWith.trim() || "profesional por confirmar"}.`,
      detail: `Motivo: ${shiftChangeForm.reason.trim()}. Cobertura: ${shiftChangeForm.coveragePlan.trim() || "Sin detalle adicional."}`,
      nextStep: "Coordinacion debe validar cobertura y respuesta del relevo.",
      owner: "Coordinacion de turno",
    });

    setShiftChangeForm((prev) => ({
      ...prev,
      reason: "",
      coveragePlan: "",
    }));
  };

  const handleSubmitDayOff = () => {
    if (!dayOffForm.date || !dayOffForm.reason.trim()) {
      return;
    }

    submitRequest({
      type: "day_off",
      title: "Solicitud de dia libre",
      requestedWindow: `${dayOffForm.date} · ${dayOffForm.duration}`,
      status: "Recibida",
      priority: "normal",
      summary: `Solicitud registrada para ${dayOffForm.duration.toLowerCase()}.`,
      detail: `Motivo: ${dayOffForm.reason.trim()}. Cobertura: ${dayOffForm.coveragePlan.trim() || "Pendiente por definir."}`,
      nextStep: "Jefatura revisara disponibilidad del servicio.",
      owner: "Jefatura de enfermeria",
    });

    setDayOffForm((prev) => ({
      ...prev,
      reason: "",
      coveragePlan: "",
    }));
  };

  const handleSubmitVacation = () => {
    if (!vacationForm.startDate || !vacationForm.endDate || !vacationForm.reason.trim()) {
      return;
    }

    submitRequest({
      type: "vacation",
      title: "Solicitud de vacaciones",
      requestedWindow: `${vacationForm.startDate} - ${vacationForm.endDate}`,
      status: "Recibida",
      priority: "normal",
      summary: `Periodo solicitado con relevo ${vacationForm.replacement.trim() || "aun no confirmado"}.`,
      detail: `Motivo: ${vacationForm.reason.trim()}. Traspaso: ${vacationForm.handoffPlan.trim() || "Sin plan documentado todavia."}`,
      nextStep: "Talento humano validara saldo y cobertura.",
      owner: "Talento humano",
    });

    setVacationForm((prev) => ({
      ...prev,
      replacement: "",
      handoffPlan: "",
      reason: "",
    }));
  };

  const handleSubmitDelay = () => {
    if (!delayForm.estimatedArrival || !delayForm.reason.trim()) {
      return;
    }

    submitRequest({
      type: "delay_notice",
      title: "Notificacion de atraso",
      requestedWindow: `Llegada estimada ${formatDateTimeLabel(delayForm.estimatedArrival)}`,
      status: "Resuelta",
      priority: "alta",
      summary: `Atraso estimado de ${delayForm.delayedMinutes || "0"} min.`,
      detail: `Motivo: ${delayForm.reason.trim()}. Impacto: ${delayForm.impact.trim() || "Sin impacto adicional reportado."}`,
      nextStep: "Supervisor registra la novedad y ajusta la cobertura temporal.",
      owner: "Supervisor de turno",
    });

    setDelayForm((prev) => ({
      ...prev,
      impact: "",
    }));
  };

  const handleEmergencyAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setEmergencyForm((prev) => ({
      ...prev,
      attachmentName: file?.name ?? "",
    }));
  };

  const handleSubmitEmergency = () => {
    if (!emergencyForm.explanation.trim()) {
      return;
    }

    submitRequest({
      type: "emergency_notice",
      title: `Emergencia reportada: ${emergencyForm.category}`,
      requestedWindow: emergencyForm.area,
      status: "Recibida",
      priority: "critica",
      summary: `Incidente reportado en ${emergencyForm.area}.`,
      detail: `${emergencyForm.explanation.trim()} ${emergencyForm.supportNeeded.trim() ? `Soporte requerido: ${emergencyForm.supportNeeded.trim()}.` : ""}`.trim(),
      nextStep: "Coordinacion, seguridad o ingenieria deben confirmar recepcion inmediata.",
      owner: "Mesa de respuesta rapida",
      attachmentName: emergencyForm.attachmentName || undefined,
    });

    setEmergencyForm((prev) => ({
      ...prev,
      explanation: "",
      supportNeeded: "",
      attachmentName: "",
    }));
  };

  return (
    <ModulePage
      title="Horarios y turno"
      subtitle="Agenda laboral, solicitudes del profesional, incidencias y seguimiento de aprobaciones."
      actions={
        <div className="flex flex-wrap gap-2">
          {requestTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveRequestType(item.id)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                activeRequestType === item.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : item.id === "emergency_notice"
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Turno activo" value={todayShift.shiftRange} hint={todayShift.dayLabel} />
        <StatCard label="Area asignada" value={professionalShiftOverview.assignedArea} hint="Cobertura principal" />
        <StatCard label="Guardia hoy" value={professionalShiftOverview.onCallToday ? "Si" : "No"} hint={professionalShiftOverview.onCallWindow} />
        <StatCard label="Guardias semana" value={onCallCount} hint={`${scheduledDays} turnos programados`} />
        <StatCard label="Solicitudes abiertas" value={openRequestsCount} hint="Pendientes de respuesta" />
        <StatCard label="Emergencias activas" value={criticalIncidentsCount} hint={`${approvedRequestsCount} tramites cerrados`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.03fr)_minmax(360px,0.97fr)]">
        <div className="space-y-4">
          <Panel title="Ficha de turno profesional" subtitle="Resumen operativo y condiciones de cobertura">
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

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <MiniCallout
                label="Cobertura actual"
                value={todayShift.service}
                detail={`Area ${todayShift.area} · ${todayShift.shiftName}`}
              />
              <MiniCallout
                label="Siguiente punto critico"
                value={professionalShiftOverview.nextOnCall}
                detail="Revisar traspaso de pacientes complejos antes de iniciar."
              />
              <MiniCallout
                label="Checklist de jornada"
                value="3 items"
                detail="Cobertura, traspaso y reporte de incidencias."
              />
            </div>
          </Panel>

          <Panel title="Agenda semanal" subtitle="Turnos, guardias y cambios visibles por jornada">
            <div className="space-y-2">
              {professionalShiftCalendar.map((entry) => (
                <ShiftRow key={entry.id} entry={entry} />
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Centro de solicitudes" subtitle={activeTypeMeta.helper}>
            <div className="mb-4 flex flex-wrap gap-2">
              {requestTypes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveRequestType(item.id)}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-medium transition",
                    activeRequestType === item.id
                      ? item.id === "emergency_notice"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {submissionFeedback ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-700">
                {submissionFeedback}
              </div>
            ) : null}

            {activeRequestType === "shift_change" ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Turno actual"
                    value={shiftChangeForm.currentShiftId}
                    onChange={(value) =>
                      setShiftChangeForm((prev) => ({ ...prev, currentShiftId: value }))
                    }
                    options={professionalShiftCalendar
                      .filter((entry) => entry.status !== "Descanso")
                      .map((entry) => ({
                        value: entry.id,
                        label: `${entry.dayLabel} · ${entry.shiftRange} · ${entry.service}`,
                      }))}
                  />
                  <SelectField
                    label="Turno solicitado"
                    value={shiftChangeForm.desiredShiftId}
                    onChange={(value) =>
                      setShiftChangeForm((prev) => ({ ...prev, desiredShiftId: value }))
                    }
                    options={professionalShiftCalendar
                      .filter((entry) => entry.status !== "Descanso")
                      .map((entry) => ({
                        value: entry.id,
                        label: `${entry.dayLabel} · ${entry.shiftRange} · ${entry.service}`,
                      }))}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Profesional para relevo o permuta"
                    value={shiftChangeForm.exchangeWith}
                    onChange={(value) =>
                      setShiftChangeForm((prev) => ({ ...prev, exchangeWith: value }))
                    }
                    placeholder="Nombre del profesional"
                  />
                  <InputField
                    label="Plan de cobertura"
                    value={shiftChangeForm.coveragePlan}
                    onChange={(value) =>
                      setShiftChangeForm((prev) => ({ ...prev, coveragePlan: value }))
                    }
                    placeholder="Como se cubrira la jornada"
                  />
                </div>

                <TextAreaField
                  label="Motivo de la solicitud"
                  value={shiftChangeForm.reason}
                  onChange={(value) =>
                    setShiftChangeForm((prev) => ({ ...prev, reason: value }))
                  }
                  placeholder="Explica la razon del cambio y cualquier restriccion clinica u operativa."
                />

                <FormActions
                  primaryLabel="Enviar cambio de turno"
                  onPrimary={handleSubmitShiftChange}
                />
              </div>
            ) : null}

            {activeRequestType === "day_off" ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Fecha solicitada"
                    value={dayOffForm.date}
                    onChange={(value) => setDayOffForm((prev) => ({ ...prev, date: value }))}
                    type="date"
                  />
                  <SelectField
                    label="Cobertura solicitada"
                    value={dayOffForm.duration}
                    onChange={(value) =>
                      setDayOffForm((prev) => ({ ...prev, duration: value }))
                    }
                    options={[
                      { value: "Jornada completa", label: "Jornada completa" },
                      { value: "Media jornada manana", label: "Media jornada manana" },
                      { value: "Media jornada tarde", label: "Media jornada tarde" },
                    ]}
                  />
                </div>

                <InputField
                  label="Propuesta de cobertura"
                  value={dayOffForm.coveragePlan}
                  onChange={(value) =>
                    setDayOffForm((prev) => ({ ...prev, coveragePlan: value }))
                  }
                  placeholder="Profesional que podria cubrir o area de apoyo"
                />

                <TextAreaField
                  label="Justificacion"
                  value={dayOffForm.reason}
                  onChange={(value) =>
                    setDayOffForm((prev) => ({ ...prev, reason: value }))
                  }
                  placeholder="Motivo del dia libre y contexto de servicio."
                />

                <FormActions
                  primaryLabel="Enviar dia libre"
                  onPrimary={handleSubmitDayOff}
                />
              </div>
            ) : null}

            {activeRequestType === "vacation" ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Inicio de vacaciones"
                    value={vacationForm.startDate}
                    onChange={(value) =>
                      setVacationForm((prev) => ({ ...prev, startDate: value }))
                    }
                    type="date"
                  />
                  <InputField
                    label="Fin de vacaciones"
                    value={vacationForm.endDate}
                    onChange={(value) =>
                      setVacationForm((prev) => ({ ...prev, endDate: value }))
                    }
                    type="date"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Profesional de reemplazo"
                    value={vacationForm.replacement}
                    onChange={(value) =>
                      setVacationForm((prev) => ({ ...prev, replacement: value }))
                    }
                    placeholder="Nombre del relevo, si ya existe"
                  />
                  <InputField
                    label="Plan de traspaso"
                    value={vacationForm.handoffPlan}
                    onChange={(value) =>
                      setVacationForm((prev) => ({ ...prev, handoffPlan: value }))
                    }
                    placeholder="Como dejas continuidad del servicio"
                  />
                </div>

                <TextAreaField
                  label="Observaciones"
                  value={vacationForm.reason}
                  onChange={(value) =>
                    setVacationForm((prev) => ({ ...prev, reason: value }))
                  }
                  placeholder="Notas para jefatura o talento humano."
                />

                <FormActions
                  primaryLabel="Enviar vacaciones"
                  onPrimary={handleSubmitVacation}
                />
              </div>
            ) : null}

            {activeRequestType === "delay_notice" ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Minutos estimados de atraso"
                    value={delayForm.delayedMinutes}
                    onChange={(value) =>
                      setDelayForm((prev) => ({ ...prev, delayedMinutes: value }))
                    }
                    type="number"
                  />
                  <InputField
                    label="Hora estimada de llegada"
                    value={delayForm.estimatedArrival}
                    onChange={(value) =>
                      setDelayForm((prev) => ({ ...prev, estimatedArrival: value }))
                    }
                    type="datetime-local"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Motivo del atraso"
                    value={delayForm.reason}
                    onChange={(value) => setDelayForm((prev) => ({ ...prev, reason: value }))}
                    options={[
                      { value: "Movilidad / trafico", label: "Movilidad / trafico" },
                      { value: "Calamidad domestica", label: "Calamidad domestica" },
                      { value: "Salud personal", label: "Salud personal" },
                      { value: "Traslado institucional", label: "Traslado institucional" },
                    ]}
                  />
                  <InputField
                    label="Impacto esperado"
                    value={delayForm.impact}
                    onChange={(value) => setDelayForm((prev) => ({ ...prev, impact: value }))}
                    placeholder="Pacientes o cobertura que podrian verse afectados"
                  />
                </div>

                <FormActions
                  primaryLabel="Registrar atraso"
                  onPrimary={handleSubmitDelay}
                />
              </div>
            ) : null}

            {activeRequestType === "emergency_notice" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
                  Esta notificacion prioriza respuesta rapida. Adjunta explicacion clara y, si aplica, una foto de evidencia.
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Tipo de emergencia"
                    value={emergencyForm.category}
                    onChange={(value) =>
                      setEmergencyForm((prev) => ({ ...prev, category: value }))
                    }
                    options={[
                      { value: "Incidente operativo", label: "Incidente operativo" },
                      { value: "Equipo fuera de servicio", label: "Equipo fuera de servicio" },
                      { value: "Seguridad del profesional", label: "Seguridad del profesional" },
                      { value: "Evento clinico critico", label: "Evento clinico critico" },
                      { value: "Falta de insumo critico", label: "Falta de insumo critico" },
                    ]}
                  />
                  <InputField
                    label="Area o servicio"
                    value={emergencyForm.area}
                    onChange={(value) =>
                      setEmergencyForm((prev) => ({ ...prev, area: value }))
                    }
                    placeholder="Emergencia adultos, observacion, etc."
                  />
                </div>

                <TextAreaField
                  label="Explicacion del incidente"
                  value={emergencyForm.explanation}
                  onChange={(value) =>
                    setEmergencyForm((prev) => ({ ...prev, explanation: value }))
                  }
                  placeholder="Describe que ocurrio, a quien afecta y que accion inmediata se tomo."
                />

                <TextAreaField
                  label="Soporte requerido"
                  value={emergencyForm.supportNeeded}
                  onChange={(value) =>
                    setEmergencyForm((prev) => ({ ...prev, supportNeeded: value }))
                  }
                  placeholder="Personal adicional, ingenieria, seguridad, traslado, insumos, etc."
                />

                <label className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Foto de evidencia
                  </span>
                  <input type="file" accept="image/*" onChange={handleEmergencyAttachment} className="block w-full text-xs text-slate-600" />
                  <p className="mt-2 text-[11px] text-slate-500">
                    {emergencyForm.attachmentName ? `Adjunto listo: ${emergencyForm.attachmentName}` : "Sin foto adjunta todavia."}
                  </p>
                </label>

                <FormActions
                  primaryLabel="Enviar emergencia"
                  onPrimary={handleSubmitEmergency}
                  critical
                />
              </div>
            ) : null}
          </Panel>

          <Panel title="Seguimiento de solicitudes" subtitle="Cada tramite queda con folio, responsable y proximo paso">
            <div className="mb-3 flex flex-wrap gap-2">
              <FilterChip label="Todas" active={trackingFilter === "all"} onClick={() => setTrackingFilter("all")} />
              <FilterChip label="Abiertas" active={trackingFilter === "open"} onClick={() => setTrackingFilter("open")} />
              <FilterChip label="Aprobadas / cerradas" active={trackingFilter === "approved"} onClick={() => setTrackingFilter("approved")} />
              <FilterChip label="Criticas" active={trackingFilter === "critical"} onClick={() => setTrackingFilter("critical")} />
            </div>

            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <RequestTrackingCard key={request.id} request={request} />
              ))}
            </div>
          </Panel>

          <Panel title="Cobertura y guardia" subtitle="Estado de guardias, responsables y prioridades de inicio">
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
                <p className="text-[11px] text-slate-500">Preparar relevo, validar dotacion y confirmar pacientes criticos antes del inicio.</p>
              </article>

              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Checklist rapido</p>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                  <li>Confirmar area de cobertura y equipo asignado.</li>
                  <li>Revisar solicitudes abiertas antes del siguiente relevo.</li>
                  <li>Registrar incidencias del turno para continuidad operativa.</li>
                </ul>
              </article>

              <article className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Emergencias activas</p>
                <p className="mt-1 text-sm font-semibold">{criticalIncidentsCount}</p>
                <p className="text-[11px]">Notificaciones criticas pendientes de cierre en la jornada actual.</p>
              </article>
            </div>
          </Panel>
        </div>
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

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "datetime-local" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
      />
    </label>
  );
}

function FormActions({
  primaryLabel,
  onPrimary,
  critical = false,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  critical?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onPrimary}
        className={[
          "rounded-xl px-4 py-2 text-sm font-medium text-white",
          critical ? "bg-red-600 hover:bg-red-700" : "bg-sky-600 hover:bg-sky-700",
        ].join(" ")}
      >
        {primaryLabel}
      </button>
      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        La solicitud se agrega al seguimiento interno inmediatamente.
      </span>
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
        "rounded-full border px-3 py-1 text-[11px] font-medium transition",
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function RequestTrackingCard({ request }: { request: StaffRequestRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-900">{request.title}</p>
          <p className="text-[11px] text-slate-500">
            {request.trackingCode} · {request.submittedAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RequestPriorityBadge priority={request.priority} />
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-700">{request.summary}</p>
      <p className="mt-1 text-[11px] text-slate-500">{request.requestedWindow}</p>
      <p className="mt-2 text-[11px] text-slate-600">{request.detail}</p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <InfoPill label="Responsable" value={request.owner} />
        <InfoPill label="Siguiente paso" value={request.nextStep} />
      </div>

      {request.attachmentName ? (
        <p className="mt-2 text-[11px] text-slate-500">Adjunto: {request.attachmentName}</p>
      ) : null}
    </article>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-[11px] text-slate-700">{value}</p>
    </div>
  );
}

function MiniCallout({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </article>
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

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Recibida: "border-sky-200 bg-sky-50 text-sky-700",
    "En revision": "border-amber-200 bg-amber-50 text-amber-700",
    Aprobada: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Observada: "border-rose-200 bg-rose-50 text-rose-700",
    Resuelta: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", styles[status]].join(" ")}>
      {status}
    </span>
  );
}

function RequestPriorityBadge({ priority }: { priority: RequestPriority }) {
  const styles: Record<RequestPriority, string> = {
    normal: "border-slate-200 bg-white text-slate-600",
    alta: "border-amber-200 bg-amber-50 text-amber-700",
    critica: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", styles[priority]].join(" ")}>
      {priority}
    </span>
  );
}

function buildTrackingCode(type: RequestTypeId, index: number) {
  const prefixMap: Record<RequestTypeId, string> = {
    shift_change: "TUR",
    day_off: "DIA",
    vacation: "VAC",
    delay_notice: "ATR",
    emergency_notice: "INC",
  };

  return `${prefixMap[type]}-20260315-${String(index).padStart(3, "0")}`;
}

function formatDateTimeLabel(value: string) {
  return value.replace("T", " ");
}
