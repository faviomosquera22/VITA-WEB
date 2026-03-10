import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { currentClinicalContext, mockPatients, type ClinicalNote, type DiagnosisRecord } from "../_data/clinical-mock-data";

type ExamSystem = {
  system: string;
  finding: string;
  status: "Normal" | "Alterado";
};

type SignedEvolution = {
  id: string;
  datetime: string;
  professional: string;
  specialty: string;
  signedAt: string;
  immutable: boolean;
  cie11Code: string;
  text: string;
};

const cie11Catalog: Array<{ code: string; label: string }> = [
  { code: "BA40.1", label: "Sindrome coronario agudo sin elevacion ST" },
  { code: "5A11", label: "Hipertension arterial primaria" },
  { code: "5A10", label: "Diabetes mellitus tipo 2" },
  { code: "CA40", label: "Exacerbacion aguda de EPOC" },
  { code: "8A80", label: "Cefalea tensional" },
];

const examBySystem: ExamSystem[] = [
  { system: "General", finding: "Consciente, orientada, colaboradora", status: "Normal" },
  { system: "Cardiovascular", finding: "TA elevada y FC sobre meta en reposo", status: "Alterado" },
  { system: "Respiratorio", finding: "Patron respiratorio estable con O2 suplementario", status: "Alterado" },
  { system: "Neurologico", finding: "Sin deficit focal, Glasgow 15/15", status: "Normal" },
  { system: "Abdominal", finding: "Blando, depresible, sin dolor a la palpacion", status: "Normal" },
  { system: "Musculoesqueletico", finding: "Movilidad conservada con apoyo parcial", status: "Normal" },
  { system: "Piel y anexos", finding: "Integra, sin lesiones nuevas", status: "Normal" },
];

