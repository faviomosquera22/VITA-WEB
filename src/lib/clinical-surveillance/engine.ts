import {
  defaultSurveillanceRuleConfig,
  escalatePriority,
  isRespiratoryDiagnosis,
  sortTriggeredRules,
} from "@/lib/clinical-surveillance/helpers";
import { clinicalSurveillanceRules } from "@/lib/clinical-surveillance/rules";
import type {
  ActivePatient,
  RulesEngineContext,
  SurveillanceRuleConfig,
  TriggeredRule,
} from "@/lib/clinical-surveillance/types";

function applyRespiratoryPriorityEscalation(patient: ActivePatient, rules: TriggeredRule[]) {
  if (!isRespiratoryDiagnosis([patient.currentDiagnosis, ...patient.diagnoses])) {
    return rules;
  }

  return rules.map((rule) => {
    if (!["vitals.low_spo2", "vitals.tachypnea"].includes(rule.ruleId)) {
      return rule;
    }

    return {
      ...rule,
      priority: escalatePriority(rule.priority),
      description: `${rule.description} La prioridad sube por contexto diagnostico respiratorio.`,
      metadata: {
        ...rule.metadata,
        respiratoryPriorityEscalation: true,
      },
    };
  });
}

export function createRulesEngineContext(
  config: Partial<SurveillanceRuleConfig> = {}
): RulesEngineContext {
  const resolvedConfig = {
    ...defaultSurveillanceRuleConfig,
    ...config,
  };

  return {
    evaluatedAt: resolvedConfig.evaluationReferenceTime,
    config: resolvedConfig,
  };
}

export function evaluateClinicalRules(
  patient: ActivePatient,
  config: Partial<SurveillanceRuleConfig> = {}
) {
  const context = createRulesEngineContext(config);
  const baseRules = clinicalSurveillanceRules.flatMap((rule) => rule.evaluate(patient, context));
  const contextualizedRules = applyRespiratoryPriorityEscalation(patient, baseRules);

  return {
    patient,
    context,
    triggeredRules: sortTriggeredRules(contextualizedRules),
  };
}

export function evaluateClinicalRulesForPatients(
  patients: ActivePatient[],
  config: Partial<SurveillanceRuleConfig> = {}
) {
  return patients.map((patient) => evaluateClinicalRules(patient, config));
}
