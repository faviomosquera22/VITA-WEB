"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

export default function BurnProtocol() {
  const { register } = useFormContext<TriageFormData>();

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Subprotocolo Quemaduras</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">% SCT</span>
          <input type="number" {...register("burns.tbsaPercent", { valueAsNumber: true })} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Metodo</span>
          <select {...register("burns.burnMethod")} className={inputClass}>
            <option value="rule_of_9">Regla de los 9</option>
            <option value="lund_browder">Lund-Browder</option>
            <option value="palm">Palma</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Edad paciente</span>
          <input type="number" {...register("burns.patientAge", { valueAsNumber: true })} className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {([
          ["airwayBurn", "Compromiso via aerea"],
          ["inhalationInjury", "Lesion inhalatoria"],
          ["closedSpaceExposure", "Exposicion en ambiente cerrado"],
          ["circumferentialBurn", "Quemadura circunferencial"],
          ["faceInvolved", "Cara"],
          ["handsInvolved", "Manos"],
          ["feetInvolved", "Pies"],
          ["genitalsInvolved", "Genitales"],
          ["jointsInvolved", "Articulaciones"],
          ["isElectrical", "Quemadura electrica"],
          ["isChemical", "Quemadura quimica"],
          ["hemodynamicInstability", "Inestabilidad hemodinamica"],
          ["isPediatric", "Paciente pediatrico"],
        ] as const).map(([key, label]) => (
          <label key={key} className={toggleClass}>
            <input type="checkbox" {...register(`burns.${key}`)} className="h-4 w-4" />
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
