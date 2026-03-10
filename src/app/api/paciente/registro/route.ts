import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendAuditEvent } from "@/lib/clinical-store";
import {
  createRegisteredPatient,
  listRegisteredPatientSummaries,
} from "@/lib/patient-intake-store";
import type { PatientIntakePayload } from "@/types/patient-intake";
import { normalizarCedula, validarCedula } from "@/utils/validarCedula";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const summaries = listRegisteredPatientSummaries();

  appendAuditEvent({
    actorName: session.name,
    actorRole: session.role,
    action: "PATIENTS_READ",
    targetType: "patient",
    targetId: "registro-list",
    detail: `Consulta de registros de ingreso (${summaries.length} pacientes).`,
  });

  return NextResponse.json({ data: summaries });
}

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON invalido." },
      { status: 400 }
    );
  }

  const payload = normalizePatientIntakePayload(body, session.name);

  if (!payload.identification.documentNumber) {
    return NextResponse.json(
      { error: "Numero de documento requerido." },
      { status: 400 }
    );
  }

  if (!payload.identification.firstNames || !payload.identification.lastNames) {
    return NextResponse.json(
      { error: "Nombres y apellidos son obligatorios." },
      { status: 400 }
    );
  }

  if (payload.identification.documentType === "cedula") {
    const cedula = normalizarCedula(payload.identification.documentNumber);
    if (!validarCedula(cedula)) {
      return NextResponse.json(
        { error: "Cedula invalida segun algoritmo oficial de Ecuador." },
        { status: 400 }
      );
    }
    payload.identification.documentNumber = cedula;
  }

  const created = createRegisteredPatient(payload, session);

  appendAuditEvent({
    actorName: session.name,
    actorRole: session.role,
    action: "PATIENT_REGISTERED",
    targetType: "patient",
    targetId: created.id,
    detail: `Ingreso de paciente ${created.identification.firstNames} ${created.identification.lastNames} (${created.identification.documentNumber}).`,
  });

  return NextResponse.json(
    {
      data: created,
    },
    { status: 201 }
  );
}

