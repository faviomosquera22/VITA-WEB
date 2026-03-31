"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { medicationMatchesAllergy } from "@/lib/clinical-surveillance/helpers";

import type { MedicationRecord, PatientRecord } from "../_data/clinical-mock-data";
import {
  medicationKnowledgeBase,
  medicationKnowledgeGroups,
  resolveMedicationKnowledgeEntry,
  type MedicationDoseRegimen,
  type MedicationKnowledgeEntry,
} from "../_data/medication-knowledge-base";
import { getMedicationStockSnapshot, type MedicationStockSnapshot } from "../_data/medication-stock";

export type MedicationCatalogFormValue = {
  name: string;
  presentation: string;
  dose: string;
  frequency: string;
  route: string;
  schedule: string;
  indication: string;
  prescriber: string;
  adherence: string;
  administrationStatus: MedicationRecord["administrationStatus"];
  notes: string;
};

export default function PatientMedicationCatalogAssistant({
  patient,
  form,
  onChange,
}: {
  patient: PatientRecord;
  form: MedicationCatalogFormValue;
  onChange: (patch: Partial<MedicationCatalogFormValue>) => void;
}) {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogGroup, setCatalogGroup] = useState("todos");
  const activeKnowledge = form.name ? resolveMedicationKnowledgeEntry(form.name) : undefined;

  const visibleEntries = useMemo(() => {
    const query = normalizeText(catalogSearch);

    return medicationKnowledgeBase.filter((entry) => {
      const matchesGroup = catalogGroup === "todos" || entry.therapeuticGroup === catalogGroup;
      if (!matchesGroup) {
        return false;
      }

      if (!query) {
        return true;
      }

      return normalizeText(
        `${entry.name} ${entry.therapeuticGroup} ${entry.pharmacologicClass} ${entry.presentations.join(" ")}`
      ).includes(query);
    });
  }, [catalogGroup, catalogSearch]);

  const activePresentation = form.presentation || activeKnowledge?.presentations[0] || "";
  const activeStock = activeKnowledge
    ? getMedicationStockSnapshot(activeKnowledge.name, activePresentation)
    : null;

  const allergyMatches = useMemo(() => {
    if (!activeKnowledge) {
      return [];
    }

    return patient.antecedentes.allergies.filter((allergy) =>
      medicationMatchesAllergy(activeKnowledge.name, allergy)
    );
  }, [activeKnowledge, patient.antecedentes.allergies]);

  const patientWeight = patient.vitalSigns[0]?.weightKg ?? null;
  const quickGroups = medicationKnowledgeGroups.slice(0, 8);

  const applyKnowledgeSelection = (entry: MedicationKnowledgeEntry) => {
    const initialPresentation = entry.presentations[0] ?? "";

    onChange({
      name: entry.name,
      presentation: initialPresentation,
      dose: extractDoseFromPresentation(initialPresentation),
      route: entry.routeOptions[0] ?? form.route,
      frequency: form.frequency || entry.regimens[0]?.frequency || "",
      schedule:
        form.schedule || inferScheduleFromFrequency(entry.regimens[0]?.frequency ?? ""),
      indication: form.indication || inferIndication(entry),
    });
  };

  const applyPresentation = (presentation: string) => {
    onChange({
      presentation,
      dose: extractDoseFromPresentation(presentation) || form.dose,
    });
  };

  const applyRegimen = (regimen: MedicationDoseRegimen) => {
    onChange({
      dose: computeRegimenDose(regimen, patientWeight),
      route: regimen.route,
      frequency: regimen.frequency,
      schedule: inferScheduleFromFrequency(regimen.frequency),
      indication: regimen.label,
      notes: regimen.notes ? mergeNotes(form.notes, regimen.notes) : form.notes,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Catalogo asistido y stock
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Selecciona desde lista, aplica un regimen sugerido y revisa disponibilidad antes de guardar.
          </p>
        </div>
        <Link
          href={`/portal/professional/medication?patientId=${patient.id}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Abrir estacion completa
        </Link>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">Buscar medicamento</span>
            <input
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
              placeholder="Metformina, ceftriaxona, enoxaparina..."
              className={fieldClassName}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <CatalogChip
              active={catalogGroup === "todos"}
              label="Todos"
              onClick={() => setCatalogGroup("todos")}
            />
            {quickGroups.map((group) => (
              <CatalogChip
                key={group}
                active={catalogGroup === group}
                label={titleCase(group)}
                onClick={() => setCatalogGroup(group)}
              />
            ))}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {visibleEntries.slice(0, 12).map((entry) => {
              const snapshot = getMedicationStockSnapshot(entry.name, entry.presentations[0]);

              return (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => applyKnowledgeSelection(entry)}
                  className={[
                    "w-full rounded-xl border px-3 py-3 text-left transition",
                    activeKnowledge?.name === entry.name
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                    {snapshot ? <MedicationStockBadge snapshot={snapshot} compact /> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {titleCase(entry.therapeuticGroup)} · {entry.presentations[0]}
                  </p>
                </button>
              );
            })}

            {visibleEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-xs text-slate-500">
                No hay coincidencias para ese filtro.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          {activeKnowledge ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activeKnowledge.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {activeKnowledge.pharmacologicClass} · {titleCase(activeKnowledge.therapeuticGroup)}
                    </p>
                  </div>
                  {activeKnowledge.highAlert ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      Alto riesgo
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-slate-600">Presentacion</span>
                    <select
                      value={activePresentation}
                      onChange={(event) => applyPresentation(event.target.value)}
                      className={fieldClassName}
                    >
                      {activeKnowledge.presentations.map((presentation) => (
                        <option key={presentation} value={presentation}>
                          {presentation}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {activeStock ? <MedicationStockBadge snapshot={activeStock} /> : null}

                <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                  <InfoLine label="Dosis adulto" value={activeKnowledge.adultDoseGuide} />
                  <InfoLine label="Formula" value={activeKnowledge.formulaGuide} />
                  <InfoLine label="Vias" value={activeKnowledge.routeOptions.join(" · ")} />
                </div>
              </div>

              {allergyMatches.length > 0 ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-800">
                  Posible cruce con alergias documentadas: {allergyMatches.join(" · ")}.
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Regimenes sugeridos
                </p>
                <div className="mt-2 space-y-2">
                  {activeKnowledge.regimens.slice(0, 3).map((regimen) => (
                    <button
                      key={regimen.id}
                      type="button"
                      onClick={() => applyRegimen(regimen)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      <p className="text-xs font-semibold text-slate-800">{regimen.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {regimen.route} · {computeRegimenDose(regimen, patientWeight)} · {regimen.frequency}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[11px] text-slate-500">
                La disponibilidad mostrada es referencial y la estructura queda lista para integrarse con inventario real de farmacia.
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-xs text-slate-500">
              Selecciona un medicamento del catalogo para cargar sus presentaciones, regimenes y disponibilidad.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "border-sky-300 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MedicationStockBadge({
  snapshot,
  compact = false,
}: {
  snapshot: MedicationStockSnapshot;
  compact?: boolean;
}) {
  const className =
    snapshot.status === "Disponible"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : snapshot.status === "Baja disponibilidad"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  if (compact) {
    return (
      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
        {snapshot.status}
      </span>
    );
  }

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold">Stock {snapshot.status.toLowerCase()}</p>
        <span className="text-xs font-semibold">{snapshot.stock} unidades</span>
      </div>
      <p className="mt-1 text-[11px]">
        {snapshot.location} · Actualizado {snapshot.updatedAt}
      </p>
      {snapshot.note ? <p className="mt-1 text-[11px]">{snapshot.note}</p> : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold text-slate-700">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function computeRegimenDose(regimen: MedicationDoseRegimen, patientWeight: number | null) {
  if (!regimen.calculation || !patientWeight) {
    return regimen.dose;
  }

  const rawValue = patientWeight * regimen.calculation.amountPerKg;
  const roundedValue = Math.round(rawValue / (regimen.calculation.roundTo ?? 1)) * (regimen.calculation.roundTo ?? 1);
  const limitedValue =
    regimen.calculation.maxDose !== undefined
      ? Math.min(roundedValue, regimen.calculation.maxDose)
      : roundedValue;

  return `${formatNumericDose(limitedValue)} ${regimen.calculation.unit}`;
}

function inferScheduleFromFrequency(frequency: string) {
  const normalized = normalizeText(frequency);

  if (normalized.includes("24")) {
    return "08:00";
  }
  if (normalized.includes("12")) {
    return "08:00 - 20:00";
  }
  if (normalized.includes("8")) {
    return "06:00 - 14:00 - 22:00";
  }
  if (normalized.includes("6")) {
    return "06:00 - 12:00 - 18:00 - 00:00";
  }

  return "08:00";
}

function inferIndication(entry?: MedicationKnowledgeEntry) {
  if (!entry) {
    return "Indicacion clinica";
  }

  if (entry.therapeuticGroup === "cardiovasculares") {
    return "Cobertura cardiovascular";
  }
  if (entry.therapeuticGroup === "endocrinos") {
    return "Control metabolico";
  }
  if (entry.therapeuticGroup === "antibioticos") {
    return "Cobertura antimicrobiana";
  }
  if (entry.therapeuticGroup === "gastrointestinal") {
    return "Control digestivo";
  }
  return "Indicacion clinica";
}

function extractDoseFromPresentation(value: string) {
  const match = value.match(/^([0-9]+(?:[.,][0-9]+)?(?:\s?[a-zA-Z/%]+(?:\/[0-9]+(?:\s?[a-zA-Z/%]+)?)?)?)/);
  return match?.[1]?.trim() ?? "";
}

function mergeNotes(current: string, extra: string) {
  if (!extra.trim()) {
    return current;
  }

  if (!current.trim()) {
    return extra.trim();
  }

  if (normalizeText(current).includes(normalizeText(extra))) {
    return current;
  }

  return `${current.trim()} ${extra.trim()}`;
}

function formatNumericDose(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

const fieldClassName =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-300 focus:bg-white";
