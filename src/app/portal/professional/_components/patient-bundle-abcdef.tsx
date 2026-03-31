"use client";

import { useMemo, useState } from "react";

import type { PatientRecord } from "../_data/clinical-mock-data";
import { Panel } from "./clinical-ui";
import {
  buildBundleClosureSnapshot,
  buildBundleDashboard,
  bundleComponentMeta,
  createInitialBundleState,
  formatBundleDateTime,
  getBundleUpdatedStateTimestamp,
  getMechanicalVentilationStatus,
  inferBundleFamilyContact,
  type BundleAbcdefState,
  type BundleApplicability,
  type BundleClosureRecord,
  type BundleClosureType,
  type BundleComponentCode,
  type BundleDeliriumEntry,
  type BundleFamilyEntry,
  type BundleMobilityEntry,
  type BundlePainEntry,
  type BundleSatSbtEntry,
  type BundleSedationEntry,
} from "@/lib/bundle-abcdef";

type PatientBundleAbcdefProps = {
  patient: PatientRecord;
  currentProfessional: string;
  onAudit?: (title: string, details: string) => void;
};

type ApplicabilityDraft = {
  applicability: BundleApplicability;
  reason: string;
};

const bundleCodes: BundleComponentCode[] = ["A", "B", "C", "D", "E", "F"];

const applicabilityOptions: Array<{ value: BundleApplicability; label: string }> = [
  { value: "aplica", label: "Aplica" },
  { value: "no_aplica", label: "No aplica" },
  { value: "contraindicado_temporalmente", label: "Contraindicado temporalmente" },
];

const painScaleOptions = ["EVA", "CPOT", "BPS", "Escala verbal"];
const sedationScaleOptions = ["RASS", "SAS", "Ramsay"];
const deliriumInstrumentOptions = ["CAM-ICU", "ICDSC", "Valoracion clinica institucional"];
const mobilityTypeOptions: Array<BundleMobilityEntry["mobilityType"]> = ["Basica", "Progresiva"];

