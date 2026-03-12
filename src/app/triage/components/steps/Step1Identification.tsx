"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import type { TriageFormData } from "@/lib/triage/triageTypes";

export default function Step1Identification() {
  const { register, watch, setValue } = useFormContext<TriageFormData>();

  const age = watch("identification.age");
  const ageUnit = watch("identification.ageUnit");
  const sex = watch("identification.sex");
  const arrivalTime = watch("identification.arrivalTime");

  useEffect(() => {
    const ageInYears = ageUnit === "years" ? age : ageUnit === "months" ? age / 12 : age / 365;
    setValue("identification.isPediatric", ageInYears < 14, { shouldDirty: true });

    const obstetricEligible = sex === "F" && ageInYears >= 10 && ageInYears <= 55;
    if (!obstetricEligible) {
      setValue("identification.isObstetric", false, { shouldDirty: true });
    }
  }, [age, ageUnit, sex, setValue]);

  useEffect(() => {
    if (!arrivalTime) {
      setValue("identification.arrivalTime", new Date().toISOString(), { shouldDirty: false });
    }
  }, [arrivalTime, setValue]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-slate-900">Paso A. Ingreso e identificacion</h2>
        <p className="text-sm text-slate-600">
          Registra datos minimos de admision. El sistema activa pediatrico/obstetrico automaticamente.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Cedula">
          <input {...register("identification.cedula")} className={inputClass} placeholder="0123456789" />
        </Field>
        <Field label="ID paciente Vita (si existe)">
          <input {...register("identification.patientId")} className={inputClass} placeholder="pac-001" />
        </Field>
        <Field label="Nombres">
          <input {...register("identification.firstName")} className={inputClass} />
        </Field>
        <Field label="Apellidos">
          <input {...register("identification.lastName")} className={inputClass} />
        </Field>
        <Field label="Fecha nacimiento">
          <input type="date" {...register("identification.birthDate")} className={inputClass} />
        </Field>
        <Field label="Sexo biologico">
          <select {...register("identification.sex")} className={inputClass}>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Edad">
          <input type="number" {...register("identification.age", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Unidad edad">
          <select {...register("identification.ageUnit")} className={inputClass}>
            <option value="years">Anios</option>
            <option value="months">Meses</option>
            <option value="days">Dias</option>
          </select>
        </Field>
        <Field label="Modo llegada">
          <select {...register("identification.arrivalMode")} className={inputClass}>
            <option value="walking">Caminando</option>
            <option value="wheelchair">Silla de ruedas</option>
            <option value="stretcher">Camilla</option>
            <option value="ambulance">Ambulancia</option>
            <option value="police">Policia</option>
            <option value="transfer">Transferencia</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Toggle label="Consciente al ingreso" {...register("identification.consciousOnArrival")} />
        <Toggle label="Puede comunicarse" {...register("identification.canCommunicate")} />
        <Toggle label="Llega acompanado" {...register("identification.isCompanied")} />
      </div>

      {sex === "F" ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <input type="checkbox" {...register("identification.isObstetric")} className="h-4 w-4" />
            Embarazada o puerpera
          </label>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Hora de llegada registrada automaticamente:{" "}
        {arrivalTime ? new Date(arrivalTime).toLocaleString() : "Pendiente"}
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Toggle(
  props: { label: string } & React.InputHTMLAttributes<HTMLInputElement>
) {
  const { label, ...inputProps } = props;
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
      <input type="checkbox" {...inputProps} className="h-4 w-4" />
      {label}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500";
