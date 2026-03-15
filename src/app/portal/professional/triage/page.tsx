"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";

import { ModulePage } from "../_components/clinical-ui";
import {
  getPatientServiceArea,
  mockPatients,
  type PatientRecord,
  type RiskLevel,
  type TriageColor,
} from "../_data/clinical-mock-data";

type QueueItem = {
  patient: PatientRecord;
  waitMinutes: number;
  limitMinutes: number;
  overdue: boolean;
};

const triagePriority: Record<TriageColor, number> = {
  rojo: 5,
  naranja: 4,
  amarillo: 3,
  verde: 2,
  azul: 1,
};

const triageMeta: Record<
  TriageColor,
  {
    index: string;
    label: string;
    target: string;
    waitLabel: string;
    pillClassName: string;
    cardClassName: string;
    accentClassName: string;
    queueClassName: string;
  }
> = {
  rojo: {
    index: "I",
    label: "Rojo",
    target: "Inmediato",
    waitLabel: "0 min",
    pillClassName: "border-rose-400/30 bg-rose-500/15 text-rose-100",
    cardClassName: "border-rose-400/30 bg-rose-500/12 text-rose-50",
    accentClassName: "text-rose-300",
    queueClassName: "border-rose-400/35 bg-rose-500/12",
  },
  naranja: {
    index: "II",
    label: "Naranja",
    target: "Muy urgente",
    waitLabel: "10 min",
    pillClassName: "border-orange-400/30 bg-orange-500/15 text-orange-100",
    cardClassName: "border-orange-400/30 bg-orange-500/12 text-orange-50",
    accentClassName: "text-orange-300",
    queueClassName: "border-orange-400/35 bg-orange-500/10",
  },
  amarillo: {
    index: "III",
    label: "Amarillo",
    target: "Urgente",
    waitLabel: "30 min",
    pillClassName: "border-amber-400/30 bg-amber-500/15 text-amber-100",
    cardClassName: "border-amber-400/30 bg-amber-500/12 text-amber-50",
    accentClassName: "text-amber-200",
    queueClassName: "border-amber-400/35 bg-amber-500/10",
  },
  verde: {
    index: "IV",
    label: "Verde",
    target: "Menor urgencia",
    waitLabel: "60 min",
    pillClassName: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    cardClassName: "border-emerald-400/30 bg-emerald-500/12 text-emerald-50",
    accentClassName: "text-emerald-300",
    queueClassName: "border-emerald-400/35 bg-emerald-500/10",
  },
  azul: {
    index: "V",
    label: "Azul",
    target: "No urgente",
    waitLabel: "120 min",
    pillClassName: "border-sky-400/30 bg-sky-500/15 text-sky-100",
    cardClassName: "border-sky-400/30 bg-sky-500/12 text-sky-50",
    accentClassName: "text-sky-300",
    queueClassName: "border-sky-400/35 bg-sky-500/10",
  },
};

const riskLabelMap: Record<RiskLevel, string> = {
  alto: "Riesgo alto",
  medio: "Riesgo medio",
  bajo: "Riesgo bajo",
};

const triageOptions: Array<{ id: "all" | TriageColor; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "rojo", label: "Rojo" },
  { id: "naranja", label: "Naranja" },
  { id: "amarillo", label: "Amarillo" },
  { id: "verde", label: "Verde" },
  { id: "azul", label: "Azul" },
];

const riskOptions: Array<{ id: "all" | RiskLevel; label: string }> = [
  { id: "all", label: "Todo riesgo" },
  { id: "alto", label: "Alto" },
  { id: "medio", label: "Medio" },
  { id: "bajo", label: "Bajo" },
];

const avpuLabels = [
  { id: "A", label: "Alerta" },
  { id: "V", label: "Voz" },
  { id: "P", label: "Dolor" },
  { id: "U", label: "Sin respuesta" },
] as const;

