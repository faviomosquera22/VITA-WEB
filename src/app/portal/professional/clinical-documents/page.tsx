"use client";

import { useMemo } from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { DataTable } from "../_components/data-table";
import DocumentIntelligenceWorkspace from "../_components/document-intelligence-workspace";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

type DocumentRow = {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  type: string;
  date: string;
  uploadedBy: string;
  status: string;
};

export default function ClinicalDocumentsPage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const rows = useMemo<DocumentRow[]>(
    () =>
      filteredPatients.flatMap((patient) =>
        patient.documents.map((document) => ({
          id: document.id,
          patientId: patient.id,
          patientName: patient.fullName,
          title: document.title,
          type: document.type,
          date: document.date,
          uploadedBy: document.uploadedBy,
          status: document.status,
        }))
      ),
    [filteredPatients]
  );

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Documento",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-slate-950">{row.original.title}</p>
            <p className="text-xs text-slate-500">{row.original.type}</p>
          </div>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Paciente",
      },
      {
        accessorKey: "date",
        header: "Fecha",
      },
      {
        accessorKey: "uploadedBy",
        header: "Responsable",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {row.original.status}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <ModulePage
      title="Documentos clinicos"
      subtitle="Repositorio documental con tabla global, vista por paciente y base preparada para OCR real."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Documentos" value={rows.length} hint="Total en filtros activos" />
        <StatCard
          label="Pacientes con adjuntos"
          value={new Set(rows.map((row) => row.patientId)).size}
          hint="Cobertura documental"
        />
        <StatCard
          label="Sin documentos"
          value={filteredPatients.filter((patient) => patient.documents.length === 0).length}
          hint="Pendiente de carga"
        />
      </div>

      <DocumentIntelligenceWorkspace />

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para documentos"
        subtitle="Selecciona paciente para revisar archivos clinicos, resultados y consentimientos."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Indice documental" subtitle="Tabla global con busqueda, ordenamiento y trazabilidad basica">
        <DataTable
          columns={columns}
          data={rows}
          initialPageSize={6}
          searchPlaceholder="Buscar por paciente, documento, tipo o responsable"
          getSearchText={(row) => [row.patientName, row.title, row.type, row.uploadedBy, row.status].join(" ")}
        />
      </Panel>
    </ModulePage>
  );
}
