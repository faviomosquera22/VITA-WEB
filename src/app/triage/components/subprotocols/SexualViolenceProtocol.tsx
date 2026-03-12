"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

import CriticalBanner from "../shared/CriticalBanner";

export default function SexualViolenceProtocol() {
  const { register, setValue } = useFormContext<TriageFormData>();

  useEffect(() => {
    setValue("sexualViolence.codePurpleActivated", true, { shouldDirty: false });
  }, [setValue]);

  return (
    <section className="space-y-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
      <CriticalBanner
        title="Codigo Purpura activo"
        description="Atencion inmediata, privada y con enfoque clinico-legal."
        tone="critical"
      />

      <h3 className="text-base font-semibold text-fuchsia-900">Subprotocolo Violencia Sexual</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-fuchsia-700">
            Horas desde el evento
          </span>
          <input
            type="number"
            {...register("sexualViolence.hoursSinceEvent", { valueAsNumber: true })}
            className={inputClass}
          />
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("sexualViolence.exactTimeKnown")} className="h-4 w-4" />
          Hora exacta conocida
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {([
          ["activeBleeding", "Sangrado activo"],
          ["visibleInjuries", "Lesiones visibles"],
          ["possiblePregnancy", "Posible embarazo"],
          ["isMinor", "Menor de edad"],
          ["hadBathOrShower", "Se bano despues del evento"],
          ["hadClothingChange", "Cambio de ropa"],
          ["emotionalCrisis", "Crisis emocional"],
          ["dissociativeState", "Estado disociativo"],
          ["suicidalIdeation", "Ideacion suicida"],
          ["requiresPrivateSpace", "Requiere espacio privado"],
          ["prefersFemaleStaff", "Prefiere personal femenino"],
        ] as const).map(([key, label]) => (
          <label key={key} className={toggleClass}>
            <input type="checkbox" {...register(`sexualViolence.${key}`)} className="h-4 w-4" />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-fuchsia-300 bg-white px-3 py-2 text-sm text-fuchsia-900 outline-none focus:border-fuchsia-600";
const toggleClass =
  "flex items-center gap-2 rounded-lg border border-fuchsia-200 bg-white px-2 py-2 text-sm text-fuchsia-900";
