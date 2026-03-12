"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

export default function ObstetricProtocol() {
  const { register } = useFormContext<TriageFormData>();

  return (
    <section className="space-y-3 rounded-2xl border border-pink-200 bg-pink-50 p-4">
      <h3 className="text-base font-semibold text-pink-900">Subprotocolo Obstetrico</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pink-700">
            Edad gestacional (semanas)
          </span>
          <input
            type="number"
            {...register("obstetric.gestationalAgeWeeks", { valueAsNumber: true })}
            className={inputClass}
          />
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("obstetric.isPuerperium")} className="h-4 w-4" />
          Puerperio (hasta 42 dias)
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {([
          ["activeLabor", "Trabajo de parto activo"],
          ["memoraneRupture", "Ruptura de membranas"],
          ["vaginalBleeding", "Sangrado vaginal"],
          ["abdominalPain", "Dolor abdominal"],
          ["eclampsia", "Eclampsia"],
          ["severePreeclampsia", "Preeclampsia severa"],
          ["placentaPrevia", "Placenta previa"],
          ["abruptionSigns", "Desprendimiento placentario"],
          ["prolapsedCord", "Prolapso de cordon"],
          ["fetalDistress", "Sufrimiento fetal"],
          ["ectopicSigns", "Sospecha embarazo ectopico"],
          ["decreasedFetalMovement", "Disminucion movimientos fetales"],
          ["hemorrhagiaPostpartum", "Hemorragia posparto"],
          ["infectionSigns", "Signos de infeccion"],
          ["thrombosisRisk", "Riesgo de trombosis"],
        ] as const).map(([key, label]) => (
          <label key={key} className={toggleClass}>
            <input type="checkbox" {...register(`obstetric.${key}`)} className="h-4 w-4" />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-pink-300 bg-white px-3 py-2 text-sm text-pink-900 outline-none focus:border-pink-600";
const toggleClass =
  "flex items-center gap-2 rounded-lg border border-pink-200 bg-white px-2 py-2 text-sm text-pink-900";
