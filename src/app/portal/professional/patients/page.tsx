"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { ModulePage, RiskBadge, TriageBadge } from "../_components/clinical-ui";
import {
  getPatientServiceArea,
  mockPatients,
  type PatientRecord,
  type ServiceArea,
} from "../_data/clinical-mock-data";

type SearchMode = "all" | "name" | "document" | "hc" | "room" | "professional";

const patientLocationLabels: Record<string, string> = {
  "p-001": "Sala de choque 1",
  "p-002": "Box de observacion 2",
  "p-003": "Consultorio 3",
  "p-004": "Consultorio 1",
  "p-005": "Habitacion 204 · cama B",
};

const searchModes: Array<{
  id: SearchMode;
  label: string;
  placeholder: string;
}> = [
  { id: "all", label: "Todo", placeholder: "Nombre, cedula, HC, sala o profesional" },
  { id: "name", label: "Nombre", placeholder: "Ej. Maria Lopez" },
  { id: "document", label: "Cedula", placeholder: "Ej. 1722334412" },
  { id: "hc", label: "Historia clinica", placeholder: "Ej. HC-2026-0001" },
  { id: "room", label: "Sala", placeholder: "Ej. sala de choque, habitacion 204" },
  { id: "professional", label: "Profesional", placeholder: "Ej. Dra. Camila Rojas" },
];

export default function PatientsPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("all");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceArea>("all");
  const deferredSearch = useDeferredValue(search);

  const serviceAreas = useMemo(
    () => Array.from(new Set(mockPatients.map((patient) => getPatientServiceArea(patient)))),
    []
  );

  const filteredPatients = useMemo(() => {
    const normalizedSearch = normalizeSearch(deferredSearch);

    return mockPatients.filter((patient) => {
      if (serviceFilter !== "all" && getPatientServiceArea(patient) !== serviceFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const location = patientLocationLabels[patient.id] ?? getPatientServiceArea(patient);
      const haystackByMode: Record<SearchMode, string> = {
        all: [
          patient.fullName,
          patient.identification,
          patient.medicalRecordNumber,
          patient.assignedProfessional,
          location,
          getPatientServiceArea(patient),
        ].join(" "),
        name: patient.fullName,
        document: patient.identification,
        hc: patient.medicalRecordNumber,
        room: location,
        professional: patient.assignedProfessional,
      };

      return normalizeSearch(haystackByMode[searchMode]).includes(normalizedSearch);
    });
  }, [deferredSearch, searchMode, serviceFilter]);

  return (
    <ModulePage
      title="Pacientes"
      subtitle="Busca primero al paciente por nombre, cedula, HC, sala o profesional y luego abre su ficha clinica."
      actions={
        <Link
          href="/portal/professional/patients/ingreso"
          className="rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          Nuevo ingreso
        </Link>
      }
    >
      <section className="mx-auto max-w-5xl space-y-4">
        <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Busqueda de paciente
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Localiza al paciente antes de abrir su ficha
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Esta pantalla solo sirve para buscar. Una vez seleccionado el paciente, se abre
                directamente la ficha clinica completa.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <SimpleMetric label="Activos" value={mockPatients.length} />
              <SimpleMetric
                label="En observacion"
                value={mockPatients.filter((patient) => patient.currentStatus === "En observacion").length}
              />
              <SimpleMetric
                label="Criticos"
                value={mockPatients.filter((patient) => patient.currentStatus === "Critico").length}
                tone="danger"
              />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {searchModes.map((mode) => (
                <SearchModeChip
                  key={mode.id}
                  label={mode.label}
                  active={searchMode === mode.id}
                  onClick={() => setSearchMode(mode.id)}
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Buscar
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchModes.find((mode) => mode.id === searchMode)?.placeholder}
                  className={fieldClassName}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Servicio
                </span>
                <select
                  value={serviceFilter}
                  onChange={(event) =>
                    setServiceFilter(event.target.value as "all" | ServiceArea)
                  }
                  className={fieldClassName}
                >
                  <option value="all">Todos</option>
                  {serviceAreas.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">Resultados</p>
              <p className="text-sm text-slate-500">
                {filteredPatients.length} paciente{filteredPatients.length === 1 ? "" : "s"} encontrado
                {filteredPatients.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              No hay pacientes que coincidan con la busqueda actual.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredPatients.map((patient) => (
                <PatientSearchCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </article>
      </section>
    </ModulePage>
  );
}

function PatientSearchCard({ patient }: { patient: PatientRecord }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold text-slate-950">{patient.fullName}</p>
            <RiskBadge risk={patient.riskLevel} />
            <TriageBadge triage={patient.triageColor} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {patient.identification} · HC {patient.medicalRecordNumber}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {patient.primaryDiagnosis}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              Sala: {patientLocationLabels[patient.id] ?? "Sin ubicacion"}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              Servicio: {getPatientServiceArea(patient)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              Profesional: {patient.assignedProfessional}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              Estado: {patient.currentStatus}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/portal/professional/patients/${patient.id}`}
            className="rounded-[18px] bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Abrir ficha
          </Link>
          <Link
            href={`/portal/professional/patients/${patient.id}?tab=msp_forms`}
            className="rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            MSP
          </Link>
        </div>
      </div>
    </article>
  );
}

function SearchModeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-sky-300 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SimpleMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "danger";
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={["mt-2 text-3xl font-semibold", tone === "danger" ? "text-rose-600" : "text-slate-950"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const fieldClassName =
  "w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none";
