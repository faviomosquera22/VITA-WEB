import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { listAuditEvents } from "@/lib/clinical-store";

type PermissionRow = {
  role: string;
  psychiatricNotes: "Si" | "No" | "Restringido" | "Lectura";
  medicationOrders: "Si" | "No" | "Restringido" | "Lectura";
  dischargeSign: "Si" | "No" | "Restringido" | "Lectura";
  adminReports: "Si" | "No" | "Restringido" | "Lectura";
};

const legalControls = [
  {
    id: "ctrl-1",
    label: "Registro inmutable de notas firmadas",
    status: "Activo",
    detail: "Ninguna nota firmada puede editarse o eliminarse; solo se permiten adendas.",
  },
  {
    id: "ctrl-2",
    label: "Cifrado en transito y en reposo",
    status: "Activo",
    detail: "Transito TLS y almacenamiento cifrado en base de datos y respaldos.",
  },
  {
    id: "ctrl-3",
    label: "Respaldo automatico con RTO/RPO",
    status: "Activo",
    detail: "RTO 4h y RPO 15 min definidos para continuidad operacional.",
  },
  {
    id: "ctrl-4",
    label: "Consentimiento de tratamiento de datos",
    status: "Activo",
    detail: "Consentimiento informado y trazabilidad de aceptacion por paciente/tutor.",
  },
  {
    id: "ctrl-5",
    label: "2FA obligatorio para personal",
    status: "En despliegue",
    detail: "Autenticacion de doble factor para personal clinico y administrativo.",
  },
];

const permissionMatrix: PermissionRow[] = [
  {
    role: "Recepcion",
    psychiatricNotes: "No",
    medicationOrders: "No",
    dischargeSign: "No",
    adminReports: "Si",
  },
  {
    role: "Enfermeria",
    psychiatricNotes: "No",
    medicationOrders: "Si",
    dischargeSign: "No",
    adminReports: "No",
  },
  {
    role: "Medicina",
    psychiatricNotes: "Si",
    medicationOrders: "Si",
    dischargeSign: "Si",
    adminReports: "No",
  },
  {
    role: "Auditoria",
    psychiatricNotes: "Restringido",
    medicationOrders: "Lectura",
    dischargeSign: "Lectura",
    adminReports: "Si",
  },
];

const securityIncidents = [
  {
    id: "sec-1",
    datetime: "2026-03-09 18:22",
    event: "Intento de acceso con credenciales invalidas",
    severity: "Media",
    action: "Bloqueo temporal y alerta a seguridad.",
  },
  {
    id: "sec-2",
    datetime: "2026-03-10 07:12",
    event: "Consulta de historial fuera de servicio asignado",
    severity: "Alta",
    action: "Sesion auditada y revisada por cumplimiento.",
  },
];

export default function CompliancePage() {
  const auditEvents = listAuditEvents(10);
  const activeControls = legalControls.filter((item) => item.status === "Activo").length;

  return (
    <ModulePage
      title="Cumplimiento y seguridad"
      subtitle="Auditoria de accesos, registro inmutable, permisos granulares, respaldo y doble factor."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Controles activos" value={activeControls} hint={`${legalControls.length} controles definidos`} />
        <StatCard label="Eventos auditados" value={auditEvents.length} hint="Bitacora reciente de accesos y acciones" />
        <StatCard label="Incidentes de seguridad" value={securityIncidents.length} hint="Monitoreo operativo" />
        <StatCard label="2FA personal" value="En despliegue" hint="Aplicacion progresiva por rol" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Auditoria de accesos" subtitle="Quien accedio, cuando y sobre que entidad clinica">
          <div className="space-y-2">
            {auditEvents.length === 0 ? (
              <p className="text-xs text-slate-500">Sin eventos recientes en la bitacora de auditoria.</p>
            ) : (
              auditEvents.map((event) => (
                <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">
                      {event.actorName} · {event.action}
                    </p>
                    <span className="text-[11px] text-slate-500">{event.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {event.targetType}:{event.targetId}
                  </p>
                  <p className="text-[11px] text-slate-500">{event.detail}</p>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Controles legales y normativos" subtitle="Estado operativo de requisitos de seguridad y privacidad">
          <div className="space-y-2">
            {legalControls.map((control) => (
              <article key={control.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{control.label}</p>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      control.status === "Activo"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {control.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{control.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Permisos granulares por rol" subtitle="Accesos clinicos diferenciados para proteger datos sensibles">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Rol</th>
                  <th className="px-2 py-2">Nota psiquiatrica</th>
                  <th className="px-2 py-2">Orden medicacion</th>
                  <th className="px-2 py-2">Firma alta</th>
                  <th className="px-2 py-2">Reportes gestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionMatrix.map((row) => (
                  <tr key={row.role}>
                    <td className="px-2 py-2 font-semibold text-slate-800">{row.role}</td>
                    <td className="px-2 py-2 text-slate-600">{row.psychiatricNotes}</td>
                    <td className="px-2 py-2 text-slate-600">{row.medicationOrders}</td>
                    <td className="px-2 py-2 text-slate-600">{row.dischargeSign}</td>
                    <td className="px-2 py-2 text-slate-600">{row.adminReports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Incidentes y respuesta" subtitle="Eventos de seguridad y accion de mitigacion">
          <div className="space-y-2">
            {securityIncidents.map((incident) => (
              <article key={incident.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{incident.event}</p>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      incident.severity === "Alta"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {incident.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{incident.datetime}</p>
                <p className="text-[11px] text-slate-600">{incident.action}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
