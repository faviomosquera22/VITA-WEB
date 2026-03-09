import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { mockPatients, teamMembers } from "../_data/clinical-mock-data";

const roleServiceMap: Record<string, string> = {
  Medicina: "Emergencia y hospitalizacion",
  Enfermeria: "Hospitalizacion y observacion",
  Nutricion: "Soporte nutricional",
  Psicologia: "Soporte emocional",
};

export default function CareTeamPage() {
  return (
    <ModulePage
      title="Equipo de salud"
      subtitle="Directorio profesional, estado activo por servicio y responsables por paciente."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Profesionales activos" value={teamMembers.length} hint="Dotacion de turno" />
        <StatCard
          label="Enfermeria + Medicina"
          value={teamMembers.filter((member) => member.role === "Enfermeria" || member.role === "Medicina").length}
          hint="Cobertura asistencial central"
        />
        <StatCard
          label="Soporte integral"
          value={teamMembers.filter((member) => member.role === "Nutricion" || member.role === "Psicologia").length}
          hint="Nutricion y psicologia"
        />
        <StatCard
          label="Pacientes con responsable"
          value={new Set(mockPatients.map((patient) => patient.assignedProfessional)).size}
          hint="Asignacion nominal"
        />
      </div>

      <Panel title="Listado de profesionales" subtitle="Rol, servicio, estado activo y actividad reciente">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {teamMembers.map((member) => (
            <article key={member.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                  Activo
                </span>
              </div>
              <p className="text-xs text-slate-600">{member.role}</p>
              <p className="text-[11px] text-slate-500">Servicio: {roleServiceMap[member.role]}</p>
              <p className="text-[11px] text-slate-500">Turno: {member.shift}</p>
              <p className="text-[11px] text-slate-500">Casos activos: {member.activeCases}</p>
              <p className="mt-2 text-[11px] text-slate-600">{member.recentActivity}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Responsables por paciente" subtitle="Relacion profesional principal por caso">
        <div className="space-y-2">
          {mockPatients.map((patient) => (
            <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">{patient.fullName}</p>
              <p className="text-[11px] text-slate-500">Responsable: {patient.assignedProfessional}</p>
              <p className="text-[11px] text-slate-500">Diagnostico: {patient.primaryDiagnosis}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Notas compartidas (futuro)" subtitle="Base preparada para seguimiento interdisciplinario">
        <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Notas colaborativas por paciente</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Tareas de turno interprofesionales</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Bitacora de decisiones clinicas</div>
        </div>
      </Panel>
    </ModulePage>
  );
}
