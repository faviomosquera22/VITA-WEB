"use client";

import { useState } from "react";

import type { UnifiedTriageColor } from "@/lib/triage/triageTypes";

interface TriageResultActionsProps {
  suggestedColor: UnifiedTriageColor;
  saving: boolean;
  onConfirm: () => void;
  onReclassify: (color: UnifiedTriageColor, reason: string) => void;
  onPrint: () => void;
}

const options: Array<{ label: string; value: UnifiedTriageColor }> = [
  { label: "Rojo", value: "RED" },
  { label: "Naranja", value: "ORANGE" },
  { label: "Amarillo", value: "YELLOW" },
  { label: "Verde", value: "GREEN" },
  { label: "Azul", value: "BLUE" },
];

export default function TriageResultActions({
  suggestedColor,
  saving,
  onConfirm,
  onReclassify,
  onPrint,
}: TriageResultActionsProps) {
  const [reclassMode, setReclassMode] = useState(false);
  const [color, setColor] = useState<UnifiedTriageColor>(suggestedColor);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Confirmar triaje
        </button>

        <button
          type="button"
          onClick={() => setReclassMode((prev) => !prev)}
          className="rounded-xl border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-700"
        >
          Reclasificar manualmente
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Imprimir PDF / pulsera
        </button>
      </div>

      {reclassMode ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Nuevo nivel
            </span>
            <select
              value={color}
              onChange={(event) => setColor(event.target.value as UnifiedTriageColor)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Razon obligatoria
            </span>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Justificacion clinica de reclasificacion"
            />
          </label>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() => {
                if (!reason.trim()) {
                  return;
                }
                onReclassify(color, reason.trim());
              }}
              disabled={saving || !reason.trim()}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Guardar reclasificacion
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
