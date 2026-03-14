import type {
  PatientAdmissionContext,
  PatientConsentRecord,
  PatientImaging,
  PatientInterconsultation,
  PatientIntakePayload,
  PatientLaboratory,
  PatientMspChecklistItem,
  PatientMspChecklistStatus,
  PatientPublicHealth,
  PatientReferrals,
  RegisteredPatientRecord,
} from "@/types/patient-intake";

export interface PatientIntakeValidationResult {
  errors: string[];
  warnings: string[];
}

export function computeBodyMassIndex(weightKg: string, heightCm: string) {
  const weight = Number.parseFloat(weightKg);
  const height = Number.parseFloat(heightCm);

  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    return "";
  }

  const bmi = weight / Math.pow(height / 100, 2);
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return "";
  }

  return bmi.toFixed(1);
}

export function validatePatientIntakePayload(
  payload: PatientIntakePayload
): PatientIntakeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasText(payload.identification.documentNumber)) {
    errors.push("Numero de documento requerido.");
  }

  if (!hasText(payload.identification.firstNames) || !hasText(payload.identification.lastNames)) {
    errors.push("Nombres y apellidos son obligatorios.");
  }

  if (!hasText(payload.consultation.literalReason)) {
    errors.push("Motivo de consulta obligatorio.");
  }

  if (
    !hasText(payload.consultation.mainSymptom) &&
    !hasText(payload.consultation.currentIllnessNarrative)
  ) {
    errors.push("Registre sintoma principal o enfermedad actual.");
  }

  if (payload.consent.required) {
    if (payload.consent.obtained) {
      const missing = [
        !hasText(payload.consent.type) ? "tipo" : null,
        !hasText(payload.consent.scope) ? "alcance/procedimiento" : null,
        !hasText(payload.consent.obtainedBy) ? "responsable" : null,
        !payload.consent.obtainedAt ? "fecha y hora" : null,
      ].filter(Boolean);

      if (missing.length > 0) {
        errors.push(`Consentimiento informado incompleto: ${missing.join(", ")}.`);
      }
    } else if (!hasText(payload.consent.refusalReason)) {
      errors.push(
        "Si el consentimiento era requerido y no fue obtenido, registre motivo de no obtencion o rechazo."
      );
    }
  }

  if (payload.interconsultation.requested) {
    const missing = [
      !hasText(payload.interconsultation.specialty) ? "especialidad" : null,
      !hasText(payload.interconsultation.reason) ? "motivo" : null,
      !hasText(payload.interconsultation.clinicalSummary)
        ? "resumen clinico"
        : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      errors.push(`Interconsulta incompleta: ${missing.join(", ")}.`);
    }
  }

  if (isReferralStarted(payload.referrals)) {
    const missing = [
      !hasText(payload.referrals.referenceReason) ? "motivo de referencia" : null,
      !hasText(payload.referrals.destination) ? "destino" : null,
      !hasText(payload.referrals.clinicalSummary) ? "resumen clinico" : null,
      !hasText(payload.referrals.relevantFindings) ? "hallazgos relevantes" : null,
      !hasText(payload.referrals.treatmentsPerformed)
        ? "manejo realizado"
        : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      errors.push(`Referencia/contrarreferencia incompleta: ${missing.join(", ")}.`);
    }
  }

  if (
    payload.publicHealth.notifiableDisease &&
    !hasText(payload.publicHealth.suspectedCondition) &&
    !hasText(payload.publicHealth.siveAlertCode)
  ) {
    errors.push(
      "Para evento de vigilancia, registre condicion sospechosa o codigo SIVE."
    );
  }

  payload.prescriptions.forEach((entry, index) => {
    if (!hasAnyText([entry.dciName, entry.dose, entry.route, entry.frequency, entry.duration])) {
      return;
    }

    const missing = [
      !hasText(entry.dciName) ? "DCI" : null,
      !hasText(entry.dose) ? "dosis" : null,
      !hasText(entry.route) ? "via" : null,
      !hasText(entry.frequency) ? "frecuencia" : null,
      !hasText(entry.duration) ? "duracion" : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      errors.push(`Prescripcion ${index + 1} incompleta: ${missing.join(", ")}.`);
    }
  });

  if (!hasText(payload.identification.birthDate)) {
    warnings.push("Se recomienda registrar fecha de nacimiento para historia clinica unica.");
  }

  if (!hasText(payload.contact.phonePrimary)) {
    warnings.push("Se recomienda registrar telefono principal para seguimiento.");
  }

  if (!hasText(payload.consultation.professionalSenescyt)) {
    warnings.push("Se recomienda registrar codigo profesional/SENESCYT.");
  }

  return { errors, warnings };
}

