"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, RiskBadge, TriageBadge } from "../_components/clinical-ui";
import type { PatientRecord, ServiceArea } from "../_data/clinical-mock-data";
import {
  getCriticalPatients,
  getPatientServiceArea,
  getPatientsWithAlerts,
  mockPatients,
} from "../_data/clinical-mock-data";
import BuscadorPaciente from "@/components/BuscadorPaciente";
import type { RegisteredPatientSummary } from "@/types/patient-intake";

type SortBy = "name" | "last_control" | "risk" | "recent";
type SearchMode = "all" | "patient" | "document" | "hc" | "room" | "professional";
type ModuleIconId =
  | "record"
  | "vitals"
  | "balance"
  | "medication"
  | "kardex"
  | "nursing"
  | "medical"
  | "msp";

const riskOrder: Record<string, number> = {
  alto: 3,
  medio: 2,
  bajo: 1,
};

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
  helper: string;
  placeholder: string;
}> = [
  {
    id: "all",
    label: "Todo",
    helper: "Nombre, documento, HC, sala, servicio o profesional.",
    placeholder: "Ej. Maria Lopez, HC-2026-0001, sala de choque",
  },
  {
    id: "patient",
    label: "Paciente",
    helper: "Busqueda por nombres y apellidos.",
    placeholder: "Ej. Maria Lopez",
  },
  {
    id: "document",
    label: "Documento",
    helper: "Busqueda por cedula o identificacion.",
    placeholder: "Ej. 1722334412",
  },
  {
    id: "hc",
    label: "Historia clinica",
    helper: "Busqueda por HC o codigo interno.",
    placeholder: "Ej. HC-2026-0001",
  },
  {
    id: "room",
    label: "Sala / ubicacion",
    helper: "Busqueda por sala, box, consultorio o servicio.",
    placeholder: "Ej. habitacion 204, observacion, emergencia",
  },
  {
    id: "professional",
    label: "Profesional",
    helper: "Busqueda por responsable asignado.",
    placeholder: "Ej. Dra. Carolina Mena",
  },
];

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Critico" | "En observacion" | "Estable" | "Alta proxima"
  >("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "alto" | "medio" | "bajo">("all");
  const [careFilter, setCareFilter] = useState<"all" | "Hospitalizacion" | "Ambulatorio">("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceArea>("all");
  const [professionalFilter, setProfessionalFilter] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [quickMode, setQuickMode] = useState<"all" | "alerts" | "recent" | "critical">("all");
  const [selectedPatientId, setSelectedPatientId] = useState(mockPatients[0]?.id ?? "");
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
    const normalizedSearch = normalizeSearch(search);

    if (normalizedSearch) {
      items = items.filter((patient) => matchesPatientSearch(patient, normalizedSearch, searchMode));
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
      if (sortBy === "risk") {
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return b.lastControlAt.localeCompare(a.lastControlAt);
    });

    return items;
  }, [
    careFilter,
    professionalFilter,
    quickMode,
    recentPatientIds,
    riskFilter,
    search,
    searchMode,
    serviceFilter,
    sortBy,
    statusFilter,
  ]);

  const filteredRegisteredPatients = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);
    const items = registeredPatients.filter((entry) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        entry.fullName,
        entry.documentNumber,
        entry.medicalRecordNumber,
        entry.consultationReason,
        entry.principalDiagnosis,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    return normalizedSearch ? items : items.slice(0, 4);
  }, [registeredPatients, search]);

  const registeredMatchByPatientId = useMemo(() => {
    return new Map(
      mockPatients.map((patient) => {
        const match =
          registeredPatients.find(
            (entry) =>
              normalizeSearch(entry.documentNumber) === normalizeSearch(patient.identification) ||
              normalizeSearch(entry.medicalRecordNumber) ===
                normalizeSearch(patient.medicalRecordNumber)
          ) ?? null;

        return [patient.id, match] as const;
      })
    );
  }, [registeredPatients]);

  const effectiveSelectedPatientId =
    filteredPatients.find((patient) => patient.id === selectedPatientId)?.id ??
    filteredPatients[0]?.id ??
    "";

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === effectiveSelectedPatientId) ??
    filteredPatients[0] ??
    null;

  const selectedPatientRegisteredMatch = selectedPatient
    ? registeredMatchByPatientId.get(selectedPatient.id) ?? null
    : null;

  const activeSearchMode = searchModes.find((mode) => mode.id === searchMode) ?? searchModes[0];
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

  const clearFilters = () => {
    setSearch("");
    setSearchMode("all");
    setStatusFilter("all");
    setRiskFilter("all");
    setCareFilter("all");
    setServiceFilter("all");
    setProfessionalFilter("all");
    setSortBy("recent");
    setQuickMode("all");
  };

  const patientModules =
    selectedPatient === null
      ? []
      : buildPatientModules(selectedPatient, selectedPatientRegisteredMatch);

  return (
    <ModulePage
      title="Centro de pacientes"
      subtitle="Explora pacientes, selecciona un caso activo y navega por sus modulos clinicos desde una vista tipo panel."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            Nuevo ingreso
          </Link>
          <Link
            href="/portal/professional/reports"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Formularios MSP
          </Link>
          <Link
            href="/portal/professional"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Inicio
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Panel
            title="Monitor"
            subtitle="Vista rapida del area de pacientes"
          >
            <div className="grid grid-cols-2 gap-3">
              <MiniMetricCard label="Activos" value={mockPatients.length} tone="slate" />
              <MiniMetricCard label="Criticos" value={criticalPatients.length} tone="red" />
              <MiniMetricCard label="Alertas" value={patientsWithAlerts.length} tone="amber" />
              <MiniMetricCard label="MSP" value={registeredPatients.length} tone="sky" />
            </div>
          </Panel>

          <Panel
            title="Explorador de pacientes"
            subtitle="Busca primero al paciente y luego abre su espacio de trabajo"
          >
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Buscar paciente
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeSearchMode.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </label>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <div className="grid grid-cols-2 gap-2">
                {searchModes.map((mode) => (
                  <SearchModeButton
                    key={mode.id}
                    active={searchMode === mode.id}
                    label={mode.label}
                    onClick={() => setSearchMode(mode.id)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Criterio activo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{activeSearchMode.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{activeSearchMode.helper}</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Filtros rapidos
              </p>
              <div className="flex flex-wrap gap-2">
                <QuickFilter active={quickMode === "all"} label="Todos" onClick={() => setQuickMode("all")} />
                <QuickFilter
                  active={quickMode === "recent"}
                  label="Recientes"
                  onClick={() => setQuickMode("recent")}
                />
                <QuickFilter
                  active={quickMode === "alerts"}
                  label="Con alertas"
                  onClick={() => setQuickMode("alerts")}
                />
                <QuickFilter
                  active={quickMode === "critical"}
                  label="Criticos"
                  onClick={() => setQuickMode("critical")}
                />
              </div>
            </div>

            <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                Filtros avanzados
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3">
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
                  label="Riesgo"
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
                  label="Modalidad"
                  value={careFilter}
                  onChange={(value) => setCareFilter(value as "all" | "Hospitalizacion" | "Ambulatorio")}
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "Hospitalizacion", label: "Hospitalizacion" },
                    { value: "Ambulatorio", label: "Ambulatorio" },
                  ]}
                />
                <SelectField
                  label="Servicio"
                  value={serviceFilter}
                  onChange={(value) => setServiceFilter(value as "all" | ServiceArea)}
                  options={[
                    { value: "all", label: "Todos" },
                    ...serviceAreas.map((area) => ({ value: area, label: area })),
                  ]}
                />
                <SelectField
                  label="Responsable"
                  value={professionalFilter}
                  onChange={setProfessionalFilter}
                  options={[
                    { value: "all", label: "Todos" },
                    ...professionals.map((professional) => ({
                      value: professional,
                      label: professional,
                    })),
                  ]}
                />
                <SelectField
                  label="Orden"
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortBy)}
                  options={[
                    { value: "recent", label: "Mas recientes" },
                    { value: "name", label: "Nombre" },
                    { value: "last_control", label: "Ultimo control" },
                    { value: "risk", label: "Gravedad" },
                  ]}
                />
              </div>
            </details>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Resultado
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{filteredPatients.length}</p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Limpiar
              </button>
            </div>
          </Panel>

          <Panel
            title={`Pacientes (${filteredPatients.length})`}
            subtitle="Selecciona un paciente para cargar su tablero"
          >
            {filteredPatients.length === 0 ? (
              <p className="text-sm text-slate-600">
                No hay pacientes que coincidan con los filtros actuales.
              </p>
            ) : (
              <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
                {filteredPatients.map((patient) => {
                  const active = patient.id === effectiveSelectedPatientId;
                  const match = registeredMatchByPatientId.get(patient.id) ?? null;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={[
                        "w-full rounded-2xl border px-3 py-3 text-left transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{patient.fullName}</p>
                          <p className={["mt-1 text-[11px]", active ? "text-white/70" : "text-slate-500"].join(" ")}>
                            HC {patient.medicalRecordNumber}
                          </p>
                          <p className={["mt-2 text-[11px]", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                            {getPatientLocation(patient)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <TriageBadge triage={patient.triageColor} />
                          <PatientMatchBadge match={match} compact />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <details className="rounded-2xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              Alta rapida de paciente nuevo
            </summary>
            <p className="mt-1 text-xs text-slate-500">
              Inicia aqui el flujo de ingreso cuando el paciente no existe todavia.
            </p>
            <div className="mt-3">
              <BuscadorPaciente />
            </div>
          </details>
        </aside>

        <section className="space-y-4">
          {selectedPatient ? (
            <PatientHero
              patient={selectedPatient}
              location={getPatientLocation(selectedPatient)}
              service={getPatientServiceArea(selectedPatient)}
              match={selectedPatientRegisteredMatch}
            />
          ) : (
            <Panel title="Sin paciente activo" subtitle="Selecciona un paciente desde el explorador lateral.">
              <p className="text-sm text-slate-600">
                El tablero de trabajo se activara cuando selecciones un paciente.
              </p>
            </Panel>
          )}

          <Panel
            title="Modulos del paciente"
            subtitle="Accesos visuales para entrar directo a las funciones clinicas del paciente activo"
          >
            {!selectedPatient ? (
              <p className="text-sm text-slate-600">No hay un paciente seleccionado.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {patientModules.map((module) => (
                  <ModuleTile
                    key={module.title}
                    title={module.title}
                    description={module.description}
                    href={module.href}
                    tone={module.tone}
                    badge={module.badge}
                    icon={module.icon}
                  />
                ))}
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Panel
              title="Resumen clinico"
              subtitle="Contexto rapido del paciente seleccionado antes de entrar a un modulo"
            >
              {!selectedPatient ? (
                <p className="text-sm text-slate-600">Sin paciente seleccionado.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoBlock label="Paciente" value={selectedPatient.fullName} />
                    <InfoBlock label="Diagnostico principal" value={selectedPatient.primaryDiagnosis} />
                    <InfoBlock label="Servicio" value={getPatientServiceArea(selectedPatient)} />
                    <InfoBlock label="Ultimo control" value={selectedPatient.lastControlAt} />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Alertas y estado actual
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RiskBadge risk={selectedPatient.riskLevel} />
                      <TriageBadge triage={selectedPatient.triageColor} />
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {selectedPatient.currentStatus}
                      </span>
                      {selectedPatient.activeAlerts.length === 0 ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Sin alertas activas
                        </span>
                      ) : (
                        selectedPatient.activeAlerts.map((alert) => (
                          <span
                            key={alert}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
                          >
                            {alert}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <SummaryStrip label="Sala / ubicacion" value={getPatientLocation(selectedPatient)} />
                    <SummaryStrip label="Profesional responsable" value={selectedPatient.assignedProfessional} />
                    <SummaryStrip label="Documento" value={selectedPatient.identification} />
                  </div>
                </div>
              )}
            </Panel>

            <div className="space-y-4">
              <Panel
                title="Estado MSP"
                subtitle="Disponibilidad del expediente estructurado y formularios"
              >
                {!selectedPatient ? (
                  <p className="text-sm text-slate-600">Selecciona un paciente para revisar su estado MSP.</p>
                ) : selectedPatientRegisteredMatch ? (
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Expediente activo
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-emerald-900">
                        {selectedPatientRegisteredMatch.mspScore}%
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        {selectedPatientRegisteredMatch.criticalPendingCount} pendientes criticos
                      </p>
                    </div>

                    <CompactRow label="Historia clinica" value={selectedPatientRegisteredMatch.medicalRecordNumber} />
                    <CompactRow label="Motivo" value={selectedPatientRegisteredMatch.consultationReason} />

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/portal/professional/patients/ingreso/${selectedPatientRegisteredMatch.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Abrir expediente
                      </Link>
                      <Link
                        href={`/portal/professional/reports?patientId=${selectedPatientRegisteredMatch.id}`}
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                      >
                        Formularios
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        MSP pendiente
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-900">
                        Este paciente todavia no tiene expediente estructurado.
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        Sin el ingreso estructurado no podras emitir 008 ni otros formularios oficiales.
                      </p>
                    </div>
                    <Link
                      href="/portal/professional/patients/ingreso"
                      className="inline-flex rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      Crear ingreso
                    </Link>
                  </div>
                )}
              </Panel>

              <Panel
                title="Expedientes MSP recientes"
                subtitle="Acceso rapido a pacientes con formularios disponibles"
              >
                {registeredPatients.length === 0 ? (
                  <p className="text-sm text-slate-600">Aun no hay expedientes MSP registrados.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredRegisteredPatients.map((entry) => (
                      <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{entry.fullName}</p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              HC {entry.medicalRecordNumber}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {entry.mspScore}%
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{entry.consultationReason}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={`/portal/professional/patients/ingreso/${entry.id}`}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Expediente
                          </Link>
                          <Link
                            href={`/portal/professional/reports?patientId=${entry.id}`}
                            className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                          >
                            Formularios
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </section>
      </div>
    </ModulePage>
  );
}

function buildPatientModules(
  patient: PatientRecord,
  match: RegisteredPatientSummary | null
) {
  return [
    {
      title: "Ficha clinica",
      description: "Resumen integral del paciente y navegacion por submodulos.",
      href: `/portal/professional/patients/${patient.id}`,
      tone: "dark" as const,
      icon: "record" as ModuleIconId,
      badge: "Principal",
    },
    {
      title: "Signos vitales",
      description: "Control y seguimiento de constantes del paciente.",
      href: `/portal/professional/patients/${patient.id}?tab=vitals`,
      tone: "white" as const,
      icon: "vitals" as ModuleIconId,
      badge: null,
    },
    {
      title: "Balance hidrico",
      description: "Ingresos, egresos y resumen por turno.",
      href: `/portal/professional/patients/${patient.id}?tab=fluid_balance`,
      tone: "white" as const,
      icon: "balance" as ModuleIconId,
      badge: null,
    },
    {
      title: "Medicacion",
      description: "Plan farmacologico y administraciones registradas.",
      href: `/portal/professional/patients/${patient.id}?tab=medication`,
      tone: "white" as const,
      icon: "medication" as ModuleIconId,
      badge: null,
    },
    {
      title: "Kardex",
      description: "Indicaciones, cuidados y actividades del paciente.",
      href: `/portal/professional/patients/${patient.id}?tab=kardex`,
      tone: "white" as const,
      icon: "kardex" as ModuleIconId,
      badge: null,
    },
    {
      title: "Reporte de enfermeria",
      description: "Notas y reporte de turno del area de enfermeria.",
      href: `/portal/professional/patients/${patient.id}?tab=nursing_report`,
      tone: "white" as const,
      icon: "nursing" as ModuleIconId,
      badge: null,
    },
    {
      title: "Reporte medico",
      description: "Evolucion, observaciones y notas medicas.",
      href: `/portal/professional/patients/${patient.id}?tab=medical_notes`,
      tone: "white" as const,
      icon: "medical" as ModuleIconId,
      badge: null,
    },
    {
      title: "Formularios MSP",
      description: match
        ? "Abrir formulario 008 y demas documentos oficiales disponibles."
        : "Requiere crear primero el expediente estructurado MSP.",
      href: match
        ? `/portal/professional/patients/${patient.id}?tab=msp_forms`
        : "/portal/professional/patients/ingreso",
      tone: "sky" as const,
      icon: "msp" as ModuleIconId,
      badge: match ? "Disponible" : "Pendiente",
    },
  ];
}

function matchesPatientSearch(patient: PatientRecord, normalizedSearch: string, searchMode: SearchMode) {
  const service = getPatientServiceArea(patient);
  const location = getPatientLocation(patient);
  const baseHaystack = [
    patient.firstName,
    patient.lastName,
    patient.fullName,
    patient.identification,
    patient.medicalRecordNumber,
    patient.code,
    patient.assignedProfessional,
    service,
    location,
    patient.primaryDiagnosis,
  ]
    .join(" ")
    .toLowerCase();

  if (searchMode === "all") {
    return baseHaystack.includes(normalizedSearch);
  }

  if (searchMode === "patient") {
    return [patient.firstName, patient.lastName, patient.fullName]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  }

  if (searchMode === "document") {
    return patient.identification.toLowerCase().includes(normalizedSearch);
  }

  if (searchMode === "hc") {
    return [patient.medicalRecordNumber, patient.code].join(" ").toLowerCase().includes(normalizedSearch);
  }

  if (searchMode === "room") {
    return [service, location].join(" ").toLowerCase().includes(normalizedSearch);
  }

  return patient.assignedProfessional.toLowerCase().includes(normalizedSearch);
}

function getPatientLocation(patient: PatientRecord) {
  return patientLocationLabels[patient.id] ?? `${getPatientServiceArea(patient)} · ubicacion pendiente`;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function PatientHero({
  patient,
  location,
  service,
  match,
}: {
  patient: PatientRecord;
  location: string;
  service: string;
  match: RegisteredPatientSummary | null;
}) {
  return (
    <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#132b4c_52%,#1d4ed8_100%)] p-6 text-white shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Paciente activo
          </p>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-xl font-semibold text-white ring-1 ring-white/15">
              {getInitials(patient.fullName)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold">{patient.fullName}</h2>
              <p className="mt-1 text-sm text-white/75">
                {patient.age} anios · {patient.sex} · HC {patient.medicalRecordNumber}
              </p>
              <p className="mt-3 max-w-2xl text-sm text-white/85">
                Diagnostico principal: <span className="font-semibold text-white">{patient.primaryDiagnosis}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge risk={patient.riskLevel} />
            <TriageBadge triage={patient.triageColor} />
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
              {patient.currentStatus}
            </span>
            {match ? (
              <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                MSP disponible
              </span>
            ) : (
              <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                MSP pendiente
              </span>
            )}
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[420px]">
          <HeroMetric label="Sala / ubicacion" value={location} />
          <HeroMetric label="Servicio" value={service} />
          <HeroMetric label="Responsable" value={patient.assignedProfessional} />
          <HeroMetric label="Ultimo control" value={patient.lastControlAt} />
        </div>
      </div>
    </article>
  );
}

function MiniMetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "slate" | "red" | "amber" | "sky";
}) {
  const toneClassName =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "sky"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClassName}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SearchModeButton({
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
        "rounded-2xl border px-3 py-2 text-left text-[11px] font-semibold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function QuickFilter({
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
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </button>
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
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
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

function ModuleTile({
  title,
  description,
  href,
  tone,
  badge,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  tone: "dark" | "white" | "sky";
  badge: string | null;
  icon: ModuleIconId;
}) {
  const toneClassName =
    tone === "dark"
      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50";

  const detailClassName = tone === "dark" ? "text-white/70" : tone === "sky" ? "text-sky-800/80" : "text-slate-500";
  const iconClassName = tone === "dark" ? "bg-white/10 text-white" : tone === "sky" ? "bg-white text-sky-700" : "bg-slate-100 text-slate-700";
  const badgeClassName =
    tone === "dark"
      ? "border-white/15 bg-white/10 text-white"
      : "border-slate-200 bg-white text-slate-600";

  return (
    <Link
      href={href}
      className={`group rounded-[28px] border p-4 transition ${toneClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClassName}`}>
          <ModuleIcon icon={icon} />
        </div>
        {badge ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeClassName}`}>
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-base font-semibold">{title}</p>
      <p className={`mt-2 text-xs leading-6 ${detailClassName}`}>{description}</p>
    </Link>
  );
}

function ModuleIcon({ icon }: { icon: ModuleIconId }) {
  if (icon === "record") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  if (icon === "vitals") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12h4l2-4 4 8 2-4h6" />
        <path d="M12 21c-4-3-7-5.6-7-9a4 4 0 0 1 7-2.4A4 4 0 0 1 19 12c0 3.4-3 6-7 9Z" />
      </svg>
    );
  }

  if (icon === "balance") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3s5 5.2 5 9a5 5 0 1 1-10 0c0-3.8 5-9 5-9Z" />
        <path d="M9 14c.5 1.6 1.6 2.4 3 2.4s2.5-.8 3-2.4" />
      </svg>
    );
  }

  if (icon === "medication") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 8.5 11.5 4a3 3 0 1 1 4.2 4.2L11.2 12.7A3 3 0 1 1 7 8.5Z" />
        <path d="M9 6.5 14.5 12" />
        <path d="M5 19h14" />
      </svg>
    );
  }

  if (icon === "kardex") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4h10l2 3v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    );
  }

  if (icon === "nursing") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4v16M4 12h16" />
        <circle cx="12" cy="12" r="7" />
      </svg>
    );
  }

  if (icon === "medical") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V8a4 4 0 0 1 4-4Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
        <path d="M18 7h4M20 5v4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4h7l5 5v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M14 4v5h5" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm text-slate-900">{value}</p>
    </div>
  );
}

function SummaryStrip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function PatientMatchBadge({
  match,
  compact = false,
}: {
  match: RegisteredPatientSummary | null;
  compact?: boolean;
}) {
  const className = compact
    ? "rounded-full border px-2 py-0.5 text-[10px] font-semibold"
    : "rounded-full border px-2.5 py-1 text-[11px] font-semibold";

  if (!match) {
    return <span className={`${className} border-amber-200 bg-amber-50 text-amber-700`}>MSP pendiente</span>;
  }

  return <span className={`${className} border-emerald-200 bg-emerald-50 text-emerald-700`}>MSP disponible</span>;
}

function CompactRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-xs text-slate-700">{value}</span>
    </div>
  );
}
