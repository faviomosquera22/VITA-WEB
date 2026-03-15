"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, RiskBadge, TriageBadge } from "../_components/clinical-ui";
import type { DiagnosisRecord, ExamRecord, MedicationRecord, PatientRecord, ServiceArea } from "../_data/clinical-mock-data";
import {
  getCriticalPatients,
  getPatientServiceArea,
  getPatientsWithAlerts,
  mockPatients,
} from "../_data/clinical-mock-data";
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
  const deferredSearch = useDeferredValue(search);
  const [searchMode, setSearchMode] = useState<SearchMode>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "alto" | "medio" | "bajo">("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceArea>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [quickMode, setQuickMode] = useState<"all" | "alerts" | "recent" | "critical">("all");
  const [selectedPatientId, setSelectedPatientId] = useState("");
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
    const normalizedSearch = normalizeSearch(deferredSearch);

    if (normalizedSearch) {
      items = items.filter((patient) => matchesPatientSearch(patient, normalizedSearch, searchMode));
    }

    if (riskFilter !== "all") {
      items = items.filter((patient) => patient.riskLevel === riskFilter);
    }

    if (serviceFilter !== "all") {
      items = items.filter((patient) => getPatientServiceArea(patient) === serviceFilter);
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
  }, [deferredSearch, quickMode, recentPatientIds, riskFilter, searchMode, serviceFilter, sortBy]);

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ??
    mockPatients.find((patient) => patient.id === selectedPatientId) ??
    null;

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

  const selectedPatientRegisteredMatch = selectedPatient
    ? registeredMatchByPatientId.get(selectedPatient.id) ?? null
    : null;

  const searchInsights = useMemo(
    () => ({
      active: mockPatients.length,
      critical: getCriticalPatients().length,
      alerts: getPatientsWithAlerts().length,
      msp: registeredPatients.length,
    }),
    [registeredPatients.length]
  );

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
        // Ignore load errors in patients page.
      }
    };

    loadRegisteredPatients();
  }, []);

  const clearFilters = () => {
    setSearch("");
    setSearchMode("all");
    setRiskFilter("all");
    setServiceFilter("all");
    setSortBy("recent");
    setQuickMode("all");
    setSelectedPatientId("");
  };

  return (
    <ModulePage
      title="Pacientes"
      subtitle="Busca primero al paciente y luego abre su tablero clinico de trabajo."
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
        </div>
      }
    >
      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Paso 1
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Buscar y abrir paciente</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Antes de mostrar el tablero clinico, localiza el paciente por nombre, documento, historia
              clinica, sala o profesional responsable.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SearchInsight label="Activos" value={searchInsights.active} />
            <SearchInsight label="Criticos" value={searchInsights.critical} tone="red" />
            <SearchInsight label="Alertas" value={searchInsights.alerts} tone="amber" />
            <SearchInsight label="MSP" value={searchInsights.msp} tone="sky" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Buscar paciente
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchModes.find((mode) => mode.id === searchMode)?.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {searchModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSearchMode(mode.id)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                    searchMode === mode.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Criterio activo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {searchModes.find((mode) => mode.id === searchMode)?.label}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {searchModes.find((mode) => mode.id === searchMode)?.helper}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                { value: "risk", label: "Riesgo" },
              ]}
            />
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Vista rapida
              </p>
              <div className="flex flex-wrap gap-2">
                <QuickFilter active={quickMode === "all"} label="Todos" onClick={() => setQuickMode("all")} />
                <QuickFilter active={quickMode === "recent"} label="Recientes" onClick={() => setQuickMode("recent")} />
                <QuickFilter active={quickMode === "alerts"} label="Con alertas" onClick={() => setQuickMode("alerts")} />
                <QuickFilter active={quickMode === "critical"} label="Criticos" onClick={() => setQuickMode("critical")} />
              </div>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              Limpiar seleccion
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Resultados</p>
              <p className="text-xs text-slate-500">
                {filteredPatients.length} pacientes visibles
              </p>
            </div>
            {professionals.length > 0 ? (
              <p className="text-[11px] text-slate-400">
                Profesionales activos: {professionals.length}
              </p>
            ) : null}
          </div>

          {filteredPatients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-900">No hay coincidencias</p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba con otro nombre, HC, documento o limpia filtros.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredPatients.slice(0, 9).map((patient) => {
                const active = patient.id === selectedPatientId;
                const match = registeredMatchByPatientId.get(patient.id) ?? null;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={[
                      "rounded-3xl border px-4 py-4 text-left transition",
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{patient.fullName}</p>
                        <p className={["mt-1 text-[11px]", active ? "text-white/70" : "text-slate-500"].join(" ")}>
                          HC {patient.medicalRecordNumber}
                        </p>
                        <p className={["mt-2 text-[11px]", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                          {getPatientLocation(patient)} · {getPatientServiceArea(patient)}
                        </p>
                      </div>
                      <TriageBadge triage={patient.triageColor} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <RiskBadge risk={patient.riskLevel} />
                      <PatientMatchBadge match={match} compact />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {!selectedPatient ? (
        <Panel
          title="Paso 2: tablero del paciente"
          subtitle="Selecciona un paciente arriba para cargar su panel clinico completo"
        >
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-lg font-semibold text-slate-900">Aun no has seleccionado un paciente</p>
            <p className="mt-2 text-sm text-slate-500">
              El tablero tipo dashboard aparecera aqui una vez que elijas un paciente desde los resultados.
            </p>
          </div>
        </Panel>
      ) : (
        <PatientDashboard
          patient={selectedPatient}
          match={selectedPatientRegisteredMatch}
        />
      )}
    </ModulePage>
  );
}

function PatientDashboard({
  patient,
  match,
}: {
  patient: PatientRecord;
  match: RegisteredPatientSummary | null;
}) {
  const latestVital = patient.vitalSigns[0] ?? null;
  const labExams = patient.exams.filter((exam) => exam.category === "Laboratorio");
  const latestNotes = [...patient.medicalNotes, ...patient.nursingNotes]
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 3);
  const primaryAllergies = patient.antecedentes.allergies.filter((item) => !/no conocidas/i.test(item));
  const latestAlert = buildDashboardAlert(patient, latestVital);
  const activeMedications = patient.medicationRecords.slice(0, 4);
  const activeDiagnoses = patient.diagnoses.slice(0, 5);
  const familyHistory = patient.antecedentes.family.join(" · ") || "Sin antecedentes familiares registrados";
  const actionLinks = buildActionLinks(patient, match);

  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-900 bg-[#161616] text-white shadow-sm">
      <div className="border-b border-white/10 bg-[linear-gradient(135deg,#262626_0%,#1f1f1f_48%,#1a2b44_100%)] px-5 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl font-semibold text-emerald-800">
                {getInitials(patient.fullName)}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-3xl font-semibold text-white">{patient.fullName}</h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
                  <span>CI: {patient.identification}</span>
                  <span>{patient.age} anios</span>
                  <span>{patient.sex}</span>
                  <span>Gpo: {patient.personalData.bloodType}</span>
                  <span>{patient.personalData.insurance}</span>
                </div>
                <p className="mt-2 text-sm text-red-300">
                  Alertas: {patient.activeAlerts.length}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {primaryAllergies.slice(0, 3).map((allergy) => (
                    <StatusChip key={allergy} label={allergy} tone="red" />
                  ))}
                  {patient.secondaryDiagnoses.slice(0, 2).map((diag) => (
                    <StatusChip key={diag} label={diag} tone="amber" />
                  ))}
                  <StatusChip label={`Ingreso: ${formatShortDate(patient.admissionDate)}`} tone="emerald" />
                  <StatusChip label={getPatientServiceArea(patient)} tone="slate" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <DashboardStat label="Alertas activas" value={patient.activeAlerts.length} tone="red" />
              <DashboardStat label="Labs pendientes" value={labExams.filter((exam) => exam.status === "Pendiente").length} tone="amber" />
              <DashboardStat label="Diagnosticos" value={patient.diagnoses.length} tone="slate" />
              <DashboardStat label="Medicamentos" value={patient.medicationRecords.length} tone="slate" />
              <DashboardStat
                label="MSP"
                value={match ? `${match.mspScore}%` : "Pendiente"}
                tone={match ? "emerald" : "slate"}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {actionLinks.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4">
        <div className="rounded-2xl border border-red-200/30 bg-[#2a1718] px-4 py-3 text-sm text-red-100">
          <span className="font-semibold">{latestAlert.title}</span>
          <span className="text-red-200"> {latestAlert.detail}</span>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <DashboardCard
          title="Signos vitales"
          action="+ Registrar"
          href={`/portal/professional/patients/${patient.id}?tab=vitals`}
        >
          {latestVital ? (
            <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-white/10">
              <VitalMetric
                label="PA"
                value={latestVital.bloodPressure}
                status={classifyBloodPressure(latestVital.bloodPressure)}
                timestamp={extractTime(latestVital.recordedAt)}
              />
              <VitalMetric
                label="FC"
                value={`${latestVital.heartRate} lpm`}
                status={latestVital.heartRate >= 100 ? "Taquicardia" : "Normal"}
                timestamp={extractTime(latestVital.recordedAt)}
              />
              <VitalMetric
                label="FR"
                value={`${latestVital.respiratoryRate} rpm`}
                status={latestVital.respiratoryRate >= 22 ? "Elevada" : "Normal"}
                timestamp={extractTime(latestVital.recordedAt)}
              />
              <VitalMetric
                label="Temp."
                value={`${latestVital.temperature.toFixed(1)} °C`}
                status={latestVital.temperature >= 37.5 ? "Elevada" : "Normal"}
                timestamp={extractTime(latestVital.recordedAt)}
              />
              <VitalMetric
                label="SpO2"
                value={`${latestVital.spo2}%`}
                status={latestVital.spo2 < 94 ? "Baja" : "Normal"}
                timestamp={extractTime(latestVital.recordedAt)}
              />
              <VitalMetric
                label="Glucosa"
                value={`${latestVital.glucose} mg/dL`}
                status={latestVital.glucose >= 180 ? "Alta" : "Normal"}
                timestamp={extractTime(latestVital.recordedAt)}
              />
            </div>
          ) : (
            <EmptyText label="Sin controles vitales recientes." />
          )}
        </DashboardCard>

        <DashboardCard
          title="Alergias e intolerancias"
          action="+ Agregar"
          href={`/portal/professional/patients/${patient.id}?tab=background`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(primaryAllergies.length ? primaryAllergies : ["Sin alergias registradas"]).map((allergy) => (
                <StatusChip key={allergy} label={allergy} tone={primaryAllergies.length ? "red" : "slate"} />
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Antecedentes familiares
              </p>
              <p className="mt-3 text-sm leading-7 text-white/80">{familyHistory}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Diagnosticos activos"
          action="+ Agregar CIE"
          href={`/portal/professional/patients/${patient.id}?tab=diagnoses`}
        >
          <div className="space-y-3">
            {activeDiagnoses.map((diagnosis) => (
              <DiagnosisRow key={diagnosis.id} diagnosis={diagnosis} />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Medicacion activa"
          action="Ver historial"
          href={`/portal/professional/patients/${patient.id}?tab=medication`}
        >
          <div className="space-y-3">
            {activeMedications.length === 0 ? (
              <EmptyText label="No hay medicacion activa registrada." />
            ) : (
              activeMedications.map((record) => <MedicationRow key={record.id} record={record} />)
            )}
          </div>
        </DashboardCard>
      </div>

      <div className="px-5 pb-5">
        <DashboardWideCard
          title="Resultados de laboratorio recientes"
          action="Solicitar nuevo"
          href={`/portal/professional/patients/${patient.id}?tab=exams`}
        >
          {labExams.length === 0 ? (
            <EmptyText label="No hay examenes de laboratorio cargados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-medium">Examen</th>
                    <th className="px-4 py-3 font-medium">Resultado / resumen</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {labExams.slice(0, 6).map((exam) => (
                    <tr key={exam.id}>
                      <td className="px-4 py-3 font-medium">{exam.name}</td>
                      <td className="px-4 py-3 text-white/75">{exam.summary}</td>
                      <td className="px-4 py-3">
                        <ExamStatus status={exam.status} />
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {formatShortDateTime(exam.resultAt ?? exam.requestedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardWideCard>
      </div>

      <div className="px-5 pb-5">
        <DashboardWideCard
          title="Notas clinicas"
          action="+ Nueva nota"
          href={`/portal/professional/patients/${patient.id}?tab=medical_notes`}
        >
          {latestNotes.length === 0 ? (
            <EmptyText label="No hay notas clinicas recientes." />
          ) : (
            <div className="space-y-3">
              {latestNotes.map((note) => (
                <article key={note.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-white">{note.professional}</span>
                    <span className="text-white/40">{formatShortDateTime(note.datetime)}</span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                      {note.specialty}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/85">{note.note}</p>
                </article>
              ))}
            </div>
          )}
        </DashboardWideCard>
      </div>
    </section>
  );
}

function buildActionLinks(patient: PatientRecord, match: RegisteredPatientSummary | null) {
  return [
    {
      label: "Abrir ficha clinica",
      href: `/portal/professional/patients/${patient.id}`,
    },
    {
      label: "Prescribir",
      href: `/portal/professional/patients/${patient.id}?tab=medication`,
    },
    {
      label: "Solicitar lab",
      href: `/portal/professional/patients/${patient.id}?tab=exams`,
    },
    {
      label: "Signos vitales",
      href: `/portal/professional/patients/${patient.id}?tab=vitals`,
    },
    {
      label: "Balance hidrico",
      href: `/portal/professional/patients/${patient.id}?tab=fluid_balance`,
    },
    {
      label: match ? "Formularios MSP" : "Crear expediente MSP",
      href: match ? `/portal/professional/patients/${patient.id}?tab=msp_forms` : "/portal/professional/patients/ingreso",
    },
  ];
}

function buildDashboardAlert(patient: PatientRecord, latestVital: PatientRecord["vitalSigns"][number] | null) {
  if (latestVital?.glucose && latestVital.glucose >= 250) {
    return {
      title: `Glucosa capilar: ${latestVital.glucose} mg/dL`,
      detail: `Requiere atencion inmediata · Registrado a las ${extractTime(latestVital.recordedAt)} por ${latestVital.professional}.`,
    };
  }

  if (latestVital?.spo2 && latestVital.spo2 < 94) {
    return {
      title: `SpO2: ${latestVital.spo2}%`,
      detail: `Saturacion en limite bajo · Registrado a las ${extractTime(latestVital.recordedAt)} por ${latestVital.professional}.`,
    };
  }

  if (patient.activeAlerts.length > 0) {
    return {
      title: patient.activeAlerts[0],
      detail: `Paciente en ${getPatientServiceArea(patient)} · Ultimo control ${patient.lastControlAt}.`,
    };
  }

  return {
    title: "Paciente sin alertas criticas activas.",
    detail: `Ultimo control ${patient.lastControlAt} · Responsable ${patient.assignedProfessional}.`,
  };
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

function formatShortDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatShortDateTime(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractTime(value: string) {
  const match = value.match(/(\d{2}:\d{2})$/);
  return match?.[1] ?? value;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function classifyBloodPressure(value: string) {
  const [systolicRaw] = value.split("/");
  const systolic = Number(systolicRaw);

  if (!Number.isFinite(systolic)) {
    return "Sin clasificar";
  }

  if (systolic >= 140) {
    return "Elevada";
  }

  return "Normal";
}

function SearchInsight({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "red" | "amber" | "sky";
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
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
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
    </label>
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
    return <span className={`${baseClassName} border-amber-200 bg-amber-50 text-amber-700`}>MSP pendiente</span>;
  }

  return <span className={`${baseClassName} border-emerald-200 bg-emerald-50 text-emerald-700`}>MSP disponible</span>;
}

function DashboardStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "red" | "amber" | "slate" | "emerald";
}) {
  const toneClassName =
    tone === "red"
      ? "text-red-400"
      : tone === "amber"
        ? "text-amber-400"
        : tone === "emerald"
          ? "text-emerald-400"
          : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className={`text-3xl font-semibold ${toneClassName}`}>{value}</p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "red" | "amber" | "emerald" | "slate";
}) {
  const toneClassName =
    tone === "red"
      ? "border-red-200/30 bg-red-100 text-red-800"
      : tone === "amber"
        ? "border-amber-200/30 bg-amber-100 text-amber-800"
        : tone === "emerald"
          ? "border-emerald-200/30 bg-emerald-100 text-emerald-800"
          : "border-white/10 bg-white/10 text-white";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}

function DashboardCard({
  title,
  action,
  href,
  children,
}: {
  title: string;
  action: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[#222222] p-4">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">{title}</h3>
        <Link href={href} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
          {action}
        </Link>
      </div>
      {children}
    </article>
  );
}

function DashboardWideCard({
  title,
  action,
  href,
  children,
}: {
  title: string;
  action: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[#222222]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">{title}</h3>
        <Link href={href} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
          {action}
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </article>
  );
}

function VitalMetric({
  label,
  value,
  status,
  timestamp,
}: {
  label: string;
  value: string;
  status: string;
  timestamp: string;
}) {
  const toneClassName =
    /alta|elevada|taquicardia|baja/i.test(status)
      ? "text-red-400"
      : "text-emerald-400";

  return (
    <div className="border-r border-b border-white/10 px-4 py-4 last:border-r-0 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-[11px] uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-2 text-4xl font-semibold leading-none text-white">{value}</p>
      <p className={`mt-2 text-sm ${toneClassName}`}>{status}</p>
      <p className="mt-1 text-[11px] text-white/40">{timestamp}</p>
    </div>
  );
}

function DiagnosisRow({ diagnosis }: { diagnosis: DiagnosisRecord }) {
  const toneClassName =
    /agudo|critico/i.test(diagnosis.status)
      ? "border-red-200/30 bg-red-100 text-red-800"
      : /seguimiento/i.test(diagnosis.status)
        ? "border-slate-200/30 bg-slate-100 text-slate-800"
        : "border-amber-200/30 bg-amber-100 text-amber-800";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/75">
            {diagnosis.id.replace("dg-", "").toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-medium text-white">{diagnosis.diagnosis}</p>
            <p className="mt-2 text-sm text-white/65">
              {diagnosis.observations || "Sin observaciones adicionales"}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClassName}`}>
          {diagnosis.status}
        </span>
      </div>
    </article>
  );
}

function MedicationRow({ record }: { record: MedicationRecord }) {
  const toneClassName =
    record.administrationStatus === "Administrado"
      ? "border-emerald-200/30 bg-emerald-100 text-emerald-800"
      : record.administrationStatus === "Omitido"
        ? "border-red-200/30 bg-red-100 text-red-800"
        : "border-amber-200/30 bg-amber-100 text-amber-800";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span
            className={[
              "mt-1 h-2.5 w-2.5 rounded-full",
              record.administrationStatus === "Administrado"
                ? "bg-emerald-400"
                : record.administrationStatus === "Omitido"
                  ? "bg-red-400"
                  : "bg-amber-400",
            ].join(" ")}
          />
          <div>
            <p className="text-lg font-medium text-white">
              {record.name} {record.dose}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {record.frequency} · {record.route}
            </p>
            <p className="text-sm text-white/55">{record.notes}</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClassName}`}>
          {record.administrationStatus}
        </span>
      </div>
    </article>
  );
}

function ExamStatus({ status }: { status: ExamRecord["status"] }) {
  const toneClassName =
    status === "Validado"
      ? "border-emerald-200/30 bg-emerald-100 text-emerald-800"
      : status === "Procesado"
        ? "border-amber-200/30 bg-amber-100 text-amber-800"
        : "border-slate-200/30 bg-slate-100 text-slate-800";

  return <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClassName}`}>{status}</span>;
}

function EmptyText({ label }: { label: string }) {
  return <p className="text-sm text-white/55">{label}</p>;
}
