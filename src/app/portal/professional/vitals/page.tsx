"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import {
  getLatestVitalByPatient,
  getPatientServiceArea,
  mockPatients,
  type ServiceArea,
} from "../_data/clinical-mock-data";

export default function VitalsPage() {
  const searchParams = useSearchParams();
  const [areaFilter, setAreaFilter] = useState<"all" | ServiceArea>("all");
  const patientsByArea = useMemo(
    () =>
      areaFilter === "all"
        ? mockPatients
        : mockPatients.filter((patient) => getPatientServiceArea(patient) === areaFilter),
    [areaFilter]
  );

  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(patientsByArea);
  const requestedPatientId = searchParams.get("patientId") ?? "";

  useEffect(() => {
    if (!requestedPatientId) {
      return;
    }

    if (patientsByArea.some((patient) => patient.id === requestedPatientId)) {
      setSelectedPatientId(requestedPatientId);
    }
  }, [patientsByArea, requestedPatientId, setSelectedPatientId]);

  const rows = useMemo(
    () =>
      filteredPatients
        .map((patient) => ({
          patient,
          latestVital: getLatestVitalByPatient(patient),
        }))
        .filter((entry) => entry.latestVital !== null),
    [filteredPatients]
  );

  const flagged = rows.filter((entry) => entry.latestVital?.outOfRangeFlags.length);

  return (
    <ModulePage
      title="Signos vitales"
      subtitle="Vista global de alteraciones y registro por paciente con historial comparativo."
      actions={
        <Link
          href="/portal/professional/patients"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Ir a pacientes
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pacientes en sala" value={patientsByArea.length} hint={areaFilter === "all" ? "Todas las areas" : areaFilter} />
        <StatCard label="Pacientes con registro" value={rows.length} hint="Ultimo control disponible" />
        <StatCard label="Con valores alterados" value={flagged.length} hint="Fuera de rango" />
        <StatCard
          label="Sin control actualizado"
          value={patientsByArea.length - rows.filter((entry) => entry.latestVital?.recordedAt.startsWith("2026-03-08")).length}
          hint="Pendientes de registro del dia"
        />
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Sala / area para signos vitales
        </label>
        <select
          value={areaFilter}
          onChange={(event) => setAreaFilter(event.target.value as "all" | ServiceArea)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none sm:max-w-sm"
        >
          <option value="all">Todas las areas</option>
          <option value="Emergencia">Emergencia</option>
          <option value="Observacion">Observacion</option>
          <option value="Hospitalizacion">Hospitalizacion</option>
          <option value="Consulta externa">Consulta externa</option>
        </select>
      </article>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : patientsByArea}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para signos vitales"
        subtitle="Primero selecciona sala/area y luego elige el paciente para revisar sus controles."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de signos" subtitle="Ultimo registro por paciente y alertas automaticas">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">TA</th>
                <th className="px-3 py-2">FC / FR</th>
                <th className="px-3 py-2">Temp / SpO2</th>
                <th className="px-3 py-2">Glucosa</th>
                <th className="px-3 py-2">Dolor</th>
                <th className="px-3 py-2">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ patient, latestVital }) => (
                <tr key={patient.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="text-[11px] text-slate-500">{patient.primaryDiagnosis}</p>
                  </td>
                  <td className="px-3 py-2">{latestVital?.recordedAt}</td>
                  <td className="px-3 py-2">{latestVital?.bloodPressure}</td>
                  <td className="px-3 py-2">{latestVital?.heartRate} / {latestVital?.respiratoryRate}</td>
                  <td className="px-3 py-2">{latestVital?.temperature} C / {latestVital?.spo2}%</td>
                  <td className="px-3 py-2">{latestVital?.glucose}</td>
                  <td className="px-3 py-2">{latestVital?.painScale}/10</td>
                  <td className="px-3 py-2">
                    {latestVital?.outOfRangeFlags.length ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                        {latestVital.outOfRangeFlags.join(", ")}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Sin alertas</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: registro de signos vitales"
          subtitle="Formulario estructurado + comparacion con control previo"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Presion arterial" value={selectedPatient.vitalSigns[0]?.bloodPressure ?? "-"} />
            <Field label="Frecuencia cardiaca" value={`${selectedPatient.vitalSigns[0]?.heartRate ?? "-"}`} />
            <Field label="Frecuencia respiratoria" value={`${selectedPatient.vitalSigns[0]?.respiratoryRate ?? "-"}`} />
            <Field label="Temperatura" value={`${selectedPatient.vitalSigns[0]?.temperature ?? "-"} C`} />
            <Field label="Saturacion O2" value={`${selectedPatient.vitalSigns[0]?.spo2 ?? "-"}%`} />
            <Field label="Glucemia capilar" value={`${selectedPatient.vitalSigns[0]?.glucose ?? "-"}`} />
            <Field label="Dolor" value={`${selectedPatient.vitalSigns[0]?.painScale ?? "-"}/10`} />
            <Field label="Peso" value={`${selectedPatient.vitalSigns[0]?.weightKg ?? "-"} kg`} />
            <Field label="Talla" value={`${selectedPatient.vitalSigns[0]?.heightCm ?? "-"} cm`} />
            <Field label="IMC" value={`${selectedPatient.vitalSigns[0]?.bmi ?? "-"}`} />
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Mini tendencia</p>
            <p className="text-[11px] text-slate-500">
              Ultimos controles: {selectedPatient.vitalSigns.slice(0, 3).map((record) => record.recordedAt).join(" · ")}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Registrar nuevo control
            </button>
            <Link
              href={`/portal/professional/patients/${selectedPatient.id}?tab=vitals`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-slate-100"
            >
              Abrir historial completo
            </Link>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}
