"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

import ChipSelector from "../shared/ChipSelector";

export default function IntoxicationProtocol() {
  const { register, watch, setValue } = useFormContext<TriageFormData>();

  return (
    <section className="space-y-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
      <h3 className="text-base font-semibold text-cyan-900">Subprotocolo Intoxicaciones</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cyan-700">Sustancia</span>
          <input {...register("intoxication.substanceName")} className={inputClass} placeholder="Organofosforado" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cyan-700">Dosis estimada</span>
          <input {...register("intoxication.estimatedDose")} className={inputClass} />
        </label>
      </div>

      <ChipSelector
        multiple
        options={[
          { label: "Medicamento", value: "medication" },
          { label: "Alcohol", value: "alcohol" },
          { label: "Droga ilicita", value: "illicit_drug" },
          { label: "Pesticida", value: "pesticide" },
          { label: "Caustico", value: "caustic" },
          { label: "Hidrocarburo", value: "hydrocarbon" },
          { label: "CO", value: "co" },
        ]}
        value={watch("intoxication.substanceType") ?? []}
        onChange={(value) => setValue("intoxication.substanceType", value as never, { shouldDirty: true })}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {([
          ["intentional", "Exposicion intencional"],
          ["alteredConsciousness", "Alteracion de conciencia"],
          ["seizures", "Convulsiones"],
          ["severeVomiting", "Vomito severo"],
          ["oralBurns", "Quemaduras orales"],
          ["bronchospasm", "Broncoespasmo"],
          ["bradycardia", "Bradicardia"],
          ["arrhythmia", "Arritmia"],
          ["miosis", "Miosis"],
          ["mydriasis", "Midriasis"],
          ["salivation", "Sialorrea"],
          ["lacrimation", "Lagrimeo"],
          ["urinaryIncontinence", "Incontinencia urinaria"],
          ["defecation", "Defecacion"],
          ["muscleParalysis", "Paralisis muscular"],
        ] as const).map(([key, label]) => (
          <label key={key} className={toggleClass}>
            <input type="checkbox" {...register(`intoxication.${key}`)} className="h-4 w-4" />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 text-sm text-cyan-900 outline-none focus:border-cyan-600";
const toggleClass =
  "flex items-center gap-2 rounded-lg border border-cyan-200 bg-white px-2 py-2 text-sm text-cyan-900";
