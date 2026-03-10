import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";

type SurgicalStatus = "Programada" | "En curso" | "Finalizada";

type SurgicalCase = {
  id: string;
  patient: string;
  procedure: string;
  room: string;
  team: string;
  estimatedTime: string;
  status: SurgicalStatus;
};

type AldretePoint = {
  label: string;
  score: 0 | 1 | 2;
  detail: string;
};

const surgerySchedule: SurgicalCase[] = [
  {
    id: "sx-1",
    patient: "Maria Lopez",
    procedure: "Cateterismo cardiaco diagnostico",
    room: "Pabellon 2",
    team: "Cardiologia + Enfermeria hemodinamica",
    estimatedTime: "90 min",
    status: "Programada",
  },
  {
    id: "sx-2",
    patient: "Juan Perez",
    procedure: "Broncoscopia diagnostica",
    room: "Pabellon 1",
    team: "Neumologia + Anestesia",
    estimatedTime: "60 min",
    status: "En curso",
  },
  {
    id: "sx-3",
    patient: "Sofia Mendoza",
    procedure: "Debridamiento de pie diabetico",
    room: "Pabellon 3",
    team: "Cirugia general + Enfermeria",
    estimatedTime: "75 min",
    status: "Finalizada",
  },
];

const operatingRoomSheet = {
  surgicalTeam: ["Cirujano principal", "Ayudante", "Anestesiologo", "Instrumentista", "Circulante"],
  materials: ["Set estandar esteril", "Suturas 3-0", "Gasas", "Solucion antiseptica"],
  startAt: "2026-03-10 10:05",
  endAt: "2026-03-10 11:14",
  incidents: "Sin incidentes intraoperatorios mayores.",
};

const aldreteRecovery: AldretePoint[] = [
  { label: "Actividad", score: 2, detail: "Mueve extremidades voluntariamente." },
  { label: "Respiracion", score: 2, detail: "Respira profundo y tose adecuadamente." },
  { label: "Circulacion", score: 1, detail: "TA dentro de 20-50% del basal." },
  { label: "Conciencia", score: 2, detail: "Completamente despierto." },
  { label: "Saturacion O2", score: 2, detail: "SpO2 > 92% con aire ambiente." },
];

const digitalConsents = [
  { id: "cons-1", title: "Consentimiento quirurgico general", patient: "Juan Perez", status: "Firmado" },
  { id: "cons-2", title: "Consentimiento anestesico", patient: "Juan Perez", status: "Firmado" },
  { id: "cons-3", title: "Consentimiento transfusional", patient: "Maria Lopez", status: "Pendiente firma" },
];

export default function SurgicalPage() {
  const inProgress = surgerySchedule.filter((item) => item.status === "En curso").length;
  const completed = surgerySchedule.filter((item) => item.status === "Finalizada").length;
  const aldreteTotal = aldreteRecovery.reduce((acc, item) => acc + item.score, 0);

  return (
    <ModulePage
      title="Modulo quirurgico"
      subtitle="Programacion de cirugias, hoja de pabellon, nota operatoria, Aldrete y consentimientos digitales."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Cirugias programadas" value={surgerySchedule.length} hint="Agenda del dia" />
        <StatCard label="En curso" value={inProgress} hint="Pabellon activo" />
        <StatCard label="Finalizadas" value={completed} hint="Con cierre operatorio" />
        <StatCard label="Aldrete actual" value={`${aldreteTotal}/10`} hint="Recuperacion post-anestesica" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Programacion quirurgica" subtitle="Pabellon, equipo, tiempo estimado y estado">
          <div className="space-y-2">
            {surgerySchedule.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{item.patient}</p>
                  <SurgeryStatusBadge status={item.status} />
                </div>
                <p className="text-[11px] text-slate-500">{item.procedure}</p>
                <p className="text-[11px] text-slate-600">
                  {item.room} · {item.team} · {item.estimatedTime}
                </p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Hoja de pabellon" subtitle="Equipo, materiales, tiempos y trazabilidad intraoperatoria">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Equipo quirurgico</p>
            <p className="text-[11px] text-slate-600">{operatingRoomSheet.surgicalTeam.join(", ")}</p>
            <p className="mt-2 font-semibold text-slate-900">Materiales utilizados</p>
            <p className="text-[11px] text-slate-600">{operatingRoomSheet.materials.join(", ")}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Inicio: {operatingRoomSheet.startAt} · Fin: {operatingRoomSheet.endAt}
            </p>
            <p className="text-[11px] text-slate-600">Incidentes: {operatingRoomSheet.incidents}</p>
          </article>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Nota operatoria estructurada" subtitle="Hallazgos, tecnica y plan postoperatorio">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Hallazgos</p>
            <p className="text-[11px] text-slate-600">
              Lesion focal tratada segun plan quirurgico, sin sangrado activo al cierre.
            </p>
            <p className="mt-2 font-semibold text-slate-900">Tecnica</p>
            <p className="text-[11px] text-slate-600">
              Procedimiento realizado bajo tecnica esteril estandar con control hemodinamico continuo.
            </p>
            <p className="mt-2 font-semibold text-slate-900">Plan inmediato</p>
            <p className="text-[11px] text-slate-600">
              Vigilancia post-anestesica, analgesia protocolizada y reevaluacion de herida en 6 horas.
            </p>
          </article>
        </Panel>

        <Panel title="Recuperacion post-anestesica (Aldrete)" subtitle="Seguimiento inmediato para alta de sala de recuperacion">
          <div className="space-y-2">
            {aldreteRecovery.map((item) => (
              <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    {item.score}/2
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Consentimientos informados digitales" subtitle="Firma paciente o tutor y estado legal del documento">
        <div className="space-y-2">
          {digitalConsents.map((consent) => (
            <article key={consent.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">{consent.title}</p>
                <span
                  className={[
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    consent.status === "Firmado"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {consent.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">Paciente: {consent.patient}</p>
            </article>
          ))}
        </div>
      </Panel>
    </ModulePage>
  );
}

function SurgeryStatusBadge({ status }: { status: SurgicalStatus }) {
  const className: Record<SurgicalStatus, string> = {
    Programada: "border-amber-200 bg-amber-50 text-amber-700",
    "En curso": "border-sky-200 bg-sky-50 text-sky-700",
    Finalizada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[status]].join(" ")}>{status}</span>;
}