function normalizePatientIntakePayload(
  raw: unknown,
  professionalName: string
): PatientIntakePayload {
  const root = asObject(raw);
  const identification = asObject(root.identification);
  const contact = asObject(root.contact);
  const financing = asObject(root.financing);
  const antecedentes = asObject(root.antecedentes);
  const lifestyle = asObject(antecedentes.lifestyle);
  const allergies = asObject(antecedentes.allergies);
  const consultation = asObject(root.consultation);
  const reviewBySystems = asObject(consultation.reviewBySystems);
  const physicalExam = asObject(consultation.physicalExam);
  const therapeuticPlan = asObject(root.therapeuticPlan);
  const laboratory = asObject(root.laboratory);
  const imaging = asObject(root.imaging);
  const hospitalization = asObject(root.hospitalization);
  const urgency = asObject(root.urgency);
  const nursingReport = asObject(root.nursingReport);
  const appointments = asObject(root.appointments);
  const referrals = asObject(root.referrals);
  const publicHealth = asObject(root.publicHealth);
  const programTracking = asObject(root.programTracking);
  const pharmacyContext = asObject(root.pharmacyContext);
  const indicatorsContext = asObject(root.indicatorsContext);
  const compliance = asObject(root.compliance);

  const payload: PatientIntakePayload = {
    source: asPatientSource(root.source),
    identification: {
      documentType: asDocumentType(identification.documentType),
      documentNumber: asString(identification.documentNumber),
      firstNames: asString(identification.firstNames),
      lastNames: asString(identification.lastNames),
      birthDate: asNullableString(identification.birthDate),
      sexBiological: asString(identification.sexBiological),
      gender: asString(identification.gender),
      nationality: asString(identification.nationality),
      ethnicity: asString(identification.ethnicity),
      civilStatus: asString(identification.civilStatus),
      educationLevel: asString(identification.educationLevel),
      occupation: asString(identification.occupation),
      workplace: asString(identification.workplace),
      religion: asString(identification.religion),
      photoUrl: asString(identification.photoUrl),
    },
    contact: {
      address: asString(contact.address),
      parish: asString(contact.parish),
      canton: asString(contact.canton),
      province: asString(contact.province),
      gpsLat: asString(contact.gpsLat),
      gpsLng: asString(contact.gpsLng),
      phonePrimary: asString(contact.phonePrimary),
      phoneSecondary: asString(contact.phoneSecondary),
      whatsapp: asString(contact.whatsapp),
      email: asString(contact.email),
      emergencyName: asString(contact.emergencyName),
      emergencyRelationship: asString(contact.emergencyRelationship),
      emergencyPhone: asString(contact.emergencyPhone),
      legalRepresentative: asString(contact.legalRepresentative),
    },
    financing: {
      affiliationType: asAffiliationType(financing.affiliationType),
      iessNumber: asString(financing.iessNumber),
      privateInsurer: asString(financing.privateInsurer),
      privatePolicyNumber: asString(financing.privatePolicyNumber),
      employer: asString(financing.employer),
      copayExemption: asString(financing.copayExemption),
      disabilityPercent: asNullableNumber(financing.disabilityPercent),
      conadisNumber: asString(financing.conadisNumber),
    },
    antecedentes: {
      personalPathological: asStringArray(antecedentes.personalPathological),
      previousHospitalizations: asStringArray(antecedentes.previousHospitalizations),
      surgeries: asStringArray(antecedentes.surgeries),
      traumaHistory: asStringArray(antecedentes.traumaHistory),
      transfusions: asStringArray(antecedentes.transfusions),
      infectiousDiseases: asStringArray(antecedentes.infectiousDiseases),
      stdHistory: asStringArray(antecedentes.stdHistory),
      mentalHealthHistory: asStringArray(antecedentes.mentalHealthHistory),
      familyHistory: asStringArray(antecedentes.familyHistory),
      gynecoObstetricHistory: asStringArray(antecedentes.gynecoObstetricHistory),
      neonatalPediatricHistory: asStringArray(antecedentes.neonatalPediatricHistory),
      lifestyle: {
        tobacco: asString(lifestyle.tobacco),
        alcohol: asString(lifestyle.alcohol),
        drugs: asString(lifestyle.drugs),
        physicalActivityMinutesPerWeek: asNullableNumber(
          lifestyle.physicalActivityMinutesPerWeek
        ),
        dietType: asString(lifestyle.dietType),
        sleepHours: asNullableNumber(lifestyle.sleepHours),
        occupationalRiskExposure: asString(lifestyle.occupationalRiskExposure),
      },
      allergies: {
        medications: asStringArray(allergies.medications),
        foods: asStringArray(allergies.foods),
        environmental: asStringArray(allergies.environmental),
        contrastOrLatex: asStringArray(allergies.contrastOrLatex),
        reactionDate: asNullableString(allergies.reactionDate),
        reactionManagement: asString(allergies.reactionManagement),
        visualAlertActive: asBoolean(allergies.visualAlertActive),
      },
    },
    consultation: {
      consultedAt: asString(consultation.consultedAt) || new Date().toISOString(),
      establishment: asString(consultation.establishment),
      service: asString(consultation.service),
      professionalName: asString(consultation.professionalName) || professionalName,
      professionalSenescyt:
        asString(consultation.professionalSenescyt) || "SENESCYT-PENDIENTE",
      consultationType: asConsultationType(consultation.consultationType),
      consultationDurationMinutes: asNullableNumber(
        consultation.consultationDurationMinutes
      ),
      literalReason: asString(consultation.literalReason),
      evolutionTime: asString(consultation.evolutionTime),
      mainSymptom: asString(consultation.mainSymptom),
      currentIllnessNarrative: asString(consultation.currentIllnessNarrative),
      previousEpisodeTreatments: asString(consultation.previousEpisodeTreatments),
      reviewBySystems: {
        general: asString(reviewBySystems.general),
        cardiovascular: asString(reviewBySystems.cardiovascular),
        respiratory: asString(reviewBySystems.respiratory),
        digestive: asString(reviewBySystems.digestive),
        genitourinary: asString(reviewBySystems.genitourinary),
        neurologic: asString(reviewBySystems.neurologic),
        musculoskeletal: asString(reviewBySystems.musculoskeletal),
        dermatologic: asString(reviewBySystems.dermatologic),
        psychiatric: asString(reviewBySystems.psychiatric),
      },
      physicalExam: {
        bloodPressure: asString(physicalExam.bloodPressure),
        heartRate: asString(physicalExam.heartRate),
        respiratoryRate: asString(physicalExam.respiratoryRate),
        temperature: asString(physicalExam.temperature),
        spo2: asString(physicalExam.spo2),
        weightKg: asString(physicalExam.weightKg),
        heightCm: asString(physicalExam.heightCm),
        bmi: asString(physicalExam.bmi),
        abdominalPerimeterCm: asString(physicalExam.abdominalPerimeterCm),
        capillaryGlucose: asString(physicalExam.capillaryGlucose),
        painScale: asNullableNumber(physicalExam.painScale),
        glasgow: asNullableNumber(physicalExam.glasgow),
        generalAppearance: asString(physicalExam.generalAppearance),
        skin: asString(physicalExam.skin),
        headNeck: asString(physicalExam.headNeck),
        ent: asString(physicalExam.ent),
        thoraxLungs: asString(physicalExam.thoraxLungs),
        cardiovascular: asString(physicalExam.cardiovascular),
        abdomen: asString(physicalExam.abdomen),
        extremities: asString(physicalExam.extremities),
        neurologic: asString(physicalExam.neurologic),
        genitourinary: asString(physicalExam.genitourinary),
        rectal: asString(physicalExam.rectal),
        gyneco: asString(physicalExam.gyneco),
      },
    },
    diagnostics: asDiagnostics(root.diagnostics),
    therapeuticPlan: {
      linkedDiagnosisCodes: asStringArray(therapeuticPlan.linkedDiagnosisCodes),
      nonPharmacological: asString(therapeuticPlan.nonPharmacological),
      followUpInstructions: asString(therapeuticPlan.followUpInstructions),
      alarmSignsExplained: asString(therapeuticPlan.alarmSignsExplained),
      referralDestination: asString(therapeuticPlan.referralDestination),
    },
    prescriptions: asPrescriptions(root.prescriptions),
    laboratory: {
      requests: asStringArray(laboratory.requests),
      criticalResults: asStringArray(laboratory.criticalResults),
      criticalResultAcknowledged: asBoolean(laboratory.criticalResultAcknowledged),
    },
    imaging: {
      requests: asStringArray(imaging.requests),
      reports: asStringArray(imaging.reports),
      pacsLinks: asStringArray(imaging.pacsLinks),
    },
    hospitalization: {
      admissionType: asString(hospitalization.admissionType),
      assignedService: asString(hospitalization.assignedService),
      assignedBed: asString(hospitalization.assignedBed),
      admissionDiagnosisCie11: asString(hospitalization.admissionDiagnosisCie11),
      admissionCondition: asString(hospitalization.admissionCondition),
      dailySoapEvolutions: asStringArray(hospitalization.dailySoapEvolutions),
      nursingShiftNotes: asStringArray(hospitalization.nursingShiftNotes),
      fluidBalanceNotes: asStringArray(hospitalization.fluidBalanceNotes),
      medicalOrders: asStringArray(hospitalization.medicalOrders),
      kardexAdministrationNotes: asStringArray(hospitalization.kardexAdministrationNotes),
      dischargeSummary: asString(hospitalization.dischargeSummary),
    },
    urgency: {
      arrivalMode: asString(urgency.arrivalMode),
      accompaniedBy: asString(urgency.accompaniedBy),
      initialCondition: asString(urgency.initialCondition),
      triageModel: asTriageModel(urgency.triageModel),
      triageDiscriminator: asString(urgency.triageDiscriminator),
      triageLevel: asString(urgency.triageLevel),
      triageColor: asString(urgency.triageColor),
      maxWaitMinutes: asNullableNumber(urgency.maxWaitMinutes),
      retriageAutomatic: asBoolean(urgency.retriageAutomatic),
    },
    nursingReport: {
      shiftSummary: asString(nursingReport.shiftSummary),
      fallEvents: asString(nursingReport.fallEvents),
      pressureUlcerRecord: asString(nursingReport.pressureUlcerRecord),
      physicalRestraintRecord: asString(nursingReport.physicalRestraintRecord),
      adverseEvents: asString(nursingReport.adverseEvents),
    },
    appointments: {
      scheduleNotes: asString(appointments.scheduleNotes),
      reminderPreference: asString(appointments.reminderPreference),
      noShowHistory: asString(appointments.noShowHistory),
    },
    referrals: {
      referenceCode: asString(referrals.referenceCode),
      referenceReason: asString(referrals.referenceReason),
      destination: asString(referrals.destination),
      counterReferenceSummary: asString(referrals.counterReferenceSummary),
    },
    publicHealth: {
      notifiableDisease: asBoolean(publicHealth.notifiableDisease),
      siveAlertCode: asString(publicHealth.siveAlertCode),
      outbreakCluster: asString(publicHealth.outbreakCluster),
      surveillanceNotes: asString(publicHealth.surveillanceNotes),
    },
    programTracking: {
      diabetes: asBoolean(programTracking.diabetes),
      hypertension: asBoolean(programTracking.hypertension),
      tuberculosis: asBoolean(programTracking.tuberculosis),
      maternalChild: asBoolean(programTracking.maternalChild),
      olderAdult: asBoolean(programTracking.olderAdult),
      mentalHealth: asBoolean(programTracking.mentalHealth),
      notes: asString(programTracking.notes),
    },
    pharmacyContext: {
      stockControlNotes: asString(pharmacyContext.stockControlNotes),
      psychotropicsDoubleSignature: asBoolean(
        pharmacyContext.psychotropicsDoubleSignature
      ),
    },
    indicatorsContext: {
      operational: asString(indicatorsContext.operational),
      clinical: asString(indicatorsContext.clinical),
      administrative: asString(indicatorsContext.administrative),
    },
    compliance: {
      twoFactorEnabled: asBoolean(compliance.twoFactorEnabled),
      autoLogout15m: asBoolean(compliance.autoLogout15m),
      immutableSignedNotes: asBoolean(compliance.immutableSignedNotes),
      aes256DataEncryption: asBoolean(compliance.aes256DataEncryption),
      informedConsentDigital: asBoolean(compliance.informedConsentDigital),
      sensitiveDataConsent: asBoolean(compliance.sensitiveDataConsent),
      backupEvery4h: asBoolean(compliance.backupEvery4h),
      disasterRecoveryValidated: asBoolean(compliance.disasterRecoveryValidated),
      offlineSyncEnabled: asBoolean(compliance.offlineSyncEnabled),
    },
  };

  return payload;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function asNullableString(value: unknown) {
  const normalized = asString(value);
  return normalized || null;
}

function asNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "1" ||
      normalized === "true" ||
      normalized === "si" ||
      normalized === "yes"
    );
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function asDocumentType(value: unknown): PatientIntakePayload["identification"]["documentType"] {
  if (value === "pasaporte" || value === "carne_refugiado") {
    return value;
  }
  return "cedula";
}

