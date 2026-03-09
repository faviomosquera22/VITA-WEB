"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  currentClinicalContext,
  mockPatients,
  nursingReportRecords,
} from "../_data/clinical-mock-data";

const reportTemplates = [
  { id: "nursing", title: "Reporte de enfermeria", route: "/portal/professional/nursing-report" },
  { id: "medical", title: "Reporte medico", route: "/portal/professional/reports" },
  { id: "clinical", title: "Resumen clinico", route: "/portal/professional/reports" },
  { id: "vitals", title: "Reporte de signos vitales", route: "/portal/professional/vitals" },
  { id: "medication", title: "Reporte de medicacion", route: "/portal/professional/medication" },
  { id: "vaccination", title: "Reporte de vacunacion", route: "/portal/professional/vaccination" },
  { id: "fluid", title: "Balance hidrico", route: "/portal/professional/fluid-balance" },
  { id: "kardex", title: "Kardex", route: "/portal/professional/kardex" },
  { id: "evolution", title: "Resumen de evolucion", route: "/portal/professional/follow-up" },
  { id: "pdf", title: "Exportacion PDF", route: "/portal/professional/reports" },
];

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [patientFilter, setPatientFilter] = useState<"all" | string>("all");
  const [professionalFilter, setProfessionalFilter] = useState<"all" | string>("all");

  const patients = mockPatients.map((patient) => ({ id: patient.id, name: patient.fullName }));
  const professionals = Array.from(new Set(mockPatients.map((patient) => patient.assignedProfessional)));

  const generatedRows = useMemo(
    () =>
      mockPatients.flatMap((patient) =>
        patient.documents.map((document) => ({
          id: `${patient.id}-${document.id}`,
          patientId: patient.id,
          patientName: patient.fullName,
          professional: document.uploadedBy,
          type: document.type,
          title: document.title,
          date: document.date,
          status: document.status,
        }))
      ),
    []
  );

  const filteredRows = generatedRows.filter((row) => {
    if (typeFilter !== "all" && row.type !== typeFilter) {
      return false;
    }
    if (patientFilter !== "all" && row.patientId !== patientFilter) {
      return false;
    }
    if (professionalFilter !== "all" && row.professional !== professionalFilter) {
      return false;
    }
    return true;
  });

  return (
    <ModulePage
      title="Reportes"
      subtitle="Generacion, filtros y trazabilidad de reportes clinicos y operativos."
      actions={
        <Link
          href="/portal/professional/nursing-report"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Crear nuevo reporte
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Plantillas" value={reportTemplates.length} hint="Tipos de reporte disponibles" />
        <StatCard label="Reportes generados" value={generatedRows.length} hint="Historico documental" />
        <StatCard label="Pendientes" value={mockPatients.filter((patient) => patient.nursingShiftReports.length === 0).length} hint="Reporte enfermeria por cerrar" />
        <StatCard label="Profesional activo" value={currentClinicalContext.professionalName} hint="Contexto de sesion" />
      </div>

      <Panel title="Filtros de reportes" subtitle="Filtra por tipo, paciente y profesional">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SelectFilter
            label="Tipo"
            value={typeFilter}
            onChange={setTypeFilter}
            options={["all", ...Array.from(new Set(generatedRows.map((row) => row.type)))]}
          />
          <SelectFilter
            label="Paciente"
            value={patientFilter}
            onChange={setPatientFilter}
            options={["all", ...patients.map((patient) => patient.id)]}
            labels={Object.fromEntries(patients.map((patient) => [patient.id, patient.name]))}
          />
          <SelectFilter
            label="Profesional"
            value={professionalFilter}
            onChange={setProfessionalFilter}
            options={["all", ...professionals]}
          />
        </div>
      </Panel>

      <Panel title="Tipos de reportes" subtitle="Acceso directo a cada flujo de reporte">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reportTemplates.map((template) => (
            <Link key={template.id} href={template.route} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 hover:bg-slate-100">
              <p className="font-semibold text-slate-900">{template.title}</p>
              <p className="mt-1 text-[11px] text-slate-500">Abrir flujo de reporte</p>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Listado de reportes generados" subtitle={`Resultados: ${filteredRows.length}`}>
        <div className="space-y-2">
          {filteredRows.map((row) => (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-600">{row.patientName} · {row.type}</p>
                  <p className="text-[11px] text-slate-500">Profesional: {row.professional} · Fecha: {row.date}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                  {row.status}
                </span>
              </div>
            </article>
          ))}
          {filteredRows.length === 0 ? <p className="text-xs text-slate-500">No hay reportes para estos filtros.</p> : null}
        </div>
      </Panel>

      <Panel title="Reporte de enfermeria (PAE)" subtitle="Estado del modulo especializado de enfermeria">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard label="Registros PAE" value={nursingReportRecords.length} hint="Con NANDA/NIC/NOC" />
          <StatCard label="Pacientes hoy" value={new Set(nursingReportRecords.map((record) => record.patientId)).size} hint="Cobertura por turno" />
          <Link href="/portal/professional/nursing-report" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 hover:bg-slate-100">
            Abrir modulo de reporte de enfermeria
          </Link>
        </div>
      </Panel>
    </ModulePage>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "Todos" : labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}
