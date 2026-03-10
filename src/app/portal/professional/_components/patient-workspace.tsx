"use client";

import { useMemo, useState, type ReactNode } from "react";

import {
  getPatientFunctionalPatterns,
  getPatientServiceArea,
  type PatientRecord,
} from "../_data/clinical-mock-data";
import { RiskBadge, TriageBadge } from "./clinical-ui";

export function PatientFinder({
  patients,
  searchValue,
  onSearchChange,
  selectedPatientId,
  onSelectPatient,
  title = "Busqueda de paciente",
  subtitle = "Busca por nombre, cedula, historia clinica o codigo y selecciona un paciente para continuar.",
  rightSlot,
  showQuickChips = true,
}: {
  patients: PatientRecord[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  showQuickChips?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Buscador
          </label>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ej. Sofia Mendoza, 1305900876, HC-2026-0005"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Paciente seleccionado
          </label>
          <select
            value={selectedPatientId}
            onChange={(event) => onSelectPatient(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName} · {patient.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showQuickChips ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {patients.slice(0, 6).map((patient) => {
            const selected = patient.id === selectedPatientId;

            return (
              <button
                key={patient.id}
                type="button"
                onClick={() => onSelectPatient(patient.id)}
                className={[
                  "rounded-full border px-3 py-1 text-[11px] transition",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                {patient.fullName}
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export function PatientContextSummary({
  patient,
  compact = false,
}: {
  patient: PatientRecord;
  compact?: boolean;
}) {
  const patterns = getPatientFunctionalPatterns(patient);
  const serviceArea = getPatientServiceArea(patient);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
          <p className="text-xs text-slate-600">
            {patient.age} anios · {patient.sex} · ID {patient.identification} · HC {patient.medicalRecordNumber}
          </p>
          <p className="text-xs text-slate-600">
            {patient.primaryDiagnosis} · Servicio {serviceArea}
          </p>
          {!compact ? (
            <p className="text-[11px] text-slate-500">
              Profesional responsable: {patient.assignedProfessional} · Estado: {patient.currentStatus}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge risk={patient.riskLevel} />
          <TriageBadge triage={patient.triageColor} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TagGroup
          title="Alergias"
          tags={patient.antecedentes.allergies.length ? patient.antecedentes.allergies : ["Sin alergias registradas"]}
          tone="amber"
        />
        <TagGroup
          title="Patron funcional alterado"
          tags={patterns.length ? patterns : ["Sin patron alterado registrado"]}
          tone="sky"
        />
        <TagGroup
          title="Alertas activas"
          tags={patient.activeAlerts.length ? patient.activeAlerts : ["Sin alertas activas"]}
          tone="rose"
        />
      </div>
    </article>
  );
}

export function usePatientSelection(patients: PatientRecord[]) {
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? "");

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return patients;
    }

    return patients.filter((patient) => {
      const terms = [
        patient.fullName,
        patient.identification,
        patient.medicalRecordNumber,
        patient.code,
        patient.assignedProfessional,
        getPatientServiceArea(patient),
      ]
        .join(" ")
        .toLowerCase();

      return terms.includes(normalized);
    });
  }, [patients, search]);

  const selectedPatient = useMemo(() => {
    return (
      filteredPatients.find((patient) => patient.id === selectedPatientId) ??
      filteredPatients[0] ??
      null
    );
  }, [filteredPatients, selectedPatientId]);

  return {
    search,
    setSearch,
    selectedPatientId,
    setSelectedPatientId,
    filteredPatients,
    selectedPatient,
  };
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Buscar opcion...",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string; description?: string }>;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) => {
      const haystack = `${option.id} ${option.label} ${option.description ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, search]);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
      >
        {filtered.map((option) => (
          <option key={option.id} value={option.id}>
            {option.id} · {option.label}
          </option>
        ))}
      </select>
      {filtered.find((option) => option.id === value)?.description ? (
        <p className="text-[11px] text-slate-500">
          {filtered.find((option) => option.id === value)?.description}
        </p>
      ) : null}
    </div>
  );
}

function TagGroup({
  title,
  tags,
  tone,
}: {
  title: string;
  tags: string[];
  tone: "sky" | "amber" | "rose";
}) {
  const toneClass: Record<"sky" | "amber" | "rose", string> = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={[
              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
              toneClass[tone],
            ].join(" ")}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
