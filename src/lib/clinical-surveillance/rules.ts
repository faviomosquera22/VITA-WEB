import {
  buildRuleTriggerId,
  hoursBetween,
  inferMedicationDueAt,
  medicationMatchesAllergy,
  normalizeText,
} from "@/lib/clinical-surveillance/helpers";
import type {
  ActivePatient,
  ClinicalRule,
  ObservationPriority,
  RulesEngineContext,
  TriggeredRule,
} from "@/lib/clinical-surveillance/types";

function createRuleTrigger({
  patient,
  context,
  ruleId,
  ruleName,
  priority,
  title,
  description,
  sourceModules,
  metadata,
}: {
  patient: ActivePatient;
  context: RulesEngineContext;
  ruleId: string;
  ruleName: string;
  priority: ObservationPriority;
  title: string;
  description: string;
  sourceModules: TriggeredRule["sourceModules"];
  metadata: TriggeredRule["metadata"];
}): TriggeredRule {
  return {
    id: buildRuleTriggerId(patient.id, ruleId, context.evaluatedAt),
    ruleId,
    ruleName,
    patientId: patient.id,
    patientName: patient.patientName,
    priority,
    title,
    description,
    sourceModules,
    metadata,
    triggeredAt: context.evaluatedAt,
  };
}

function latestVital(patient: ActivePatient) {
  return patient.vitalSigns[0] ?? null;
}

function latestFluidBalance(patient: ActivePatient) {
  return patient.fluidBalances[0] ?? null;
}

function buildDuplicateMedicationGroups(patient: ActivePatient) {
  const grouped = new Map<string, ActivePatient["medicationOrders"]>();

  for (const order of patient.medicationOrders) {
    const key = `${order.normalizedName}|${order.className}`;
    grouped.set(key, [...(grouped.get(key) ?? []), order]);
  }

  return Array.from(grouped.values()).filter((items) => items.length > 1);
}

function hasRecentReevaluation(
  patient: ActivePatient,
  referenceTime: string,
  maxHours: number
) {
  const hours = hoursBetween(patient.lastReevaluationAt, referenceTime);
  return hours !== null && hours <= maxHours;
}

const lowSpo2Rule: ClinicalRule = {
  id: "vitals.low_spo2",
  name: "SatO2 baja",
  description: "Detecta saturacion de oxigeno menor a 90.",
  sourceModules: ["vital_signs", "diagnosis"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital || vital.spo2 >= 90) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "critical",
        title: "Se detecta SatO2 por debajo del umbral de seguridad",
        description:
          "Hallazgo automatizado de posible compromiso respiratorio. Se recomienda revision clinica inmediata y corroborar el dato en cabecera.",
        sourceModules: this.sourceModules,
        metadata: {
          spo2: vital.spo2,
          threshold: 90,
          recordedAt: vital.recordedAt,
        },
      }),
    ];
  },
};

const tachypneaRule: ClinicalRule = {
  id: "vitals.tachypnea",
  name: "Taquipnea",
  description: "Detecta frecuencia respiratoria mayor a 24 rpm.",
  sourceModules: ["vital_signs", "diagnosis"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital || vital.respiratoryRate <= 24) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "high",
        title: "Se observa frecuencia respiratoria elevada",
        description:
          "Hallazgo automatizado compatible con taquipnea. Se recomienda revision clinica y confirmar tendencia respiratoria.",
        sourceModules: this.sourceModules,
        metadata: {
          respiratoryRate: vital.respiratoryRate,
          threshold: 24,
          recordedAt: vital.recordedAt,
        },
      }),
    ];
  },
};