export function normalizeRegisteredPatientRecord(
  record: RegisteredPatientRecord
): RegisteredPatientRecord {
  const normalizedLaboratory = normalizeLaboratory(record.laboratory);
  const normalizedImaging = normalizeImaging(record.imaging);
  const normalizedReferrals = normalizeReferrals(record.referrals);
  const normalizedPublicHealth = normalizePublicHealth(record.publicHealth);
  const normalizedAdmission = normalizeAdmission(record.admission, record);
  const normalizedConsent = normalizeConsent(record.consent);
  const normalizedInterconsultation = normalizeInterconsultation(record.interconsultation);
  const normalizedCompliance = normalizeSecurityCompliance(record);
  const bmi =
    record.consultation?.physicalExam?.bmi ||
    computeBodyMassIndex(
      record.consultation?.physicalExam?.weightKg ?? "",
      record.consultation?.physicalExam?.heightCm ?? ""
    );

  const normalized: RegisteredPatientRecord = {
    ...record,
    identification: {
      ...record.identification,
      bloodGroup: record.identification?.bloodGroup ?? "",
      photoUrl: record.identification?.photoUrl ?? "",
    },
    consultation: {
      ...record.consultation,
      physicalExam: {
        ...record.consultation.physicalExam,
        bmi,
      },
    },
    laboratory: normalizedLaboratory,
    imaging: normalizedImaging,
    admission: normalizedAdmission,
    consent: normalizedConsent,
    interconsultation: normalizedInterconsultation,
    referrals: normalizedReferrals,
    publicHealth: normalizedPublicHealth,
    compliance: normalizedCompliance,
    mspCompliance: {
      score: 0,
      criticalPendingItems: [],
      forms: [],
      generatedAt: new Date().toISOString(),
    },
  };

  return {
    ...normalized,
    mspCompliance: buildMspComplianceSnapshot(normalized),
  };
}

export function buildMspComplianceSnapshot(record: RegisteredPatientRecord) {
  const forms: PatientMspChecklistItem[] = [
    buildChecklistItem({
      code: "HCU-form.001",
      title: "Admision e identificacion",
      reference: "Historia clinica unica MSP",
      pendingItems: [
        !hasText(record.identification.documentNumber) ? "Documento de identidad" : null,
        !hasText(record.identification.firstNames) || !hasText(record.identification.lastNames)
          ? "Nombres y apellidos"
          : null,
        !hasText(record.identification.birthDate) ? "Fecha de nacimiento" : null,
        !hasText(record.identification.sexBiological) ? "Sexo biologico" : null,
        !hasText(record.contact.address) ? "Direccion" : null,
        !hasText(record.contact.phonePrimary) ? "Telefono principal" : null,
      ],
    }),
    buildChecklistItem({
      code: "HCU-form.003",
      title: "Anamnesis y examen fisico",
      reference: "Historia clinica unica MSP",
      pendingItems: [
        !hasText(record.consultation.literalReason) ? "Motivo de consulta" : null,
        !hasText(record.consultation.currentIllnessNarrative)
          ? "Enfermedad actual"
          : null,
        !hasText(record.consultation.evolutionTime) ? "Tiempo de evolucion" : null,
        !hasText(record.consultation.physicalExam.bloodPressure)
          ? "Presion arterial"
          : null,
        !hasText(record.consultation.physicalExam.heartRate)
          ? "Frecuencia cardiaca"
          : null,
        !hasText(record.consultation.physicalExam.respiratoryRate)
          ? "Frecuencia respiratoria"
          : null,
        !hasText(record.consultation.physicalExam.temperature)
          ? "Temperatura"
          : null,
        !hasText(record.consultation.physicalExam.spo2) ? "SpO2" : null,
        !hasText(record.consultation.physicalExam.generalAppearance)
          ? "Aspecto general"
          : null,
      ],
    }),
    buildChecklistItem({
      code: "EVOL-PLAN",
      title: "Diagnostico, plan y seguimiento",
      reference: "Registro clinico y continuidad asistencial",
      pendingItems: [
        !record.diagnostics.some((item) => hasText(item.cie11Code) || hasText(item.description))
          ? "Diagnostico registrado"
          : null,
        !hasText(record.therapeuticPlan.nonPharmacological) &&
        !record.prescriptions.some((item) => hasText(item.dciName))
          ? "Plan terapeutico"
          : null,
        !hasText(record.therapeuticPlan.followUpInstructions)
          ? "Seguimiento / control"
          : null,
        !hasText(record.therapeuticPlan.alarmSignsExplained)
          ? "Signos de alarma explicados"
          : null,
        !hasText(record.consultation.professionalName) ? "Profesional responsable" : null,
        !hasText(record.consultation.professionalSenescyt)
          ? "Codigo profesional"
          : null,
      ],
    }),
    buildConditionalChecklistItem(
      "HCU-form.024",
      "Consentimiento informado",
      "Consentimiento informado MSP",
      record.consent.required,
      [
        record.consent.obtained === false && !hasText(record.consent.refusalReason)
          ? "Motivo de rechazo/no obtencion"
          : null,
        record.consent.obtained && !hasText(record.consent.type)
          ? "Tipo de consentimiento"
          : null,
        record.consent.obtained && !hasText(record.consent.scope)
          ? "Procedimiento / alcance"
          : null,
        record.consent.obtained && !hasText(record.consent.obtainedBy)
          ? "Responsable que informa"
          : null,
        record.consent.obtained && !record.consent.obtainedAt
          ? "Fecha y hora de consentimiento"
          : null,
      ]
    ),
    buildConditionalChecklistItem(
      "FORM-053",
      "Referencia y contrarreferencia",
      "Formulario 053 MSP",
      isReferralStarted(record.referrals),
      [
        !hasText(record.referrals.referenceReason) ? "Motivo de referencia" : null,
        !hasText(record.referrals.destination) ? "Destino" : null,
        !hasText(record.referrals.clinicalSummary) ? "Resumen clinico" : null,
        !hasText(record.referrals.relevantFindings) ? "Hallazgos relevantes" : null,
        !hasText(record.referrals.treatmentsPerformed) ? "Tratamiento y estabilizacion" : null,
      ]
    ),
    buildConditionalChecklistItem(
      "INTERCONSULTA",
      "Interconsulta especializada",
      "Continuidad asistencial interna",
      record.interconsultation.requested,
      [
        !hasText(record.interconsultation.specialty) ? "Especialidad" : null,
        !hasText(record.interconsultation.reason) ? "Motivo" : null,
        !hasText(record.interconsultation.clinicalSummary)
          ? "Resumen clinico"
          : null,
      ]
    ),
    buildConditionalChecklistItem(
      "SALUD-PUBLICA",
      "Vigilancia epidemiologica",
      "Eventos de notificacion obligatoria",
      record.publicHealth.notifiableDisease,
      [
        !hasText(record.publicHealth.suspectedCondition) &&
        !hasText(record.publicHealth.siveAlertCode)
          ? "Evento o codigo SIVE"
          : null,
        !hasText(record.publicHealth.surveillanceNotes)
          ? "Observaciones de vigilancia"
          : null,
        !record.publicHealth.reportedAt ? "Fecha de reporte" : null,
      ]
    ),
  ];

  const applicableForms = forms.filter(
    (item) => item.required || item.status !== "no_aplica"
  );
  const completed = applicableForms.filter((item) => item.status === "completo").length;
  const score =
    applicableForms.length === 0
      ? 100
      : Math.round((completed / applicableForms.length) * 100);
  const criticalPendingItems = forms
    .filter((item) => item.status === "incompleto")
    .flatMap((item) =>
      item.pendingItems.map((pending) => `${item.code}: ${pending}`)
    )
    .slice(0, 8);

  return {
    score,
    criticalPendingItems,
    forms,
    generatedAt: new Date().toISOString(),
  };
}

