import type { RegisteredPatientRecord } from "@/types/patient-intake";

export type MspFormAvailability = "listo" | "parcial" | "sin_datos";

export interface MspFormCatalogItem {
  id: string;
  code: string;
  title: string;
  description: string;
  availability: MspFormAvailability;
  availabilityNote: string;
}

export interface MspFormReportSection {
  title: string;
  description?: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
}

export interface MspFormReport {
  form: MspFormCatalogItem;
  patientName: string;
  medicalRecordNumber: string;
  generatedAt: string;
  notes: string[];
  sections: MspFormReportSection[];
}

export function getAvailableMspForms(
  record: RegisteredPatientRecord
): MspFormCatalogItem[] {
  return [
    buildFormAvailability(
      "005",
      "SNS-MSP / HCU-form.005 / 2008",
      "Evolucion y prescripciones",
      "Registro de evolucion clinica y prescripcion ligada al episodio de atencion.",
      hasText(record.consultation.currentIllnessNarrative) ||
        hasAnyPrescription(record),
      hasAnyPrescription(record)
        ? "Cuenta con evolucion y prescripcion registradas."
        : "Puede emitirse con evolucion, pero faltan prescripciones detalladas."
    ),
    buildFormAvailability(
      "007",
      "SNS-MSP / HCU-form.007 / 2008",
      "Interconsulta - solicitud",
      "Solicitud interna a otra especialidad con cuadro clinico, diagnosticos y plan actual.",
      record.interconsultation.requested,
      record.interconsultation.requested
        ? "La interconsulta fue marcada en el expediente."
        : "No hay solicitud de interconsulta registrada para este paciente."
    ),
    buildFormAvailability(
      "008",
      "SNS-MSP / HCU-form.008 / 2008",
      "Emergencia",
      "Formulario operativo de atencion en emergencia generado desde triaje, urgencia y expediente.",
      hasEmergencyContext(record),
      hasEmergencyContext(record)
        ? "Cuenta con datos de urgencia, triaje o motivo de atencion para generar el reporte."
        : "Faltan datos minimos de urgencia o triaje para emitirlo con valor operativo."
    ),
    buildFormAvailability(
      "010A",
      "SNS-MSP / HCU-form.010A / 2008",
      "Laboratorio clinico - solicitud",
      "Solicitud de laboratorio con prioridad, justificacion y estudios requeridos.",
      record.laboratory.requests.length > 0,
      record.laboratory.requests.length > 0
        ? "Hay ordenes de laboratorio listas para imprimir."
        : "No existen solicitudes de laboratorio cargadas."
    ),
    buildFormAvailability(
      "012A",
      "SNS-MSP / HCU-form.012A / 2008",
      "Imagenologia - solicitud",
      "Solicitud de imagenologia con motivo, resumen clinico y diagnosticos.",
      record.imaging.requests.length > 0,
      record.imaging.requests.length > 0
        ? "Hay estudios de imagen listos para emitir."
        : "No existen solicitudes de imagen registradas."
    ),
    buildFormAvailability(
      "024",
      "DNEAIS-HCU-form.024",
      "Consentimiento informado",
      "Documento de consentimiento, rechazo o no obtencion justificada.",
      record.consent.required || record.consent.obtained,
      record.consent.required || record.consent.obtained
        ? "El consentimiento esta documentado en el expediente."
        : "No hay consentimiento requerido/registrado para este caso."
    ),
    buildFormAvailability(
      "053",
      "SNS-MSP / formulario 053 / 2008",
      "Referencia - contrarreferencia",
      "Traslado entre niveles con resumen clinico y tratamiento realizado.",
      hasReferral(record),
      hasReferral(record)
        ? "Existe informacion de referencia o contrarreferencia para emitir el formulario."
        : "No hay referencia activa en el expediente."
    ),
  ];
}