const feverWithTachycardiaRule: ClinicalRule = {
  id: "vitals.fever_tachycardia",
  name: "Fiebre con taquicardia",
  description: "Detecta FC > 110 junto a temperatura > 38.",
  sourceModules: ["vital_signs"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital || vital.heartRate <= 110 || vital.temperature <= 38) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "high",
        title: "Se detecta fiebre con taquicardia",
        description:
          "Hallazgo automatizado que combina temperatura elevada y frecuencia cardiaca alta. Se recomienda revision clinica y reevaluacion hemodinamica.",
        sourceModules: this.sourceModules,
        metadata: {
          heartRate: vital.heartRate,
          temperature: vital.temperature,
          heartRateThreshold: 110,
          temperatureThreshold: 38,
          recordedAt: vital.recordedAt,
        },
      }),
    ];
  },
};

const hypotensionRule: ClinicalRule = {
  id: "vitals.hypotension",
  name: "Hipotension",
  description: "Detecta PAS menor a 90 mmHg.",
  sourceModules: ["vital_signs"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital || vital.systolicBloodPressure === null || vital.systolicBloodPressure >= 90) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "critical",
        title: "Se detecta presion arterial sistolica baja",
        description:
          "Hallazgo automatizado de hipotension. Se recomienda revision clinica inmediata y corroboracion del registro.",
        sourceModules: this.sourceModules,
        metadata: {
          systolicBloodPressure: vital.systolicBloodPressure,
          threshold: 90,
          recordedAt: vital.recordedAt,
        },
      }),
    ];
  },
};

const highPainWithoutReevaluationRule: ClinicalRule = {
  id: "pain.high_without_reevaluation",
  name: "Dolor alto sin reevaluacion reciente",
  description: "Detecta dolor >= 7 sin reevaluacion reciente.",
  sourceModules: ["pain_scale", "reevaluation", "clinical_notes"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital || vital.painScale < 7) {
      return [];
    }

    if (hasRecentReevaluation(patient, context.evaluatedAt, context.config.painReevaluationHours)) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "high",
        title: "Se observa dolor alto pendiente de reevaluacion reciente",
        description:
          "Hallazgo automatizado de escala de dolor elevada sin reevaluacion dentro de la ventana esperada. Se recomienda revision clinica y seguimiento del control analgesico.",
        sourceModules: this.sourceModules,
        metadata: {
          painScale: vital.painScale,
          threshold: 7,
          lastReevaluationAt: patient.lastReevaluationAt,
          maxHoursWithoutReevaluation: context.config.painReevaluationHours,
          recordedAt: vital.recordedAt,
        },
      }),
    ];
  },
};

const staleVitalsRule: ClinicalRule = {
  id: "follow_up.stale_vitals",
  name: "Signos vitales no actualizados",
  description: "Detecta ausencia de signos vitales recientes.",
  sourceModules: ["vital_signs", "reevaluation"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital) {
      return [
        createRuleTrigger({
          patient,
          context,
          ruleId: this.id,
          ruleName: this.name,
          priority: "medium",
          title: "Pendiente de actualizacion de signos vitales",
          description:
            "Se observa ausencia de signos vitales recientes en el paciente activo. Se recomienda validar si corresponde nuevo control.",
          sourceModules: this.sourceModules,
          metadata: {
            lastRecordedAt: null,
            staleThresholdHours: context.config.staleVitalsHours,
          },
        }),
      ];
    }

    const hours = hoursBetween(vital.recordedAt, context.evaluatedAt);
    if (hours === null || hours <= context.config.staleVitalsHours) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "medium",
        title: "Pendiente de actualizacion de signos vitales",
        description:
          "Hallazgo automatizado de seguimiento: el ultimo control de signos vitales supera la ventana esperada. Se recomienda revision clinica y nuevo registro si aplica.",
        sourceModules: this.sourceModules,
        metadata: {
          lastRecordedAt: vital.recordedAt,
          hoursSinceLastVitals: Number(hours.toFixed(1)),
          staleThresholdHours: context.config.staleVitalsHours,
        },
      }),
    ];
  },
};

