export type PortalNotificationCategory =
  | "appointment"
  | "medication"
  | "follow_up"
  | "document"
  | "platform";

export type PortalNotificationPriority = "critical" | "high" | "medium" | "low";

export interface PortalNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: PortalNotificationCategory;
  priority: PortalNotificationPriority;
  read: boolean;
  actionLabel?: string;
  href?: string;
  workflowKey: string;
}

export const portalNotifications: PortalNotification[] = [
  {
    id: "notif-appointment-reminder",
    title: "Citas de control por confirmar",
    description: "Tres pacientes requieren confirmacion de asistencia en las proximas 24 horas.",
    timestamp: "Hoy · 08:12",
    category: "appointment",
    priority: "high",
    read: false,
    actionLabel: "Revisar agenda",
    href: "/portal/professional/appointments",
    workflowKey: "appointment-reminder-dispatch",
  },
  {
    id: "notif-document-review",
    title: "Resultados pendientes de interpretacion",
    description: "Se cargo un PDF de laboratorio para Sofia Mendoza y falta validacion clinica.",
    timestamp: "Hoy · 07:45",
    category: "document",
    priority: "medium",
    read: false,
    actionLabel: "Abrir documentos",
    href: "/portal/professional/clinical-documents",
    workflowKey: "document-ocr-processing",
  },
  {
    id: "notif-follow-up",
    title: "Seguimiento metabólico en riesgo",
    description: "El seguimiento de diabetes requiere reajuste por dos controles consecutivos de glucosa alta.",
    timestamp: "Ayer · 18:30",
    category: "follow_up",
    priority: "critical",
    read: false,
    actionLabel: "Ver seguimiento",
    href: "/portal/professional/follow-up",
    workflowKey: "follow-up-escalation",
  },
  {
    id: "notif-medication",
    title: "Administracion omitida registrada",
    description: "Una dosis de antibiotico fue marcada como omitida y debe justificarse.",
    timestamp: "Ayer · 15:05",
    category: "medication",
    priority: "high",
    read: true,
    actionLabel: "Ir a medicacion",
    href: "/portal/professional/medication",
    workflowKey: "medication-safety-check",
  },
  {
    id: "notif-platform",
    title: "Resumen operativo listo",
    description: "El reporte consolidado de jornada puede generarse desde el tablero profesional.",
    timestamp: "Ayer · 12:40",
    category: "platform",
    priority: "low",
    read: true,
    actionLabel: "Abrir dashboard",
    href: "/portal/professional",
    workflowKey: "daily-operations-report",
  },
];

export function getNotificationSummary() {
  const unread = portalNotifications.filter((notification) => !notification.read);
  const critical = portalNotifications.filter((notification) => notification.priority === "critical");

  return {
    total: portalNotifications.length,
    unread: unread.length,
    critical: critical.length,
  };
}
