import type {
  ActivePatient,
  ClinicalObservation,
  ObservationSource,
} from "@/lib/clinical-surveillance/types";

export interface ClinicalObservationNarrativeAdapter {
  enhanceObservation(input: {
    patient: ActivePatient;
    observation: ClinicalObservation;
  }): Promise<Pick<ClinicalObservation, "title" | "description"> | null>;
}

export async function applyOptionalNarrativeAdapter(input: {
  patient: ActivePatient;
  observation: ClinicalObservation;
  adapter?: ClinicalObservationNarrativeAdapter;
}) {
  const { adapter, observation, patient } = input;

  if (!adapter) {
    return observation;
  }

  const refinedCopy = await adapter.enhanceObservation({
    patient,
    observation,
  });

  if (!refinedCopy) {
    return observation;
  }

  return {
    ...observation,
    ...refinedCopy,
    narrativeSource: "ai_adapter" as const,
    sourceModules: Array.from(
      new Set<ObservationSource>([...observation.sourceModules, "ai_adapter"])
    ),
  };
}
