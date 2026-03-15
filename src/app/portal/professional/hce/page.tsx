"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";

import { ModulePage } from "../_components/clinical-ui";
import { usePatientSelection } from "../_components/patient-workspace";
import {
  currentClinicalContext,
  getPatientServiceArea,
  mockPatients,
  nandaCatalog,
  nicCatalog,
  nocCatalog,
  nursingReportRecords,
  type ClinicalNote,
  type DiagnosisRecord,
  type PatientRecord,
} from "../_data/clinical-mock-data";

type HceSectionId =
  | "summary"
  | "anamnesis"
  | "physical_exam"
  | "diagnoses"
  | "nursing_model"
  | "notes"
  | "background"
  | "allergies"
  | "vitals"
  | "medication"
  | "lab_image"
  | "triage_protocol"
  | "violence_protocol"
  | "sca_protocol";

type SectionGroupId = "history" | "documents" | "protocols";
type NoteKind = "Nota de enfermeria" | "Nota medica" | "Nota de triaje";
type ExamStatus = "Normal" | "Alterado";

type HceNoteEntry = {
  id: string;
  kind: NoteKind;
  datetime: string;
  professional: string;
  specialty: string;
  text: string;
};

type CodedDiagnosis = DiagnosisRecord & {
  code: string;
  phase: string;
};

type HceSectionItem = {
  id: HceSectionId;
  label: string;
  group: SectionGroupId;
  count?: number;
  dotTone: "emerald" | "sky" | "rose" | "amber" | "violet";
};

type CareLinkage = {
  nandaId: string;
  nandaLabel: string;
  nocId: string;
  nocLabel: string;
  nicId: string;
  nicLabel: string;
  clinicalRationale: string;
  evaluation: string;
};

type ExamSystemEntry = {
  system: string;
  finding: string;
  status: ExamStatus;
};

const referenceNow = "2026-03-15 12:55";

const cie11Catalog: Array<{ code: string; label: string }> = [
  { code: "BA40.1", label: "Sindrome coronario agudo sin elevacion ST" },
  { code: "5A11", label: "Hipertension arterial primaria" },
  { code: "5A10", label: "Diabetes mellitus tipo 2" },
  { code: "CA40", label: "Exacerbacion aguda de EPOC" },
  { code: "8A80", label: "Cefalea tensional" },
];

const noteTypeOptions: Array<{ value: NoteKind; label: string }> = [
  { value: "Nota medica", label: "Nota medica" },
  { value: "Nota de enfermeria", label: "Nota de enfermeria" },
];

