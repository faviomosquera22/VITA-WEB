import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { currentClinicalContext } from "../_data/clinical-mock-data";

const settingsSections = [
  {
    title: "Perfil del usuario",
    items: ["Nombre profesional", "Especialidad", "Firma digital", "Contacto institucional"],
  },
  {
    title: "Preferencias",
    items: ["Vista por modulo", "Formato de fecha", "Densidad de tabla", "Dashboard inicial"],
  },
  {
    title: "Notificaciones",
    items: ["Alertas criticas", "Recordatorios de medicacion", "Vacunas pendientes", "Resumen diario"],
  },
  {
    title: "Idioma y apariencia",
    items: ["Espanol", "Terminologia clinica", "Tema claro", "Accesibilidad visual"],
  },
  {
    title: "Privacidad y permisos",
    items: ["Control de acceso", "Sesiones activas", "Permisos por rol", "Auditoria de acciones"],
  },
];

export default function SettingsPage() {
  return (
    <ModulePage
      title="Configuracion"
      subtitle="Perfil, rol, centro asignado, preferencias, privacidad y permisos futuros."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Rol" value={currentClinicalContext.role} hint="Sesion actual" />
        <StatCard label="Centro asignado" value={currentClinicalContext.centerName} hint="Configuracion institucional" />
        <StatCard label="Bloques" value={settingsSections.length} hint="Secciones de configuracion" />
        <StatCard label="Estado" value="Seguro" hint="Sin incidentes reportados" />
      </div>

      <Panel title="Contexto de cuenta" subtitle="Configuracion base del usuario actual">
        <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Perfil" value={currentClinicalContext.professionalName} />
          <Field label="Rol" value={currentClinicalContext.role} />
          <Field label="Centro" value={currentClinicalContext.centerName} />
          <Field label="Turno" value={currentClinicalContext.activeShift} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {settingsSections.map((section) => (
          <Panel key={section.title} title={section.title}>
            <div className="space-y-2">
              {section.items.map((item) => (
                <label
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                >
                  <span>{item}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-sky-600" />
                </label>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </ModulePage>
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
