"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

import ChipSelector from "../shared/ChipSelector";

const chronicOptions = [
  { label: "Diabetes", value: "diabetes" },
  { label: "HTA", value: "hta" },
  { label: "Cardiopatia", value: "cardiopatia" },
  { label: "EPOC", value: "epoc" },
  { label: "ERC", value: "erc" },
  { label: "Asma", value: "asma" },
  { label: "Cancer", value: "cancer" },
  { label: "VIH", value: "vih" },
  { label: "Embarazo", value: "embarazo" },
];

export default function Step5History() {
  const { register, watch, setValue } = useFormContext<TriageFormData>();

  const selectedConditions = watch("history.relevantChronicConditions");

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-slate-900">Paso E. Antecedentes y enfermedad actual</h2>
        <p className="text-sm text-slate-600">
          Registrar solo antecedentes que cambian prioridad de triaje.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Duracion sintomas
          </span>
          <input {...register("history.symptomDuration")} className={inputClass} placeholder="2 horas" />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Evolucion
          </span>
          <select {...register("history.symptomProgression")} className={inputClass}>
            <option value="improving">Mejorando</option>
            <option value="stable">Estable</option>
            <option value="worsening">Empeorando</option>
            <option value="sudden">Inicio brusco</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.knownAllergies")} className="h-4 w-4" />
          Alergias conocidas
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.currentMedications")} className="h-4 w-4" />
          Medicacion actual
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.previousTreatmentAttempted")} className="h-4 w-4" />
          Tratamiento previo
        </label>
      </div>

      {watch("history.knownAllergies") ? (
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Detalle alergias
          </span>
          <input {...register("history.allergyDetail")} className={inputClass} />
        </label>
      ) : null}

      {watch("history.currentMedications") ? (
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Detalle medicacion
          </span>
          <input {...register("history.medicationDetail")} className={inputClass} />
        </label>
      ) : null}

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Condiciones cronicas relevantes</p>
        <ChipSelector
          multiple
          options={chronicOptions}
          value={selectedConditions}
          onChange={(value) => {
            setValue("history.relevantChronicConditions", value as string[], {
              shouldDirty: true,
            });
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.immunocompromised")} className="h-4 w-4" />
          Inmunocomprometido
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.anticoagulated")} className="h-4 w-4" />
          Anticoagulado
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.recentSurgery")} className="h-4 w-4" />
          Cirugia ultimos 30 dias
        </label>
        <label className={toggleClass}>
          <input type="checkbox" {...register("history.recentDischarge")} className="h-4 w-4" />
          Alta reciente ultimos 7 dias
        </label>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500";
const toggleClass =
  "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700";
