"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, RiskBadge, StatCard, TriageBadge } from "../_components/clinical-ui";
import BuscadorPaciente from "@/components/BuscadorPaciente";
import type { RegisteredPatientSummary } from "@/types/patient-intake";
import {
  getCriticalPatients,
  getPatientFunctionalPatterns,
  getPatientServiceArea,
  getPatientsWithAlerts,
  mockPatients,
  type ServiceArea,
} from "../_data/clinical-mock-data";

type AgeFilter = "all" | "under18" | "18to39" | "40to64" | "65plus";
type SortBy = "name" | "last_control" | "risk" | "age" | "recent";

const riskOrder: Record<string, number> = {
  alto: 3,
  medio: 2,
  bajo: 1,
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState<"all" | "Femenino" | "Masculino">("all");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Critico" | "En observacion" | "Estable" | "Alta proxima"
  >("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "alto" | "medio" | "bajo">("all");
  const [careFilter, setCareFilter] = useState<"all" | "Hospitalizacion" | "Ambulatorio">("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceArea>("all");
  const [professionalFilter, setProfessionalFilter] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [quickMode, setQuickMode] = useState<"all" | "alerts" | "recent" | "critical">("all");
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientSummary[]>([]);

  const professionals = useMemo(
    () => Array.from(new Set(mockPatients.map((patient) => patient.assignedProfessional))),
    []
  );

  const serviceAreas = useMemo(
    () => Array.from(new Set(mockPatients.map((patient) => getPatientServiceArea(patient)))),
    []
  );

  const recentPatientIds = useMemo(
    () =>
      [...mockPatients]
        .sort((a, b) => b.lastControlAt.localeCompare(a.lastControlAt))
        .slice(0, 6)
        .map((patient) => patient.id),
    []
  );

  const filteredPatients = useMemo(() => {
    let items = [...mockPatients];

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch.length > 0) {
      items = items.filter((patient) => {
        const haystack = [
          patient.firstName,
          patient.lastName,
          patient.fullName,
          patient.identification,
          patient.code,
          patient.medicalRecordNumber,
          getPatientServiceArea(patient),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
    }

    if (sexFilter !== "all") {
      items = items.filter((patient) => patient.sex === sexFilter);
    }

    if (ageFilter !== "all") {
      items = items.filter((patient) => {
        if (ageFilter === "under18") {
          return patient.age < 18;
        }
        if (ageFilter === "18to39") {
          return patient.age >= 18 && patient.age <= 39;
        }
        if (ageFilter === "40to64") {
          return patient.age >= 40 && patient.age <= 64;
        }
        return patient.age >= 65;
      });
    }

    if (statusFilter !== "all") {
      items = items.filter((patient) => patient.currentStatus === statusFilter);
    }

    if (riskFilter !== "all") {
      items = items.filter((patient) => patient.riskLevel === riskFilter);
    }

    if (careFilter !== "all") {
      items = items.filter((patient) => patient.careMode === careFilter);
    }

    if (serviceFilter !== "all") {
      items = items.filter((patient) => getPatientServiceArea(patient) === serviceFilter);
    }

    if (professionalFilter !== "all") {
      items = items.filter((patient) => patient.assignedProfessional === professionalFilter);
    }

    if (quickMode === "alerts") {
      items = items.filter((patient) => patient.activeAlerts.length > 0);
    }

    if (quickMode === "recent") {
      items = items.filter((patient) => recentPatientIds.includes(patient.id));
    }

    if (quickMode === "critical") {
      items = items.filter(
        (patient) => patient.riskLevel === "alto" || patient.currentStatus === "Critico"
      );
    }

    items.sort((a, b) => {
      if (sortBy === "name") {
        return a.fullName.localeCompare(b.fullName);
      }
      if (sortBy === "last_control" || sortBy === "recent") {
        return b.lastControlAt.localeCompare(a.lastControlAt);
      }
      if (sortBy === "risk") {
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return b.age - a.age;
    });

    return items;
  }, [
    ageFilter,
    careFilter,
    professionalFilter,
    quickMode,
    recentPatientIds,
    riskFilter,
    search,
    serviceFilter,
    sexFilter,
    sortBy,
    statusFilter,
  ]);

  const criticalPatients = getCriticalPatients();
  const patientsWithAlerts = getPatientsWithAlerts();

  useEffect(() => {
    const loadRegisteredPatients = async () => {
      try {
        const response = await fetch("/api/paciente/registro", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          data?: RegisteredPatientSummary[];
        };

        if (response.ok && payload.data) {
          setRegisteredPatients(payload.data);
        }
      } catch {
        // Ignore load errors in list page.
      }
    };

    loadRegisteredPatients();
  }, []);

  return (
    <ModulePage
      title="Pacientes"
      subtitle="Busqueda, filtros clinicos y acceso a ficha integral del paciente con enfoque profesional."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            Ingresar paciente
          </Link>
          <Link
            href="/portal/professional"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver a inicio
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total pacientes" value={mockPatients.length} hint="Base clinica activa" />
        <StatCard label="Pacientes criticos" value={criticalPatients.length} hint="Riesgo alto o estado critico" />
        <StatCard label="Con alertas" value={patientsWithAlerts.length} hint="Alertas clinicas abiertas" />
        <StatCard
          label="Pendientes del dia"
          value={mockPatients.filter((patient) => patient.currentStatus === "En observacion").length}
          hint="En seguimiento activo"
        />
      </div>

      <BuscadorPaciente />

      <Panel
        title="Pacientes ingresados recientemente"
        subtitle="Registros creados desde modulo de ingreso clinico"
      >
        {registeredPatients.length === 0 ? (
          <p className="text-xs text-slate-500">Aun no hay pacientes creados con el nuevo flujo de ingreso.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">HC</th>
                  <th className="px-3 py-2 font-semibold">Paciente</th>
                  <th className="px-3 py-2 font-semibold">Documento</th>
                  <th className="px-3 py-2 font-semibold">Motivo</th>
                  <th className="px-3 py-2 font-semibold">MSP</th>
                  <th className="px-3 py-2 text-center font-semibold">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registeredPatients.slice(0, 6).map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2 text-slate-700">{entry.medicalRecordNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{entry.fullName}</td>
                    <td className="px-3 py-2 text-slate-700">{entry.documentNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{entry.consultationReason}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {entry.mspScore}% · {entry.criticalPendingCount} pendientes
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <Link
                        href={`/portal/professional/patients/ingreso/${entry.id}`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold leading-none text-slate-700 hover:bg-slate-100"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Buscador y filtros"
        subtitle="Nombre, cedula, historia clinica, estado, riesgo, servicio y profesional"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Buscar (nombre, apellido, cedula, HC, codigo)
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej. Maria Lopez o HC-2026-0001"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>

          <SelectField
            label="Sexo"
            value={sexFilter}
            onChange={(value) => setSexFilter(value as "all" | "Femenino" | "Masculino")}
            options={[
              { value: "all", label: "Todos" },
              { value: "Femenino", label: "Femenino" },
              { value: "Masculino", label: "Masculino" },
            ]}
          />

          <SelectField
            label="Edad"
            value={ageFilter}
            onChange={(value) => setAgeFilter(value as AgeFilter)}
            options={[
              { value: "all", label: "Todas" },
              { value: "under18", label: "< 18" },
              { value: "18to39", label: "18 - 39" },
              { value: "40to64", label: "40 - 64" },
              { value: "65plus", label: ">= 65" },
            ]}
          />

          <SelectField
            label="Estado clinico"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(
                value as "all" | "Critico" | "En observacion" | "Estable" | "Alta proxima"
              )
            }
            options={[
              { value: "all", label: "Todos" },
              { value: "Critico", label: "Critico" },
              { value: "En observacion", label: "En observacion" },
              { value: "Estable", label: "Estable" },
              { value: "Alta proxima", label: "Alta proxima" },
            ]}
          />

          <SelectField
            label="Prioridad / riesgo"
            value={riskFilter}
            onChange={(value) => setRiskFilter(value as "all" | "alto" | "medio" | "bajo")}
            options={[
              { value: "all", label: "Todos" },
              { value: "alto", label: "Alto" },
              { value: "medio", label: "Medio" },
              { value: "bajo", label: "Bajo" },
            ]}
          />

          <SelectField
            label="Hospitalizacion / ambulatorio"
            value={careFilter}
            onChange={(value) => setCareFilter(value as "all" | "Hospitalizacion" | "Ambulatorio")}
            options={[
              { value: "all", label: "Todos" },
              { value: "Hospitalizacion", label: "Hospitalizacion" },
              { value: "Ambulatorio", label: "Ambulatorio" },
            ]}
          />

          <SelectField
            label="Servicio / area"
            value={serviceFilter}
            onChange={(value) => setServiceFilter(value as "all" | ServiceArea)}
            options={[{ value: "all", label: "Todos" }, ...serviceAreas.map((area) => ({ value: area, label: area }))]}
          />

          <SelectField
            label="Profesional asignado"
            value={professionalFilter}
            onChange={setProfessionalFilter}
            options={[{ value: "all", label: "Todos" }, ...professionals.map((name) => ({ value: name, label: name }))]}
          />

          <SelectField
            label="Ordenar por"
            value={sortBy}
            onChange={(value) => setSortBy(value as SortBy)}
            options={[
              { value: "recent", label: "Mas recientes" },
              { value: "name", label: "Nombre" },
              { value: "last_control", label: "Ultimo control" },
              { value: "risk", label: "Gravedad" },
              { value: "age", label: "Edad" },
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <QuickModeButton active={quickMode === "all"} onClick={() => setQuickMode("all")} label="Todos" />
          <QuickModeButton
            active={quickMode === "recent"}
            onClick={() => setQuickMode("recent")}
            label="Recientes"
          />
          <QuickModeButton
            active={quickMode === "alerts"}
            onClick={() => setQuickMode("alerts")}
            label="Con alertas"
          />
          <QuickModeButton
            active={quickMode === "critical"}
            onClick={() => setQuickMode("critical")}
            label="Criticos"
          />
        </div>
      </Panel>

      <Panel title="Listado de pacientes" subtitle={`Resultados visibles: ${filteredPatients.length}`}>
        <div className="hidden overflow-x-auto xl:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Paciente</th>
                <th className="px-3 py-2 font-semibold">Edad / sexo</th>
                <th className="px-3 py-2 font-semibold">Diagnostico principal</th>
                <th className="px-3 py-2 font-semibold">Estado / riesgo</th>
                <th className="px-3 py-2 font-semibold">Servicio</th>
                <th className="px-3 py-2 font-semibold">Ultima actualizacion</th>
                <th className="px-3 py-2 font-semibold">Profesional</th>
                <th className="px-3 py-2 font-semibold">Patron alterado</th>
                <th className="px-3 py-2 text-center font-semibold">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      {patient.code} · HC {patient.medicalRecordNumber}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {patient.age} anios · {patient.sex}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{patient.primaryDiagnosis}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RiskBadge risk={patient.riskLevel} />
                      <TriageBadge triage={patient.triageColor} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{getPatientServiceArea(patient)}</td>
                  <td className="px-3 py-2 text-slate-600">{patient.lastControlAt}</td>
                  <td className="px-3 py-2 text-slate-600">{patient.assignedProfessional}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {getPatientFunctionalPatterns(patient).slice(0, 2).map((pattern) => (
                        <span
                          key={pattern}
                          className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center align-middle">
                    <Link
                      href={`/portal/professional/patients/${patient.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-slate-700 hover:bg-slate-100"
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 xl:hidden">
          {filteredPatients.map((patient) => (
            <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-xs text-slate-600">{patient.primaryDiagnosis}</p>
                </div>
                <TriageBadge triage={patient.triageColor} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span>{patient.code}</span>
                <span>·</span>
                <span>{patient.age} anios</span>
                <span>·</span>
                <span>{getPatientServiceArea(patient)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {getPatientFunctionalPatterns(patient).map((pattern) => (
                  <span
                    key={pattern}
                    className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <RiskBadge risk={patient.riskLevel} />
                <Link
                  href={`/portal/professional/patients/${patient.id}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-slate-700 hover:bg-slate-100"
                >
                  Ver ficha
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <p className="text-xs text-slate-500">No hay pacientes que coincidan con los filtros.</p>
        )}
      </Panel>
    </ModulePage>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-sky-500 focus:bg-white focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function QuickModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-[11px] font-medium transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