export function generateMspFormReport(
  formId: string,
  record: RegisteredPatientRecord
): MspFormReport | null {
  const catalog = getAvailableMspForms(record);
  const form = catalog.find((item) => item.id === formId);
  if (!form) {
    return null;
  }

  const patientName = getPatientName(record);
  const generatedAt = new Date().toISOString();

  const sections =
    formId === "005"
      ? buildEvolutionSections(record)
      : formId === "007"
        ? buildInterconsultationSections(record)
        : formId === "008"
          ? buildEmergencySections(record)
          : formId === "010A"
            ? buildLaboratorySections(record)
            : formId === "012A"
              ? buildImagingSections(record)
              : formId === "024"
                ? buildConsentSections(record)
                : formId === "053"
                  ? buildReferralSections(record)
                  : [];

  const notes =
    formId === "008"
      ? [
          "La estructura del formulario 008 se genera desde el expediente clinico, urgencia y triaje disponibles en Vita.",
          "Si la institucion maneja una version anexa propia del formulario de emergencia, debe validarse contra esa version antes de uso operativo definitivo.",
        ]
      : [
          "Reporte generado automaticamente a partir del expediente clinico persistido del paciente.",
        ];

  return {
    form,
    patientName,
    medicalRecordNumber: record.medicalRecordNumber,
    generatedAt,
    notes,
    sections,
  };
}

function buildEvolutionSections(record: RegisteredPatientRecord): MspFormReportSection[] {
  return [
    {
      title: "Identificacion del episodio",
      fields: buildHeaderFields(record),
    },
    {
      title: "Evolucion",
      description: "Campos de evolucion clinica ligados al episodio actual.",
      fields: [
        field("Motivo de consulta", record.consultation.literalReason),
        field("Enfermedad actual", record.consultation.currentIllnessNarrative),
        field("Tiempo de evolucion", record.consultation.evolutionTime),
        field("Sintoma principal", record.consultation.mainSymptom),
        field("Observacion general", record.consultation.physicalExam.generalAppearance),
        field("Diagnosticos", formatDiagnoses(record)),
      ],
    },
    {
      title: "Prescripciones y plan",
      fields: [
        field("Farmacoterapia e indicaciones", formatPrescriptions(record)),
        field("Plan no farmacologico", record.therapeuticPlan.nonPharmacological),
        field("Seguimiento", record.therapeuticPlan.followUpInstructions),
        field("Signos de alarma", record.therapeuticPlan.alarmSignsExplained),
      ],
    },
  ];
}

function buildInterconsultationSections(
  record: RegisteredPatientRecord
): MspFormReportSection[] {
  return [
    {
      title: "Datos base",
      fields: buildHeaderFields(record),
    },
    {
      title: "Caracteristicas de la solicitud y motivo",
      fields: [
        field("Establecimiento solicitante", record.consultation.establishment),
        field("Servicio que solicita", record.consultation.service),
        field("Establecimiento de destino", record.referrals.destination),
        field("Servicio consultado", record.interconsultation.specialty),
        field("Prioridad", record.interconsultation.priority),
        field("Motivo", record.interconsultation.reason),
      ],
    },
    {
      title: "Cuadro clinico actual",
      fields: [
        field("Resumen clinico", record.interconsultation.clinicalSummary),
        field("Resultados de examenes", formatDiagnosticSupport(record)),
        field("Diagnosticos", formatDiagnoses(record)),
        field(
          "Planes terapeuticos y educacionales",
          buildParagraph(
            record.therapeuticPlan.nonPharmacological,
            record.therapeuticPlan.followUpInstructions
          )
        ),
      ],
    },
  ];
}

function buildEmergencySections(record: RegisteredPatientRecord): MspFormReportSection[] {
  return [
    {
      title: "Identificacion del paciente",
      fields: buildHeaderFields(record),
    },
    {
      title: "Ingreso a emergencia",
      description: "Generado desde triaje y contexto de urgencia del expediente.",
      fields: [
        field("Tipo de atencion", record.consultation.consultationType),
        field("Modo de llegada", record.urgency.arrivalMode),
        field("Acompaniante", record.urgency.accompaniedBy),
        field("Condicion inicial", record.urgency.initialCondition),
        field(
          "Triaje",
          buildParagraph(
            record.urgency.triageModel,
            record.urgency.triageDiscriminator,
            record.urgency.triageLevel,
            record.urgency.triageColor
          )
        ),
        field(
          "Tiempo maximo de espera",
          record.urgency.maxWaitMinutes ? `${record.urgency.maxWaitMinutes} min` : ""
        ),
      ],
    },
    {
      title: "Motivo, cuadro actual y examen rapido",
      fields: [
        field("Motivo de consulta", record.consultation.literalReason),
        field("Sintoma principal", record.consultation.mainSymptom),
        field("Enfermedad actual", record.consultation.currentIllnessNarrative),
        field("Tratamientos previos", record.consultation.previousEpisodeTreatments),
        field(
          "Signos vitales",
          buildParagraph(
            `PA ${safe(record.consultation.physicalExam.bloodPressure)}`,
            `FC ${safe(record.consultation.physicalExam.heartRate)}`,
            `FR ${safe(record.consultation.physicalExam.respiratoryRate)}`,
            `Temp ${safe(record.consultation.physicalExam.temperature)}`,
            `SpO2 ${safe(record.consultation.physicalExam.spo2)}`,
            `Glasgow ${safeNumber(record.consultation.physicalExam.glasgow)}`,
            `Dolor ${safeNumber(record.consultation.physicalExam.painScale)}`
          )
        ),
        field("Aspecto general", record.consultation.physicalExam.generalAppearance),
      ],
    },
    {
      title: "Conducta y salida del episodio",
      fields: [
        field("Diagnosticos", formatDiagnoses(record)),
        field("Plan terapeutico", formatPlan(record)),
        field("Referencia / destino", record.referrals.destination),
        field("Contrarreferencia", record.referrals.counterReferenceSummary),
      ],
    },
  ];
}