export default function TriagePage() {
  const [search, setSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState<"all" | TriageColor>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const deferredSearch = useDeferredValue(search);

  const triageQueue = useMemo(() => {
    const query = normalize(deferredSearch);

    return [...mockPatients]
      .filter((patient) => {
        if (triageFilter !== "all" && patient.triageColor !== triageFilter) {
          return false;
        }
        if (riskFilter !== "all" && patient.riskLevel !== riskFilter) {
          return false;
        }
        if (query && !matchesTriageSearch(patient, query)) {
          return false;
        }
        return true;
      })
      .sort((left, right) => {
        if (triagePriority[right.triageColor] !== triagePriority[left.triageColor]) {
          return triagePriority[right.triageColor] - triagePriority[left.triageColor];
        }
        return right.triageAssessment.evaluatedAt.localeCompare(left.triageAssessment.evaluatedAt);
      });
  }, [deferredSearch, riskFilter, triageFilter]);

  const triageWaitData = useMemo<QueueItem[]>(
    () =>
      triageQueue.map((patient, index) => {
        const limitMinutes = getWaitLimit(patient.triageColor);
        const waitMinutes = getEstimatedWaitMinutes(patient.triageColor, index);

        return {
          patient,
          waitMinutes,
          limitMinutes,
          overdue: waitMinutes > limitMinutes,
        };
      }),
    [triageQueue]
  );

  const fallbackSelectedPatientId = triageWaitData[0]?.patient.id ?? "";
  const effectiveSelectedPatientId =
    triageWaitData.find((item) => item.patient.id === selectedPatientId)?.patient.id ??
    fallbackSelectedPatientId;
  const selectedQueueItem =
    triageWaitData.find((item) => item.patient.id === effectiveSelectedPatientId) ?? null;
  const selectedPatient = selectedQueueItem?.patient ?? null;
  const latestVital = selectedPatient?.vitalSigns[0] ?? null;

  const urgentCount = triageWaitData.filter(
    (item) => item.patient.triageColor === "rojo" || item.patient.triageColor === "naranja"
  ).length;
  const reevaluationPending = triageWaitData.filter(
    (item) => item.overdue || item.patient.currentStatus === "En observacion"
  ).length;
  const averageDoorToDoctor = triageWaitData.length
    ? Math.round(
        triageWaitData.reduce((total, item) => total + item.waitMinutes, 0) /
          triageWaitData.length
      )
    : 0;
  const withinGoalCount = triageWaitData.filter((item) => !item.overdue).length;
  const complianceRate = triageWaitData.length
    ? Math.round((withinGoalCount / triageWaitData.length) * 100)
    : 100;

  const selectedAlert = selectedPatient ? getSelectedAlert(selectedPatient) : null;
  const selectedDiscriminators = selectedPatient
    ? buildDiscriminators(selectedPatient)
    : [];
  const activeDiagnoses = selectedPatient?.diagnoses.slice(0, 4) ?? [];
  const recentExams = selectedPatient?.exams.slice(0, 5) ?? [];
  const recentNotes = selectedPatient
    ? [...selectedPatient.nursingNotes, ...selectedPatient.medicalNotes]
        .sort((left, right) => right.datetime.localeCompare(left.datetime))
        .slice(0, 3)
    : [];
  const selectedAvpu = selectedPatient ? inferAvpu(selectedPatient) : "A";

  return (
    <ModulePage
      title="Triaje"
      subtitle="Clasificacion MSP tipo Manchester con cola operativa, reevaluacion y vista clinica por paciente."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/patients"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver pacientes
          </Link>
          <Link
            href="/portal/professional/alerts"
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            Codigo Purpura
          </Link>
          <Link
            href="/portal/professional/triage/ingreso?section=ingreso_identificacion"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Agregar paciente
          </Link>
        </div>
      }
    >
      <section className="overflow-hidden rounded-[34px] border border-slate-700 bg-[#121212] shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0))] px-5 py-5 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-300/80">
                    Estacion de triaje
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                    Triaje MSP con cola clinica priorizada
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Busca al paciente, revisa la cola por prioridad y confirma la clasificacion con
                    contexto clinico en una sola pantalla.
                  </p>
                </div>

                <div className="hidden gap-2 lg:flex">
                  {Object.entries(triageMeta).map(([key, meta]) => (
                    <span
                      key={key}
                      className={[
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                        meta.pillClassName,
                      ].join(" ")}
                    >
                      {meta.index} · {meta.label} · {meta.waitLabel}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <label className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06]">
                  <span className="text-lg text-slate-400 transition group-focus-within:text-emerald-300">
                    ⌕
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, CI, HC, diagnostico o profesional"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  {triageOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTriageFilter(option.id)}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        triageFilter === option.id
                          ? "border-white/0 bg-white text-slate-950"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.07]",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Riesgo
                  </span>
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value as "all" | RiskLevel)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none"
                  >
                    {riskOptions.map((option) => (
                      <option key={option.id} value={option.id} className="bg-slate-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="En cola"
                value={triageWaitData.length}
                hint="Turno actual"
              />
              <MetricCard
                label="Rojo / naranja"
                value={urgentCount}
                hint="Atencion inmediata"
                tone="critical"
              />
              <MetricCard
                label="Sin reevaluar"
                value={reevaluationPending}
                hint="Priorizar revision"
                tone="warning"
              />
              <MetricCard
                label="Puerta-medico"
                value={`${averageDoorToDoctor} min`}
                hint="Promedio del turno"
                tone="neutral"
              />
              <MetricCard
                label="Cumplimiento"
                value={`${complianceRate}%`}
                hint="Tiempos MSP"
                tone="success"
              />
              <MetricCard
                label="Paciente activo"
                value={selectedPatient ? triageMeta[selectedPatient.triageColor].index : "--"}
                hint={selectedPatient ? selectedPatient.fullName : "Selecciona de la cola"}
              />
            </div>
          </div>
        </div>

        {selectedPatient && selectedAlert ? (
          <div className="border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex flex-wrap items-start gap-2">
                <span className="mt-0.5 text-base text-rose-200">⚠</span>
                <div className="space-y-1">
                  <p className="font-semibold">{selectedAlert.title}</p>
                  <p className="text-sm leading-6 text-rose-100/90">{selectedAlert.detail}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[370px_minmax(0,1fr)]">
          <DarkPanel
            title="Cola de triaje"
            subtitle="Ordenada por prioridad y tiempo objetivo MSP"
            rightSlot={
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-emerald-300 transition hover:border-emerald-300/30 hover:bg-emerald-500/10"
              >
                Actualizar
              </button>
            }
            className="min-h-[820px]"
          >
            {triageWaitData.length === 0 ? (
              <EmptyQueue search={search} />
            ) : (
              <div className="space-y-3">
                {triageWaitData.map((item) => (
                  <QueueCard
                    key={item.patient.id}
                    item={item}
                    selected={item.patient.id === effectiveSelectedPatientId}
                    onSelect={() => setSelectedPatientId(item.patient.id)}
                  />
                ))}
              </div>
            )}
          </DarkPanel>

          <div className="space-y-4">
            {selectedPatient ? (
              <>
                <SelectedPatientHero patient={selectedPatient} />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                  <DarkPanel
                    title="Paciente seleccionado"
                    subtitle="Contexto clinico inmediato para clasificar y actuar"
                    rightSlot={
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          triageMeta[selectedPatient.triageColor].pillClassName,
                        ].join(" ")}
                      >
                        {triageMeta[selectedPatient.triageColor].index} ·{" "}
                        {triageMeta[selectedPatient.triageColor].label}
                      </span>
                    }
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoField
                        label="Motivo de consulta principal"
                        value={selectedPatient.triageAssessment.consultationReason}
                      />
                      <InfoField
                        label="Servicio destino"
                        value={getDestinationService(selectedPatient)}
                      />
                      <InfoField
                        label="Inicio de sintomas"
                        value={selectedPatient.triageAssessment.evolutionTime}
                      />
                      <InfoField
                        label="Profesional de triaje"
                        value={selectedPatient.assignedProfessional}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                      <VitalSignsCard latestVital={latestVital} />

                      <div className="space-y-4">
                        <ScaleCard title="Dolor - escala EVA">
                          <PainScale value={latestVital?.painScale ?? 0} />
                        </ScaleCard>

                        <ScaleCard title="Nivel de conciencia - AVPU">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {avpuLabels.map((option) => (
                              <div
                                key={option.id}
                                className={[
                                  "rounded-2xl border px-3 py-3 text-center",
                                  selectedAvpu === option.id
                                    ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-50"
                                    : "border-white/10 bg-black/20 text-slate-400",
                                ].join(" ")}
                              >
                                <p className="text-lg font-semibold">{option.id}</p>
                                <p className="text-xs">{option.label}</p>
                              </div>
                            ))}
                          </div>
                        </ScaleCard>
                      </div>
                    </div>
                  </DarkPanel>

                  <div className="space-y-4">
                    <DarkPanel
                      title="Clasificacion MSP"
                      subtitle="Nivel de prioridad y tiempos objetivo"
                    >
                      <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {Object.entries(triageMeta).map(([key, meta]) => {
                          const color = key as TriageColor;
                          const active = selectedPatient.triageColor === color;

                          return (
                            <div
                              key={color}
                              className={[
                                "rounded-2xl border p-3 transition",
                                active
                                  ? meta.cardClassName
                                  : "border-white/10 bg-black/20 text-slate-300",
                              ].join(" ")}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                                    Nivel {meta.index}
                                  </p>
                                  <p className="mt-2 text-base font-semibold">{meta.label}</p>
                                </div>
                                <span className="text-xs font-medium">{meta.waitLabel}</span>
                              </div>
                              <p className="mt-3 text-sm text-white/80">{meta.target}</p>
                            </div>
                          );
                        })}
                      </div>
                    </DarkPanel>

                    <DarkPanel
                      title="Discriminadores clinicos activos"
                      subtitle="Signos de alarma, sintomas y banderas de monitorizacion"
                    >
                      <div className="flex flex-wrap gap-2">
                        {selectedDiscriminators.length === 0 ? (
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-400">
                            Sin discriminadores activos
                          </span>
                        ) : (
                          selectedDiscriminators.map((item) => (
                            <span
                              key={item.label}
                              className={[
                                "rounded-full border px-3 py-1.5 text-xs font-medium",
                                item.tone === "high"
                                  ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
                                  : item.tone === "medium"
                                  ? "border-amber-300/20 bg-amber-500/10 text-amber-100"
                                  : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
                              ].join(" ")}
                            >
                              {item.label}
                            </span>
                          ))
                        )}
                      </div>
                    </DarkPanel>

                    <DarkPanel
                      title="Conducta sugerida / nota de triaje"
                      subtitle="Resumen para accion inmediata en admision o sala"
                    >
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm leading-7 text-slate-200">
                          {selectedPatient.triageAssessment.suggestedConduct}.{" "}
                          {selectedPatient.triageAssessment.professionalObservations}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          Derivacion: {selectedPatient.triageAssessment.referral}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          Re-triaje
                        </button>
                        <button
                          type="button"
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          Confirmar nivel {triageMeta[selectedPatient.triageColor].index}
                        </button>
                        <Link
                          href={`/portal/professional/patients/${selectedPatient.id}?tab=triage`}
                          className="rounded-2xl border border-emerald-300/20 bg-emerald-500/12 px-4 py-3 text-center text-sm font-medium text-emerald-50 transition hover:border-emerald-300/30 hover:bg-emerald-500/20"
                        >
                          Abrir ficha clinica
                        </Link>
                      </div>
                    </DarkPanel>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <DarkPanel
                    title="Diagnosticos activos"
                    subtitle="Problemas clinicos vigentes del paciente seleccionado"
                  >
                    <div className="space-y-3">
                      {activeDiagnoses.map((diagnosis) => (
                        <div
                          key={diagnosis.id}
                          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-start lg:justify-between"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-slate-400">
                                {diagnosis.type}
                              </span>
                              <p className="text-sm font-semibold text-white">
                                {diagnosis.diagnosis}
                              </p>
                            </div>
                            <p className="mt-2 text-xs leading-6 text-slate-400">
                              {diagnosis.observations}
                            </p>
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            {diagnosis.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DarkPanel>

                  <DarkPanel
                    title="Alergias y antecedentes"
                    subtitle="Datos rapidos antes de medicar o derivar"
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Alergias / intolerancias
                        </p>
                        {getRecordedAllergies(selectedPatient).length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getRecordedAllergies(selectedPatient).map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">Sin alergias registradas</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Antecedentes familiares
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          {selectedPatient.antecedentes.family.join(" · ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Enfermedades cronicas
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPatient.antecedentes.chronicDiseases.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DarkPanel>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
                  <DarkPanel
                    title="Resultados de laboratorio / examenes"
                    subtitle="Pendientes y resultados recientes vinculados al episodio"
                  >
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="min-w-full divide-y divide-white/8 text-left">
                        <thead className="bg-white/[0.03]">
                          <tr className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            <th className="px-4 py-3 font-semibold">Examen</th>
                            <th className="px-4 py-3 font-semibold">Estado</th>
                            <th className="px-4 py-3 font-semibold">Resumen</th>
                            <th className="px-4 py-3 font-semibold">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/8 bg-black/20">
                          {recentExams.map((exam) => (
                            <tr key={exam.id} className="text-sm text-slate-200">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-white">{exam.name}</p>
                                  <p className="text-xs text-slate-500">{exam.category}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={[
                                    "rounded-full border px-3 py-1 text-xs font-medium",
                                    exam.status === "Pendiente"
                                      ? "border-amber-300/20 bg-amber-500/10 text-amber-100"
                                      : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
                                  ].join(" ")}
                                >
                                  {exam.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-300">{exam.summary}</td>
                              <td className="px-4 py-3 text-slate-400">
                                {exam.resultAt ?? exam.requestedAt}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DarkPanel>

                  <DarkPanel
                    title="Notas clinicas"
                    subtitle="Ultimas observaciones de enfermeria y medicina"
                  >
                    <div className="space-y-3">
                      {recentNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="font-semibold text-white">{note.professional}</span>
                            <span>{note.datetime}</span>
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">
                              {note.specialty}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-300">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </DarkPanel>
                </div>
              </>
            ) : (
              <DarkPanel title="Sin paciente seleccionado" subtitle="Usa la cola de triaje para abrir un caso">
                <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-6 py-14 text-center">
                  <p className="text-base font-semibold text-white">No hay casos visibles con estos filtros.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Ajusta la busqueda o crea un nuevo ingreso de triaje para continuar.
                  </p>
                </div>
              </DarkPanel>
            )}
          </div>
        </div>
      </section>
    </ModulePage>
  );
}

function DarkPanel({
  title,
  subtitle,
  children,
  rightSlot,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={[
        "rounded-[26px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      ].join(" ")}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      {children}
    </article>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "critical" | "warning" | "success" | "neutral";
}) {
  const toneClassName =
    tone === "critical"
      ? "text-rose-300"
      : tone === "warning"
      ? "text-amber-300"
      : tone === "success"
      ? "text-emerald-300"
      : "text-white";

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={["mt-3 text-4xl font-semibold tracking-tight", toneClassName].join(" ")}>{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  );
}

function EmptyQueue({ search }: { search: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-6 text-center">
      <div>
        <p className="text-base font-semibold text-white">No hay pacientes en la cola visible</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {search
            ? "Prueba otra combinacion de busqueda o cambia el filtro de color y riesgo."
            : "Agrega un paciente nuevo o limpia los filtros para ver toda la cola de triaje."}
        </p>
      </div>
    </div>
  );
}

function QueueCard({
  item,
  selected,
  onSelect,
}: {
  item: QueueItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { patient, waitMinutes, limitMinutes, overdue } = item;
  const latestVital = patient.vitalSigns[0];
  const meta = triageMeta[patient.triageColor];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-[24px] border p-4 text-left transition",
        selected
          ? meta.queueClassName
          : "border-white/10 bg-black/20 hover:border-white/15 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{patient.fullName}</p>
          <p className="mt-1 text-sm text-slate-400">
            {patient.age} a · {patient.sex.slice(0, 1)} · CI {patient.identification}
          </p>
          <p className="text-sm text-slate-500">HC {patient.medicalRecordNumber}</p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
            meta.pillClassName,
          ].join(" ")}
        >
          {meta.index} · {meta.label}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">
        {patient.triageAssessment.consultationReason} · {getPatientServiceArea(patient)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniVital label="PA" value={latestVital?.bloodPressure ?? "--"} />
        <MiniVital label="FC" value={latestVital ? `${latestVital.heartRate}` : "--"} />
        <MiniVital label="SpO2" value={latestVital ? `${latestVital.spo2}%` : "--"} />
        <MiniVital label="EVA" value={latestVital ? `${latestVital.painScale}/10` : "--"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {getRecordedAllergies(patient).length > 0 ? (
          <span className="rounded-full border border-rose-300/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-100">
            Alergias
          </span>
        ) : null}
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
          {riskLabelMap[patient.riskLevel]}
        </span>
      </div>

      <div className="mt-4 border-t border-white/8 pt-3 text-xs text-slate-400">
        <div className="flex items-center justify-between gap-3">
          <span>
            Espera {waitMinutes} min / objetivo {limitMinutes} min
          </span>
          <span
            className={
              overdue ? "font-semibold text-rose-300" : "font-semibold text-emerald-300"
            }
          >
            {overdue ? "Fuera de objetivo" : "En tiempo"}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span>Clasif. {patient.assignedProfessional}</span>
          <span>{formatShortDate(patient.triageAssessment.evaluatedAt)}</span>
        </div>
      </div>
    </button>
  );
}

function SelectedPatientHero({ patient }: { patient: PatientRecord }) {
  const meta = triageMeta[patient.triageColor];

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(140deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02)),radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%)] p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-3xl font-semibold text-emerald-700">
            {getInitials(patient.fullName)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-3xl font-semibold tracking-tight text-white">{patient.fullName}</h3>
              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  meta.pillClassName,
                ].join(" ")}
              >
                {meta.index} · {meta.label}
              </span>
            </div>
            <p className="mt-2 text-lg text-slate-300">
              CI: {patient.identification} · {patient.age} anios · {patient.sex} · Gpo:{" "}
              {patient.personalData.bloodType} · {patient.personalData.insurance}
            </p>
            {patient.activeAlerts.length > 0 ? (
              <p className="mt-2 text-sm font-medium text-rose-300">
                Alertas: {patient.activeAlerts.join(" · ")}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {getRecordedAllergies(patient).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100"
                >
                  {item}
                </span>
              ))}
              {patient.antecedentes.chronicDiseases.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                Ingreso: {patient.admissionDate}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
                {getPatientServiceArea(patient)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px] xl:grid-cols-4">
          <HeroStat
            value={patient.activeAlerts.length}
            label="Alertas activas"
            tone="critical"
          />
          <HeroStat
            value={patient.exams.filter((item) => item.status === "Pendiente").length}
            label="Labs pendientes"
            tone="warning"
          />
          <HeroStat value={patient.diagnoses.length} label="Diagnosticos" />
          <HeroStat
            value={patient.medicationRecords.length}
            label="Medicamentos"
          />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "critical" | "warning";
}) {
  const toneClassName =
    tone === "critical"
      ? "text-rose-300"
      : tone === "warning"
      ? "text-amber-300"
      : "text-white";

  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
      <p className={["text-3xl font-semibold", toneClassName].join(" ")}>{value}</p>
      <p className="mt-2 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

function VitalSignsCard({
  latestVital,
}: {
  latestVital: PatientRecord["vitalSigns"][number] | null;
}) {
  const items = [
    { label: "PA", value: latestVital?.bloodPressure ?? "--", tone: "critical" as const },
    { label: "FC", value: latestVital ? `${latestVital.heartRate} lpm` : "--", tone: "warning" as const },
    { label: "FR", value: latestVital ? `${latestVital.respiratoryRate} rpm` : "--", tone: "warning" as const },
    { label: "Temp.", value: latestVital ? `${latestVital.temperature} °C` : "--", tone: "success" as const },
    { label: "SpO2", value: latestVital ? `${latestVital.spo2} %` : "--", tone: "success" as const },
    { label: "Glucosa", value: latestVital ? `${latestVital.glucose} mg/dL` : "--", tone: "critical" as const },
  ];

  return (
    <ScaleCard title="Signos vitales al ingreso">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {item.label}
            </p>
            <p
              className={[
                "mt-3 text-2xl font-semibold tracking-tight",
                item.tone === "critical"
                  ? "text-rose-300"
                  : item.tone === "warning"
                  ? "text-amber-300"
                  : "text-emerald-300",
              ].join(" ")}
            >
              {item.value}
            </p>
            {latestVital ? (
              <p className="mt-2 text-xs text-slate-500">{formatShortDate(latestVital.recordedAt)}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ScaleCard>
  );
}

function ScaleCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function PainScale({ value }: { value: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, index) => {
          const tone =
            index <= 2
              ? "bg-emerald-200 text-emerald-800"
              : index <= 5
              ? "bg-amber-200 text-amber-800"
              : "bg-rose-200 text-rose-800";

          return (
            <div
              key={index}
              className={[
                "flex h-10 items-center justify-center rounded-full border text-sm font-semibold",
                value === index
                  ? `${tone} border-white/0 shadow-[0_0_0_3px_rgba(255,255,255,0.08)]`
                  : "border-white/10 bg-black/20 text-slate-400",
              ].join(" ")}
            >
              {index}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-slate-400">
        {value === 0
          ? "Sin dolor"
          : value <= 3
          ? "Dolor leve"
          : value <= 6
          ? "Dolor moderado"
          : "Dolor severo"}
      </p>
    </div>
  );
}

function MiniVital({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
      {label} {value}
    </span>
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesTriageSearch(patient: PatientRecord, query: string) {
  const haystack = [
    patient.fullName,
    patient.identification,
    patient.medicalRecordNumber,
    patient.code,
    patient.assignedProfessional,
    patient.primaryDiagnosis,
    patient.triageAssessment.consultationReason,
    patient.triageAssessment.symptoms.join(" "),
    patient.activeAlerts.join(" "),
    getPatientServiceArea(patient),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getWaitLimit(color: TriageColor) {
  const limits: Record<TriageColor, number> = {
    rojo: 0,
    naranja: 10,
    amarillo: 30,
    verde: 60,
    azul: 120,
  };

  return limits[color];
}

function getEstimatedWaitMinutes(color: TriageColor, index: number) {
  const base: Record<TriageColor, number> = {
    rojo: 3,
    naranja: 12,
    amarillo: 22,
    verde: 44,
    azul: 78,
  };

  return base[color] + index * 4;
}

function getSelectedAlert(patient: PatientRecord) {
  const allergy = getRecordedAllergies(patient)[0];
  const primaryAlert = patient.activeAlerts[0];

  if (!primaryAlert && !allergy) {
    return null;
  }

  return {
    title: `${patient.fullName}: ${allergy ? `alergia a ${allergy}` : primaryAlert}`,
    detail: [
      primaryAlert ?? patient.primaryDiagnosis,
      patient.primaryDiagnosis,
      "Verificar medicacion, discriminadores y conducta antes de confirmar la clasificacion.",
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

function buildDiscriminators(patient: PatientRecord) {
  const latestVital = patient.vitalSigns[0];
  const items = [
    ...patient.triageAssessment.warningSigns,
    ...patient.triageAssessment.symptoms,
    ...(latestVital?.outOfRangeFlags ?? []),
  ];

  return Array.from(new Set(items)).slice(0, 8).map((item) => ({
    label: item,
    tone: getDiscriminatorTone(item),
  }));
}

function getDiscriminatorTone(item: string) {
  const normalized = item.toLowerCase();

  if (
    normalized.includes("shock") ||
    normalized.includes("alteracion") ||
    normalized.includes("hipotension") ||
    normalized.includes("spo2") ||
    normalized.includes("dolor")
  ) {
    return "high" as const;
  }

  if (
    normalized.includes("ta") ||
    normalized.includes("fc") ||
    normalized.includes("glucosa") ||
    normalized.includes("disnea") ||
    normalized.includes("mareo")
  ) {
    return "medium" as const;
  }

  return "low" as const;
}

function inferAvpu(patient: PatientRecord) {
  const terms = [
    ...patient.triageAssessment.warningSigns,
    ...patient.triageAssessment.symptoms,
    patient.primaryDiagnosis,
  ]
    .join(" ")
    .toLowerCase();

  if (terms.includes("perdida de conciencia") || terms.includes("inconsciente")) {
    return "U";
  }

  if (terms.includes("alteracion de conciencia")) {
    return "V";
  }

  if (patient.currentStatus === "Critico" && patient.triageColor === "rojo") {
    return "A";
  }

  return "A";
}

function getDestinationService(patient: PatientRecord) {
  const service = getPatientServiceArea(patient);
  const referral = patient.triageAssessment.referral;

  if (service === "Emergencia") {
    return `Sala de emergencia · ${referral}`;
  }

  if (service === "Observacion") {
    return `Observacion clinica · ${referral}`;
  }

  return `${service} · ${referral}`;
}

function getRecordedAllergies(patient: PatientRecord) {
  return patient.antecedentes.allergies.filter((item) => normalize(item) !== "no conocidas");
}

function formatShortDate(value: string) {
  return value.replace("2026-", "").replace(" ", " · ");
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0] ?? "")
    .join("")
    .toUpperCase();
}
