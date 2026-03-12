"use client";

import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

const groups: Array<{ title: string; fields: Array<{ key: keyof TriageFormData["criticalFindings"]; label: string }> }> = [
  {
    title: "Via aerea",
    fields: [
      { key: "airwayCompromised", label: "Via aerea comprometida" },
      { key: "stridor", label: "Estridor" },
      { key: "apnea", label: "Apnea" },
      { key: "foreignBody", label: "Cuerpo extranio" },
    ],
  },
  {
    title: "Respiratorio",
    fields: [
      { key: "severeRespiratoryDistress", label: "Dificultad respiratoria severa" },
      { key: "cyanosis", label: "Cianosis" },
      { key: "accessoryMuscleUse", label: "Uso de musculos accesorios" },
    ],
  },
  {
    title: "Circulatorio",
    fields: [
      { key: "uncontrolledBleeding", label: "Sangrado no controlado" },
      { key: "shockSigns", label: "Signos de shock" },
    ],
  },
  {
    title: "Neurologico y especificos",
    fields: [
      { key: "alteredConsciousness", label: "Alteracion de conciencia" },
      { key: "seizureActive", label: "Convulsion activa" },
      { key: "focalNeurologicDeficit", label: "Deficit focal" },
      { key: "severePainUncontrolled", label: "Dolor severo no controlado" },
      { key: "anaphylaxis", label: "Anafilaxia" },
      { key: "sepsisSigns", label: "Sospecha de sepsis" },
      { key: "strokeSigns", label: "Signos de ACV" },
      { key: "acuteChestPain", label: "Dolor toracico agudo" },
      { key: "pregnancyComplications", label: "Complicaciones obstetricas" },
    ],
  },
];

export default function Step4CriticalFindings() {
  const { register } = useFormContext<TriageFormData>();

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-slate-900">Paso D. Hallazgos criticos</h2>
        <p className="text-sm text-slate-600">
          Marca solo hallazgos presentes. Cualquier hallazgo critico ajusta prioridad en tiempo real.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-2xl border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">{group.title}</h3>
            <div className="space-y-2">
              {group.fields.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-sm text-slate-700"
                >
                  <input type="checkbox" {...register(`criticalFindings.${field.key}`)} className="h-4 w-4" />
                  {field.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
