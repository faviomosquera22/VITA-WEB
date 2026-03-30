import type { BackgroundJobTemplate } from "./types";

export const backgroundJobCatalog: BackgroundJobTemplate[] = [
  {
    id: "document-ocr-processing",
    name: "Procesamiento documental",
    description: "Recibe un archivo, lo indexa y lo deja listo para OCR, validacion y archivado clinico.",
    queue: "clinical-documents",
    trigger: "manual",
    expectedOutput: "Documento clasificado con metadatos y campos extraidos.",
    status: "ready",
  },
  {
    id: "appointment-reminder-dispatch",
    name: "Recordatorios de citas",
    description: "Prepara recordatorios para citas, vacunacion y controles de seguimiento.",
    queue: "patient-engagement",
    trigger: "scheduled",
    expectedOutput: "Mensajes pendientes por canal y estado de confirmacion.",
    status: "ready",
  },
  {
    id: "follow-up-escalation",
    name: "Escalamiento de seguimiento",
    description: "Evalua eventos pendientes y sugiere intervenciones cuando un caso se desvía del plan.",
    queue: "patient-engagement",
    trigger: "event",
    expectedOutput: "Lista priorizada de pacientes con seguimiento critico.",
    status: "ready",
  },
  {
    id: "daily-operations-report",
    name: "Reporte operacional diario",
    description: "Consolida productividad, alertas y brechas de cumplimiento para el cierre de jornada.",
    queue: "reporting",
    trigger: "scheduled",
    expectedOutput: "Resumen ejecutivo y tablero consolidado.",
    status: "planned",
  },
];
