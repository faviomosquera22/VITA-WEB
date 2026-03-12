"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

export default function TraumaProtocol() {
  const { register } = useFormContext<TriageFormData>();

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Subprotocolo Trauma</h3>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Mecanismo</span>
        <select {...register("trauma.mechanism")} className={inputClass}>
          <option value="mva_high">Accidente alta energia</option>
          <option value="mva_low">Accidente baja energia</option>
          <option value="fall_high">Caida alta</option>
          <option value="fall_low">Caida baja</option>
          <option value="penetrating">Penetrante</option>
          <option value="blunt">Contuso</option>
          <option value="crush">Aplastamiento</option>
          <option value="blast">Explosion</option>
          <option value="other">Otro</option>
        </select>
      </label>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {([
          ["lossOfConsciousness", "Perdida de conciencia"],
          ["cervicalPain", "Dolor cervical"],
          ["chestPain", "Dolor toracico"],
          ["abdominalPain", "Dolor abdominal"],
          ["penetratingWound", "Herida penetrante"],
          ["amputation", "Amputacion"],
          ["evisceration", "Evisceracion"],
          ["uncontrolledHemorrhage", "Sangrado no controlado"],
          ["suspectedSpinalInjury", "Lesion medular sospechada"],
          ["severeHeadTrauma", "TEC severo"],
          ["multipleMajorFractures", "Multiples fracturas mayores"],
          ["neurovascularCompromise", "Compromiso neurovascular"],
          ["openFracture", "Fractura abierta"],
          ["isPolitrauma", "Politrauma"],
        ] as const).map(([key, label]) => (
          <label key={key} className={toggleClass}>
            <input type="checkbox" {...register(`trauma.${key}`)} className="h-4 w-4" />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500";
const toggleClass =
  "flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700";