function normalizeLaboratory(laboratory: RegisteredPatientRecord["laboratory"]): PatientLaboratory {
  return {
    requests: Array.isArray(laboratory?.requests) ? laboratory.requests : [],
    criticalResults: Array.isArray(laboratory?.criticalResults)
      ? laboratory.criticalResults
      : [],
    criticalResultAcknowledged: Boolean(laboratory?.criticalResultAcknowledged),
    priority: laboratory?.priority ?? "",
    clinicalJustification: laboratory?.clinicalJustification ?? "",
  };
}

function normalizeImaging(imaging: RegisteredPatientRecord["imaging"]): PatientImaging {
  return {
    requests: Array.isArray(imaging?.requests) ? imaging.requests : [],
    reports: Array.isArray(imaging?.reports) ? imaging.reports : [],
    pacsLinks: Array.isArray(imaging?.pacsLinks) ? imaging.pacsLinks : [],
    priority: imaging?.priority ?? "",
    clinicalJustification: imaging?.clinicalJustification ?? "",
  };
}

function normalizeAdmission(
  admission: RegisteredPatientRecord["admission"],
  record: RegisteredPatientRecord
): PatientAdmissionContext {
  return {
    admissionArea: admission?.admissionArea ?? "",
    sourceEstablishment:
      admission?.sourceEstablishment ?? record.consultation.establishment ?? "",
    sourceService: admission?.sourceService ?? record.consultation.service ?? "",
    bedOrDesk: admission?.bedOrDesk ?? "",
  };
}