export default function StructuredHcePage() {
  const patient = mockPatients[0];
  const codedDiagnoses = mapDiagnosesToCie11(patient.diagnoses);
  const evolution = buildSignedEvolution(patient.medicalNotes);
  const legalChecklist = [
    {
      label: "Anamnesis estructurada completa",
      detail: "Antecedentes personales, familiares, quirurgicos, alergias y habitos.",
      status: "Cumple",
    },
    {
      label: "Motivo de consulta separado de enfermedad actual",
      detail: "Campos diferenciados para trazabilidad clinica y estadistica.",
      status: "Cumple",
    },
    {
      label: "Diagnosticos codificados en CIE-11",
      detail: "Catalogo codificado para auditoria, reporte y analitica.",
      status: "Cumple",
    },
    {
      label: "Evolucion cronologica firmada",
      detail: "Cada nota se marca con sello profesional y hash de firma.",
      status: "Cumple",
    },
    {
      label: "Registro inmutable posterior a firma",
      detail: "Se permite solo agregar correcciones, no sobreescribir notas previas.",
      status: "Cumple",
    },
  ];

  return (
    <ModulePage
      title="Historia clinica estructurada (HCE)"
      subtitle="Registro medico-legal con anamnesis completa, CIE-11, evolucion firmada e inmutable."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Paciente activo" value={patient.fullName} hint={`HC ${patient.medicalRecordNumber}`} />
        <StatCard label="Diagnosticos CIE-11" value={codedDiagnoses.length} hint="Principal y secundarios codificados" />
        <StatCard label="Notas firmadas" value={evolution.length} hint="Evolucion clinica cronologica" />
        <StatCard label="Firma profesional" value={currentClinicalContext.professionalName} hint="Sello digital aplicado" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Consulta actual" subtitle="Motivo de consulta y enfermedad actual en campos separados">
          <div className="space-y-2 text-xs text-slate-700">
            <Field label="Motivo de consulta" value={patient.summary.reasonForConsultation} />
            <Field
              label="Enfermedad actual"
              value={patient.triageAssessment.professionalObservations || "Sin descripcion de enfermedad actual."}
            />
            <Field label="Tiempo de evolucion" value={patient.triageAssessment.evolutionTime} />
            <Field label="Servicio de ingreso" value={patient.serviceArea ?? "No definido"} />
          </div>
        </Panel>

        <Panel title="Anamnesis estructurada" subtitle="Antecedentes, alergias, habitos y contexto clinico">
          <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
            <ListField label="Patologicos" items={patient.antecedentes.pathological} />
            <ListField label="Familiares" items={patient.antecedentes.family} />
            <ListField label="Quirurgicos" items={patient.antecedentes.surgical} />
            <ListField label="Alergias" items={patient.antecedentes.allergies} />
            <ListField label="Farmacologicos" items={patient.antecedentes.pharmacological} />
            <ListField label="Hospitalizaciones previas" items={patient.antecedentes.hospitalizations} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
            <Field label="Habito tabaco" value={patient.antecedentes.habits.tobacco} />
            <Field label="Habito alcohol" value={patient.antecedentes.habits.alcohol} />
            <Field label="Actividad fisica" value={patient.antecedentes.habits.physicalActivity} />
            <Field label="Alimentacion" value={patient.antecedentes.habits.feeding} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Examen fisico por sistemas" subtitle="Registro estructurado por aparatos y sistemas">
          <div className="space-y-2">
            {examBySystem.map((entry) => (
              <article key={entry.system} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{entry.system}</p>
                  <StatusBadge status={entry.status} />
                </div>
                <p className="text-[11px] text-slate-600">{entry.finding}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Diagnosticos CIE-11 y plan terapeutico" subtitle="Plan vinculado directamente a diagnosticos codificados">
          <div className="space-y-2">
            {codedDiagnoses.map((diag) => (
              <article key={diag.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">
                  {diag.code} · {diag.diagnosis}
                </p>
                <p className="text-[11px] text-slate-500">Tipo: {diag.type}</p>
                <p className="mt-1 text-[11px] text-slate-600">{buildLinkedPlan(diag)}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Evolucion clinica cronologica" subtitle="Notas firmadas digitalmente, fechadas y bloqueadas para edicion">
        <div className="space-y-2">
          {evolution.map((note) => (
            <article key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">
                  {note.datetime} · {note.specialty}
                </p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {note.immutable ? "Registro inmutable" : "Editable"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Profesional: {note.professional} · CIE-11: {note.cie11Code}
              </p>
              <p className="mt-1 text-[11px] text-slate-700">{note.text}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Firma: {buildSignatureHash(note.id, note.professional)} · Firmado: {note.signedAt}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Validacion medico-legal" subtitle="Control operativo para mantener validez del expediente clinico">
        <div className="space-y-2">
          {legalChecklist.map((item) => (
            <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </Panel>
    </ModulePage>
  );
}

function mapDiagnosesToCie11(diagnoses: DiagnosisRecord[]) {
  return diagnoses.map((diag, index) => {
    const match =
      cie11Catalog.find((item) => diag.diagnosis.toLowerCase().includes(item.label.toLowerCase().split(" ")[0])) ??
      cie11Catalog[index % cie11Catalog.length];

    return {
      ...diag,
      code: match.code,
    };
  });
}

function buildSignedEvolution(notes: ClinicalNote[]): SignedEvolution[] {
  return notes
    .slice(0, 6)
    .map((note, index) => ({
      id: note.id,
      datetime: note.datetime,
      professional: note.professional,
      specialty: note.specialty,
      signedAt: note.datetime,
      immutable: true,
      cie11Code: cie11Catalog[index % cie11Catalog.length].code,
      text: note.note,
    }))
    .sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
}

function buildLinkedPlan(diag: { code: string; diagnosis: string }) {
  if (diag.code === "BA40.1") {
    return "Plan: monitorizacion hemodinamica continua, antiagregacion, control de dolor toracico y reevaluacion cada 2h.";
  }
  if (diag.code === "5A11") {
    return "Plan: ajuste de antihipertensivos, metas TA < 140/90, vigilancia de respuesta farmacologica.";
  }
  if (diag.code === "5A10") {
    return "Plan: control glucemico capilar seriado, ajuste insulinico y educacion terapeutica.";
  }
  return "Plan: seguimiento clinico estructurado, intervenciones segun protocolos institucionales y reevaluacion diaria.";
}

function buildSignatureHash(noteId: string, professional: string) {
  const raw = `${noteId}:${professional}`;
  let acc = 0;

  for (let index = 0; index < raw.length; index += 1) {
    acc = (acc * 31 + raw.charCodeAt(index)) % 0xffffff;
  }

  return `SIG-${acc.toString(16).toUpperCase().padStart(6, "0")}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{items.join(", ") || "Sin registro"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ExamSystem["status"] }) {
  const className =
    status === "Normal"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className].join(" ")}>{status}</span>;
}
