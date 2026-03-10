import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";

const chronicPrograms = [
  {
    id: "prog-1",
    name: "Diabetes",
    activePatients: 186,
    noShowRate: "14%",
    keyIndicators: "HbA1c meta: 61%",
  },
  {
    id: "prog-2",
    name: "Hipertension",
    activePatients: 242,
    noShowRate: "11%",
    keyIndicators: "PA controlada: 68%",
  },
  {
    id: "prog-3",
    name: "Tuberculosis",
    activePatients: 28,
    noShowRate: "7%",
    keyIndicators: "Adherencia DOTS: 92%",
  },
  {
    id: "prog-4",
    name: "Materno infantil",
    activePatients: 133,
    noShowRate: "9%",
    keyIndicators: "Controles al dia: 79%",
  },
];

const epidemiologyKpis = [
  { label: "Top CIE-11 del mes", value: "5A11 / 5A10 / CA40" },
  { label: "Ocupacion hospitalaria semanal", value: "82%" },
  { label: "Reingreso en 30 dias", value: "7.4%" },
  { label: "Infecciones asociadas a salud", value: "1.8 por 100 egresos" },
];

const patientPortalFeatures = [
  "Resumen de historia clinica para paciente",
  "Resultados de examenes en PDF descargable",
  "Receta electronica con QR validable",
  "Agenda de citas (solicitar, confirmar, cancelar)",
  "Mensajeria segura con equipo de salud",
  "Cuestionario preconsulta desde movil",
];

const teleconsultFeatures = [
  "Video consulta integrada (WebRTC)",
  "Consentimiento digital para atencion remota",
  "Prescripcion remota vinculada a HCE",
  "Registro automatico de consulta en la historia",
  "Vista dividida: video + expediente clinico",
];

const adminCapabilities = [
  "Agenda unificada de profesionales con cupos y ausencias",
  "Referencias y contrareferencias entre niveles",
  "Gestion de insumos con stock y vencimientos",
  "Facturacion por aseguradora (IESS, privado, particular)",
  "Turnos de personal y guardias institucionales",
];

const differentiators = [
  "Dictado clinico con IA para estructurar notas en campos codificados.",
  "Alertas predictivas de deterioro temprano (ej. NEWS2) en tiempo real.",
  "Resumen automatico para cambio de guardia con eventos del turno.",
  "Modo offline-first con sincronizacion cuando retorna la red.",
  "Diseño optimizado para tablet/iPad con interacciones tactiles.",
];

export default function PopulationProgramsPage() {
  return (
    <ModulePage
      title="Programas y gestion poblacional"
      subtitle="Seguimiento cronico, portal paciente, teleconsulta, epidemiologia y gestion administrativa."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Programas activos" value={chronicPrograms.length} hint="Cobertura por linea de cuidado" />
        <StatCard label="Pacientes cronicos" value={589} hint="En seguimiento longitudinal" />
        <StatCard label="Teleconsultas mes" value={214} hint="Atenciones remotas registradas" />
        <StatCard label="Reportes epidemiologicos" value={12} hint="Emitidos a autoridad sanitaria" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Programas de salud cronica" subtitle="Controles, inasistencia e indicadores de meta terapeutica">
          <div className="space-y-2">
            {chronicPrograms.map((program) => (
              <article key={program.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{program.name}</p>
                <p className="text-[11px] text-slate-500">Pacientes activos: {program.activePatients}</p>
                <p className="text-[11px] text-slate-500">Inasistencia: {program.noShowRate}</p>
                <p className="text-[11px] text-slate-600">{program.keyIndicators}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Indicadores epidemiologicos y calidad" subtitle="Morbilidad, ocupacion y eventos de calidad institucional">
          <div className="space-y-2">
            {epidemiologyKpis.map((kpi) => (
              <article key={kpi.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{kpi.label}</p>
                <p className="text-[11px] text-slate-600">{kpi.value}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Portal del paciente" subtitle="Autoservicio digital y comunicacion segura">
          <ul className="space-y-2 text-xs text-slate-700">
            {patientPortalFeatures.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Teleconsulta" subtitle="Atencion remota con trazabilidad legal y clinica">
          <ul className="space-y-2 text-xs text-slate-700">
            {teleconsultFeatures.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Gestion administrativa critica" subtitle="Capacidades operativas de soporte institucional">
        <ul className="grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
          {adminCapabilities.map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Diferenciadores de producto" subtitle="Linea de trabajo para hacer la plataforma memorable">
        <ul className="space-y-2 text-xs text-slate-700">
          {differentiators.map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Panel>
    </ModulePage>
  );
}