export default function PatientBundleAbcdef({
  patient,
  currentProfessional,
  onAudit,
}: PatientBundleAbcdefProps) {
  const [bundleState, setBundleState] = useState<BundleAbcdefState>(() =>
    createInitialBundleState(patient, currentProfessional)
  );
  const [activeCode, setActiveCode] = useState<BundleComponentCode>("A");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [applicabilityDrafts, setApplicabilityDrafts] = useState<Record<BundleComponentCode, ApplicabilityDraft>>(
    () => createApplicabilityDrafts(createInitialBundleState(patient, currentProfessional))
  );
  const [painForm, setPainForm] = useState(() => createPainForm(patient, currentProfessional));
  const [satSbtForm, setSatSbtForm] = useState(() =>
    createSatSbtForm(patient, currentProfessional)
  );
  const [sedationForm, setSedationForm] = useState(() =>
    createSedationForm(patient, currentProfessional)
  );
  const [deliriumForm, setDeliriumForm] = useState(() =>
    createDeliriumForm(patient, currentProfessional)
  );
  const [mobilityForm, setMobilityForm] = useState(() =>
    createMobilityForm(currentProfessional)
  );
  const [familyForm, setFamilyForm] = useState(() =>
    createFamilyForm(patient, currentProfessional)
  );

  const ventilated = getMechanicalVentilationStatus(patient);
  const dashboard = useMemo(() => buildBundleDashboard(bundleState, patient), [bundleState, patient]);
  const closurePreview = useMemo(
    () => buildBundleClosureSnapshot(bundleState, patient),
    [bundleState, patient]
  );
  const orderedClosures = useMemo(
    () => [...bundleState.closures].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    [bundleState.closures]
  );
  const latestClosure = orderedClosures[0] ?? null;
  const patientLocation = `${patient.serviceArea ?? patient.careMode} · ${patient.code}`;
  const riskSummary = `${patient.currentStatus} · Riesgo ${patient.riskLevel}`;
  const activeCard = dashboard.cards[activeCode];

  const registerAudit = (title: string, details: string) => {
    onAudit?.(title, details);
  };

  const updateSection = <TEntry,>(
    code: BundleComponentCode,
    updater: (currentSection: {
      applicability: BundleApplicability;
      applicabilityReason: string;
      entries: TEntry[];
    }) => {
      applicability: BundleApplicability;
      applicabilityReason: string;
      entries: TEntry[];
    }
  ) => {
    setBundleState((current) => ({
      ...current,
      updatedAt: getBundleUpdatedStateTimestamp(),
      sections: {
        ...current.sections,
        [code]: updater(current.sections[code] as {
          applicability: BundleApplicability;
          applicabilityReason: string;
          entries: TEntry[];
        }),
      },
    }));
  };

  const saveApplicability = (code: BundleComponentCode) => {
    const draft = applicabilityDrafts[code];
    if (draft.applicability !== "aplica" && !draft.reason.trim()) {
      setFeedback(`Documenta el motivo clinico para ${bundleComponentMeta[code].title.toLowerCase()}.`);
      return;
    }

    updateSection(code, (section) => ({
      ...section,
      applicability: draft.applicability,
      applicabilityReason: draft.reason.trim(),
    }));

    setFeedback(`Se actualizo la elegibilidad de ${bundleComponentMeta[code].title}.`);
    registerAudit(
      `Bundle ${code} · elegibilidad`,
      `${bundleComponentMeta[code].title}: ${draft.applicability.replaceAll("_", " ")}${
        draft.reason.trim() ? ` · Motivo: ${draft.reason.trim()}` : ""
      }`
    );
  };

  const handleSavePain = () => {
    if (!painForm.recordedAt || !painForm.painScaleName || !painForm.painLocation.trim()) {
      setFeedback("Completa escala, fecha/hora y localizacion para registrar dolor.");
      return;
    }

    const entry: BundlePainEntry = {
      id: createLocalId("pain"),
      recordedAt: painForm.recordedAt,
      painScaleName: painForm.painScaleName,
      painLocation: painForm.painLocation.trim(),
      painIntensity: Number(painForm.painIntensity) || 0,
      interventionPerformed: painForm.interventionPerformed.trim(),
      analgesiaIndicated: painForm.analgesiaIndicated.trim(),
      analgesiaAdministered: painForm.analgesiaAdministered.trim(),
      response: painForm.response.trim(),
      observations: painForm.observations.trim(),
      professional: normalizedProfessional(currentProfessional),
    };

    updateSection<BundlePainEntry>("A", (section) => ({
      ...section,
      applicability: "aplica",
      applicabilityReason: "",
      entries: [entry, ...section.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setApplicabilityDrafts((current) => ({
      ...current,
      A: { applicability: "aplica", reason: "" },
    }));
    setFeedback("Valoracion de dolor registrada.");
    registerAudit(
      "Bundle A · dolor",
      `Dolor ${entry.painIntensity}/10, escala ${entry.painScaleName}, respuesta: ${entry.response || "sin respuesta documentada"}.`
    );
  };

  const handleSaveSatSbt = () => {
    if (satSbtForm.onMechanicalVentilation && satSbtForm.satCandidate === "no" && !satSbtForm.satExclusionReason.trim()) {
      setFeedback("Documenta el motivo clinico si SAT no aplica.");
      return;
    }
    if (satSbtForm.onMechanicalVentilation && satSbtForm.sbtCandidate === "no" && !satSbtForm.sbtExclusionReason.trim()) {
      setFeedback("Documenta el motivo clinico si SBT no aplica.");
      return;
    }

    const entry: BundleSatSbtEntry = {
      id: createLocalId("sat-sbt"),
      recordedAt: satSbtForm.recordedAt,
      onMechanicalVentilation: satSbtForm.onMechanicalVentilation,
      satCandidate: parseOptionalBoolean(satSbtForm.satCandidate),
      satExclusionReason: satSbtForm.satExclusionReason.trim(),
      satPerformed: parseOptionalBoolean(satSbtForm.satPerformed),
      satResult: satSbtForm.satResult.trim(),
      sbtCandidate: parseOptionalBoolean(satSbtForm.sbtCandidate),
      sbtExclusionReason: satSbtForm.sbtExclusionReason.trim(),
      sbtPerformed: parseOptionalBoolean(satSbtForm.sbtPerformed),
      sbtResult: satSbtForm.sbtResult.trim(),
      observations: satSbtForm.observations.trim(),
      professional: normalizedProfessional(currentProfessional),
    };

    updateSection<BundleSatSbtEntry>("B", (section) => ({
      ...section,
      applicability: entry.onMechanicalVentilation ? "aplica" : "no_aplica",
      applicabilityReason: entry.onMechanicalVentilation ? "" : "Paciente sin ventilacion mecanica activa.",
      entries: [entry, ...section.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setApplicabilityDrafts((current) => ({
      ...current,
      B: {
        applicability: entry.onMechanicalVentilation ? "aplica" : "no_aplica",
        reason: entry.onMechanicalVentilation ? "" : "Paciente sin ventilacion mecanica activa.",
      },
    }));
    setFeedback("Revision SAT/SBT registrada.");
    registerAudit(
      "Bundle B · SAT/SBT",
      `Ventilacion mecanica: ${entry.onMechanicalVentilation ? "si" : "no"} · SAT: ${formatOptionalState(entry.satPerformed)} · SBT: ${formatOptionalState(entry.sbtPerformed)}.`
    );
  };

  const handleSaveSedation = () => {
    if (!sedationForm.recordedAt || !sedationForm.sedationScale.trim() || !sedationForm.currentLevel.trim()) {
      setFeedback("Completa fecha/hora, escala y nivel actual para registrar sedacion.");
      return;
    }

    const entry: BundleSedationEntry = {
      id: createLocalId("sedation"),
      recordedAt: sedationForm.recordedAt,
      relatedMedications: splitList(sedationForm.relatedMedications),
      sedationGoal: sedationForm.sedationGoal.trim(),
      sedationScale: sedationForm.sedationScale.trim(),
      currentLevel: sedationForm.currentLevel.trim(),
      comparisonToGoal: sedationForm.comparisonToGoal.trim(),
      observations: sedationForm.observations.trim(),
      professional: normalizedProfessional(currentProfessional),
    };

    updateSection<BundleSedationEntry>("C", (section) => ({
      ...section,
      applicability: "aplica",
      applicabilityReason: "",
      entries: [entry, ...section.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setApplicabilityDrafts((current) => ({
      ...current,
      C: { applicability: "aplica", reason: "" },
    }));
    setFeedback("Revision de analgesia y sedacion registrada.");
    registerAudit(
      "Bundle C · analgesia y sedacion",
      `Meta: ${entry.sedationGoal || "sin meta documentada"} · Nivel actual: ${entry.currentLevel} · Comparacion: ${entry.comparisonToGoal || "sin comparacion"}.`
    );
  };

  const handleSaveDelirium = () => {
    if (!deliriumForm.recordedAt) {
      setFeedback("Completa la fecha/hora del tamizaje de delirio.");
      return;
    }
    if (deliriumForm.screeningPerformed && (!deliriumForm.instrument.trim() || !deliriumForm.result.trim())) {
      setFeedback("Documenta instrumento y resultado para registrar tamizaje de delirio.");
      return;
    }

    const entry: BundleDeliriumEntry = {
      id: createLocalId("delirium"),
      recordedAt: deliriumForm.recordedAt,
      screeningPerformed: deliriumForm.screeningPerformed,
      instrument: deliriumForm.instrument.trim(),
      result: deliriumForm.result.trim(),
      riskFactors: splitList(deliriumForm.riskFactors),
      nonPharmacologicMeasures: splitList(deliriumForm.nonPharmacologicMeasures),
      observations: deliriumForm.observations.trim(),
      nextReevaluationAt: deliriumForm.nextReevaluationAt,
      professional: normalizedProfessional(currentProfessional),
    };

    updateSection<BundleDeliriumEntry>("D", (section) => ({
      ...section,
      applicability: "aplica",
      applicabilityReason: "",
      entries: [entry, ...section.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setApplicabilityDrafts((current) => ({
      ...current,
      D: { applicability: "aplica", reason: "" },
    }));
    setFeedback("Tamizaje de delirio registrado.");
    registerAudit(
      "Bundle D · delirio",
      `Tamizaje ${entry.screeningPerformed ? "realizado" : "no realizado"} · Resultado: ${entry.result || "pendiente"}.`
    );
  };

  const handleSaveMobility = () => {
    if (!mobilityForm.recordedAt || !mobilityForm.mobilityLevel.trim()) {
      setFeedback("Completa fecha/hora y nivel de movilidad para registrar la seccion E.");
      return;
    }
    if (mobilityForm.dailyStatus === "Pendiente" && !mobilityForm.barriers.trim()) {
      setFeedback("Si la movilizacion queda pendiente, documenta barreras o motivo clinico.");
      return;
    }

    const entry: BundleMobilityEntry = {
      id: createLocalId("mobility"),
      recordedAt: mobilityForm.recordedAt,
      dailyStatus: mobilityForm.dailyStatus,
      mobilityLevel: mobilityForm.mobilityLevel.trim(),
      mobilityType: mobilityForm.mobilityType,
      responsibleProfessional: mobilityForm.responsibleProfessional.trim() || normalizedProfessional(currentProfessional),
      tolerance: mobilityForm.tolerance.trim(),
      barriers: mobilityForm.barriers.trim(),
      observations: mobilityForm.observations.trim(),
      professional: normalizedProfessional(currentProfessional),
    };

    updateSection<BundleMobilityEntry>("E", (section) => ({
      ...section,
      applicability: "aplica",
      applicabilityReason: "",
      entries: [entry, ...section.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setApplicabilityDrafts((current) => ({
      ...current,
      E: { applicability: "aplica", reason: "" },
    }));
    setFeedback("Registro de movilizacion actualizado.");
    registerAudit(
      "Bundle E · movilizacion",
      `Estado: ${entry.dailyStatus} · Nivel: ${entry.mobilityLevel} · Tolerancia: ${entry.tolerance || "sin comentario"}.`
    );
  };

  const handleSaveFamily = () => {
    if (!familyForm.recordedAt || !familyForm.familyContact.trim()) {
      setFeedback("Completa fecha/hora y contacto familiar para registrar la seccion F.");
      return;
    }
    if (familyForm.communicationPerformed && !familyForm.educationProvided.trim()) {
      setFeedback("Documenta la educacion o informacion brindada a la familia.");
      return;
    }

    const entry: BundleFamilyEntry = {
      id: createLocalId("family"),
      recordedAt: familyForm.recordedAt,
      familyContact: familyForm.familyContact.trim(),
      communicationPerformed: familyForm.communicationPerformed,
      educationProvided: familyForm.educationProvided.trim(),
      participationInDecisions: familyForm.participationInDecisions.trim(),
      observations: familyForm.observations.trim(),
      professional: familyForm.professional.trim() || normalizedProfessional(currentProfessional),
    };

    updateSection<BundleFamilyEntry>("F", (section) => ({
      ...section,
      applicability: "aplica",
      applicabilityReason: "",
      entries: [entry, ...section.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setApplicabilityDrafts((current) => ({
      ...current,
      F: { applicability: "aplica", reason: "" },
    }));
    setFeedback("Comunicacion con familia registrada.");
    registerAudit(
      "Bundle F · familia",
      `Contacto: ${entry.familyContact} · Comunicacion: ${entry.communicationPerformed ? "si" : "no"} · Profesional: ${entry.professional}.`
    );
  };

  const handleCloseBundle = (closureType: BundleClosureType) => {
    const snapshot = buildBundleClosureSnapshot(bundleState, patient);
    const professional = normalizedProfessional(currentProfessional);
    const record: BundleClosureRecord = {
      id: createLocalId(`closure-${closureType}`),
      recordedAt: new Date().toISOString(),
      closureType,
      professional,
      completedSections: snapshot.completedSections,
      pendingSections: snapshot.pendingSections,
      validationNotes: snapshot.validationNotes,
      summary: snapshot.summary,
    };

    setBundleState((current) => ({
      ...current,
      updatedAt: getBundleUpdatedStateTimestamp(),
      closures: [record, ...current.closures].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    }));
    setFeedback(
      snapshot.pendingSections.length
        ? `Se registro el cierre de ${closureLabel(closureType)} con pendientes: ${snapshot.pendingSections.join(", ")}.`
        : `Se registro el cierre de ${closureLabel(closureType)} con bundle completo.`
    );
    registerAudit(
      `Cierre bundle de ${closureLabel(closureType)}`,
      `${record.summary} Profesional: ${professional}.`
    );
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Bundle ABCDEF"
        subtitle="Seguimiento estructurado del cuidado critico y hospitalario con enfoque operativo"
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Bundle ABCDEF
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">{patient.fullName}</h2>
                  <p className="text-xs text-slate-600">
                    HC {patient.medicalRecordNumber} · {patient.age} anios · {patient.sex}
                  </p>
                  <p className="text-xs text-slate-500">
                    Diagnostico principal: <span className="font-medium text-slate-700">{patient.primaryDiagnosis}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">Cumplimiento hoy</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {dashboard.completedCount}/{dashboard.applicableCount || 6}
                  </p>
                  <p className="text-[11px] text-slate-500">{dashboard.completionPercent}% de componentes aplicables</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <ContextItem label="Ubicacion" value={patientLocation} />
                <ContextItem label="Servicio / unidad" value={patient.serviceArea ?? patient.careMode} />
                <ContextItem label="Ventilacion mecanica" value={ventilated ? "Si" : "No"} />
                <ContextItem label="Riesgo clinico" value={riskSummary} />
                <ContextItem label="Ultimo control" value={patient.lastControlAt} />
                <ContextItem label="Actualizado bundle" value={formatBundleDateTime(bundleState.updatedAt)} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Alertas suaves
              </p>
              {dashboard.alerts.length === 0 ? (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
                  Sin recordatorios prioritarios en este momento.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {dashboard.alerts.slice(0, 5).map((alert) => (
                    <AlertRow
                      key={alert.id}
                      code={alert.code}
                      severity={alert.severity}
                      title={alert.title}
                      detail={alert.detail}
                      onOpen={() => setActiveCode(alert.code)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
                Este panel organiza y visibiliza componentes del Bundle ABCDEF como apoyo al equipo clinico. No sustituye la valoracion profesional ni los protocolos institucionales.
              </div>
            </div>
          </div>

          {feedback ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {feedback}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bundleCodes.map((code) => {
              const card = dashboard.cards[code];
              return (
                <SummaryCard
                  key={code}
                  code={code}
                  title={bundleComponentMeta[code].title}
                  description={bundleComponentMeta[code].description}
                  tone={card.tone}
                  stateLabel={card.stateLabel}
                  lastRecordedAt={card.lastRecordedAt}
                  appliesLabel={card.appliesLabel}
                  relevantFinding={card.relevantFinding}
                  active={activeCode === code}
                  onOpen={() => setActiveCode(code)}
                />
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="space-y-4 2xl:grid 2xl:grid-cols-[minmax(0,1.5fr)_340px] 2xl:items-start 2xl:gap-4 2xl:space-y-0">
        <div className="min-w-0 space-y-4">
          <Panel
            title="Detalle operativo por componente"
            subtitle="Selecciona una letra para registrar, revisar historial y ajustar elegibilidad clinica"
          >
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {bundleCodes.map((code) => (
                  <SectionNavButton
                    key={code}
                    code={code}
                    title={bundleComponentMeta[code].shortTitle}
                    stateLabel={dashboard.cards[code].stateLabel}
                    tone={dashboard.cards[code].tone}
                    active={activeCode === code}
                    onClick={() => setActiveCode(code)}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Seccion {activeCode}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {bundleComponentMeta[activeCode].title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {bundleComponentMeta[activeCode].description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StateBadge tone={activeCard.tone}>{activeCard.stateLabel}</StateBadge>
                    <StateBadge tone="muted">{activeCard.appliesLabel}</StateBadge>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-4">{renderSectionContent(activeCode)}</div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <Panel title="Elegibilidad" subtitle="Flexible segun condicion clinica actual">
                      <div className="space-y-3">
                        <SelectField
                          label="Estado clinico de elegibilidad"
                          value={applicabilityDrafts[activeCode].applicability}
                          onChange={(value) =>
                            setApplicabilityDrafts((current) => ({
                              ...current,
                              [activeCode]: {
                                ...current[activeCode],
                                applicability: value as BundleApplicability,
                              },
                            }))
                          }
                          options={applicabilityOptions}
                        />
                        <TextAreaField
                          label="Motivo clinico / nota"
                          value={applicabilityDrafts[activeCode].reason}
                          onChange={(value) =>
                            setApplicabilityDrafts((current) => ({
                              ...current,
                              [activeCode]: { ...current[activeCode], reason: value },
                            }))
                          }
                          placeholder="Ej. Inestabilidad hemodinamica transitoria, no aplica en este turno..."
                          rows={4}
                        />
                        <button
                          type="button"
                          onClick={() => saveApplicability(activeCode)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Actualizar elegibilidad
                        </button>
                      </div>
                    </Panel>

                    <Panel title="Resumen del componente" subtitle="Estado actual y ultimo registro">
                      <dl className="space-y-2 text-xs text-slate-700">
                        <SummaryLine label="Estado actual" value={activeCard.stateLabel} />
                        <SummaryLine label="Ultimo registro" value={formatBundleDateTime(activeCard.lastRecordedAt)} />
                        <SummaryLine label="Aplica" value={activeCard.appliesLabel} />
                        <SummaryLine label="Hallazgo" value={activeCard.relevantFinding || "Sin hallazgos relevantes"} />
                      </dl>
                    </Panel>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-1">
          <Panel title="Indicadores" subtitle="Base inicial preparada para analitica futura">
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
              <MetricCard
                label="Cumplimiento total hoy"
                value={`${dashboard.completedCount}/${dashboard.applicableCount || 6}`}
                hint={`${dashboard.completionPercent}% de componentes aplicables`}
              />
              {dashboard.metrics.map((metric) => (
                <MetricCard
                  key={metric.code}
                  label={`${metric.code} ${metric.label}`}
                  value={metric.complete ? "Si" : "No"}
                  hint={metric.complete ? "Completado" : "Pendiente o no aplicable"}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              La estructura queda lista para segmentar luego por servicio, turno, unidad y profesional.
            </p>
          </Panel>

          <Panel title="Cierre del bundle" subtitle="Resumen clinico del turno o del dia con trazabilidad">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vista previa</p>
                <p className="mt-1 text-xs text-slate-700">{closurePreview.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {closurePreview.completedSections.map((code) => (
                    <span
                      key={`done-${code}`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"
                    >
                      {code} completo
                    </span>
                  ))}
                  {closurePreview.pendingSections.map((code) => (
                    <span
                      key={`pending-${code}`}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800"
                    >
                      {code} pendiente
                    </span>
                  ))}
                </div>
                {closurePreview.validationNotes.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
                    {closurePreview.validationNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleCloseBundle("turno")}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                >
                  Cerrar bundle del turno
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseBundle("dia")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cerrar bundle del dia
                </button>
              </div>

              {latestClosure ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ultimo cierre</p>
                  <p className="mt-1 text-xs text-slate-700">{latestClosure.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {closureLabel(latestClosure.closureType)} · {formatBundleDateTime(latestClosure.recordedAt)} · {latestClosure.professional}
                  </p>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Trazabilidad" subtitle="Cierres recientes del modulo">
            {orderedClosures.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Aun no se han registrado cierres del bundle.
              </p>
            ) : (
              <div className="space-y-2">
                {orderedClosures.slice(0, 4).map((closure) => (
                  <article key={closure.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">
                        Cierre de {closureLabel(closure.closureType)}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {formatBundleDateTime(closure.recordedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-700">{closure.summary}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Profesional: {closure.professional}</p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );

  function renderSectionContent(code: BundleComponentCode) {
    if (code === "A") {
      const entries = bundleState.sections.A.entries;

      return (
        <div className="space-y-4">
          <Panel title="Registro de dolor" subtitle="Valoracion, intervencion y respuesta del paciente">
            <div className="grid gap-3 lg:grid-cols-2">
              <SelectField
                label="Escala de dolor"
                value={painForm.painScaleName}
                onChange={(value) => setPainForm((current) => ({ ...current, painScaleName: value }))}
                options={painScaleOptions.map((value) => ({ value, label: value }))}
              />
              <InputField
                label="Fecha / hora de valoracion"
                type="datetime-local"
                value={painForm.recordedAt}
                onChange={(value) => setPainForm((current) => ({ ...current, recordedAt: value }))}
              />
              <InputField
                label="Localizacion del dolor"
                value={painForm.painLocation}
                onChange={(value) => setPainForm((current) => ({ ...current, painLocation: value }))}
                placeholder="Ej. torax, abdominal, cefalico..."
              />
              <InputField
                label="Intensidad"
                type="number"
                min={0}
                max={10}
                value={painForm.painIntensity}
                onChange={(value) => setPainForm((current) => ({ ...current, painIntensity: value }))}
                placeholder="0-10"
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Intervencion realizada"
                value={painForm.interventionPerformed}
                onChange={(value) =>
                  setPainForm((current) => ({ ...current, interventionPerformed: value }))
                }
                placeholder="Ej. analgesia, cambio de posicion, reevaluacion..."
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Analgesia indicada"
                value={painForm.analgesiaIndicated}
                onChange={(value) => setPainForm((current) => ({ ...current, analgesiaIndicated: value }))}
                placeholder="Ej. analgesia segun orden medica..."
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Analgesia administrada"
                value={painForm.analgesiaAdministered}
                onChange={(value) =>
                  setPainForm((current) => ({ ...current, analgesiaAdministered: value }))
                }
                placeholder="Medicacion administrada o medidas no farmacologicas"
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Respuesta posterior"
                value={painForm.response}
                onChange={(value) => setPainForm((current) => ({ ...current, response: value }))}
                placeholder="Ej. disminucion del dolor, tolerancia aceptable..."
              />
            </div>

            <div className="mt-3">
              <TextAreaField
                label="Observaciones"
                value={painForm.observations}
                onChange={(value) => setPainForm((current) => ({ ...current, observations: value }))}
                placeholder="Observaciones clinicas breves"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={handleSavePain}>Guardar valoracion de dolor</PrimaryButton>
            </div>
          </Panel>

          <Panel title="Historial de valoraciones" subtitle="Registros mas recientes del componente A">
            <HistoryList
              emptyMessage="Aun no hay valoraciones de dolor registradas."
              items={entries.map((entry) => ({
                id: entry.id,
                title: `${entry.painScaleName} · ${entry.painIntensity}/10`,
                timestamp: formatBundleDateTime(entry.recordedAt),
                summary: `${entry.painLocation} · ${entry.response || "Sin respuesta documentada"}`,
                meta: `Intervencion: ${entry.interventionPerformed || "no registrada"} · Profesional: ${entry.professional}`,
              }))}
            />
          </Panel>
        </div>
      );
    }

    if (code === "B") {
      const entries = bundleState.sections.B.entries;

      return (
        <div className="space-y-4">
          <Panel title="Elegibilidad y ejecucion SAT/SBT" subtitle="Registrar revision clinica sin automatizar decisiones">
            <div className="grid gap-3 lg:grid-cols-2">
              <BooleanField
                label="Paciente en ventilacion mecanica"
                value={satSbtForm.onMechanicalVentilation}
                onChange={(value) =>
                  setSatSbtForm((current) => ({ ...current, onMechanicalVentilation: value }))
                }
                className="lg:col-span-2"
              />
              <InputField
                label="Fecha / hora de revision"
                type="datetime-local"
                value={satSbtForm.recordedAt}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, recordedAt: value }))}
              />
              <SelectField
                label="Candidato a SAT"
                value={satSbtForm.satCandidate}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, satCandidate: value }))}
                options={yesNoPendingOptions}
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Motivo si SAT no aplica"
                value={satSbtForm.satExclusionReason}
                onChange={(value) =>
                  setSatSbtForm((current) => ({ ...current, satExclusionReason: value }))
                }
                placeholder="Ej. necesidad de sedacion profunda, inestabilidad, convulsiones..."
              />
              <SelectField
                label="SAT realizado"
                value={satSbtForm.satPerformed}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, satPerformed: value }))}
                options={yesNoPendingOptions}
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Resultado SAT"
                value={satSbtForm.satResult}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, satResult: value }))}
                placeholder="Ej. tolerado, agitacion, dolor, hipotension..."
              />
              <SelectField
                label="Candidato a SBT"
                value={satSbtForm.sbtCandidate}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, sbtCandidate: value }))}
                options={yesNoPendingOptions}
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Motivo si SBT no aplica"
                value={satSbtForm.sbtExclusionReason}
                onChange={(value) =>
                  setSatSbtForm((current) => ({ ...current, sbtExclusionReason: value }))
                }
                placeholder="Ej. secreciones, soporte alto, inestabilidad..."
              />
              <SelectField
                label="SBT realizado"
                value={satSbtForm.sbtPerformed}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, sbtPerformed: value }))}
                options={yesNoPendingOptions}
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Resultado SBT"
                value={satSbtForm.sbtResult}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, sbtResult: value }))}
                placeholder="Resultado clinico resumido"
              />
            </div>

            <div className="mt-3">
              <TextAreaField
                label="Observaciones"
                value={satSbtForm.observations}
                onChange={(value) => setSatSbtForm((current) => ({ ...current, observations: value }))}
                placeholder="Notas clinicas del turno"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={handleSaveSatSbt}>Guardar revision SAT/SBT</PrimaryButton>
            </div>
          </Panel>

          <Panel title="Historial SAT/SBT" subtitle="Revision estructurada de ventilacion y pruebas espontaneas">
            <HistoryList
              emptyMessage="Aun no hay revisiones SAT/SBT registradas."
              items={entries.map((entry) => ({
                id: entry.id,
                title: `VM ${entry.onMechanicalVentilation ? "si" : "no"} · SAT ${formatOptionalState(entry.satPerformed)} · SBT ${formatOptionalState(entry.sbtPerformed)}`,
                timestamp: formatBundleDateTime(entry.recordedAt),
                summary: `${entry.satResult || "Sin resultado SAT"} · ${entry.sbtResult || "Sin resultado SBT"}`,
                meta: `Observaciones: ${entry.observations || "sin observaciones"} · Profesional: ${entry.professional}`,
              }))}
            />
          </Panel>
        </div>
      );
    }

    if (code === "C") {
      const entries = bundleState.sections.C.entries;

      return (
        <div className="space-y-4">
          <Panel title="Analgesia y sedacion" subtitle="Documentar objetivo, escala y concordancia actual vs meta">
            <div className="grid gap-3 lg:grid-cols-2">
              <InputField
                label="Fecha / hora de revision"
                type="datetime-local"
                value={sedationForm.recordedAt}
                onChange={(value) => setSedationForm((current) => ({ ...current, recordedAt: value }))}
              />
              <InputField
                className="lg:col-span-2"
                label="Medicamentos activos relacionados"
                value={sedationForm.relatedMedications}
                onChange={(value) =>
                  setSedationForm((current) => ({ ...current, relatedMedications: value }))
                }
                placeholder="Separar por comas"
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Objetivo de sedacion"
                value={sedationForm.sedationGoal}
                onChange={(value) => setSedationForm((current) => ({ ...current, sedationGoal: value }))}
                placeholder="Ej. RASS 0 a -1, confort sin sobresedacion..."
              />
              <SelectField
                label="Escala de sedacion"
                value={sedationForm.sedationScale}
                onChange={(value) => setSedationForm((current) => ({ ...current, sedationScale: value }))}
                options={sedationScaleOptions.map((value) => ({ value, label: value }))}
              />
              <InputField
                label="Nivel de sedacion actual"
                value={sedationForm.currentLevel}
                onChange={(value) => setSedationForm((current) => ({ ...current, currentLevel: value }))}
                placeholder="Ej. 0, -1, alerta y cooperador..."
              />
              <InputField
                label="Comparacion actual vs meta"
                value={sedationForm.comparisonToGoal}
                onChange={(value) =>
                  setSedationForm((current) => ({ ...current, comparisonToGoal: value }))
                }
                placeholder="Ej. En meta, sobre sedacion, infra sedacion..."
              />
            </div>

            <div className="mt-3">
              <TextAreaField
                label="Observaciones clinicas"
                value={sedationForm.observations}
                onChange={(value) => setSedationForm((current) => ({ ...current, observations: value }))}
                placeholder="Nota de apoyo clinico; no sustituye prescripcion"
              />
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
              Nota de apoyo: este registro visibiliza meta y estado clinico para seguimiento del equipo. No sugiere cambios de prescripcion ni toma decisiones automaticas.
            </div>

            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={handleSaveSedation}>Guardar revision C</PrimaryButton>
            </div>
          </Panel>

          <Panel title="Historial de revisiones" subtitle="Revision mas reciente de analgesia y sedacion">
            <HistoryList
              emptyMessage="Aun no hay revisiones de analgesia y sedacion registradas."
              items={entries.map((entry) => ({
                id: entry.id,
                title: `${entry.sedationScale} · ${entry.currentLevel || "sin nivel"}`,
                timestamp: formatBundleDateTime(entry.recordedAt),
                summary: `Meta: ${entry.sedationGoal || "sin meta"} · ${entry.comparisonToGoal || "sin comparacion"}`,
                meta: `Medicamentos: ${entry.relatedMedications.join(", ") || "sin relacionados"} · Profesional: ${entry.professional}`,
              }))}
            />
          </Panel>
        </div>
      );
    }

    if (code === "D") {
      const entries = bundleState.sections.D.entries;

      return (
        <div className="space-y-4">
          <Panel title="Tamizaje y prevencion de delirio" subtitle="Registrar instrumento, riesgos y medidas no farmacologicas">
            <div className="grid gap-3 lg:grid-cols-2">
              <BooleanField
                label="Tamizaje realizado"
                value={deliriumForm.screeningPerformed}
                onChange={(value) =>
                  setDeliriumForm((current) => ({ ...current, screeningPerformed: value }))
                }
                className="lg:col-span-2"
              />
              <InputField
                label="Fecha / hora"
                type="datetime-local"
                value={deliriumForm.recordedAt}
                onChange={(value) =>
                  setDeliriumForm((current) => ({ ...current, recordedAt: value }))
                }
              />
              <SelectField
                label="Instrumento utilizado"
                value={deliriumForm.instrument}
                onChange={(value) => setDeliriumForm((current) => ({ ...current, instrument: value }))}
                options={deliriumInstrumentOptions.map((value) => ({ value, label: value }))}
              />
              <InputField
                label="Resultado"
                value={deliriumForm.result}
                onChange={(value) => setDeliriumForm((current) => ({ ...current, result: value }))}
                placeholder="Ej. negativo, positivo, no valorable..."
              />
              <InputField
                className="lg:col-span-2"
                label="Factores de riesgo identificados"
                value={deliriumForm.riskFactors}
                onChange={(value) => setDeliriumForm((current) => ({ ...current, riskFactors: value }))}
                placeholder="Separar por comas"
              />
              <InputField
                className="lg:col-span-2"
                label="Medidas no farmacologicas"
                value={deliriumForm.nonPharmacologicMeasures}
                onChange={(value) =>
                  setDeliriumForm((current) => ({ ...current, nonPharmacologicMeasures: value }))
                }
                placeholder="Separar por comas"
              />
              <InputField
                label="Proxima reevaluacion sugerida"
                type="datetime-local"
                value={deliriumForm.nextReevaluationAt}
                onChange={(value) =>
                  setDeliriumForm((current) => ({ ...current, nextReevaluationAt: value }))
                }
              />
            </div>

            <div className="mt-3">
              <TextAreaField
                label="Observaciones"
                value={deliriumForm.observations}
                onChange={(value) =>
                  setDeliriumForm((current) => ({ ...current, observations: value }))
                }
                placeholder="Registro clinico breve"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={handleSaveDelirium}>Guardar tamizaje de delirio</PrimaryButton>
            </div>
          </Panel>

          <Panel title="Historial de tamizajes" subtitle="Ultimos registros del componente D">
            <HistoryList
              emptyMessage="Aun no hay tamizajes de delirio registrados."
              items={entries.map((entry) => ({
                id: entry.id,
                title: `${entry.screeningPerformed ? "Tamizaje realizado" : "Tamizaje pendiente"} · ${entry.result || "sin resultado"}`,
                timestamp: formatBundleDateTime(entry.recordedAt),
                summary: `Instrumento: ${entry.instrument || "no documentado"} · Reevaluacion: ${formatBundleDateTime(entry.nextReevaluationAt)}`,
                meta: `Riesgos: ${entry.riskFactors.join(", ") || "sin factores"} · Profesional: ${entry.professional}`,
              }))}
            />
          </Panel>
        </div>
      );
    }

    if (code === "E") {
      const entries = bundleState.sections.E.entries;

      return (
        <div className="space-y-4">
          <Panel title="Movilizacion temprana" subtitle="Registrar nivel del dia, tolerancia y barreras operativas">
            <div className="grid gap-3 lg:grid-cols-2">
              <InputField
                label="Fecha / hora"
                type="datetime-local"
                value={mobilityForm.recordedAt}
                onChange={(value) =>
                  setMobilityForm((current) => ({ ...current, recordedAt: value }))
                }
              />
              <SelectField
                label="Estado del dia"
                value={mobilityForm.dailyStatus}
                onChange={(value) =>
                  setMobilityForm((current) => ({
                    ...current,
                    dailyStatus: value as BundleMobilityEntry["dailyStatus"],
                  }))
                }
                options={[
                  { value: "Realizada", label: "Realizada" },
                  { value: "Pendiente", label: "Pendiente" },
                ]}
              />
              <InputField
                label="Nivel de movilidad"
                value={mobilityForm.mobilityLevel}
                onChange={(value) =>
                  setMobilityForm((current) => ({ ...current, mobilityLevel: value }))
                }
                placeholder="Ej. cambios posturales, sedestacion, marcha corta..."
              />
              <SelectField
                label="Tipo de movilizacion"
                value={mobilityForm.mobilityType}
                onChange={(value) =>
                  setMobilityForm((current) => ({
                    ...current,
                    mobilityType: value as BundleMobilityEntry["mobilityType"],
                  }))
                }
                options={mobilityTypeOptions.map((value) => ({ value, label: value }))}
              />
              <InputField
                label="Profesional responsable"
                value={mobilityForm.responsibleProfessional}
                onChange={(value) =>
                  setMobilityForm((current) => ({ ...current, responsibleProfessional: value }))
                }
                placeholder="Ej. Lic. Daniela Naranjo"
              />
              <InputField
                label="Tolerancia"
                value={mobilityForm.tolerance}
                onChange={(value) => setMobilityForm((current) => ({ ...current, tolerance: value }))}
                placeholder="Ej. adecuada, limitada por disnea..."
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Barreras o contraindicaciones"
                value={mobilityForm.barriers}
                onChange={(value) => setMobilityForm((current) => ({ ...current, barriers: value }))}
                placeholder="Ej. inestabilidad, monitorizacion intensiva, dolor..."
              />
            </div>

            <div className="mt-3">
              <TextAreaField
                label="Observaciones"
                value={mobilityForm.observations}
                onChange={(value) =>
                  setMobilityForm((current) => ({ ...current, observations: value }))
                }
                placeholder="Observaciones clinicas"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={handleSaveMobility}>Guardar movilizacion</PrimaryButton>
            </div>
          </Panel>

          <Panel title="Historial de movilizacion" subtitle="Diferencia movilizacion basica y progresiva">
            <HistoryList
              emptyMessage="Aun no hay registros de movilizacion registrados."
              items={entries.map((entry) => ({
                id: entry.id,
                title: `${entry.dailyStatus} · ${entry.mobilityType}`,
                timestamp: formatBundleDateTime(entry.recordedAt),
                summary: `${entry.mobilityLevel} · Tolerancia: ${entry.tolerance || "sin comentario"}`,
                meta: `Barreras: ${entry.barriers || "ninguna"} · Responsable: ${entry.responsibleProfessional}`,
              }))}
            />
          </Panel>
        </div>
      );
    }

    const entries = bundleState.sections.F.entries;

    return (
      <div className="space-y-4">
        <Panel title="Familia y empoderamiento" subtitle="Comunicar, educar y documentar participacion en decisiones">
          <div className="grid gap-3 lg:grid-cols-2">
            <InputField
              label="Familiar / contacto identificado"
              value={familyForm.familyContact}
              onChange={(value) => setFamilyForm((current) => ({ ...current, familyContact: value }))}
              placeholder="Nombre y relacion"
            />
            <InputField
              label="Fecha / hora de actualizacion"
              type="datetime-local"
              value={familyForm.recordedAt}
              onChange={(value) => setFamilyForm((current) => ({ ...current, recordedAt: value }))}
            />
            <BooleanField
              label="Comunicacion realizada"
              value={familyForm.communicationPerformed}
              onChange={(value) =>
                setFamilyForm((current) => ({ ...current, communicationPerformed: value }))
              }
              className="lg:col-span-2"
            />
            <InputField
              label="Profesional que registro"
              value={familyForm.professional}
              onChange={(value) => setFamilyForm((current) => ({ ...current, professional: value }))}
              placeholder="Ej. Dra. Camila Rojas"
            />
            <TextAreaField
              className="lg:col-span-2"
              label="Educacion brindada"
              value={familyForm.educationProvided}
              onChange={(value) =>
                setFamilyForm((current) => ({ ...current, educationProvided: value }))
              }
              placeholder="Resumen breve de informacion y educacion entregada"
            />
            <TextAreaField
              className="lg:col-span-2"
              label="Participacion en decisiones"
              value={familyForm.participationInDecisions}
              onChange={(value) =>
                setFamilyForm((current) => ({ ...current, participationInDecisions: value }))
              }
              placeholder="Ej. acuerdo con plan, dudas resueltas, decision compartida..."
            />
          </div>

          <div className="mt-3">
            <TextAreaField
              label="Observaciones"
              value={familyForm.observations}
              onChange={(value) => setFamilyForm((current) => ({ ...current, observations: value }))}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setFamilyForm((current) => ({
                  ...current,
                  recordedAt: nowDateTimeLocal(),
                  communicationPerformed: true,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Registrar comunicacion con familia
            </button>
            <PrimaryButton onClick={handleSaveFamily}>Guardar seguimiento familiar</PrimaryButton>
          </div>
        </Panel>

        <Panel title="Historial familiar" subtitle="Ultimas actualizaciones del componente F">
          <HistoryList
            emptyMessage="Aun no hay actualizaciones familiares registradas."
            items={entries.map((entry) => ({
              id: entry.id,
              title: `${entry.communicationPerformed ? "Comunicacion realizada" : "Sin comunicacion"} · ${entry.familyContact}`,
              timestamp: formatBundleDateTime(entry.recordedAt),
              summary: `${entry.educationProvided || "Sin educacion documentada"} · ${entry.participationInDecisions || "Sin participacion consignada"}`,
              meta: `Profesional: ${entry.professional} · Observaciones: ${entry.observations || "sin observaciones"}`,
            }))}
          />
        </Panel>
      </div>
    );
  }
}

function createApplicabilityDrafts(state: BundleAbcdefState) {
  return {
    A: {
      applicability: state.sections.A.applicability,
      reason: state.sections.A.applicabilityReason,
    },
    B: {
      applicability: state.sections.B.applicability,
      reason: state.sections.B.applicabilityReason,
    },
    C: {
      applicability: state.sections.C.applicability,
      reason: state.sections.C.applicabilityReason,
    },
    D: {
      applicability: state.sections.D.applicability,
      reason: state.sections.D.applicabilityReason,
    },
    E: {
      applicability: state.sections.E.applicability,
      reason: state.sections.E.applicabilityReason,
    },
    F: {
      applicability: state.sections.F.applicability,
      reason: state.sections.F.applicabilityReason,
    },
  } satisfies Record<BundleComponentCode, ApplicabilityDraft>;
}

function createPainForm(patient: PatientRecord, currentProfessional: string) {
  return {
    recordedAt: nowDateTimeLocal(),
    painScaleName: "EVA",
    painLocation: patient.primaryDiagnosis.toLowerCase().includes("cefalea")
      ? "Cefalica"
      : patient.primaryDiagnosis.toLowerCase().includes("torac")
        ? "Torax"
        : "Pendiente precisar",
    painIntensity: String(patient.vitalSigns[0]?.painScale ?? 0),
    interventionPerformed: "",
    analgesiaIndicated: patient.medicationRecords[0]?.name ?? "",
    analgesiaAdministered: "",
    response: "",
    observations: "",
    professional: normalizedProfessional(currentProfessional),
  };
}

function createSatSbtForm(patient: PatientRecord, currentProfessional: string) {
  return {
    recordedAt: nowDateTimeLocal(),
    onMechanicalVentilation: getMechanicalVentilationStatus(patient),
    satCandidate: "",
    satExclusionReason: "",
    satPerformed: "",
    satResult: "",
    sbtCandidate: "",
    sbtExclusionReason: "",
    sbtPerformed: "",
    sbtResult: "",
    observations: "",
    professional: normalizedProfessional(currentProfessional),
  };
}

function createSedationForm(patient: PatientRecord, currentProfessional: string) {
  const relatedMedications = patient.medicationRecords.map((record) => record.name).join(", ");

  return {
    recordedAt: nowDateTimeLocal(),
    relatedMedications,
    sedationGoal: "",
    sedationScale: "RASS",
    currentLevel: "",
    comparisonToGoal: "",
    observations: "",
    professional: normalizedProfessional(currentProfessional),
  };
}

function createDeliriumForm(patient: PatientRecord, currentProfessional: string) {
  return {
    recordedAt: nowDateTimeLocal(),
    screeningPerformed: true,
    instrument: "CAM-ICU",
    result: "",
    riskFactors: patient.activeAlerts.join(", "),
    nonPharmacologicMeasures: "Reorientacion, control de sueno, uso de lentes/audifonos",
    observations: "",
    nextReevaluationAt: addHoursLocal(8),
    professional: normalizedProfessional(currentProfessional),
  };
}

function createMobilityForm(currentProfessional: string) {
  return {
    recordedAt: nowDateTimeLocal(),
    dailyStatus: "Realizada" as BundleMobilityEntry["dailyStatus"],
    mobilityLevel: "",
    mobilityType: "Basica" as BundleMobilityEntry["mobilityType"],
    responsibleProfessional: normalizedProfessional(currentProfessional),
    tolerance: "",
    barriers: "",
    observations: "",
    professional: normalizedProfessional(currentProfessional),
  };
}

function createFamilyForm(patient: PatientRecord, currentProfessional: string) {
  return {
    recordedAt: nowDateTimeLocal(),
    familyContact: inferBundleFamilyContact(patient),
    communicationPerformed: true,
    educationProvided: "",
    participationInDecisions: "",
    observations: "",
    professional: normalizedProfessional(currentProfessional),
  };
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function SummaryCard({
  code,
  title,
  description,
  tone,
  stateLabel,
  lastRecordedAt,
  appliesLabel,
  relevantFinding,
  active,
  onOpen,
}: {
  code: BundleComponentCode;
  title: string;
  description: string;
  tone: "success" | "warning" | "critical" | "muted";
  stateLabel: string;
  lastRecordedAt: string | null;
  appliesLabel: string;
  relevantFinding: string | null;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "rounded-2xl border p-4 text-left transition",
        active ? "border-sky-300 bg-sky-50/60 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={["flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold", toneClasses(tone).bubble].join(" ")}>
          {code}
        </div>
        <StateBadge tone={tone}>{stateLabel}</StateBadge>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="mt-4 space-y-1.5 text-xs text-slate-600">
        <p>
          <span className="font-medium text-slate-700">Ultimo registro:</span>{" "}
          {formatBundleDateTime(lastRecordedAt)}
        </p>
        <p>
          <span className="font-medium text-slate-700">Aplica:</span> {appliesLabel}
        </p>
        <p className="min-h-[34px] text-[11px] text-slate-500">
          {relevantFinding || "Sin hallazgos relevantes para destacar."}
        </p>
      </div>
    </button>
  );
}

function SectionNavButton({
  code,
  title,
  stateLabel,
  tone,
  active,
  onClick,
}: {
  code: BundleComponentCode;
  title: string;
  stateLabel: string;
  tone: "success" | "warning" | "critical" | "muted";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-3 py-3 text-left transition",
        active ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {code} {title}
        </p>
        <StateBadge tone={tone}>{stateLabel}</StateBadge>
      </div>
    </button>
  );
}

function AlertRow({
  code,
  severity,
  title,
  detail,
  onOpen,
}: {
  code: BundleComponentCode;
  severity: "soft" | "priority" | "relevant";
  title: string;
  detail: string;
  onOpen: () => void;
}) {
  const classes =
    severity === "priority"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : severity === "relevant"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-xl border px-3 py-3 text-left ${classes}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">
          {code} · {title}
        </p>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {severity === "priority" ? "Prioritario" : severity === "relevant" ? "Hallazgo" : "Recordatorio"}
        </span>
      </div>
      <p className="mt-1 text-[11px] opacity-80">{detail}</p>
    </button>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function HistoryList({
  items,
  emptyMessage,
}: {
  items: Array<{
    id: string;
    title: string;
    timestamp: string;
    summary: string;
    meta: string;
  }>;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-900">{item.title}</p>
            <span className="text-[11px] text-slate-500">{item.timestamp}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-700">{item.summary}</p>
          <p className="mt-1 text-[11px] text-slate-500">{item.meta}</p>
        </article>
      ))}
    </div>
  );
}

function StateBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "critical" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span className={["inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", toneClasses(tone).badge].join(" ")}>
      {children}
    </span>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[180px] text-right text-slate-800">{value}</dd>
    </div>
  );
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100"
    >
      {children}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={[
            "rounded-xl border px-3 py-2 text-xs font-semibold",
            value ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          Si
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={[
            "rounded-xl border px-3 py-2 text-xs font-semibold",
            !value ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          No
        </button>
      </div>
    </div>
  );
}

function toneClasses(tone: "success" | "warning" | "critical" | "muted") {
  if (tone === "success") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bubble: "bg-emerald-100 text-emerald-700",
    };
  }

  if (tone === "warning") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      bubble: "bg-amber-100 text-amber-800",
    };
  }

  if (tone === "critical") {
    return {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      bubble: "bg-rose-100 text-rose-700",
    };
  }

  return {
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    bubble: "bg-slate-200 text-slate-700",
  };
}

function parseOptionalBoolean(value: string) {
  if (value === "si") {
    return true;
  }
  if (value === "no") {
    return false;
  }
  return null;
}

function formatOptionalState(value: boolean | null) {
  if (value === true) {
    return "si";
  }
  if (value === false) {
    return "no";
  }
  return "pendiente";
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nowDateTimeLocal() {
  return formatDateTimeLocal(new Date());
}

function addHoursLocal(hours: number) {
  return formatDateTimeLocal(new Date(Date.now() + hours * 60 * 60 * 1000));
}

function formatDateTimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizedProfessional(currentProfessional: string) {
  return currentProfessional.trim() || "Profesional no identificado";
}

function closureLabel(value: BundleClosureType) {
  return value === "turno" ? "turno" : "dia";
}

const yesNoPendingOptions = [
  { value: "si", label: "Si" },
  { value: "no", label: "No" },
];
