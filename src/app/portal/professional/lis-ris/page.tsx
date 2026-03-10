import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { mockPatients, type ExamRecord } from "../_data/clinical-mock-data";

type LabTrendPoint = {
  date: string;
  hemoglobin: number;
  glucose: number;
  creatinine: number;
};

const examProfiles = [
  {
    id: "profile-1",
    name: "Perfil metabolico",
    tests: ["Glucosa", "Urea", "Creatinina", "Electrolitos"],
    estimatedTurnaround: "2 horas",
  },
  {
    id: "profile-2",
    name: "Perfil hepatico",
    tests: ["AST", "ALT", "Bilirrubina", "Fosfatasa alcalina"],
    estimatedTurnaround: "3 horas",
  },
  {
    id: "profile-3",
    name: "Perfil cardiovascular",
    tests: ["Troponina", "CK-MB", "BNP", "ECG"],
    estimatedTurnaround: "90 min",
  },
];

const imagingQueue = [
  {
    id: "img-1",
    patient: "Maria Lopez",
    study: "TAC torax sin contraste",
    status: "Informado",
    report: "Sin tromboembolismo pulmonar. Cardiomegalia leve.",
    pacsLink: "PACS interno / estudio 2026-03-10-001",
  },
  {
    id: "img-2",
    patient: "Juan Perez",
    study: "Rx torax AP",
    status: "Pendiente informe",
    report: "Pendiente validacion por radiologia.",
    pacsLink: "PACS interno / estudio 2026-03-10-008",
  },
];

const criticalLabTrend: LabTrendPoint[] = [
  { date: "2026-03-07", hemoglobin: 12.4, glucose: 245, creatinine: 1.02 },
  { date: "2026-03-08", hemoglobin: 11.8, glucose: 232, creatinine: 1.1 },
  { date: "2026-03-09", hemoglobin: 11.3, glucose: 214, creatinine: 1.18 },
  { date: "2026-03-10", hemoglobin: 10.9, glucose: 206, creatinine: 1.24 },
];

export default function LisRisPage() {
  const examRows = mockPatients.flatMap((patient) =>
    patient.exams.map((exam) => ({ patientName: patient.fullName, exam }))
  );
  const pending = examRows.filter((row) => row.exam.status === "Pendiente");
  const critical = examRows.filter((row) => isCriticalExam(row.exam));
  const imaging = examRows.filter((row) => row.exam.category === "Imagenologia");

  return (
    <ModulePage
      title="LIS / RIS"
      subtitle="Solicitud, resultado, criticidad y tendencias de laboratorio e imagenes con trazabilidad clinica."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Examenes totales" value={examRows.length} hint="Laboratorio e imagenologia" />
        <StatCard label="Pendientes" value={pending.length} hint="Sin resultado validado" />
        <StatCard label="Criticos" value={critical.length} hint="Requieren notificacion inmediata" />
        <StatCard label="Imagenes" value={imaging.length} hint="Integradas con referencia PACS" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Solicitud por perfiles" subtitle="Ordenes estandarizadas para reducir errores y acelerar tiempos">
          <div className="space-y-2">
            {examProfiles.map((profile) => (
              <article key={profile.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{profile.name}</p>
                <p className="text-[11px] text-slate-600">{profile.tests.join(", ")}</p>
                <p className="text-[11px] text-slate-500">Tiempo esperado: {profile.estimatedTurnaround}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Resultados criticos" subtitle="Marcadores de alarma y notificacion al medico tratante">
          <div className="space-y-2">
            {critical.length === 0 ? (
              <p className="text-xs text-slate-500">No hay resultados criticos en este momento.</p>
            ) : (
              critical.map((row) => (
                <article key={`${row.patientName}-${row.exam.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{row.patientName}</p>
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      Critico
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {row.exam.name} · {row.exam.category} · Estado {row.exam.status}
                  </p>
                  <p className="text-[11px] text-slate-600">{row.exam.summary}</p>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Tendencia de laboratorio" subtitle="Evolucion temporal de Hb, glucosa y creatinina">
          <div className="space-y-2">
            {criticalLabTrend.map((point) => (
              <article key={point.date} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{point.date}</p>
                <p className="text-[11px] text-slate-500">
                  Hemoglobina: {point.hemoglobin} g/dL (ref 12-16) · Glucosa: {point.glucose} mg/dL (ref 70-110)
                </p>
                <p className="text-[11px] text-slate-600">Creatinina: {point.creatinine} mg/dL (ref 0.6-1.2)</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Imagenes y RIS/PACS" subtitle="Estado de estudios, informe radiologico y acceso al visor">
          <div className="space-y-2">
            {imagingQueue.map((study) => (
              <article key={study.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{study.patient}</p>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      study.status === "Informado"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {study.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{study.study}</p>
                <p className="text-[11px] text-slate-600">{study.report}</p>
                <p className="text-[11px] text-slate-500">{study.pacsLink}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function isCriticalExam(exam: ExamRecord) {
  const text = `${exam.name} ${exam.summary} ${exam.observations}`.toLowerCase();
  const keywords = ["critico", "elevad", "hiper", "alarma", "urgente", "alto riesgo"];

  return keywords.some((keyword) => text.includes(keyword));
}