function normalizeConsent(consent: RegisteredPatientRecord["consent"]): PatientConsentRecord {
  return {
    required: Boolean(consent?.required),
    obtained: Boolean(consent?.obtained),
    type: consent?.type ?? "",
    scope: consent?.scope ?? "",
    explainedRisks: consent?.explainedRisks ?? "",
    explainedBenefits: consent?.explainedBenefits ?? "",
    explainedAlternatives: consent?.explainedAlternatives ?? "",
    obtainedBy: consent?.obtainedBy ?? "",
    obtainedAt: consent?.obtainedAt ?? null,
    witnessName: consent?.witnessName ?? "",
    representativeName: consent?.representativeName ?? "",
    representativeRelationship: consent?.representativeRelationship ?? "",
    decisionCapacity: consent?.decisionCapacity ?? "",
    refusalReason: consent?.refusalReason ?? "",
  };
}

function normalizeInterconsultation(
  interconsultation: RegisteredPatientRecord["interconsultation"]
): PatientInterconsultation {
  return {
    requested: Boolean(interconsultation?.requested),
    specialty: interconsultation?.specialty ?? "",
    priority: interconsultation?.priority ?? "",
    reason: interconsultation?.reason ?? "",
    clinicalSummary: interconsultation?.clinicalSummary ?? "",
    requestedAt: interconsultation?.requestedAt ?? null,
    responseSummary: interconsultation?.responseSummary ?? "",
  };
}

function normalizeReferrals(referrals: RegisteredPatientRecord["referrals"]): PatientReferrals {
  return {
    referralType: referrals?.referralType ?? "",
    referenceCode: referrals?.referenceCode ?? "",
    referenceReason: referrals?.referenceReason ?? "",
    destination: referrals?.destination ?? "",
    clinicalSummary: referrals?.clinicalSummary ?? "",
    relevantFindings: referrals?.relevantFindings ?? "",
    treatmentsPerformed: referrals?.treatmentsPerformed ?? "",
    recommendedTreatment: referrals?.recommendedTreatment ?? "",
    counterReferenceSummary: referrals?.counterReferenceSummary ?? "",
  };
}

function normalizePublicHealth(
  publicHealth: RegisteredPatientRecord["publicHealth"]
): PatientPublicHealth {
  return {
    notifiableDisease: Boolean(publicHealth?.notifiableDisease),
    suspectedCondition: publicHealth?.suspectedCondition ?? "",
    siveAlertCode: publicHealth?.siveAlertCode ?? "",
    outbreakCluster: publicHealth?.outbreakCluster ?? "",
    surveillanceNotes: publicHealth?.surveillanceNotes ?? "",
    reportedAt: publicHealth?.reportedAt ?? null,
  };
}

function normalizeSecurityCompliance(record: RegisteredPatientRecord) {
  return {
    twoFactorEnabled: Boolean(record.compliance?.twoFactorEnabled),
    autoLogout15m: Boolean(record.compliance?.autoLogout15m),
    immutableSignedNotes: Boolean(record.compliance?.immutableSignedNotes),
    aes256DataEncryption: Boolean(record.compliance?.aes256DataEncryption),
    informedConsentDigital: Boolean(record.compliance?.informedConsentDigital),
    sensitiveDataConsent: Boolean(record.compliance?.sensitiveDataConsent),
    backupEvery4h: Boolean(record.compliance?.backupEvery4h),
    disasterRecoveryValidated: Boolean(record.compliance?.disasterRecoveryValidated),
    offlineSyncEnabled: Boolean(record.compliance?.offlineSyncEnabled),
  };
}

function buildChecklistItem(input: {
  code: string;
  title: string;
  reference: string;
  pendingItems: Array<string | null>;
}): PatientMspChecklistItem {
  const pendingItems = input.pendingItems.filter(Boolean) as string[];
  return {
    code: input.code,
    title: input.title,
    reference: input.reference,
    required: true,
    status: toChecklistStatus(pendingItems.length),
    pendingItems,
  };
}

function buildConditionalChecklistItem(
  code: string,
  title: string,
  reference: string,
  required: boolean,
  pendingItems: Array<string | null>
): PatientMspChecklistItem {
  const cleanPendingItems = pendingItems.filter(Boolean) as string[];
  return {
    code,
    title,
    reference,
    required,
    status: required ? toChecklistStatus(cleanPendingItems.length) : "no_aplica",
    pendingItems: cleanPendingItems,
  };
}

function toChecklistStatus(
  pendingCount: number
): PatientMspChecklistStatus {
  return pendingCount === 0 ? "completo" : "incompleto";
}

function isReferralStarted(referrals: PatientReferrals) {
  return hasAnyText([
    referrals.referralType,
    referrals.referenceCode,
    referrals.referenceReason,
    referrals.destination,
    referrals.clinicalSummary,
    referrals.relevantFindings,
    referrals.treatmentsPerformed,
    referrals.recommendedTreatment,
    referrals.counterReferenceSummary,
  ]);
}

function hasAnyText(values: Array<string | null | undefined>) {
  return values.some((value) => hasText(value));
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}