const staleFluidBalanceRule: ClinicalRule = {
  id: "follow_up.stale_fluid_balance",
  name: "Balance hidrico no actualizado",
  description: "Detecta ausencia de balance hidrico reciente en pacientes que lo requieren.",
  sourceModules: ["fluid_balance"],
  evaluate(patient, context) {
    if (!patient.requiresFluidBalance) {
      return [];
    }

    const balance = latestFluidBalance(patient);
    if (!balance) {
      return [
        createRuleTrigger({
          patient,
          context,
          ruleId: this.id,
          ruleName: this.name,
          priority: "medium",
          title: "Pendiente de balance hidrico estructurado",
          description:
            "Se observa que el paciente requiere balance hidrico y no existe un registro reciente disponible. Se recomienda revisar y completar el seguimiento.",
          sourceModules: this.sourceModules,
          metadata: {
            lastRecordedAt: null,
            staleThresholdHours: context.config.staleFluidBalanceHours,
          },
        }),
      ];
    }

    const hours = hoursBetween(balance.recordedAt, context.evaluatedAt);
    if (hours === null || hours <= context.config.staleFluidBalanceHours) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "medium",
        title: "Se detecta balance hidrico fuera de la ventana de seguimiento",
        description:
          "Hallazgo automatizado de seguimiento en paciente con control hidrico requerido. Se recomienda validar nuevo balance y reevaluar tendencia.",
        sourceModules: this.sourceModules,
        metadata: {
          lastRecordedAt: balance.recordedAt,
          hoursSinceLastBalance: Number(hours.toFixed(1)),
          staleThresholdHours: context.config.staleFluidBalanceHours,
          netBalanceMl: balance.netBalanceMl,
        },
      }),
    ];
  },
};

const abnormalWithoutReevaluationRule: ClinicalRule = {
  id: "follow_up.abnormal_without_reevaluation",
  name: "Hallazgos alterados sin reevaluacion reciente",
  description: "Detecta alteraciones clinicas sin reevaluacion documentada.",
  sourceModules: ["vital_signs", "reevaluation", "clinical_notes"],
  evaluate(patient, context) {
    const vital = latestVital(patient);
    if (!vital) {
      return [];
    }

    const alteredFindings: string[] = [];
    if (vital.spo2 < 90) {
      alteredFindings.push(`SatO2 ${vital.spo2}%`);
    }
    if (vital.respiratoryRate > 24) {
      alteredFindings.push(`FR ${vital.respiratoryRate}`);
    }
    if (vital.systolicBloodPressure !== null && vital.systolicBloodPressure < 90) {
      alteredFindings.push(`PAS ${vital.systolicBloodPressure}`);
    }
    if (vital.heartRate > 110 && vital.temperature > 38) {
      alteredFindings.push(`FC ${vital.heartRate} con T ${vital.temperature}`);
    }
    if (vital.painScale >= 7) {
      alteredFindings.push(`dolor ${vital.painScale}/10`);
    }

    if (alteredFindings.length === 0) {
      return [];
    }

    if (hasRecentReevaluation(patient, context.evaluatedAt, context.config.abnormalReevaluationHours)) {
      return [];
    }

    return [
      createRuleTrigger({
        patient,
        context,
        ruleId: this.id,
        ruleName: this.name,
        priority: "high",
        title: "Pendiente de reevaluacion frente a hallazgos alterados",
        description:
          "Se detectan datos alterados sin reevaluacion documentada dentro del tiempo esperado. Se recomienda revision clinica y registro de seguimiento.",
        sourceModules: this.sourceModules,
        metadata: {
          alteredFindings,
          lastReevaluationAt: patient.lastReevaluationAt,
          maxHoursWithoutReevaluation: context.config.abnormalReevaluationHours,
          recordedAt: vital.recordedAt,
        },
      }),
    ];
  },
};

