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
  description: string;
  placeholder: string;
}> = [
  {
    id: "all",
    label: "Todo",
    description: "Nombre, documento, HC, sala, servicio y profesional.",
    placeholder: "Ej. Maria Lopez, HC-2026-0001, sala de choque",
  },
  {
    id: "patient",
    label: "Paciente",
    description: "Busqueda por nombres y apellidos.",
    placeholder: "Ej. Maria Lopez",
  },
  {
    id: "document",
    label: "Documento",
    description: "Busqueda por cedula o identificacion.",
    placeholder: "Ej. 1722334412",
  },
  {
    id: "hc",
    label: "Historia clinica",
    description: "Busqueda por HC o codigo interno.",
    placeholder: "Ej. HC-2026-0001",
  },
  {
    id: "room",
    label: "Sala / ubicacion",
    description: "Busqueda por sala, box, consultorio o servicio.",
    placeholder: "Ej. habitacion 204, observacion, emergencia",
  },
  {
    id: "professional",
    label: "Profesional",
    description: "Busqueda por responsable asignado.",
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
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(mockPatients[0]?.id ?? "");

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

    return normalizedSearch ? items : items.slice(0, 8);
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

  return (
    <ModulePage
      title="Pacientes"
      subtitle="Selecciona primero un paciente y luego trabaja su ficha clinica, signos, balance, medicacion, reportes y formularios MSP desde un mismo contexto."
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
        <StatCard
          label="Expedientes MSP"
          value={registeredPatients.length}
          hint="Registros estructurados disponibles"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Panel
          title="Paso 1: localizar paciente"
          subtitle="Busca por nombre, documento, HC, sala/ubicacion o profesional antes de entrar a su ficha"
        >
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
            {searchModes.map((mode) => (
              <SearchModeButton
                key={mode.id}
                active={searchMode === mode.id}
                label={mode.label}
                description={mode.description}
                onClick={() => setSearchMode(mode.id)}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.6fr))]">
            <label className="xl:col-span-1">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                Busqueda principal
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeSearchMode.placeholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </label>

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
              label="Servicio"
              value={serviceFilter}
              onChange={(value) => setServiceFilter(value as "all" | ServiceArea)}
              options={[
                { value: "all", label: "Todos" },
                ...serviceAreas.map((area) => ({ value: area, label: area })),
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

          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="flex flex-wrap gap-2">
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
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedPatient ? selectedPatient.fullName : "Sin paciente seleccionado"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {selectedPatient
                    ? `HC ${selectedPatient.medicalRecordNumber} · Documento ${selectedPatient.identification}`
                    : "Ajusta la busqueda o filtros para localizar un paciente."}
                </p>
                {selectedPatient ? (
                  <>
                    <p className="mt-1 text-xs text-slate-600">
                      {getPatientLocation(selectedPatient)} · {getPatientServiceArea(selectedPatient)} ·{" "}
                      {selectedPatient.assignedProfessional}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Diagnostico principal: {selectedPatient.primaryDiagnosis}
                    </p>
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedPatient ? (
                  <>
                    <RiskBadge risk={selectedPatient.riskLevel} />
                    <TriageBadge triage={selectedPatient.triageColor} />
                    <PatientMatchBadge match={selectedPatientRegisteredMatch} />
                  </>
                ) : null}
              </div>
            </div>

            {selectedPatient ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <QuickActionLink
                  href={`/portal/professional/patients/${selectedPatient.id}`}
                  label="Abrir ficha clinica"
                  tone="dark"
                />
                <QuickActionLink
                  href={`/portal/professional/patients/${selectedPatient.id}?tab=vitals`}
                  label="Signos vitales"
                />
                <QuickActionLink
                  href={`/portal/professional/patients/${selectedPatient.id}?tab=fluid_balance`}
                  label="Balance hidrico"
                />
                <QuickActionLink
                  href={`/portal/professional/patients/${selectedPatient.id}?tab=kardex`}
                  label="Kardex"
                />
                <QuickActionLink
                  href={`/portal/professional/patients/${selectedPatient.id}?tab=medical_notes`}
                  label="Reporte medico"
                />
                <QuickActionLink
                  href={`/portal/professional/patients/${selectedPatient.id}?tab=msp_forms`}
                  label="Formularios MSP"
                />
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Paso 2: abrir y trabajar la ficha"
          subtitle="Desde la ficha podras navegar por signos, balance, medicacion, kardex, reportes y formularios MSP"
        >
          {selectedPatient ? (
            <div className="space-y-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedPatient.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      {selectedPatient.age} anios · {selectedPatient.sex} · {selectedPatient.currentStatus}
                    </p>
                  </div>
                  <TriageBadge triage={selectedPatient.triageColor} />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
                  <InfoRow label="Sala / ubicacion" value={getPatientLocation(selectedPatient)} />
                  <InfoRow label="Servicio" value={getPatientServiceArea(selectedPatient)} />
                  <InfoRow label="Profesional" value={selectedPatient.assignedProfessional} />
                  <InfoRow label="Ultimo control" value={selectedPatient.lastControlAt} />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Que podras hacer dentro de la ficha
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "Signos vitales",
                      "Balance hidrico",
                      "Medicacion",
                      "Kardex",
                      "Reporte de enfermeria",
                      "Reporte medico",
                      "Vacunacion",
                      "Formularios MSP",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>

              <div className="grid grid-cols-1 gap-3">
                {filteredPatients.slice(0, 5).map((patient) => {
                  const selected = patient.id === effectiveSelectedPatientId;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left transition",
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{patient.fullName}</p>
                          <p
                            className={[
                              "text-[11px]",
                              selected ? "text-white/70" : "text-slate-500",
                            ].join(" ")}
                          >
                            HC {patient.medicalRecordNumber} · {getPatientLocation(patient)}
                          </p>
                        </div>
                        <PatientMatchBadge match={registeredMatchByPatientId.get(patient.id) ?? null} compact />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No hay pacientes visibles con los filtros actuales.</p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Panel
          title="Listado operativo de pacientes"
          subtitle={`Resultados visibles: ${filteredPatients.length}`}
        >
          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Paciente</th>
                  <th className="px-3 py-2 font-semibold">HC / documento</th>
                  <th className="px-3 py-2 font-semibold">Sala / servicio</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Profesional</th>
                  <th className="px-3 py-2 font-semibold">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const selected = patient.id === effectiveSelectedPatientId;
                  const registeredMatch = registeredMatchByPatientId.get(patient.id) ?? null;

                  return (
                    <tr
                      key={patient.id}
                      className={selected ? "bg-sky-50" : "hover:bg-slate-50"}
                    >
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientId(patient.id)}
                          className="text-left"
                        >
                          <p className="font-semibold text-slate-900">{patient.fullName}</p>
                          <p className="text-[11px] text-slate-500">{patient.primaryDiagnosis}</p>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <p>HC {patient.medicalRecordNumber}</p>
                        <p className="text-[11px] text-slate-500">{patient.identification}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <p>{getPatientLocation(patient)}</p>
                        <p className="text-[11px] text-slate-500">{getPatientServiceArea(patient)}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RiskBadge risk={patient.riskLevel} />
                          <TriageBadge triage={patient.triageColor} />
                          <PatientMatchBadge match={registeredMatch} compact />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{patient.assignedProfessional}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/portal/professional/patients/${patient.id}`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-slate-700 hover:bg-slate-100"
                          >
                            Abrir
                          </Link>
                          <Link
                            href={`/portal/professional/patients/${patient.id}?tab=msp_forms`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium leading-none text-sky-700 hover:bg-sky-100"
                          >
                            MSP
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 xl:hidden">
            {filteredPatients.map((patient) => {
              const registeredMatch = registeredMatchByPatientId.get(patient.id) ?? null;

              return (
                <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                      <p className="text-xs text-slate-600">{patient.primaryDiagnosis}</p>
                    </div>
                    <TriageBadge triage={patient.triageColor} />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    HC {patient.medicalRecordNumber} · {getPatientLocation(patient)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RiskBadge risk={patient.riskLevel} />
                    <PatientMatchBadge match={registeredMatch} compact />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/portal/professional/patients/${patient.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-slate-700 hover:bg-slate-100"
                    >
                      Abrir ficha
                    </Link>
                    <Link
                      href={`/portal/professional/patients/${patient.id}?tab=msp_forms`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium leading-none text-sky-700 hover:bg-sky-100"
                    >
                      Formularios MSP
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPatients.length === 0 ? (
            <p className="text-xs text-slate-500">No hay pacientes que coincidan con la busqueda actual.</p>
          ) : null}
        </Panel>

        <Panel
          title="Expedientes MSP vinculados"
          subtitle="Pacientes con ingreso estructurado, checklist MSP y formularios imprimibles"
        >
          {registeredPatients.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aun no hay pacientes creados con el nuevo flujo de ingreso.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredRegisteredPatients.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{entry.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        HC {entry.medicalRecordNumber} · {entry.documentNumber}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      MSP {entry.mspScore}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{entry.consultationReason}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {entry.principalDiagnosis} · {entry.criticalPendingCount} pendientes criticos
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/portal/professional/patients/ingreso/${entry.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-slate-700 hover:bg-slate-100"
                    >
                      Abrir expediente
                    </Link>
                    <Link
                      href={`/portal/professional/reports?patientId=${entry.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium leading-none text-sky-700 hover:bg-sky-100"
                    >
                      Formularios MSP
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Alta rapida de paciente nuevo</h2>
          <p className="text-xs text-slate-500">
            Si el paciente aun no existe, puedes buscarlo por cedula y comenzar el ingreso clinico desde aqui.
          </p>
        </div>
        <BuscadorPaciente />
      </div>
    </ModulePage>
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
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
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

function SearchModeButton({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-3 py-2 text-left transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      <p className="text-xs font-semibold">{label}</p>
      <p className={["mt-1 text-[11px] leading-5", active ? "text-white/70" : "text-slate-500"].join(" ")}>
        {description}
      </p>
    </button>
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

function QuickActionLink({
  href,
  label,
  tone = "default",
}: {
  href: string;
  label: string;
  tone?: "default" | "dark";
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold leading-none transition",
        tone === "dark"
          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function PatientMatchBadge({
  match,
  compact = false,
}: {
  match: RegisteredPatientSummary | null;
  compact?: boolean;
}) {
  const baseClassName = compact
    ? "rounded-full border px-2 py-0.5 text-[10px] font-semibold"
    : "rounded-full border px-2.5 py-1 text-[11px] font-semibold";

  if (!match) {
    return (
      <span className={`${baseClassName} border-amber-200 bg-amber-50 text-amber-700`}>
        MSP pendiente
      </span>
    );
  }

  return (
    <span className={`${baseClassName} border-emerald-200 bg-emerald-50 text-emerald-700`}>
      MSP disponible
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-xs text-slate-700">{value}</span>
    </div>
  );
}