function buildLaboratorySections(record: RegisteredPatientRecord): MspFormReportSection[] {
  return [
    {
      title: "Datos administrativos",
      fields: buildHeaderFields(record),
    },
    {
      title: "Solicitud de laboratorio clinico",
      description:
        "Basado en el formulario oficial 010A: prioridad, estudios solicitados y justificacion clinica.",
      fields: [
        field("Servicio / cama", buildParagraph(record.consultation.service, record.admission.bedOrDesk)),
        field("Prioridad", record.laboratory.priority),
        field("Fecha de toma", record.consultation.consultedAt),
        field("Solicitudes", record.laboratory.requests.join("\n")),
        field("Justificacion clinica", record.laboratory.clinicalJustification),
        field("Diagnosticos", formatDiagnoses(record)),
      ],
    },
  ];
}

function buildImagingSections(record: RegisteredPatientRecord): MspFormReportSection[] {
  return [
    {
      title: "Datos administrativos",
      fields: buildHeaderFields(record),
    },
    {
      title: "Solicitud de imagenologia",
      description:
        "Basado en el formulario oficial 012A: estudio solicitado, motivo y resumen clinico.",
      fields: [
        field("Prioridad", record.imaging.priority),
        field("Estudio solicitado", record.imaging.requests.join("\n")),
        field("Motivo de la solicitud", record.consultation.literalReason),
        field("Resumen clinico", coalesce(record.imaging.clinicalJustification, record.consultation.currentIllnessNarrative)),
        field("Diagnosticos", formatDiagnoses(record)),
        field("Reportes previos", record.imaging.reports.join("\n")),
      ],
    },
  ];
}

function buildConsentSections(record: RegisteredPatientRecord): MspFormReportSection[] {
  return [
    {
      title: "Datos del paciente y atencion",
      fields: buildHeaderFields(record),
    },
    {
      title: "Consentimiento informado",
      description:
        "Estructura basada en el modelo DNEAIS-HCU-form.024 del MSP.",
      fields: [
        field("Tipo de atencion", record.consultation.consultationType),
        field("Diagnostico", formatDiagnoses(record)),
        field("Procedimiento recomendado", record.consent.scope),
        field("Beneficios del procedimiento", record.consent.explainedBenefits),
        field("Riesgos relacionados", record.consent.explainedRisks),
        field("Alternativas", record.consent.explainedAlternatives),
        field("Responsable que informa", record.consent.obtainedBy),
        field("Fecha y hora", record.consent.obtainedAt),
        field("Testigo", record.consent.witnessName),
        field(
          "Representante y capacidad de decision",
          buildParagraph(
            record.consent.representativeName,
            record.consent.representativeRelationship,
            record.consent.decisionCapacity
          )
        ),
        field("Motivo de rechazo/no obtencion", record.consent.refusalReason),
      ],
    },
  ];
}

