"use client";

import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  SearchableSelect,
  usePatientSelection,
} from "../_components/patient-workspace";
import {
  getPatientFunctionalPatterns,
  mockPatients,
  nandaCatalog,
  nicCatalog,
  nocCatalog,
  nursingReportRecords,
} from "../_data/clinical-mock-data";

type NarrativeRecord = {
  id: string;
  patientId: string;
  datetime: string;
  nurse: string;
  shift: string;
  narrative: string;
};

type NarrativeFormState = {
  shift: string;
  nurse: string;
  companion: string;
  cefalocaudalAssessment: string;
  cuidados: string;
  procedures: string;
  incidents: string;
  immediatePlan: string;
};

const initialNarrativeForm: NarrativeFormState = {
  shift: "Manana",
  nurse: "",
  companion: "madre/padre",
  cefalocaudalAssessment: "",
  cuidados: "",
  procedures: "",
  incidents: "",
  immediatePlan: "",
};

export default function NursingReportPage() {
  const {
    search,
    setSearch,
    selectedPatientId,
    setSelectedPatientId,
    filteredPatients,
    selectedPatient,
  } = usePatientSelection(mockPatients);

  const [nandaId, setNandaId] = useState(nandaCatalog[0]?.id ?? "");
  const [nicId, setNicId] = useState(nicCatalog[0]?.id ?? "");
  const [nocId, setNocId] = useState(nocCatalog[0]?.id ?? "");
  const [clinicalRationale, setClinicalRationale] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [initialScale, setInitialScale] = useState("2");
  const [targetScale, setTargetScale] = useState("4");
  const [reevaluationScale, setReevaluationScale] = useState("3");

  const [narrativeForm, setNarrativeForm] = useState<NarrativeFormState>(
    initialNarrativeForm
  );
  const [localNarrativesByPatient, setLocalNarrativesByPatient] = useState<
    Record<string, NarrativeRecord[]>
  >({});

  const selectedNanda = nandaCatalog.find((item) => item.id === nandaId) ?? nandaCatalog[0];
  const selectedNic = nicCatalog.find((item) => item.id === nicId) ?? nicCatalog[0];
  const selectedNoc = nocCatalog.find((item) => item.id === nocId) ?? nocCatalog[0];

  const globalRecords = useMemo(() => {
    const base = nursingReportRecords.map((record) => {
      const patient = mockPatients.find((item) => item.id === record.patientId);
      return {
        id: record.id,
        patientId: record.patientId,
        datetime: `${record.date} 12:00`,
        nurse: record.response,
        shift: record.shift,
        narrative: `Recibo paciente ${patient?.fullName ?? record.patientId} acompanado de familiar, con diagnostico de ${record.diagnosis}. Valoracion cefalocaudal: estado general ${record.generalStatus}, conciencia ${record.consciousness}, respiracion ${record.breathing}. Cuidados: ${record.proceduresDone}. Incidencias: ${record.incidents}. Plan inmediato: ${record.immediatePlan}.`,
      };
    });

    const local = Object.values(localNarrativesByPatient).flat();
    return [...base, ...local].sort((a, b) => b.datetime.localeCompare(a.datetime));
  }, [localNarrativesByPatient]);

  const patientNarratives = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }
    return globalRecords.filter((record) => record.patientId === selectedPatient.id);
  }, [globalRecords, selectedPatient]);

  const narrativePreview = useMemo(() => {
    if (!selectedPatient) {
      return "Selecciona un paciente para generar el reporte narrativo.";
    }

    return buildNarrativeText({
      patientName: selectedPatient.fullName,
      diagnosis: selectedPatient.primaryDiagnosis,
      companion: narrativeForm.companion,
      cefalocaudalAssessment: narrativeForm.cefalocaudalAssessment,
      cuidados: narrativeForm.cuidados,
      procedures: narrativeForm.procedures,
      incidents: narrativeForm.incidents,
      immediatePlan: narrativeForm.immediatePlan,
    });
  }, [narrativeForm, selectedPatient]);

  const registerNarrative = () => {
    if (!selectedPatient) {
      return;
    }

    if (
      !narrativeForm.nurse.trim() ||
      !narrativeForm.cefalocaudalAssessment.trim() ||
      !narrativeForm.cuidados.trim()
    ) {
      return;
    }

    const now = new Date();
    const datetime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const record: NarrativeRecord = {
      id: `nr-local-${selectedPatient.id}-${Date.now()}`,
      patientId: selectedPatient.id,
      datetime,
      nurse: narrativeForm.nurse.trim(),
      shift: narrativeForm.shift,
      narrative: narrativePreview,
    };

    setLocalNarrativesByPatient((prev) => ({
      ...prev,
      [selectedPatient.id]: [...(prev[selectedPatient.id] ?? []), record],
    }));

    setNarrativeForm((prev) => ({
      ...initialNarrativeForm,
      nurse: prev.nurse,
      companion: prev.companion,
    }));
  };

  return (
    <ModulePage
      title="Reporte de enfermeria"
      subtitle="Registro narrativo profesional por enfermeria + PAE con NANDA/NIC/NOC y fundamento clinico."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Reportes registrados" value={globalRecords.length} hint="Narrativos y estructurados" />
        <StatCard
          label="Pacientes cubiertos"
          value={new Set(globalRecords.map((record) => record.patientId)).size}
          hint="Cobertura por turno"
        />
        <StatCard
          label="Con PAE completo"
          value={nursingReportRecords.filter((record) => record.nandaId && record.nicId && record.nocId).length}
          hint="NANDA + NIC + NOC"
        />
        <StatCard
          label="Pendientes de cierre"
          value={mockPatients.filter((patient) => patient.nursingShiftReports.length === 0).length}
          hint="Falta reporte de turno"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para reporte de enfermeria"
        subtitle="Selecciona paciente y registra reporte narrativo realizado por enfermeria."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel
        title="Vista global de reportes narrativos"
        subtitle="Registros de enfermeria con redaccion clinica y seguimiento de turno"
      >
        <div className="space-y-2">
          {globalRecords.map((record) => {
            const patient = mockPatients.find((item) => item.id === record.patientId);
            return (
              <article
                key={record.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {patient?.fullName ?? record.patientId} · Turno {record.shift}
                    </p>
                    <p className="text-[11px] text-slate-500">{record.datetime} · Enfermera: {record.nurse}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">{record.narrative}</p>
              </article>
            );
          })}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Registro literal de enfermeria"
          subtitle="Ejemplo: 'Recibo paciente ... acompanado de ... con diagnostico ... valoracion cefalocaudal ... cuidados ...'"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Turno"
              value={narrativeForm.shift}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, shift: value }))}
              options={["Manana", "Tarde", "Noche"]}
            />
            <InputField
              label="Enfermera responsable"
              value={narrativeForm.nurse}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, nurse: value }))}
              placeholder="Nombre de enfermera"
            />
            <SelectField
              label="Acompanante"
              value={narrativeForm.companion}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, companion: value }))}
              options={["madre/padre", "familiar", "tutor", "sin acompanante"]}
            />
            <InputField label="Paciente" value={selectedPatient.fullName} onChange={() => {}} placeholder="" disabled />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <TextArea
              label="Valoracion cefalocaudal"
              value={narrativeForm.cefalocaudalAssessment}
              onChange={(value) =>
                setNarrativeForm((prev) => ({ ...prev, cefalocaudalAssessment: value }))
              }
              placeholder="Ej. Alerta, orientado, pupilas isocoricas, respiracion eupneica, piel integra..."
            />
            <TextArea
              label="Cuidados de enfermeria brindados"
              value={narrativeForm.cuidados}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, cuidados: value }))}
              placeholder="Ej. Control de signos, higiene, cambio de posicion, educacion a familiar..."
            />
            <TextArea
              label="Procedimientos realizados"
              value={narrativeForm.procedures}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, procedures: value }))}
              placeholder="Ej. Canalizacion periferica, administracion de medicamento, curacion..."
            />
            <TextArea
              label="Incidencias y observaciones"
              value={narrativeForm.incidents}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, incidents: value }))}
              placeholder="Ej. Sin incidencias / se reporta dolor / se notifica a medico..."
            />
          </div>

          <div className="mt-3">
            <TextArea
              label="Plan inmediato"
              value={narrativeForm.immediatePlan}
              onChange={(value) => setNarrativeForm((prev) => ({ ...prev, immediatePlan: value }))}
              placeholder="Ej. Continuar vigilancia, control cada 2 horas, educacion familiar..."
            />
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previsualizacion narrativa</p>
            <p className="mt-1 text-xs text-slate-700">{narrativePreview}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={registerNarrative}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Registrar reporte narrativo
            </button>
          </div>

          {patientNarratives.length > 0 ? (
            <div className="mt-3 space-y-2">
              {patientNarratives.map((record) => (
                <article
                  key={record.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"
                >
                  <p className="font-semibold text-slate-900">
                    {record.datetime} · Turno {record.shift} · Enfermera {record.nurse}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">{record.narrative}</p>
                </article>
              ))}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {selectedPatient ? (
        <Panel
          title="Integracion PAE (NANDA, NIC, NOC)"
          subtitle="Seleccion, fundamento clinico y evaluacion por turno"
        >
          <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Contexto PAE</p>
            <p className="text-[11px] text-slate-500">
              Patron funcional alterado: {getPatientFunctionalPatterns(selectedPatient).join(", ") || "Sin patron"}
            </p>
            <p className="text-[11px] text-slate-500">
              Signos/sintomas observados: {selectedPatient.triageAssessment.symptoms.join(", ")}
            </p>
            <p className="text-[11px] text-slate-500">
              Diagnostico medico: {selectedPatient.primaryDiagnosis}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
            <SearchableSelect
              label="NANDA"
              value={nandaId}
              onChange={setNandaId}
              options={nandaCatalog.map((item) => ({
                id: item.id,
                label: item.label,
                description: `${item.domain} · ${item.class}`,
              }))}
              placeholder="Buscar diagnostico NANDA"
            />

            <SearchableSelect
              label="NOC"
              value={nocId}
              onChange={setNocId}
              options={nocCatalog.map((item) => ({
                id: item.id,
                label: item.outcome,
                description: item.scale,
              }))}
              placeholder="Buscar resultado NOC"
            />

            <SearchableSelect
              label="NIC"
              value={nicId}
              onChange={setNicId}
              options={nicCatalog.map((item) => ({
                id: item.id,
                label: item.intervention,
                description: `${item.field} · ${item.class}`,
              }))}
              placeholder="Buscar intervencion NIC"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-slate-700 lg:grid-cols-2">
            <InfoBlock
              title="NANDA seleccionado"
              lines={[
                selectedNanda.label,
                `Dominio: ${selectedNanda.domain} · Clase: ${selectedNanda.class}`,
                `Factores relacionados: ${selectedNanda.relatedFactors.join("; ")}`,
                `Caracteristicas definitorias: ${selectedNanda.definingCharacteristics.join("; ")}`,
              ]}
            />
            <InfoBlock
              title="NOC / NIC seleccionados"
              lines={[
                `NOC: ${selectedNoc.outcome}`,
                `Indicadores: ${selectedNoc.indicators.join("; ")}`,
                `NIC: ${selectedNic.intervention}`,
                `Actividades sugeridas: ${selectedNic.suggestedActivities.join("; ")}`,
              ]}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <ScaleInput label="Estado inicial (NOC)" value={initialScale} onChange={setInitialScale} />
            <ScaleInput label="Meta esperada (NOC)" value={targetScale} onChange={setTargetScale} />
            <ScaleInput label="Reevaluacion" value={reevaluationScale} onChange={setReevaluationScale} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <TextArea
              label="Justificacion clinica de la seleccion"
              value={clinicalRationale}
              onChange={setClinicalRationale}
              placeholder="Justifica por que se eligio este NANDA/NOC/NIC en este paciente..."
            />
            <TextArea
              label="Evaluacion final"
              value={evaluation}
              onChange={setEvaluation}
              placeholder="Resultado de intervenciones, cumplimiento de objetivos y conducta de continuidad..."
            />
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function buildNarrativeText({
  patientName,
  diagnosis,
  companion,
  cefalocaudalAssessment,
  cuidados,
  procedures,
  incidents,
  immediatePlan,
}: {
  patientName: string;
  diagnosis: string;
  companion: string;
  cefalocaudalAssessment: string;
  cuidados: string;
  procedures: string;
  incidents: string;
  immediatePlan: string;
}) {
  return `Recibo paciente ${patientName} acompanado de ${companion}, con diagnostico de ${diagnosis}. Valoracion cefalocaudal: ${cefalocaudalAssessment || "sin detalle"}. Cuidados de enfermeria brindados: ${cuidados || "sin detalle"}. Procedimientos realizados: ${procedures || "sin detalle"}. Incidencias: ${incidents || "sin incidencias"}. Plan inmediato: ${immediatePlan || "continuar vigilancia y cuidados"}.`;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 disabled:opacity-70"
      />
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
  options: string[];
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
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScaleInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type="number"
        min={1}
        max={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
      />
    </div>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-[11px] text-slate-500">
          {line}
        </p>
      ))}
    </div>
  );
}
