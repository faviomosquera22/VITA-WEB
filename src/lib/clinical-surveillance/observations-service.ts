import "server-only";

import { listActiveHospitalizedPatients } from "@/lib/clinical-surveillance/data-access";
import { evaluateClinicalRulesForPatients } from "@/lib/clinical-surveillance/engine";
import {
  applyOptionalNarrativeAdapter,
  type ClinicalObservationNarrativeAdapter,
} from "@/lib/clinical-surveillance/ai-adapter";
import {
  buildCountsByPriority,
  buildObservationDedupeKey,
  highestPriority,
  sortByPriority,
  uniqueSources,
} from "@/lib/clinical-surveillance/helpers";
import type {
  ActivePatient,
  ClinicalObservation,
  ClinicalSurveillancePayload,
  SurveillanceRuleConfig,
  TriggeredRule,
} from "@/lib/clinical-surveillance/types";

function buildObservationFromRule(patient: ActivePatient, rule: TriggeredRule): ClinicalObservation {
  const dedupeKey = buildObservationDedupeKey(patient.id, [rule.ruleId]);

  return {
    id: `obs-${dedupeKey}`,
    dedupeKey,
    patientId: patient.id,
    patientName: patient.patientName,
    priority: rule.priority,
    title: rule.title,
    description: rule.description,
    triggeredRules: [rule],
    sourceModules: uniqueSources(rule.sourceModules),
    createdAt: rule.triggeredAt,
    updatedAt: rule.triggeredAt,
    status: "new",
    metadata: {
      ...rule.metadata,
      diagnosis: patient.currentDiagnosis,
      assignedProfessional: patient.assignedProfessional,
    },
    reviewedAt: null,
    reviewedBy: null,
    narrativeSource: "rules",
  };
}

function buildGroupedObservation(patient: ActivePatient, rules: TriggeredRule[]) {
  if (rules.length < 2) {
    return null;
  }

  const ruleIds = rules.map((rule) => rule.ruleId);
  const dedupeKey = buildObservationDedupeKey(patient.id, ["grouped", ...ruleIds]);
  const sourceModules = uniqueSources(
    rules.flatMap((rule) => rule.sourceModules).concat("grouping")
  );
  const highest = highestPriority(rules.map((rule) => rule.priority));

  return {
    id: `obs-${dedupeKey}`,
    dedupeKey,
    patientId: patient.id,
    patientName: patient.patientName,
    priority: highest,
    title: "Se detectan multiples hallazgos automatizados simultaneos",
    description: `Hallazgo automatizado resumido con ${rules.length} criterios activos. Se recomienda revision clinica prioritaria y confirmar si corresponde nueva reevaluacion o ajuste del seguimiento.`,
    triggeredRules: rules,
    sourceModules,
    createdAt: rules[0]?.triggeredAt ?? new Date().toISOString(),
    updatedAt: rules[0]?.triggeredAt ?? new Date().toISOString(),
    status: "new" as const,
    metadata: {
      diagnosis: patient.currentDiagnosis,
      groupedRuleIds: ruleIds,
      groupedTitles: rules.map((rule) => rule.title),
      groupedPriorities: rules.map((rule) => rule.priority),
    },
    reviewedAt: null,
    reviewedBy: null,
    narrativeSource: "rules" as const,
  };
}

async function applyNarrativeLayer(input: {
  patient: ActivePatient;
  observations: ClinicalObservation[];
  adapter?: ClinicalObservationNarrativeAdapter;
}) {
  const enhanced = await Promise.all(
    input.observations.map((observation) =>
      applyOptionalNarrativeAdapter({
        patient: input.patient,
        observation,
        adapter: input.adapter,
      })
    )
  );

  return sortByPriority(enhanced);
}

export async function buildClinicalSurveillancePayload(input?: {
  patientId?: string;
  config?: Partial<SurveillanceRuleConfig>;
  adapter?: ClinicalObservationNarrativeAdapter;
}) {
  const patients = listActiveHospitalizedPatients();
  const evaluations = evaluateClinicalRulesForPatients(patients, input?.config);
  const scopedEvaluations = input?.patientId
    ? evaluations.filter((entry) => entry.patient.id === input.patientId)
    : evaluations;

  const observations = (
    await Promise.all(
      scopedEvaluations.map(async ({ patient, triggeredRules, context }) => {
        const baseObservations = triggeredRules.map((rule) => buildObservationFromRule(patient, rule));
        const groupedObservation =
          triggeredRules.length >= context.config.groupedObservationMinimum
            ? buildGroupedObservation(patient, triggeredRules)
            : null;

        return applyNarrativeLayer({
          patient,
          observations: groupedObservation
            ? [...baseObservations, groupedObservation]
            : baseObservations,
          adapter: input?.adapter,
        });
      })
    )
  ).flat();

  const sortedObservations = sortByPriority(observations);

  return {
    generatedAt:
      scopedEvaluations[0]?.context.evaluatedAt ??
      input?.config?.evaluationReferenceTime ??
      new Date().toISOString(),
    total: sortedObservations.length,
    countsByPriority: buildCountsByPriority(sortedObservations),
    observations: sortedObservations,
    dataSource: "mock_current_project",
  } satisfies ClinicalSurveillancePayload;
}