function asPatientSource(value: unknown): PatientIntakePayload["source"] {
  return value === "registro_civil" ? "registro_civil" : "manual";
}

function asAffiliationType(
  value: unknown
): PatientIntakePayload["financing"]["affiliationType"] {
  if (
    value === "IESS" ||
    value === "ISSFA" ||
    value === "ISSPOL" ||
    value === "privado" ||
    value === "otro"
  ) {
    return value;
  }
  return "particular";
}

function asConsultationType(
  value: unknown
): PatientIntakePayload["consultation"]["consultationType"] {
  if (
    value === "subsecuente" ||
    value === "urgencia" ||
    value === "teleconsulta"
  ) {
    return value;
  }
  return "primera_vez";
}

function asTriageModel(
  value: unknown
): PatientIntakePayload["urgency"]["triageModel"] {
  if (value === "Manchester" || value === "otro") {
    return value;
  }
  return "ESI";
}

function asDiagnostics(value: unknown): PatientIntakePayload["diagnostics"] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: PatientIntakePayload["diagnostics"] = [];

  for (const item of value) {
    const entry = asObject(item);
    const type: PatientIntakePayload["diagnostics"][number]["type"] =
      entry.type === "presuntivo" || entry.type === "descartado"
        ? entry.type
        : "definitivo";
    const condition: PatientIntakePayload["diagnostics"][number]["condition"] =
      entry.condition === "secundario" || entry.condition === "complicacion"
        ? entry.condition
        : "principal";

    const diagnosis: PatientIntakePayload["diagnostics"][number] = {
      cie11Code: asString(entry.cie11Code),
      description: asString(entry.description),
      type,
      condition,
      pregnancyRelated: asBoolean(entry.pregnancyRelated),
    };

    if (diagnosis.cie11Code || diagnosis.description) {
      normalized.push(diagnosis);
    }
  }

  return normalized;
}

function asPrescriptions(value: unknown): PatientIntakePayload["prescriptions"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asObject(entry))
    .map((entry) => ({
      dciName: asString(entry.dciName),
      commercialName: asString(entry.commercialName),
      concentration: asString(entry.concentration),
      pharmaceuticalForm: asString(entry.pharmaceuticalForm),
      dose: asString(entry.dose),
      route: asString(entry.route),
      frequency: asString(entry.frequency),
      duration: asString(entry.duration),
      unitsToDispense: asString(entry.unitsToDispense),
      patientInstructions: asString(entry.patientInstructions),
    }))
    .filter((entry) => entry.dciName || entry.dose || entry.frequency);
}