const overdueMedicationRule: ClinicalRule = {
  id: "medication.overdue_administration",
  name: "Medicacion prescrita sin administracion esperada",
  description: "Detecta medicacion pendiente fuera de la ventana esperada.",
  sourceModules: ["medication_orders", "medication_administrations"],
  evaluate(patient, context) {
    return patient.medicationOrders.flatMap((order) => {
      if (order.administrationStatus !== "Pendiente") {
        return [];
      }

      const dueAt = inferMedicationDueAt(order);
      if (!dueAt) {
        return [];
      }

      const hoursOverdue = hoursBetween(dueAt, context.evaluatedAt);
      if (hoursOverdue === null || hoursOverdue <= context.config.medicationAdministrationGraceHours) {
        return [];
      }

      const relatedAdministration = patient.medicationAdministrations.find((item) =>
        item.normalizedMedicationName.includes(order.normalizedName) ||
        order.normalizedName.includes(item.normalizedMedicationName)
      );

      return [
        createRuleTrigger({
          patient,
          context,
          ruleId: `${this.id}.${normalizeText(order.name)}`,
          ruleName: this.name,
          priority: "high",
          title: "Se detecta medicacion pendiente fuera del tiempo esperado",
          description:
            "Hallazgo automatizado sobre una orden prescrita sin administracion confirmada en la ventana esperada. Se recomienda revisar kardex, causa de omision y estado clinico.",
          sourceModules: this.sourceModules,
          metadata: {
            medicationOrderId: order.id,
            medicationName: order.name,
            schedule: order.schedule,
            startDate: order.startDate,
            dueAt,
            hoursOverdue: Number(hoursOverdue.toFixed(1)),
            relatedAdministrationAt: relatedAdministration?.administeredAt ?? null,
          },
        }),
      ];
    });
  },
};

const duplicateMedicationRule: ClinicalRule = {
  id: "medication.simple_duplicate",
  name: "Posible duplicidad simple de medicacion",
  description: "Detecta ordenes duplicadas por nombre o clase simple.",
  sourceModules: ["medication_orders"],
  evaluate(patient, context) {
    return buildDuplicateMedicationGroups(patient).map((orders, index) =>
      createRuleTrigger({
        patient,
        context,
        ruleId: `${this.id}.${index + 1}`,
        ruleName: this.name,
        priority: "medium",
        title: "Se observa posible duplicidad simple de medicacion",
        description:
          "Hallazgo automatizado por coincidencia de nombre o clase terapeutica. Se recomienda conciliacion farmacologica antes de asumir duplicidad clinica real.",
        sourceModules: this.sourceModules,
        metadata: {
          medications: orders.map((order) => ({
            id: order.id,
            name: order.name,
            className: order.className,
            dose: order.dose,
            route: order.route,
          })),
        },
      })
    );
  },
};

const medicationAllergyRule: ClinicalRule = {
  id: "medication.allergy_match",
  name: "Medicacion relacionada con alergia documentada",
  description: "Detecta coincidencias simples entre medicacion y alergias.",
  sourceModules: ["medication_orders", "allergies"],
  evaluate(patient, context) {
    return patient.medicationOrders.flatMap((order) => {
      const matchedAllergies = patient.allergies.filter((allergy) =>
        medicationMatchesAllergy(order.name, allergy)
      );

      if (matchedAllergies.length === 0) {
        return [];
      }

      return [
        createRuleTrigger({
          patient,
          context,
          ruleId: `${this.id}.${order.id}`,
          ruleName: this.name,
          priority: "critical",
          title: "Se detecta coincidencia entre medicacion y alergia documentada",
          description:
            "Hallazgo automatizado de seguridad farmacologica. Se recomienda verificacion clinica inmediata y validar pertinencia de la orden.",
          sourceModules: this.sourceModules,
          metadata: {
            medicationOrderId: order.id,
            medicationName: order.name,
            matchedAllergies,
          },
        }),
      ];
    });
  },
};

export const clinicalSurveillanceRules: ClinicalRule[] = [
  lowSpo2Rule,
  tachypneaRule,
  feverWithTachycardiaRule,
  hypotensionRule,
  highPainWithoutReevaluationRule,
  staleVitalsRule,
  staleFluidBalanceRule,
  abnormalWithoutReevaluationRule,
  overdueMedicationRule,
  duplicateMedicationRule,
  medicationAllergyRule,
];
