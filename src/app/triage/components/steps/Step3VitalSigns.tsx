"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { TRIAGE_LEVELS } from "@/lib/triage/triageConstants";
import type { TriageFormData } from "@/lib/triage/triageTypes";

import VitalInput from "../shared/VitalInput";

interface Step3VitalSignsProps {
  criticalParameters: Record<string, "critical" | "alert" | "normal">;
  tentativePriority: number;
}

const notTakenFieldLabels = [
  ["heartRate", "FC"],
  ["respiratoryRate", "FR"],
  ["systolicBP", "PA"],
  ["spo2", "SpO2"],
  ["temperature", "Temperatura"],
  ["glasgowTotal", "Glasgow"],
] as const;

type NotTakenField = (typeof notTakenFieldLabels)[number][0];

export default function Step3VitalSigns({
  criticalParameters,
  tentativePriority,
}: Step3VitalSignsProps) {
  const { watch, setValue } = useFormContext<TriageFormData>();
  const [notTaken, setNotTaken] = useState<Record<string, boolean>>({});
  const [notTakenReason, setNotTakenReason] = useState<Record<string, string>>({});

  const isObstetric = watch("identification.isObstetric");
  const isPediatric = watch("identification.isPediatric");
  const chronic = watch("history.relevantChronicConditions");
  const alteredConsciousness = watch("criticalFindings.alteredConsciousness");

  const shouldShowGlucometry = useMemo(
    () => chronic.includes("diabetes") || alteredConsciousness,
    [chronic, alteredConsciousness]
  );

  const tentativeLevel = TRIAGE_LEVELS[(tentativePriority as 1 | 2 | 3 | 4 | 5) || 5];

  const clearVitalField = (field: NotTakenField) => {
    switch (field) {
      case "heartRate":
        setValue("vitalSigns.heartRate", undefined, { shouldDirty: true });
        return;
      case "respiratoryRate":
        setValue("vitalSigns.respiratoryRate", undefined, { shouldDirty: true });
        return;
      case "systolicBP":
        setValue("vitalSigns.systolicBP", undefined, { shouldDirty: true });
        return;
      case "spo2":
        setValue("vitalSigns.spo2", undefined, { shouldDirty: true });
        return;
      case "temperature":
        setValue("vitalSigns.temperature", undefined, { shouldDirty: true });
        return;
      case "glasgowTotal":
        setValue("vitalSigns.glasgowTotal", undefined, { shouldDirty: true });
        return;
      default:
        return;
    }
  };

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">Paso C. Signos vitales (obligatorio)</h2>
        <p className="text-sm text-slate-600">
          Toma minima requerida: FC, FR, PA, SpO2, temperatura y Glasgow.
        </p>
        <div
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${tentativeLevel.colorHex}20`, color: tentativeLevel.colorHex }}
        >
          Nivel tentativo actual: {tentativePriority} - {tentativeLevel.label}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <VitalInput
          label="FC"
          unit="lpm"
          value={watch("vitalSigns.heartRate")}
          onChange={(value) => setValue("vitalSigns.heartRate", value, { shouldDirty: true })}
          status={criticalParameters.heartRate ?? "normal"}
        />
        <VitalInput
          label="FR"
          unit="rpm"
          value={watch("vitalSigns.respiratoryRate")}
          onChange={(value) => setValue("vitalSigns.respiratoryRate", value, { shouldDirty: true })}
          status={criticalParameters.respiratoryRate ?? "normal"}
        />
        <VitalInput
          label="PA sistolica"
          unit="mmHg"
          value={watch("vitalSigns.systolicBP")}
          onChange={(value) => setValue("vitalSigns.systolicBP", value, { shouldDirty: true })}
          status={criticalParameters.systolicBP ?? "normal"}
        />
        <VitalInput
          label="PA diastolica"
          unit="mmHg"
          value={watch("vitalSigns.diastolicBP")}
          onChange={(value) => setValue("vitalSigns.diastolicBP", value, { shouldDirty: true })}
        />
        <VitalInput
          label="SpO2"
          unit="%"
          value={watch("vitalSigns.spo2")}
          onChange={(value) => setValue("vitalSigns.spo2", value, { shouldDirty: true })}
          status={criticalParameters.spo2 ?? "normal"}
        />
        <VitalInput
          label="Temperatura"
          unit="C"
          value={watch("vitalSigns.temperature")}
          onChange={(value) => setValue("vitalSigns.temperature", value, { shouldDirty: true })}
          status={criticalParameters.temperature ?? "normal"}
        />
        <VitalInput
          label="Glasgow total"
          unit="pts"
          value={watch("vitalSigns.glasgowTotal")}
          onChange={(value) => setValue("vitalSigns.glasgowTotal", value, { shouldDirty: true })}
          status={criticalParameters.glasgowTotal ?? "normal"}
        />
        <VitalInput
          label="Dolor EVA"
          unit="0-10"
          value={watch("vitalSigns.painScale")}
          onChange={(value) => setValue("vitalSigns.painScale", value, { shouldDirty: true })}
          status={criticalParameters.painScale ?? "normal"}
        />

        {shouldShowGlucometry ? (
          <VitalInput
            label="Glucometria"
            unit="mg/dL"
            value={watch("vitalSigns.glucometry")}
            onChange={(value) => setValue("vitalSigns.glucometry", value, { shouldDirty: true })}
            status={criticalParameters.glucometry ?? "normal"}
          />
        ) : null}

        {isObstetric ? (
          <VitalInput
            label="FC fetal"
            unit="lpm"
            value={watch("vitalSigns.fetalHeartRate")}
            onChange={(value) => setValue("vitalSigns.fetalHeartRate", value, { shouldDirty: true })}
          />
        ) : null}

        {isPediatric ? (
          <VitalInput
            label="Peso"
            unit="kg"
            value={watch("vitalSigns.weight")}
            onChange={(value) => setValue("vitalSigns.weight", value, { shouldDirty: true })}
          />
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">No tomado / No posible</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {notTakenFieldLabels.map(([field, label]) => (
            <div key={field} className="rounded-lg border border-slate-200 p-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(notTaken[field])}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setNotTaken((prev) => ({ ...prev, [field]: checked }));
                    if (checked) {
                      clearVitalField(field);
                    }
                  }}
                />
                {label} no tomado
              </label>
              {notTaken[field] ? (
                <input
                  value={notTakenReason[field] ?? ""}
                  onChange={(event) =>
                    setNotTakenReason((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  placeholder="Motivo"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
