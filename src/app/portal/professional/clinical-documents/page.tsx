"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function ClinicalDocumentsPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const rows = useMemo(
    () =>
      filteredPatients.flatMap((patient) =>
        patient.documents.map((document) => ({
          patient,
          document,
        }))
      ),
    [filteredPatients]
  );

  return (
    <ModulePage
      title="Documentos clinicos"
      subtitle="Repositorio por paciente de reportes PDF, examenes, consentimientos y adjuntos."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Documentos" value={rows.length} hint="Total en filtros activos" />
        <StatCard
          label="Pacientes con adjuntos"
          value={new Set(rows.map((row) => row.patient.id)).size}
          hint="Cobertura documental"
        />
        <StatCard
          label="Sin documentos"
          value={filteredPatients.filter((patient) => patient.documents.length === 0).length}
          hint="Pendiente de carga"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para documentos"
        subtitle="Selecciona paciente para revisar archivos clinicos y generar nuevos adjuntos."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de documentos" subtitle="Documentacion clinica indexada por paciente">
        <div className="space-y-2">
          {rows.map(({ patient, document }) => (
            <article key={document.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{document.title}</p>
                  <p className="text-xs text-slate-600">{patient.fullName} · {document.type}</p>
                  <p className="text-[11px] text-slate-500">
                    Fecha: {document.date} · Subido por: {document.uploadedBy}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                  {document.status}
                </span>
              </div>
            </article>
          ))}
          {rows.length === 0 ? <p className="text-xs text-slate-500">No hay documentos en este filtro.</p> : null}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: gestion documental"
          subtitle="Reportes PDF, consentimientos, examenes y referencias"
        >
          {selectedPatient.documents.length === 0 ? (
            <p className="text-xs text-slate-500">Sin documentos cargados para este paciente.</p>
          ) : (
            <div className="space-y-2">
              {selectedPatient.documents.map((document) => (
                <article key={document.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p className="text-sm font-semibold text-slate-900">{document.title}</p>
                  <p className="text-[11px] text-slate-500">Tipo: {document.type}</p>
                  <p className="text-[11px] text-slate-500">Fecha: {document.date}</p>
                  <p className="text-[11px] text-slate-500">Responsable: {document.uploadedBy}</p>
                  <p className="text-[11px] text-slate-500">Estado: {document.status}</p>
                </article>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Subir documento
            </button>
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Generar PDF clinico
            </button>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}