export default function StructuredHcePage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);
  const [sectionSearch, setSectionSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<HceSectionId>("summary");
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [noteDraft, setNoteDraft] = useState({
    type: "Nota medica" as NoteKind,
    text: "",
  });
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);
  const [addedNotesByPatient, setAddedNotesByPatient] = useState<Record<string, HceNoteEntry[]>>({});

  const patient = selectedPatient;
  const codedDiagnoses = useMemo(
    () => (patient ? mapDiagnosesToCie11(patient.diagnoses) : []),
    [patient]
  );
  const addedNotes = useMemo(
    () => (patient ? addedNotesByPatient[patient.id] ?? [] : []),
    [addedNotesByPatient, patient]
  );
  const recentNotes = useMemo(
    () => (patient ? buildRecentNotes(patient, addedNotes) : []),
    [addedNotes, patient]
  );
  const physicalExam = useMemo(
    () => (patient ? buildPhysicalExam(patient) : []),
    [patient]
  );
  const careLinkage = useMemo(
    () => (patient ? buildCareLinkage(patient) : []),
    [patient]
  );
  const sectionItems = useMemo(
    () => (patient ? buildSectionItems(patient, codedDiagnoses, recentNotes, physicalExam, careLinkage) : []),
    [careLinkage, codedDiagnoses, patient, physicalExam, recentNotes]
  );
  const filteredSectionItems = useMemo(() => {
    const normalized = normalizeText(sectionSearch);
    if (!normalized) {
      return sectionItems;
    }

    return sectionItems.filter((item) =>
      normalizeText(`${item.label} ${item.group}`).includes(normalized)
    );
  }, [sectionItems, sectionSearch]);
  const groupedSections = useMemo(() => {
    return {
      history: filteredSectionItems.filter((item) => item.group === "history"),
      documents: filteredSectionItems.filter((item) => item.group === "documents"),
      protocols: filteredSectionItems.filter((item) => item.group === "protocols"),
    };
  }, [filteredSectionItems]);
  const activeSection =
    sectionItems.find((item) => item.id === selectedSection) ?? sectionItems[0] ?? null;
  const latestUpdate = recentNotes[0]?.datetime ?? referenceNow;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleSaveNote = () => {
    if (!patient || !noteDraft.text.trim()) {
      return;
    }

    const specialty =
      noteDraft.type === "Nota de enfermeria" ? "Enfermeria" : "Medicina interna";
    const newNote: HceNoteEntry = {
      id: `local-note-${patient.id}-${Date.now()}`,
      kind: noteDraft.type,
      datetime: referenceNow,
      professional: currentClinicalContext.professionalName,
      specialty,
      text: noteDraft.text.trim(),
    };

    setAddedNotesByPatient((current) => ({
      ...current,
      [patient.id]: [newNote, ...(current[patient.id] ?? [])],
    }));
    setShowNoteComposer(false);
    setSelectedSection("notes");
    setNoteDraft({
      type: "Nota medica",
      text: "",
    });
    setNoteFeedback(`Nueva nota agregada a la HCE de ${patient.fullName}.`);
  };

  return (
    <ModulePage
      title="HCE estructurada"
      subtitle="Historia clinica electronica con resumen del paciente, documentos clinicos y trazabilidad por secciones."
    >
      {!patient ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">No hay pacientes disponibles para cargar la HCE.</p>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-lg font-semibold text-red-600">
                  {initialsOf(patient.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {patient.age} a - {patient.code} - Nivel {patient.triageColor.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500">
                    {patient.medicalRecordNumber} - {getPatientServiceArea(patient)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {patient.antecedentes.allergies.slice(0, 1).map((item) => (
                  <TagChip key={item} tone="danger">
                    Alerg: {item}
                  </TagChip>
                ))}
                {patient.secondaryDiagnoses.slice(0, 2).map((item) => (
                  <TagChip key={item} tone="warning">
                    {item}
                  </TagChip>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Buscar paciente
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Maria Lopez, 1722334412, HC-2026..."
                    className={fieldClassName}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Paciente activo
                  </span>
                  <select
                    value={selectedPatientId}
                    onChange={(event) => {
                      setSelectedPatientId(event.target.value);
                      setNoteFeedback(null);
                    }}
                    className={fieldClassName}
                  >
                    {(filteredPatients.length ? filteredPatients : mockPatients).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.fullName} - {item.medicalRecordNumber}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Buscar en HCE
                </span>
                <input
                  value={sectionSearch}
                  onChange={(event) => setSectionSearch(event.target.value)}
                  placeholder="Anamnesis, signos vitales, laboratorio..."
                  className={fieldClassName}
                />
              </label>

              <div className="mt-5 space-y-5">
                <SectionGroupBlock
                  title="Historia clinica"
                  items={groupedSections.history}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                />
                <SectionGroupBlock
                  title="Documentos clinicos"
                  items={groupedSections.documents}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                />
                <SectionGroupBlock
                  title="Protocolos"
                  items={groupedSections.protocols}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                />
              </div>
            </article>
          </aside>

          <div className="space-y-4">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    HCE
                  </p>
                  <h1 className="text-4xl font-semibold leading-none text-slate-900">
                    {activeSection ? sectionTitle(activeSection.id) : "Resumen del paciente"}
                  </h1>
                  <p className="mt-3 text-sm text-slate-600">
                    Historia clinica electronica estructurada - Vita HIS - ultima actualizacion: {latestUpdate}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-[24px] border border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Imprimir HCE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteComposer((current) => !current);
                      setNoteFeedback(null);
                    }}
                    className="rounded-[24px] border border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    + Nueva nota
                  </button>
                </div>
              </div>
            </section>

            {showNoteComposer ? (
              <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Tipo de nota
                    </span>
                    <select
                      value={noteDraft.type}
                      onChange={(event) =>
                        setNoteDraft((current) => ({
                          ...current,
                          type: event.target.value as NoteKind,
                        }))
                      }
                      className={fieldClassName}
                    >
                      {noteTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Redaccion de la nota
                    </span>
                    <textarea
                      rows={4}
                      value={noteDraft.text}
                      onChange={(event) =>
                        setNoteDraft((current) => ({
                          ...current,
                          text: event.target.value,
                        }))
                      }
                      placeholder="Evolucion, conducta, respuesta al tratamiento, hallazgos relevantes..."
                      className={fieldClassName}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Guardar nota
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNoteComposer(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            ) : null}

            {noteFeedback ? (
              <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                {noteFeedback}
              </section>
            ) : null}

            {activeSection?.id === "summary" ? (
              <SummarySection patient={patient} codedDiagnoses={codedDiagnoses} careLinkage={careLinkage} recentNotes={recentNotes} />
            ) : null}

            {activeSection?.id === "anamnesis" ? (
              <AnamnesisSection patient={patient} />
            ) : null}

            {activeSection?.id === "physical_exam" ? (
              <PhysicalExamSection entries={physicalExam} />
            ) : null}

            {activeSection?.id === "diagnoses" ? (
              <DiagnosesSection codedDiagnoses={codedDiagnoses} patientId={patient.id} />
            ) : null}

            {activeSection?.id === "nursing_model" ? (
              <NursingModelSection careLinkage={careLinkage} />
            ) : null}

            {activeSection?.id === "notes" ? (
              <NotesSection notes={recentNotes} />
            ) : null}

            {activeSection?.id === "background" ? (
              <BackgroundSection patient={patient} />
            ) : null}

            {activeSection?.id === "allergies" ? (
              <AllergiesSection patient={patient} />
            ) : null}

            {activeSection?.id === "vitals" ? (
              <VitalsSection patient={patient} />
            ) : null}

            {activeSection?.id === "medication" ? (
              <MedicationSection patient={patient} />
            ) : null}

            {activeSection?.id === "lab_image" ? (
              <LabImageSection patient={patient} />
            ) : null}

            {activeSection?.id === "triage_protocol" ? (
              <ProtocolCard
                title={`Triaje ${patient.triageAssessment.triageColor.toUpperCase()} - ${patient.triageAssessment.consultationReason}`}
                subtitle={`Evaluado ${patient.triageAssessment.evaluatedAt}`}
                tone="info"
                bullets={[
                  `Motivo: ${patient.summary.reasonForConsultation}`,
                  `Sintomas: ${patient.triageAssessment.symptoms.join(" · ")}`,
                  `Conducta sugerida: ${patient.triageAssessment.suggestedConduct}`,
                  `Referencia: ${patient.triageAssessment.referral}`,
                ]}
              />
            ) : null}

            {activeSection?.id === "violence_protocol" ? (
              <ProtocolCard
                title={detectViolenceProtocol(recentNotes) ? "Protocolo violencia activo" : "Protocolo violencia"}
                subtitle={detectViolenceProtocol(recentNotes) ? "Seguimiento clinico activo" : "Tamizaje sin activacion actual"}
                tone={detectViolenceProtocol(recentNotes) ? "danger" : "neutral"}
                bullets={
                  detectViolenceProtocol(recentNotes)
                    ? [
                        "Existe mencion clinica de protocolo de violencia dentro del expediente.",
                        "Revisar formulario MSP y trazabilidad legal asociada.",
                      ]
                    : [
                        "No se identifican hallazgos activos de violencia en la HCE actual.",
                        "Mantener tamizaje documentado cuando el contexto clinico lo requiera.",
                      ]
                }
              />
            ) : null}

            {activeSection?.id === "sca_protocol" ? (
              <ProtocolCard
                title="Subprotocolo SCA"
                subtitle={hasScaProtocol(patient, recentNotes) ? "Activo en el episodio actual" : "No activo"}
                tone={hasScaProtocol(patient, recentNotes) ? "danger" : "neutral"}
                bullets={
                  hasScaProtocol(patient, recentNotes)
                    ? [
                        "Diagnostico y notas compatibles con sindrome coronario agudo en estudio.",
                        "Mantener monitorizacion continua, ECG seriado y marcadores cardiacos.",
                        "Validar antiagregacion y vigilancia glucemica asociada.",
                      ]
                    : [
                        "Sin evidencia documental de subprotocolo SCA activo en esta HCE.",
                      ]
                }
              />
            ) : null}
          </div>
        </section>
      )}
    </ModulePage>
  );
}

function SummarySection({
  patient,
  codedDiagnoses,
  careLinkage,
  recentNotes,
}: {
  patient: PatientRecord;
  codedDiagnoses: CodedDiagnosis[];
  careLinkage: CareLinkage[];
  recentNotes: HceNoteEntry[];
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_1fr]">
      <div className="space-y-4">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <InfoCircle tone="info">ID</InfoCircle>
              <h2 className="text-lg font-semibold text-slate-900">Datos de identificacion</h2>
            </div>
            <Link
              href={`/portal/professional/patients/${patient.id}`}
              className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Editar
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <IdentityRow label="Nombre completo" value={patient.fullName} />
            <IdentityRow label="HC" value={patient.medicalRecordNumber} />
            <IdentityRow label="Cedula" value={patient.identification} />
            <IdentityRow label="Afiliacion" value={patient.personalData.insurance} />
            <IdentityRow label="Fecha nacimiento" value={`${patient.birthDate} · ${patient.age} anios`} />
            <IdentityRow label="Medico tratante" value={patient.assignedProfessional} />
            <IdentityRow label="Sexo biologico" value={patient.sex} />
            <IdentityRow label="Ingreso" value={patient.admissionDate} />
            <IdentityRow label="Grupo sanguineo" value={`${patient.personalData.bloodType} · Rh positivo`} accent="text-red-600" />
            <IdentityRow label="Servicio" value={getPatientServiceArea(patient)} />
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <InfoCircle tone="danger">Dx</InfoCircle>
                <h2 className="text-lg font-semibold text-slate-900">Diagnosticos activos</h2>
              </div>
              <Link
                href={`/portal/professional/patients/${patient.id}?tab=diagnoses`}
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {codedDiagnoses.map((diagnosis) => (
                <article key={diagnosis.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {diagnosis.code}
                    </span>
                    <p className="text-base font-semibold text-slate-900">{diagnosis.diagnosis}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {diagnosis.phase} · {diagnosis.type} · {diagnosis.status}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <InfoCircle tone="violet">N</InfoCircle>
                <h2 className="text-lg font-semibold text-slate-900">Diagnosticos NANDA activos</h2>
              </div>
              <Link
                href="/portal/professional/nursing-report"
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Ver PAE
              </Link>
            </div>
            <div className="space-y-3">
              {careLinkage.length === 0 ? (
                <EmptyState message="No hay relacion NANDA/NOC/NIC documentada para este paciente." />
              ) : (
                careLinkage.map((link) => (
                  <article key={link.nandaId} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {link.nandaId} · {link.nandaLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <TagChip tone="info">NOC: {link.nocLabel}</TagChip>
                      <TagChip tone="success">NIC: {link.nicLabel}</TagChip>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{link.evaluation}</p>
                  </article>
                ))
              )}
            </div>
          </article>
        </div>

        <NotesPanel notes={recentNotes} compact={false} />
      </div>
    </section>
  );
}

function AnamnesisSection({ patient }: { patient: PatientRecord }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <DataCard title="Consulta actual" subtitle="Motivo de consulta y enfermedad actual">
        <DetailBlock label="Motivo de consulta" value={patient.summary.reasonForConsultation} />
        <DetailBlock label="Enfermedad actual" value={patient.triageAssessment.professionalObservations} />
        <DetailBlock label="Tiempo de evolucion" value={patient.triageAssessment.evolutionTime} />
        <DetailBlock label="Servicio de ingreso" value={getPatientServiceArea(patient)} />
      </DataCard>
      <DataCard title="Antecedentes clinicos" subtitle="Base narrativa y medico-legal">
        <ListBlock title="Patologicos" items={patient.antecedentes.pathological} />
        <ListBlock title="Quirurgicos" items={patient.antecedentes.surgical} />
        <ListBlock title="Farmacologicos" items={patient.antecedentes.pharmacological} />
        <ListBlock title="Familiares" items={patient.antecedentes.family} />
        <ListBlock title="Hospitalizaciones previas" items={patient.antecedentes.hospitalizations} />
      </DataCard>
      <DataCard title="Habitos y contexto" subtitle="Estilo de vida y soporte del paciente">
        <DetailBlock label="Tabaco" value={patient.antecedentes.habits.tobacco} />
        <DetailBlock label="Alcohol" value={patient.antecedentes.habits.alcohol} />
        <DetailBlock label="Sustancias" value={patient.antecedentes.habits.substances} />
        <DetailBlock label="Actividad fisica" value={patient.antecedentes.habits.physicalActivity} />
        <DetailBlock label="Alimentacion" value={patient.antecedentes.habits.feeding} />
      </DataCard>
      <DataCard title="Contexto administrativo" subtitle="Datos para continuidad asistencial">
        <DetailBlock label="Direccion" value={patient.personalData.address} />
        <DetailBlock label="Telefono" value={patient.personalData.phone} />
        <DetailBlock label="Contacto" value={patient.personalData.emergencyContact} />
        <DetailBlock label="Ocupacion" value={patient.personalData.occupation} />
        <DetailBlock label="Estado civil" value={patient.personalData.civilStatus} />
      </DataCard>
    </section>
  );
}

function PhysicalExamSection({ entries }: { entries: ExamSystemEntry[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {entries.map((entry) => (
        <article key={entry.system} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{entry.system}</h2>
            <TagChip tone={entry.status === "Normal" ? "success" : "warning"}>
              {entry.status}
            </TagChip>
          </div>
          <p className="mt-3 text-sm text-slate-700">{entry.finding}</p>
        </article>
      ))}
    </section>
  );
}

function DiagnosesSection({
  codedDiagnoses,
  patientId,
}: {
  codedDiagnoses: CodedDiagnosis[];
  patientId: string;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniMetricCard label="Diagnosticos activos" value={codedDiagnoses.length} />
        <MiniMetricCard label="Principales" value={codedDiagnoses.filter((item) => item.type === "Principal").length} />
        <MiniMetricCard label="Presuntivos" value={codedDiagnoses.filter((item) => item.type === "Presuntivo").length} />
      </div>
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Diagnosticos codificados en CIE-11</h2>
          <Link
            href={`/portal/professional/patients/${patientId}?tab=diagnoses`}
            className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Abrir ficha
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {codedDiagnoses.map((diagnosis) => (
            <article key={diagnosis.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {diagnosis.code}
                </span>
                <p className="text-base font-semibold text-slate-900">{diagnosis.diagnosis}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {diagnosis.phase} · {diagnosis.type} · {diagnosis.status}
              </p>
              <p className="mt-3 text-sm text-slate-700">{buildLinkedPlan(diagnosis)}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function NursingModelSection({ careLinkage }: { careLinkage: CareLinkage[] }) {
  return (
    <section className="space-y-4">
      {careLinkage.length === 0 ? (
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <EmptyState message="No existe registro NANDA/NOC/NIC activo para este paciente." />
        </article>
      ) : (
        careLinkage.map((link) => (
          <article key={link.nandaId} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-3">
              <ModelCard
                title={`NANDA ${link.nandaId}`}
                body={link.nandaLabel}
                tone="violet"
                footer={link.clinicalRationale}
              />
              <ModelCard
                title={`NOC ${link.nocId}`}
                body={link.nocLabel}
                tone="info"
                footer={link.evaluation}
              />
              <ModelCard
                title={`NIC ${link.nicId}`}
                body={link.nicLabel}
                tone="success"
                footer={link.clinicalRationale}
              />
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function NotesSection({ notes }: { notes: HceNoteEntry[] }) {
  return <NotesPanel notes={notes} compact={false} />;
}

function BackgroundSection({ patient }: { patient: PatientRecord }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <DataCard title="Antecedentes personales" subtitle="Patologicos, quirurgicos y cronicos">
        <ListBlock title="Patologicos" items={patient.antecedentes.pathological} />
        <ListBlock title="Cronicos" items={patient.antecedentes.chronicDiseases} />
        <ListBlock title="Quirurgicos" items={patient.antecedentes.surgical} />
      </DataCard>
      <DataCard title="Familiares y gineco-obstetricos" subtitle="Contexto de riesgo y antecedentes relevantes">
        <ListBlock title="Familiares" items={patient.antecedentes.family} />
        <ListBlock title="Gineco-obstetricos" items={patient.antecedentes.gynecoObstetric} />
      </DataCard>
    </section>
  );
}

function AllergiesSection({ patient }: { patient: PatientRecord }) {
  const activeAllergies = patient.antecedentes.allergies.filter((item) => !isNoKnownAllergy(item));

  return (
    <section className="space-y-4">
      <article className="rounded-[28px] border border-red-200 bg-red-50 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-red-800">Seguridad por alergias medicamentosas</h2>
        <p className="mt-2 text-sm text-red-700">
          {activeAllergies.length > 0
            ? `Alergias activas: ${activeAllergies.join(", ")}. Verificar toda prescripcion y procedimientos con antecedente de reaccion cruzada.`
            : "No hay alergias medicamentosas activas documentadas en esta HCE."}
        </p>
      </article>
      <div className="grid gap-4 lg:grid-cols-2">
        <DataCard title="Alergias registradas" subtitle="Seguridad farmaceutica y procedural">
          <ListBlock title="Alergias" items={patient.antecedentes.allergies} />
          <ListBlock title="Farmacos actuales" items={patient.antecedentes.pharmacological} />
        </DataCard>
        <DataCard title="Alertas relacionadas" subtitle="Cruce con contexto clinico actual">
          <ListBlock title="Alertas activas" items={patient.activeAlerts} />
          <ListBlock title="Dispositivos / procedimientos" items={patient.procedures.map((item) => item.type)} />
        </DataCard>
      </div>
    </section>
  );
}

function VitalsSection({ patient }: { patient: PatientRecord }) {
  const latest = patient.vitalSigns[0];
  const previous = patient.vitalSigns[1];

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <VitalCard label="PA" value={latest ? latest.bloodPressure : "-"} hint={previous ? `${previous.bloodPressure} previo` : "Sin previo"} tone="danger" />
        <VitalCard label="FC" value={latest ? `${latest.heartRate} lpm` : "-"} hint={previous ? `${previous.heartRate} lpm previo` : "Sin previo"} tone="warning" />
        <VitalCard label="SpO₂" value={latest ? `${latest.spo2}%` : "-"} hint={previous ? `${previous.spo2}% previo` : "Sin previo"} tone="info" />
        <VitalCard label="Glucosa" value={latest ? `${latest.glucose} mg/dL` : "-"} hint={previous ? `${previous.glucose} mg/dL previo` : "Sin previo"} tone="danger" />
      </div>
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ultimos controles registrados</h2>
        <div className="mt-4 space-y-3">
          {patient.vitalSigns.slice(0, 3).map((entry) => (
            <article key={entry.recordedAt} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{entry.recordedAt}</p>
                <TagChip tone="info">{entry.professional}</TagChip>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                PA {entry.bloodPressure} · FC {entry.heartRate} · FR {entry.respiratoryRate} · Temp {entry.temperature}°C · SpO₂ {entry.spo2}% · Glucosa {entry.glucose} mg/dL
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {entry.outOfRangeFlags.join(" · ") || "Sin alertas"}
              </p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function MedicationSection({ patient }: { patient: PatientRecord }) {
  return (
    <section className="space-y-4">
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Medicacion activa</h2>
          <Link
            href={`/portal/professional/patients/${patient.id}?tab=medication`}
            className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Abrir medicacion
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {patient.medicationRecords.map((medication) => (
            <article key={medication.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">
                  {medication.name} {medication.dose}
                </p>
                <TagChip
                  tone={
                    medication.administrationStatus === "Administrado"
                      ? "success"
                      : medication.administrationStatus === "Pendiente"
                      ? "warning"
                      : "danger"
                  }
                >
                  {medication.administrationStatus}
                </TagChip>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {medication.route} · {medication.frequency} · {medication.indication}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Prescriptor: {medication.prescriber} · Inicio: {medication.startDate} · Horario: {medication.schedule}
              </p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function LabImageSection({ patient }: { patient: PatientRecord }) {
  return (
    <section className="space-y-4">
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Laboratorio e imagen</h2>
          <Link
            href={`/portal/professional/lis-ris?patientId=${patient.id}`}
            className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Abrir LIS / RIS
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {patient.exams.length === 0 ? (
            <EmptyState message="Sin examenes registrados en la HCE actual." />
          ) : (
            patient.exams.map((exam) => (
              <article key={exam.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base font-semibold text-slate-900">{exam.name}</p>
                  <TagChip
                    tone={
                      exam.status === "Validado"
                        ? "success"
                        : exam.status === "Pendiente"
                        ? "warning"
                        : "info"
                    }
                  >
                    {exam.status}
                  </TagChip>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {exam.category} · {exam.summary}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Solicitado: {exam.requestedAt} · Resultado: {exam.resultAt ?? "Pendiente"} · {exam.requestedBy}
                </p>
              </article>
            ))
          )}
        </div>
      </article>
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Documentos clinicos</h2>
        <div className="mt-4 space-y-3">
          {patient.documents.length === 0 ? (
            <EmptyState message="No hay documentos asociados al expediente." />
          ) : (
            patient.documents.map((document) => (
              <article key={document.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base font-semibold text-slate-900">{document.title}</p>
                  <TagChip tone="neutral">{document.status}</TagChip>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {document.type} · {document.date}
                </p>
                <p className="mt-2 text-xs text-slate-500">Subido por: {document.uploadedBy}</p>
              </article>
            ))
          )}
        </div>
      </article>
    </section>
  );
}

function NotesPanel({
  notes,
  compact,
}: {
  notes: HceNoteEntry[];
  compact: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <InfoCircle tone="success">[]</InfoCircle>
          <h2 className="text-lg font-semibold text-slate-900">Notas clinicas recientes</h2>
        </div>
        <Link
          href="/portal/professional/clinical-documents"
          className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          Ver todas
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {(compact ? notes.slice(0, 3) : notes).map((note) => (
          <article key={note.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{note.professional}</p>
                <p className="text-sm text-slate-500">
                  {note.datetime} · {note.specialty}
                </p>
              </div>
              <TagChip tone={noteTone(note.kind)}>{note.kind}</TagChip>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{note.text}</p>
          </article>
        ))}
      </div>
    </article>
  );
}

function ProtocolCard({
  title,
  subtitle,
  tone,
  bullets,
}: {
  title: string;
  subtitle: string;
  tone: "danger" | "info" | "neutral";
  bullets: string[];
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <TagChip tone={tone}>{tone === "danger" ? "Activo" : tone === "info" ? "Registrado" : "Sin activacion"}</TagChip>
      </div>
      <div className="mt-4 space-y-3">
        {bullets.map((bullet) => (
          <article key={bullet} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {bullet}
          </article>
        ))}
      </div>
    </article>
  );
}

function SectionGroupBlock({
  title,
  items,
  selectedSection,
  onSelectSection,
}: {
  title: string;
  items: HceSectionItem[];
  selectedSection: HceSectionId;
  onSelectSection: (section: HceSectionId) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSection(item.id)}
            className={[
              "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
              selectedSection === item.id
                ? "bg-slate-100 text-slate-900"
                : "text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <span className="flex items-center gap-3">
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  item.dotTone === "emerald"
                    ? "bg-emerald-500"
                    : item.dotTone === "sky"
                    ? "bg-sky-500"
                    : item.dotTone === "rose"
                    ? "bg-rose-500"
                    : item.dotTone === "amber"
                    ? "bg-amber-500"
                    : "bg-violet-500",
                ].join(" ")}
              />
              <span>{item.label}</span>
            </span>
            {item.count !== undefined ? <CountBadge value={item.count} /> : null}
          </button>
        ))}
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
            Sin coincidencias para esta busqueda.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DataCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </article>
  );
}

function IdentityRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className={["mt-2 text-lg leading-8 text-slate-900", accent ?? ""].join(" ")}>{value}</p>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <TagChip key={item} tone="neutral">
              {item}
            </TagChip>
          ))
        ) : (
          <TagChip tone="neutral">Sin registro</TagChip>
        )}
      </div>
    </div>
  );
}

function VitalCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "danger" | "warning" | "info";
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p
        className={[
          "mt-3 text-4xl font-semibold",
          tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-sky-600",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

function MiniMetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

function ModelCard({
  title,
  body,
  footer,
  tone,
}: {
  title: string;
  body: string;
  footer: string;
  tone: "violet" | "info" | "success";
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <TagChip tone={tone}>{title}</TagChip>
      <p className="mt-3 text-lg font-semibold text-slate-900">{body}</p>
      <p className="mt-3 text-sm text-slate-700">{footer}</p>
    </article>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
      {value}
    </span>
  );
}

function InfoCircle({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "info" | "danger" | "violet" | "success";
}) {
  return (
    <div
      className={[
        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
        tone === "info"
          ? "bg-sky-50 text-sky-600"
          : tone === "danger"
          ? "bg-red-50 text-red-600"
          : tone === "violet"
          ? "bg-violet-50 text-violet-600"
          : "bg-emerald-50 text-emerald-600",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function TagChip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "danger" | "warning" | "success" | "info" | "neutral" | "violet";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700"
          : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : tone === "violet"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
      {message}
    </p>
  );
}

function buildSectionItems(
  patient: PatientRecord,
  codedDiagnoses: CodedDiagnosis[],
  recentNotes: HceNoteEntry[],
  physicalExam: ExamSystemEntry[],
  careLinkage: CareLinkage[]
): HceSectionItem[] {
  return [
    { id: "summary", label: "Resumen del paciente", group: "history", dotTone: "emerald" },
    { id: "anamnesis", label: "Anamnesis", group: "history", dotTone: "sky" },
    { id: "physical_exam", label: "Examen fisico", group: "history", count: physicalExam.length, dotTone: "sky" },
    { id: "diagnoses", label: "Diagnosticos CIE-11", group: "history", count: codedDiagnoses.length, dotTone: "rose" },
    { id: "nursing_model", label: "NANDA / NOC / NIC", group: "history", count: careLinkage.length, dotTone: "violet" },
    { id: "notes", label: "Notas y evolucion", group: "documents", count: recentNotes.length, dotTone: "emerald" },
    {
      id: "background",
      label: "Antecedentes",
      group: "documents",
      count: patient.antecedentes.pathological.length + patient.antecedentes.family.length,
      dotTone: "amber",
    },
    {
      id: "allergies",
      label: "Alergias",
      group: "documents",
      count: patient.antecedentes.allergies.filter((item) => !isNoKnownAllergy(item)).length,
      dotTone: "rose",
    },
    { id: "vitals", label: "Signos vitales", group: "documents", count: patient.vitalSigns.length, dotTone: "sky" },
    { id: "medication", label: "Medicacion", group: "documents", count: patient.medicationRecords.length, dotTone: "sky" },
    { id: "lab_image", label: "Laboratorio e imagen", group: "documents", count: patient.exams.length, dotTone: "sky" },
    { id: "triage_protocol", label: `Triaje ${patient.triageAssessment.triageColor.toUpperCase()}-${patient.id.toUpperCase()}`, group: "protocols", dotTone: "emerald" },
    { id: "violence_protocol", label: "Protocolo violencia", group: "protocols", dotTone: "emerald" },
    { id: "sca_protocol", label: "Subprot. SCA", group: "protocols", dotTone: "rose" },
  ];
}

function buildRecentNotes(patient: PatientRecord, addedNotes: HceNoteEntry[]) {
  const timelineTriage = patient.timeline
    .filter((entry) => entry.category === "Triaje" || entry.category === "Ingreso")
    .slice(0, 1)
    .map((entry) => ({
      id: `timeline-${entry.id}`,
      kind: "Nota de triaje" as NoteKind,
      datetime: entry.datetime,
      professional: currentClinicalContext.professionalName,
      specialty: "Urgencias",
      text: entry.detail,
    }));

  const nursing = patient.nursingNotes.map((note) => mapClinicalNoteToEntry(note, "Nota de enfermeria"));
  const medical = patient.medicalNotes.map((note) => mapClinicalNoteToEntry(note, "Nota medica"));

  return [...addedNotes, ...nursing, ...medical, ...timelineTriage].sort((a, b) =>
    b.datetime.localeCompare(a.datetime)
  );
}

function mapClinicalNoteToEntry(note: ClinicalNote, kind: NoteKind): HceNoteEntry {
  return {
    id: note.id,
    kind,
    datetime: note.datetime,
    professional: note.professional,
    specialty: note.specialty,
    text: note.note,
  };
}

function buildPhysicalExam(patient: PatientRecord): ExamSystemEntry[] {
  const latestVital = patient.vitalSigns[0];
  const taStatus = latestVital && latestVital.bloodPressure !== "120/80" ? "Alterado" : "Normal";
  const spo2Status = latestVital && latestVital.spo2 < 94 ? "Alterado" : "Normal";

  return [
    { system: "General", finding: `Estado actual: ${patient.currentStatus}.`, status: "Normal" },
    {
      system: "Cardiovascular",
      finding: `PA ${latestVital?.bloodPressure ?? "-"} · FC ${latestVital?.heartRate ?? "-"}.`,
      status: taStatus,
    },
    {
      system: "Respiratorio",
      finding: `FR ${latestVital?.respiratoryRate ?? "-"} · SpO₂ ${latestVital?.spo2 ?? "-"}%.`,
      status: spo2Status,
    },
    {
      system: "Neurologico",
      finding: patient.triageAssessment.professionalObservations || "Sin observaciones neurologicas.",
      status: "Normal",
    },
    {
      system: "Metabolico",
      finding: `Glucosa ${latestVital?.glucose ?? "-"} mg/dL · Dolor ${latestVital?.painScale ?? "-"} /10.`,
      status: latestVital && latestVital.glucose >= 180 ? "Alterado" : "Normal",
    },
    {
      system: "Piel y anexos",
      finding: patient.nursingShiftReports[0]?.skin || "Sin datos de piel en este turno.",
      status: "Normal",
    },
  ];
}

function mapDiagnosesToCie11(diagnoses: DiagnosisRecord[]) {
  return diagnoses.map((diagnosis, index) => {
    const match =
      cie11Catalog.find((item) =>
        normalizeText(diagnosis.diagnosis).includes(normalizeText(item.label.split(" ")[0] ?? ""))
      ) ?? cie11Catalog[index % cie11Catalog.length];

    return {
      ...diagnosis,
      code: match.code,
      phase: /activo/i.test(diagnosis.status) ? "Activo" : /estudio/i.test(diagnosis.status) ? "En estudio" : diagnosis.status,
    };
  });
}

function buildCareLinkage(patient: PatientRecord) {
  const report = nursingReportRecords.find((item) => item.patientId === patient.id);

  if (report) {
    const nanda = nandaCatalog.find((item) => item.id === report.nandaId);
    const noc = nocCatalog.find((item) => item.id === report.nocId);
    const nic = nicCatalog.find((item) => item.id === report.nicId);

    if (nanda && noc && nic) {
      return [
        {
          nandaId: nanda.id,
          nandaLabel: nanda.label,
          nocId: noc.id,
          nocLabel: noc.outcome,
          nicId: nic.id,
          nicLabel: nic.intervention,
          clinicalRationale: report.clinicalRationale,
          evaluation: report.evaluation,
        },
      ];
    }
  }

  return patient.carePlan.slice(0, 2).map((plan, index) => {
    const nanda = nandaCatalog[index % nandaCatalog.length];
    const noc = nocCatalog[index % nocCatalog.length];
    const nic = nicCatalog[index % nicCatalog.length];

    return {
      nandaId: nanda.id,
      nandaLabel: plan.nursingDiagnosis,
      nocId: noc.id,
      nocLabel: noc.outcome,
      nicId: nic.id,
      nicLabel: nic.intervention,
      clinicalRationale: plan.observations,
      evaluation: plan.evaluation,
    };
  });
}

function buildLinkedPlan(diagnosis: { code: string }) {
  if (diagnosis.code === "BA40.1") {
    return "Plan: monitorizacion hemodinamica continua, antiagregacion, control de dolor toracico y reevaluacion cada 2h.";
  }
  if (diagnosis.code === "5A11") {
    return "Plan: ajuste de antihipertensivos, metas TA < 140/90 y vigilancia de respuesta farmacologica.";
  }
  if (diagnosis.code === "5A10") {
    return "Plan: control glucemico capilar seriado, ajuste insulinico y educacion terapeutica.";
  }
  return "Plan: seguimiento clinico estructurado, intervenciones segun protocolos institucionales y reevaluacion diaria.";
}

function detectViolenceProtocol(notes: HceNoteEntry[]) {
  return notes.some((note) => normalizeText(note.text).includes("violencia"));
}

function hasScaProtocol(patient: PatientRecord, notes: HceNoteEntry[]) {
  return (
    normalizeText(patient.primaryDiagnosis).includes("coronario") ||
    patient.activeAlerts.some((item) => normalizeText(item).includes("cardiovascular")) ||
    notes.some((note) => normalizeText(note.text).includes("sca"))
  );
}

function isNoKnownAllergy(value: string) {
  return /(ninguna|no conocida|sin alergia|no registra)/i.test(value);
}

function noteTone(kind: NoteKind) {
  if (kind === "Nota de enfermeria") {
    return "warning" as const;
  }
  if (kind === "Nota medica") {
    return "info" as const;
  }
  return "danger" as const;
}

function sectionTitle(section: HceSectionId) {
  const map: Record<HceSectionId, string> = {
    summary: "Resumen del paciente",
    anamnesis: "Anamnesis",
    physical_exam: "Examen fisico",
    diagnoses: "Diagnosticos CIE-11",
    nursing_model: "NANDA / NOC / NIC",
    notes: "Notas y evolucion",
    background: "Antecedentes",
    allergies: "Alergias",
    vitals: "Signos vitales",
    medication: "Medicacion",
    lab_image: "Laboratorio e imagen",
    triage_protocol: "Protocolo de triaje",
    violence_protocol: "Protocolo de violencia",
    sca_protocol: "Subprotocolo SCA",
  };

  return map[section];
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initialsOf(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0] ?? "")
    .join("");
}

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none";