function buildReferralSections(record: RegisteredPatientRecord): MspFormReportSection[] {
  return [
    {
      title: "Datos del paciente",
      fields: buildHeaderFields(record),
    },
    {
      title: "Referencia - contrarreferencia",
      description:
        "Generado desde el expediente clinico para traslado entre niveles.",
      fields: [
        field("Tipo de referencia", record.referrals.referralType),
        field("Codigo", record.referrals.referenceCode),
        field("Motivo", record.referrals.referenceReason),
        field("Destino", record.referrals.destination),
        field("Resumen clinico", record.referrals.clinicalSummary),
        field("Hallazgos relevantes", record.referrals.relevantFindings),
        field("Tratamientos realizados", record.referrals.treatmentsPerformed),
        field("Tratamiento recomendado", record.referrals.recommendedTreatment),
        field("Contrarreferencia", record.referrals.counterReferenceSummary),
      ],
    },
  ];
}

function buildHeaderFields(record: RegisteredPatientRecord) {
  return [
    field("Establecimiento", record.consultation.establishment),
    field("Servicio", record.consultation.service),
    field("Historia clinica", record.medicalRecordNumber),
    field("Cedula / documento", record.identification.documentNumber),
    field("Paciente", getPatientName(record)),
    field("Edad", safeNumber(record.identification.age)),
    field("Sexo", record.identification.sexBiological),
    field("Fecha de atencion", record.consultation.consultedAt || record.createdAt),
    field("Profesional", buildParagraph(record.consultation.professionalName, record.consultation.professionalSenescyt)),
  ];
}

function buildFormAvailability(
  id: string,
  code: string,
  title: string,
  description: string,
  ready: boolean,
  readyNote: string
): MspFormCatalogItem {
  return {
    id,
    code,
    title,
    description,
    availability: ready ? "listo" : "sin_datos",
    availabilityNote: ready ? readyNote : readyNote,
  };
}

function getPatientName(record: RegisteredPatientRecord) {
  return `${record.identification.firstNames} ${record.identification.lastNames}`.trim();
}

function formatDiagnoses(record: RegisteredPatientRecord) {
  if (record.diagnostics.length === 0) {
    return "Sin diagnosticos registrados.";
  }

  return record.diagnostics
    .map((item) =>
      buildParagraph(item.cie11Code, item.description, item.type, item.condition)
    )
    .join("\n");
}

function formatPlan(record: RegisteredPatientRecord) {
  return buildParagraph(
    record.therapeuticPlan.nonPharmacological,
    record.therapeuticPlan.followUpInstructions,
    record.therapeuticPlan.alarmSignsExplained,
    record.therapeuticPlan.referralDestination
  );
}

function formatPrescriptions(record: RegisteredPatientRecord) {
  if (record.prescriptions.length === 0) {
    return "Sin prescripciones registradas.";
  }

  return record.prescriptions
    .map((item) =>
      buildParagraph(
        item.dciName,
        item.dose,
        item.route,
        item.frequency,
        item.duration,
        item.patientInstructions
      )
    )
    .join("\n");
}

function formatDiagnosticSupport(record: RegisteredPatientRecord) {
  return buildParagraph(
    record.laboratory.requests.join(", "),
    record.imaging.requests.join(", "),
    record.laboratory.criticalResults.join(", "),
    record.imaging.reports.join(", ")
  );
}

function hasAnyPrescription(record: RegisteredPatientRecord) {
  return record.prescriptions.some((item) =>
    hasText(
      buildParagraph(item.dciName, item.dose, item.route, item.frequency, item.duration)
    )
  );
}

function hasEmergencyContext(record: RegisteredPatientRecord) {
  return (
    record.consultation.consultationType === "urgencia" ||
    hasText(record.urgency.triageColor) ||
    hasText(record.urgency.arrivalMode) ||
    hasText(record.consultation.literalReason)
  );
}

function hasReferral(record: RegisteredPatientRecord) {
  return hasText(
    buildParagraph(
      record.referrals.referenceReason,
      record.referrals.destination,
      record.referrals.clinicalSummary
    )
  );
}

function field(label: string, value: string | null | undefined) {
  return {
    label,
    value: safe(value),
  };
}

function coalesce(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (hasText(value)) {
      return value!.trim();
    }
  }
  return "";
}

function safe(value: string | null | undefined) {
  return hasText(value) ? value!.trim() : "No registrado";
}

function safeNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "No registrado" : String(value);
}

function buildParagraph(...values: Array<string | number | null | undefined>) {
  const items = values
    .map((value) => (typeof value === "number" ? String(value) : value))
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return items.join(" · ");
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}
