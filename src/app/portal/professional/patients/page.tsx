"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, RiskBadge, StatCard, TriageBadge } from "../_components/clinical-ui";
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
    label: "Sala",
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

    return normalizedSearch ? items : items.slice(0, 5);
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

  const selectedPatientActions = selectedPatient
    ? [
        {
          title: "Abrir ficha clinica",
          detail: "Entrar al expediente integral del paciente.",
          href: `/portal/professional/patients/${selectedPatient.id}`,
          tone: "dark" as const,
        },
        {
          title: "Signos vitales",
          detail: "Registrar y revisar controles recientes.",
          href: `/portal/professional/patients/${selectedPatient.id}?tab=vitals`,
          tone: "default" as const,
        },
        {
          title: "Balance hidrico",
          detail: "Control de ingresos, egresos y balance.",
          href: `/portal/professional/patients/${selectedPatient.id}?tab=fluid_balance`,
          tone: "default" as const,
        },
        {
          title: "Kardex",
          detail: "Indicaciones, administraciones y cuidados.",
          href: `/portal/professional/patients/${selectedPatient.id}?tab=kardex`,
          tone: "default" as const,
        },
        {
          title: "Reporte medico",
          detail: "Notas y evolucion medica del paciente.",
          href: `/portal/professional/patients/${selectedPatient.id}?tab=medical_notes`,
          tone: "default" as const,
        },
        {
          title: selectedPatientRegisteredMatch ? "Formularios MSP" : "Crear expediente MSP",
          detail: selectedPatientRegisteredMatch
            ? "Abrir 008 y demas formularios disponibles."
            : "Este paciente aun no tiene ingreso estructurado.",
          href: selectedPatientRegisteredMatch
            ? `/portal/professional/patients/${selectedPatient.id}?tab=msp_forms`
            : "/portal/professional/patients/ingreso",
          tone: "sky" as const,
        },
      ]
    : [];

  return (
    <ModulePage
      title="Pacientes"
      subtitle="Busca, selecciona y trabaja al paciente desde una vista mas ordenada, con acceso directo a su ficha clinica y formularios MSP."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            Ingresar paciente
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
            Volver a inicio
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total pacientes" value={mockPatients.length} hint="Base clinica operativa" />
        <StatCard label="Pacientes criticos" value={criticalPatients.length} hint="Riesgo alto o estado critico" />
        <StatCard label="Con alertas" value={patientsWithAlerts.length} hint="Alertas clinicas abiertas" />
        <StatCard label="Expedientes MSP" value={registeredPatients.length} hint="Registros estructurados disponibles" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Panel
            title="Buscar y filtrar"
            subtitle="Primero localiza al paciente por nombre, documento, HC, sala o profesional"
          >
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Busqueda principal
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeSearchMode.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </label>

            <div className="mt-4 rounded-2xl bg-slate-100 p-1">
              <div className="flex flex-wrap gap-1">
                {searchModes.map((mode) => (
                  <SearchModeTab
                    key={mode.id}
                    active={searchMode === mode.id}
                    label={mode.label}
                    onClick={() => setSearchMode(mode.id)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Buscando por
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{activeSearchMode.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{activeSearchMode.helper}</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Vistas rapidas
              </p>
              <div className="flex flex-wrap gap-2">
                <QuickModeButton active={quickMode === "all"} onClick={() => setQuickMode("all")} label="Todos" />
                <QuickModeButton active={quickMode === "recent"} onClick={() => setQuickMode("recent")} label="Recientes" />
                <QuickModeButton active={quickMode === "alerts"} onClick={() => setQuickMode("alerts")} label="Con alertas" />
                <QuickModeButton active={quickMode === "critical"} onClick={() => setQuickMode("critical")} label="Criticos" />
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

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Resultado actual
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{filteredPatients.length} pacientes</p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Limpiar
              </button>
            </div>
          </Panel>

          <article className="rounded-3xl border border-slate-200 bg-slate-900 p-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Flujo recomendado
            </p>
            <div className="mt-4 space-y-3">
              <WorkflowStep index="1" title="Busca al paciente" detail="Usa nombre, HC, documento, sala o profesional." />
              <WorkflowStep index="2" title="Selecciona el contexto" detail="El paciente activo se vuelve el foco de la pantalla." />
              <WorkflowStep index="3" title="Trabaja desde la ficha" detail="Signos, balance, kardex, reportes y formularios MSP." />
            </div>
          </article>

          <details className="rounded-2xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              Alta rapida de paciente nuevo
            </summary>
            <p className="mt-1 text-xs text-slate-500">
              Si el paciente aun no existe, comienza aqui el ingreso clinico.
            </p>
            <div className="mt-3">
              <BuscadorPaciente />
            </div>
          </details>
        </aside>

        <section className="space-y-4">
          {selectedPatient ? (
            <PatientWorkspaceHero
              patient={selectedPatient}
              patientLocation={getPatientLocation(selectedPatient)}
              patientService={getPatientServiceArea(selectedPatient)}
              match={selectedPatientRegisteredMatch}
              actions={selectedPatientActions}
            />
          ) : (
            <Panel title="Sin paciente seleccionado" subtitle="Ajusta la busqueda o filtros para empezar a trabajar.">
              <p className="text-sm text-slate-600">
                No hay pacientes visibles con los filtros actuales. Limpia filtros o cambia el criterio de busqueda.
              </p>
            </Panel>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Panel
              title={`Pacientes encontrados (${filteredPatients.length})`}
              subtitle="Selecciona un paciente para fijarlo como contexto principal de trabajo"
            >
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-slate-600">No hay pacientes que coincidan con la busqueda actual.</p>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map((patient) => {
                    const isSelected = patient.id === effectiveSelectedPatientId;
                    const registeredMatch = registeredMatchByPatientId.get(patient.id) ?? null;

                    return (
                      <article
                        key={patient.id}
                        className={[
                          "rounded-3xl border px-4 py-4 transition",
                          isSelected
                            ? "border-sky-300 bg-sky-50/70 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedPatientId(patient.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={[
                                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                                  isSelected
                                    ? "bg-sky-600 text-white"
                                    : "bg-white text-slate-700",
                                ].join(" ")}
                              >
                                {getInitials(patient.fullName)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-base font-semibold text-slate-900">
                                    {patient.fullName}
                                  </p>
                                  {isSelected ? (
                                    <span className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                      Activo
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  HC {patient.medicalRecordNumber} · Documento {patient.identification}
                                </p>
                                <p className="mt-2 text-sm text-slate-700">{patient.primaryDiagnosis}</p>
                              </div>
                            </div>
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            <RiskBadge risk={patient.riskLevel} />
                            <TriageBadge triage={patient.triageColor} />
                            <PatientMatchBadge match={registeredMatch} />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <PatientInfoCard label="Sala / ubicacion" value={getPatientLocation(patient)} />
                          <PatientInfoCard label="Servicio" value={getPatientServiceArea(patient)} />
                          <PatientInfoCard label="Responsable" value={patient.assignedProfessional} />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPatientId(patient.id)}
                            className={[
                              "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                            ].join(" ")}
                          >
                            {isSelected ? "Paciente activo" : "Seleccionar"}
                          </button>
                          <Link
                            href={`/portal/professional/patients/${patient.id}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Abrir ficha
                          </Link>
                          <Link
                            href={
                              registeredMatch
                                ? `/portal/professional/patients/${patient.id}?tab=msp_forms`
                                : "/portal/professional/patients/ingreso"
                            }
                            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                          >
                            {registeredMatch ? "Formularios MSP" : "Crear expediente MSP"}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Panel>

            <div className="space-y-4">
              <Panel
                title="Estado MSP del paciente"
                subtitle="Situacion documental del paciente actualmente seleccionado"
              >
                {!selectedPatient ? (
                  <p className="text-sm text-slate-600">Selecciona un paciente para revisar su estado MSP.</p>
                ) : selectedPatientRegisteredMatch ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Expediente disponible
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-900">
                        MSP {selectedPatientRegisteredMatch.mspScore}%
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        {selectedPatientRegisteredMatch.criticalPendingCount} pendientes criticos visibles
                      </p>
                    </div>

                    <div className="space-y-2">
                      <MspMetricRow label="Paciente" value={selectedPatientRegisteredMatch.fullName} />
                      <MspMetricRow label="Historia clinica" value={selectedPatientRegisteredMatch.medicalRecordNumber} />
                      <MspMetricRow label="Motivo" value={selectedPatientRegisteredMatch.consultationReason} />
                    </div>

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
                        Ver formularios MSP
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        MSP pendiente
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-900">
                        Este paciente aun no tiene expediente estructurado.
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        Sin ingreso estructurado no se pueden generar formularios como el 008 desde la ficha.
                      </p>
                    </div>
                    <Link
                      href="/portal/professional/patients/ingreso"
                      className="inline-flex rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      Crear ingreso estructurado
                    </Link>
                  </div>
                )}
              </Panel>

              <Panel
                title="Expedientes MSP recientes"
                subtitle="Pacientes con registro estructurado y formularios disponibles"
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
                              HC {entry.medicalRecordNumber} · {entry.documentNumber}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            MSP {entry.mspScore}%
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

function PatientWorkspaceHero({
  patient,
  patientLocation,
  patientService,
  match,
  actions,
}: {
  patient: PatientRecord;
  patientLocation: string;
  patientService: string;
  match: RegisteredPatientSummary | null;
  actions: Array<{
    title: string;
    detail: string;
    href: string;
    tone: "dark" | "default" | "sky";
  }>;
}) {
  return (
    <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_62%,#f8fafc_100%)] p-5 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-sky-600 text-lg font-semibold text-white shadow-sm">
              {getInitials(patient.fullName)}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Paciente seleccionado
              </p>
              <h2 className="mt-1 truncate text-2xl font-semibold text-slate-950">{patient.fullName}</h2>
              <p className="mt-1 text-sm text-slate-600">
                HC {patient.medicalRecordNumber} · Documento {patient.identification}
              </p>
              <p className="mt-3 max-w-2xl text-sm text-slate-700">
                Diagnostico principal: <span className="font-semibold text-slate-900">{patient.primaryDiagnosis}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge risk={patient.riskLevel} />
            <TriageBadge triage={patient.triageColor} />
            <PatientMatchBadge match={match} />
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {patient.currentStatus}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Sala / ubicacion" value={patientLocation} />
            <MetricTile label="Servicio" value={patientService} />
            <MetricTile label="Responsable" value={patient.assignedProfessional} />
            <MetricTile label="Ultimo control" value={patient.lastControlAt} />
          </div>
        </div>

        <div className="w-full xl:max-w-[300px]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Siguiente paso
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">Trabajar la ficha desde un solo contexto</p>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              Usa los accesos de abajo para entrar directo a signos, balance, kardex, reportes o formularios MSP.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <ActionTile key={action.title} title={action.title} detail={action.detail} href={action.href} tone={action.tone} />
        ))}
      </div>
    </article>
  );
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

function SearchModeTab({
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
        "rounded-2xl px-3 py-2 text-[11px] font-semibold transition",
        active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900",
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

function WorkflowStep({
  index,
  title,
  detail,
}: {
  index: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-white">
        {index}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/70">{detail}</p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ActionTile({
  title,
  detail,
  href,
  tone,
}: {
  title: string;
  detail: string;
  href: string;
  tone: "dark" | "default" | "sky";
}) {
  const toneClassName =
    tone === "dark"
      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";

  const detailClassName = tone === "dark" ? "text-white/70" : "text-slate-500";

  return (
    <Link
      href={href}
      className={`rounded-3xl border p-4 transition ${toneClassName}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className={`mt-2 text-xs leading-6 ${detailClassName}`}>{detail}</p>
    </Link>
  );
}

function PatientInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function PatientMatchBadge({
  match,
}: {
  match: RegisteredPatientSummary | null;
}) {
  if (!match) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
        MSP pendiente
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      MSP disponible
    </span>
  );
}

function MspMetricRow({
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
