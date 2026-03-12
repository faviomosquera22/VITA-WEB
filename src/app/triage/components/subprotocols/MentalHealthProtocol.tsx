"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

import ChipSelector from "../shared/ChipSelector";

export default function MentalHealthProtocol() {
  const { register, watch, setValue } = useFormContext<TriageFormData>();

  return (
    <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <h3 className="text-base font-semibold text-violet-900">Subprotocolo Salud Mental</h3>

      <ChipSelector
        multiple
        options={[
          { label: "Agitacion", value: "agitation" },
          { label: "Ideacion suicida", value: "suicidal_ideation" },
          { label: "Intento suicida", value: "suicide_attempt" },
          { label: "Psicosis", value: "psychosis" },
          { label: "Crisis ansiedad", value: "anxiety_crisis" },
          { label: "Disociacion", value: "dissociation" },
          { label: "Autolesion", value: "self_harm" },
        ]}
        value={watch("mentalHealth.presentationType") ?? []}
        onChange={(value) => setValue("mentalHealth.presentationType", value as never, { shouldDirty: true })}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {([
          ["activeSuicidalIdeation", "Ideacion suicida activa"],
          ["specificPlan", "Plan especifico"],
          ["accessToMeans", "Acceso a medios"],
          ["priorAttempts", "Intentos previos"],
          ["recentAttempt", "Intento reciente"],
          ["violentBehavior", "Conducta violenta"],
          ["riskToOthers", "Riesgo para terceros"],
          ["substanceInfluence", "Bajo efecto de sustancias"],
          ["knownPsychiatricDiagnosis", "Dx psiquiatrico conocido"],
          ["psychiatricMedicationStopped", "Suspension de medicacion"],
          ["requiresContainment", "Requiere contencion"],
          ["requiresSecurityAlert", "Requiere alerta de seguridad"],
        ] as const).map(([key, label]) => (
          <label key={key} className={toggleClass}>
            <input type="checkbox" {...register(`mentalHealth.${key}`)} className="h-4 w-4" />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

const toggleClass =
  "flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-2 py-2 text-sm text-violet-900";
