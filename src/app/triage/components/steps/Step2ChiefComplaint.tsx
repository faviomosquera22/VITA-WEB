"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import discriminatorsJson from "@/lib/triage/config/discriminators.json";
import { TRIAGE_LEVELS } from "@/lib/triage/triageConstants";
import { detectActivatedSubprotocols } from "@/lib/triage/engine/baseTriageRules";
import type { DiscriminatorConfigItem, TriageFormData, TriagePriority } from "@/lib/triage/triageTypes";

import ChipSelector from "../shared/ChipSelector";
import CriticalBanner from "../shared/CriticalBanner";

const discriminators = discriminatorsJson as DiscriminatorConfigItem[];

export default function Step2ChiefComplaint() {
  const { register, watch, setValue } = useFormContext<TriageFormData>();

  const selectedDiscriminatorId = watch("chiefComplaint.discriminatorId");
  const selectedPriority = watch("chiefComplaint.basePriority");

  const grouped = useMemo(() => {
    return discriminators.reduce<Record<string, DiscriminatorConfigItem[]>>((acc, item) => {
      if (!acc[item.system]) {
        acc[item.system] = [];
      }
      acc[item.system].push(item);
      return acc;
    }, {});
  }, []);

  const activeProtocols = watch("chiefComplaint.activatedSubprotocols");

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-slate-900">Paso B. Motivo y discriminador</h2>
        <p className="text-sm text-slate-600">
          Primero registra el relato del paciente y luego selecciona el discriminador principal.
        </p>
      </header>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Motivo de consulta (palabras del paciente, max 200)
        </span>
        <textarea
          {...register("chiefComplaint.chiefComplaintText")}
          maxLength={200}
          rows={3}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          placeholder="Ej: dolor toracico opresivo desde hace 30 minutos"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Inicio de sintomas
          </span>
          <input
            {...register("chiefComplaint.onsetTime")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="30"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Unidad</span>
          <select
            {...register("chiefComplaint.onsetUnit")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </label>
      </div>

      {Object.entries(grouped).map(([system, items]) => (
        <div key={system} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{system}</h3>
          <ChipSelector
            options={items.map((item) => ({
              label: item.label,
              value: item.id,
              description: `Prioridad base ${item.basePriority}`,
            }))}
            value={selectedDiscriminatorId}
            onChange={(value) => {
              const nextId = value as string;
              const selected = discriminators.find((item) => item.id === nextId);
              if (!selected) {
                return;
              }

              setValue("chiefComplaint.discriminatorId", selected.id, { shouldDirty: true, shouldValidate: true });
              setValue("chiefComplaint.discriminatorLabel", selected.label, { shouldDirty: true });
              setValue("chiefComplaint.basePriority", selected.basePriority as TriagePriority, { shouldDirty: true });

              const chiefComplaint = {
                ...watch("chiefComplaint"),
                discriminatorId: selected.id,
                discriminatorLabel: selected.label,
                basePriority: selected.basePriority as TriagePriority,
              };

              const protocols = detectActivatedSubprotocols(chiefComplaint);
              setValue("chiefComplaint.activatedSubprotocols", protocols, { shouldDirty: true });
            }}
          />
        </div>
      ))}

      {selectedPriority ? (
        <div
          className="rounded-2xl border p-3"
          style={{
            borderColor: TRIAGE_LEVELS[selectedPriority].colorHex,
            backgroundColor: `${TRIAGE_LEVELS[selectedPriority].colorHex}20`,
          }}
        >
          <p className="text-sm font-semibold text-slate-800">
            Prioridad base detectada: {selectedPriority} ({TRIAGE_LEVELS[selectedPriority].label})
          </p>
        </div>
      ) : null}

      {activeProtocols.length > 0 ? (
        <CriticalBanner
          tone="info"
          title="Subprotocolos detectados automaticamente"
          description={activeProtocols.join(" | ")}
        />
      ) : null}
    </section>
  );
}
