import "server-only";

import { listAuditEvents } from "@/lib/clinical-store";
import { listRegisteredPatients } from "@/lib/patient-intake-store";

export type MspDomainStatus = "implementado" | "parcial" | "pendiente";

export interface MspDomainSnapshot {
  code: string;
  area: string;
  title: string;
  reference: string;
  status: MspDomainStatus;
  evidence: string;
  riskIfMissing: string;
  nextStep: string;
}

export interface MspGapItem {
  title: string;
  severity: "alta" | "media";
  detail: string;
}

export interface MspOperationalMetric {
  label: string;
  value: string | number;
  hint: string;
}

export interface MspComplianceDashboard {
  summary: {
    totalDomains: number;
    implementedDomains: number;
    partialDomains: number;
    pendingDomains: number;
    averageRecordScore: number;
    totalClinicalRecords: number;
  };
  metrics: MspOperationalMetric[];
  domains: MspDomainSnapshot[];
  criticalGaps: MspGapItem[];
}

export function getMspComplianceDashboard(): MspComplianceDashboard {
  const records = listRegisteredPatients();
  const recentAuditEvents = listAuditEvents(200);

  const averageRecordScore = records.length
    ? Math.round(
        records.reduce((sum, record) => sum + record.mspCompliance.score, 0) /
          records.length
      )
    : 0;

  const consentRequired = records.filter((record) => record.consent.required).length;
  const consentResolved = records.filter(
    (record) =>
      !record.consent.required ||
      record.consent.obtained ||
      Boolean(record.consent.refusalReason.trim())
  ).length;

  const referralsCompleted = records.filter(
    (record) =>
      Boolean(record.referrals.referenceReason.trim()) &&
      Boolean(record.referrals.destination.trim()) &&
      Boolean(record.referrals.clinicalSummary.trim())
  ).length;

  const surveillanceRecords = records.filter(
    (record) => record.publicHealth.notifiableDisease
  ).length;

  const recordsWith100 = records.filter(
    (record) => record.mspCompliance.score === 100
  ).length;

  const recordsWithCriticalPending = records.filter(
    (record) => record.mspCompliance.criticalPendingItems.length > 0
  ).length;

  const domains: MspDomainSnapshot[] = [
    {
      code: "MSP-HCU-ADM",
      area: "Historia clínica",
      title: "Admision e identificacion estructurada",
      reference: "Historia Clinica Unica MSP",
      status: "implementado",
      evidence: `Flujo de ingreso estructurado con ${records.length} registros persistidos y checklist MSP por paciente.`,
      riskIfMissing: "Errores de identificacion, estadistica sanitaria y trazabilidad medico-legal.",
      nextStep: "Migrar la misma estructura a una base transaccional multiusuario.",
    },
    {
      code: "MSP-HCU-ANAM",
      area: "Historia clínica",
      title: "Anamnesis, examen fisico y diagnostico codificado",
      reference: "Historia Clinica Unica MSP / CIE-11",
      status: "implementado",
      evidence: "Ingreso captura motivo de consulta, enfermedad actual, examen fisico por sistemas, plan y CIE-11.",
      riskIfMissing: "Expediente incompleto y mala continuidad asistencial.",
      nextStep: "Conectar HCE completa y evoluciones firmadas al mismo expediente real.",
    },
    {
      code: "MSP-TRIAGE",
      area: "Urgencias",
      title: "Triaje de urgencias con subprotocolos",
      reference: "Lineamientos MSP de urgencias / Manchester adaptado",
      status: "implementado",
      evidence: "Existe motor de triaje con colores, discriminadores y protocolos automaticos.",
      riskIfMissing: "Priorizacion incorrecta de pacientes y aumento de eventos adversos.",
      nextStep: "Conectar completamente la salida de triaje con cama, ordenes y HCE longitudinal.",
    },
    {
      code: "MSP-CONSENT",
      area: "Medico-legal",
      title: "Consentimiento informado",
      reference: "Modelo de Consentimiento Informado MSP",
      status: "implementado",
      evidence: `El sistema registra consentimiento requerido, obtenido, rechazo, representante y testigo; ${consentRequired} casos lo marcaron como requerido.`,
      riskIfMissing: "Riesgo medico-legal y nulidad de procedimientos invasivos o sensibles.",
      nextStep: "Adjuntar documentos firmados y firma electronica/certificado en produccion.",
    },
    {
      code: "MSP-REF053",
      area: "Continuidad",
      title: "Referencia y contrarreferencia",
      reference: "Formulario 053 MSP",
      status: "implementado",
      evidence: `El expediente ya contempla resumen clinico, hallazgos, tratamiento realizado y destino; ${referralsCompleted} referencias completas detectadas.`,
      riskIfMissing: "Perdida de continuidad entre niveles y errores en transferencias.",
      nextStep: "Emitir PDF/imprimible del formulario y enlace con red externa real.",
    },
    {
      code: "MSP-SIVE",
      area: "Salud publica",
      title: "Vigilancia epidemiologica",
      reference: "Eventos de notificacion obligatoria / SIVE",
      status: "parcial",
      evidence: `El expediente captura evento notificable, codigo SIVE y notas; ${surveillanceRecords} casos fueron marcados.`,
      riskIfMissing: "Subregistro epidemiologico y fallas regulatorias en notificacion.",
      nextStep: "Integrar catalogos oficiales y reporte/intercambio real con vigilancia.",
    },
    {
      code: "MSP-AUDIT",
      area: "Seguridad",
      title: "Auditoria y trazabilidad de accesos",
      reference: "Buenas practicas de seguridad y expediente clinico",
      status: "parcial",
      evidence: `La aplicacion registra eventos de auditoria; ${recentAuditEvents.length} eventos consultados en la bitacora.`,
      riskIfMissing: "Accesos indebidos sin rastro y baja capacidad de investigacion.",
      nextStep: "Completar trazabilidad por modulo, firma de eventos y retencion definida.",
    },
    {
      code: "MSP-RBAC",
      area: "Seguridad",
      title: "Control de acceso por rol y autenticacion fuerte",
      reference: "Proteccion de datos y acceso minimo necesario",
      status: "parcial",
      evidence: "Hay roles demo y controles declarativos, pero no un RBAC de produccion ni 2FA operativo end-to-end.",
      riskIfMissing: "Exposicion de datos sensibles y acceso no autorizado.",
      nextStep: "Implementar identidades reales, 2FA, sesiones revocables y permisos por recurso/accion.",
    },
    {
      code: "MSP-HOSP",
      area: "Hospitalizacion y enfermeria",
      title: "Kardex, reportes de turno y hospitalizacion",
      reference: "Registros operativos hospitalarios MSP",
      status: "parcial",
      evidence: "Existen modulos y campos, pero gran parte del portal profesional aun opera con datos mock.",
      riskIfMissing: "Riesgo operativo en administracion de medicamentos y continuidad de turno.",
      nextStep: "Conectar hospitalizacion, kardex y enfermeria al expediente persistido.",
    },
    {
      code: "MSP-LAB-IMG",
      area: "Apoyo diagnostico",
      title: "Laboratorio, imagen, LIS/RIS y PACS",
      reference: "Continuidad diagnostica e imagenologia",
      status: "parcial",
      evidence: "Ingreso ya captura solicitudes y justificacion clinica, pero no existe interoperabilidad real con LIS/RIS/PACS.",
      riskIfMissing: "Duplicacion de estudios, retrasos y ausencia de resultados integrados.",
      nextStep: "Integrar ordenes, estados, resultados criticos y repositorio de imagenes real.",
    },
    {
      code: "MSP-FARMA",
      area: "Farmacia",
      title: "Prescripcion, dispensacion y control de medicamentos",
      reference: "Buenas practicas de prescripcion y farmacia",
      status: "parcial",
      evidence: "Ya se valida prescripcion minima en ingreso, pero no hay circuito completo de dispensacion, stock y doble firma real.",
      riskIfMissing: "Errores de medicacion, stock inconsistente y debil auditoria farmacologica.",
      nextStep: "Cerrar el circuito medico-farmacia-kardex-administracion.",
    },
    {
      code: "MSP-VAC",
      area: "Programas",
      title: "Vacunacion y programas priorizados",
      reference: "Programas preventivos MSP",
      status: "parcial",
      evidence: "Existe modulo de vacunacion, pero aun no esta unificado con el expediente real y el inventario operativo.",
      riskIfMissing: "Esquemas incompletos y reporte inconsistente a programas.",
      nextStep: "Sincronizar stock, aplicacion, carnet y seguimiento por paciente.",
    },
    {
      code: "MSP-DB",
      area: "Arquitectura",
      title: "Base de datos clinica transaccional y multiusuario",
      reference: "Requisito operativo para HIS profesional",
      status: "pendiente",
      evidence: "Actualmente la persistencia principal del expediente usa archivos JSON locales.",
      riskIfMissing: "No hay garantias de concurrencia, alta disponibilidad ni operacion hospitalaria real.",
      nextStep: "Migrar a PostgreSQL/MySQL con control transaccional, indices, backups y jobs.",
    },
    {
      code: "MSP-INT",
      area: "Interoperabilidad",
      title: "Integraciones externas institucionales",
      reference: "Interoperabilidad HIS, vigilancia y red de servicios",
      status: "pendiente",
      evidence: "No hay conexiones productivas con SIVE, laboratorio, PACS, farmacia externa o red de referencia.",
      riskIfMissing: "Sistema aislado, duplicidad manual y fallas de coordinacion institucional.",
      nextStep: "Definir APIs, mensajeria e interoperabilidad por dominio prioritario.",
    },
  ];

  const summary = {
    totalDomains: domains.length,
    implementedDomains: domains.filter((item) => item.status === "implementado").length,
    partialDomains: domains.filter((item) => item.status === "parcial").length,
    pendingDomains: domains.filter((item) => item.status === "pendiente").length,
    averageRecordScore,
    totalClinicalRecords: records.length,
  };

  const metrics: MspOperationalMetric[] = [
    {
      label: "Registros clinicos",
      value: records.length,
      hint: "Pacientes persistidos en ingreso estructurado",
    },
    {
      label: "Promedio MSP por expediente",
      value: `${averageRecordScore}%`,
      hint: "Puntaje promedio del checklist MSP",
    },
    {
      label: "Expedientes al 100%",
      value: recordsWith100,
      hint: "Sin pendientes criticos de checklist",
    },
    {
      label: "Expedientes con pendientes",
      value: recordsWithCriticalPending,
      hint: "Requieren correccion antes de auditoria",
    },
    {
      label: "Consentimientos resueltos",
      value: `${consentResolved}/${Math.max(records.length, 1)}`,
      hint: "Incluye consentimiento obtenido o rechazo justificado",
    },
    {
      label: "Referencias completas",
      value: referralsCompleted,
      hint: "Con resumen clinico y destino documentado",
    },
    {
      label: "Eventos notificables",
      value: surveillanceRecords,
      hint: "Casos marcados para vigilancia epidemiologica",
    },
    {
      label: "Eventos auditados",
      value: recentAuditEvents.length,
      hint: "Bitacora clinica y de acceso disponible",
    },
  ];

  const criticalGaps: MspGapItem[] = [
    {
      title: "Persistencia hospitalaria real",
      severity: "alta",
      detail:
        "Mientras el expediente siga en archivos JSON locales, no es razonable declarar el sistema apto para operacion institucional multiusuario.",
    },
    {
      title: "Modulos aun desacoplados del expediente",
      severity: "alta",
      detail:
        "Hospitalizacion, medicacion, vacunacion, LIS/RIS, HCE y reportes todavia no consumen todos el mismo modelo persistido.",
    },
    {
      title: "Seguridad de produccion incompleta",
      severity: "alta",
      detail:
        "Faltan identidad real, 2FA operativo, RBAC granular, politicas de sesion y evidencia robusta de firma/inalterabilidad.",
    },
    {
      title: "Interoperabilidad externa",
      severity: "media",
      detail:
        "Sin conexiones reales con vigilancia, laboratorio, imagen, farmacia o red de referencia, el sistema sigue dependiendo de digitacion manual.",
    },
    {
      title: "Validacion regulatoria documental",
      severity: "media",
      detail:
        "Hace falta contrastar modulo por modulo contra el inventario completo de formularios/protocolos MSP y sus versiones vigentes.",
    },
  ];

  return {
    summary,
    metrics,
    domains,
    criticalGaps,
  };
}
