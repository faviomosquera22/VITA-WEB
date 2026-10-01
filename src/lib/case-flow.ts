export type CareArea = "general" | "hospitalizacion";
export type FlowStatus = "pendiente" | "en_atencion" | "finalizado";
export type FlowTriage = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
export type MonitorGroup =
  "emergency" | "new" | "attention" | "hospital" | "completed";
export const monitorGroups: {
  id: MonitorGroup;
  label: string;
  detail: string;
  tone: string;
}[] = [
  {
    id: "emergency",
    label: "Emergencias",
    detail: "Prioridad roja o naranja · casos activos",
    tone: "red",
  },
  {
    id: "new",
    label: "Casos nuevos",
    detail: "Pendientes de atención",
    tone: "amber",
  },
  {
    id: "attention",
    label: "En atención",
    detail: "Atención general en curso",
    tone: "teal",
  },
  {
    id: "hospital",
    label: "Hospitalización",
    detail: "Casos ingresados en hospitalización",
    tone: "blue",
  },
  {
    id: "completed",
    label: "Finalizados",
    detail: "Cierre registrado hoy · hora de Ecuador",
    tone: "slate",
  },
];
export const statusLabels: Record<FlowStatus, string> = {
  pendiente: "Pendiente",
  en_atencion: "En atención",
  finalizado: "Finalizado",
};
export interface FlowCase {
  id: string;
  triage: FlowTriage;
  status: FlowStatus;
  careArea: CareArea;
  date: string;
  updatedAt: string;
}
export function ecuadorDay(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
export function belongsToGroup(
  item: FlowCase,
  group: MonitorGroup,
  now = new Date(),
) {
  if (group === "emergency")
    return (
      item.status !== "finalizado" && ["rojo", "naranja"].includes(item.triage)
    );
  if (group === "new") return item.status === "pendiente";
  if (group === "attention")
    return item.status === "en_atencion" && item.careArea !== "hospitalizacion";
  if (group === "hospital")
    return item.status === "en_atencion" && item.careArea === "hospitalizacion";
  return (
    item.status === "finalizado" &&
    ecuadorDay(item.updatedAt) === ecuadorDay(now)
  );
}
export function caseCode(id: string) {
  return `V-${id.slice(0, 8).toUpperCase()}`;
}
export interface MonitorSnapshot {
  generatedAt: string;
  centerName: string;
  totalActive: number;
  groups: {
    id: MonitorGroup;
    count: number;
    cases: { code: string; triage: FlowTriage; date: string }[];
  }[];
}
export function buildMonitorSnapshot(
  items: FlowCase[],
  centerName: string,
  now = new Date(),
): MonitorSnapshot {
  const priority = { rojo: 0, naranja: 1, amarillo: 2, verde: 3, azul: 4 };
  return {
    generatedAt: now.toISOString(),
    centerName,
    totalActive: items.filter((i) => i.status !== "finalizado").length,
    groups: monitorGroups.map((group) => {
      const matches = items.filter((item) =>
        belongsToGroup(item, group.id, now),
      );
      matches.sort((a, b) =>
        group.id === "emergency"
          ? priority[a.triage] - priority[b.triage] ||
            a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
      );
      return {
        id: group.id,
        count: matches.length,
        cases: matches
          .slice(0, 5)
          .map((i) => ({
            code: caseCode(i.id),
            triage: i.triage,
            date: i.date,
          })),
      };
    }),
  };
}
