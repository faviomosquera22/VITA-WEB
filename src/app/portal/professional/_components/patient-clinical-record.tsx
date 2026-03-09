"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Panel, RiskBadge, TriageBadge } from "./clinical-ui";
import {
  educationResources,
  getPatientFunctionalPatterns,
  type PatientRecord,
} from "../_data/clinical-mock-data";

type PatientTabId =
  | "summary"
  | "personal"
  | "background"
  | "triage"
  | "vitals"
  | "medication"
  | "nursing_notes"
  | "medical_notes"
  | "nursing_report"
  | "fluid_balance"
  | "kardex"
  | "exams"
  | "diagnoses"
  | "procedures"
  | "nutrition"
  | "vaccination"
  | "emotional"
  | "care_plan"
  | "documents"
  | "timeline"
  | "education"
  | "reports";

const patientTabs: Array<{ id: PatientTabId; label: string; group: string }> = [
  { id: "summary", label: "Resumen", group: "Vision clinica rapida" },
  { id: "diagnoses", label: "Diagnosticos", group: "Vision clinica rapida" },
  { id: "triage", label: "Triaje", group: "Vision clinica rapida" },
  { id: "timeline", label: "Historial", group: "Vision clinica rapida" },
  { id: "vitals", label: "Signos vitales", group: "Monitoreo" },
  { id: "fluid_balance", label: "Balance hidrico", group: "Monitoreo" },
  { id: "exams", label: "Examenes", group: "Monitoreo" },
  { id: "procedures", label: "Procedimientos", group: "Monitoreo" },
  { id: "medication", label: "Medicacion", group: "Tratamiento y cuidados" },
  { id: "nursing_notes", label: "Enfermeria", group: "Tratamiento y cuidados" },
  { id: "medical_notes", label: "Medicina", group: "Tratamiento y cuidados" },
  { id: "kardex", label: "Kardex", group: "Tratamiento y cuidados" },
  { id: "nursing_report", label: "Reporte enfermeria", group: "Tratamiento y cuidados" },
  { id: "care_plan", label: "Plan de cuidados", group: "Tratamiento y cuidados" },
  { id: "nutrition", label: "Nutricion", group: "Enfoque integral" },
  { id: "vaccination", label: "Vacunacion", group: "Enfoque integral" },
  { id: "emotional", label: "Salud emocional", group: "Enfoque integral" },
  { id: "education", label: "Educacion", group: "Enfoque integral" },
  { id: "personal", label: "Datos personales", group: "Apoyo documental" },
  { id: "background", label: "Antecedentes", group: "Apoyo documental" },
  { id: "documents", label: "Documentos", group: "Apoyo documental" },
  { id: "reports", label: "Reportes", group: "Apoyo documental" },
];

const isTab = (value: string | null): value is PatientTabId =>
  patientTabs.some((tab) => tab.id === value);

export default function PatientClinicalRecord({ patient }: { patient: PatientRecord }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [selectedTab, setSelectedTab] = useState<PatientTabId>("summary");
  const activeTab = isTab(requestedTab) ? requestedTab : selectedTab;

  const latestVital = patient.vitalSigns[0] ?? null;
  const functionalPatterns = getPatientFunctionalPatterns(patient);

  const timelineSorted = useMemo(
    () => [...patient.timeline].sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [patient.timeline]
  );

  const groupedTabs = useMemo(() => {
    return patientTabs.reduce<Record<string, Array<{ id: PatientTabId; label: string }>>>(
      (acc, tab) => {
        if (!acc[tab.group]) {
          acc[tab.group] = [];
        }
        acc[tab.group].push({ id: tab.id, label: tab.label });
        return acc;
      },
      {}
    );
  }, []);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-lg font-semibold text-white">
              {toInitials(patient.fullName)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{patient.fullName}</h1>
              <p className="text-xs text-slate-600">
                {patient.age} anios · {patient.sex} · ID {patient.identification}
              </p>
              <p className="text-xs text-slate-500">
                Historia clinica: {patient.medicalRecordNumber} · Codigo: {patient.code}
              </p>
              <p className="mt-1 text-xs text-slate-700">
                Diagnostico principal: <span className="font-semibold">{patient.primaryDiagnosis}</span>
              </p>
              <p className="text-xs text-slate-500">
                Diagnosticos secundarios:{" "}
                {patient.secondaryDiagnoses.length
                  ? patient.secondaryDiagnoses.join(", ")
                  : "Sin diagnosticos secundarios"}
              </p>
              <p className="text-xs text-slate-500">
                Profesional responsable: {patient.assignedProfessional} · Ingreso: {patient.admissionDate} · Ultimo
                control: {patient.lastControlAt}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge risk={patient.riskLevel} />
              <TriageBadge triage={patient.triageColor} />
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                Estado: {patient.currentStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <ActionChip label="Editar datos" />
              <ActionChip label="Generar reporte" />
              <ActionChip label="Exportar PDF" />
              <ActionChip label="Ver alertas" />
              <ActionChip label="Agregar nota" />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
            Patron funcional alterado
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(functionalPatterns.length ? functionalPatterns : ["Sin patron registrado"]).map(
              (pattern) => (
                <span
                  key={pattern}
                  className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] text-sky-700"
                >
                  {pattern}
                </span>
              )
            )}
          </div>
        </div>

        {patient.activeAlerts.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Alertas activas
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {patient.activeAlerts.map((alert) => (
                <span
                  key={alert}
                  className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[11px] text-amber-700"
                >
                  {alert}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <nav className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
            Submodulos de ficha clinica
          </span>
          <span>Vision clinica · Monitoreo · Cuidados · Integral · Documental</span>
        </div>
        <div className="space-y-2">
          {Object.entries(groupedTabs).map(([groupName, tabs]) => (
            <div key={groupName}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {groupName}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                  const active = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedTab(tab.id)}
                      className={[
                        "whitespace-nowrap rounded-full border px-3 py-1 text-xs transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {activeTab === "summary" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Resumen general" subtitle="Vista rapida del estado actual del paciente">
            <div className="space-y-2 text-xs text-slate-700">
              <SummaryRow label="Motivo de consulta" value={patient.summary.reasonForConsultation} />
              <SummaryRow label="Diagnostico principal" value={patient.primaryDiagnosis} />
              <SummaryRow
                label="Diagnosticos secundarios"
                value={patient.secondaryDiagnoses.length ? patient.secondaryDiagnoses.join(", ") : "Sin diagnosticos secundarios"}
              />
              <SummaryRow
                label="Alergias"
                value={patient.antecedentes.allergies.join(", ") || "No registradas"}
              />
              <SummaryRow
                label="Signos vitales recientes"
                value={
                  latestVital
                    ? `${latestVital.recordedAt} · TA ${latestVital.bloodPressure} · FC ${latestVital.heartRate} · SpO2 ${latestVital.spo2}%`
                    : "Sin registros recientes"
                }
              />
            </div>
          </Panel>

          <Panel title="Resumen clinico complementario" subtitle="Alertas, notas recientes y seguimiento">
            <div className="space-y-2 text-xs text-slate-700">
              <SummaryRow
                label="Medicacion actual"
                value={patient.summary.activeMedicationSummary.join(" · ")}
              />
              <SummaryRow
                label="Ultimo reporte de enfermeria"
                value={patient.summary.latestNursingReport}
              />
              <SummaryRow
                label="Vacunas pendientes"
                value={patient.summary.vaccinationPendingSummary.join(", ") || "Sin pendientes"}
              />
              <SummaryRow
                label="Resumen nutricional"
                value={patient.summary.nutritionalSummary}
              />
              <SummaryRow
                label="Resumen emocional"
                value={patient.summary.emotionalSummary}
              />
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "personal" && (
        <Panel title="Datos personales e identificacion" subtitle="Informacion administrativa y de contacto">
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-3">
            <SummaryRow label="Nombres" value={`${patient.firstName} ${patient.lastName}`} />
            <SummaryRow label="Fecha nacimiento" value={patient.birthDate} />
            <SummaryRow label="Edad" value={`${patient.age} anios`} />
            <SummaryRow label="Sexo" value={patient.sex} />
            <SummaryRow label="Cedula" value={patient.identification} />
            <SummaryRow label="Direccion" value={patient.personalData.address} />
            <SummaryRow label="Telefono" value={patient.personalData.phone} />
            <SummaryRow
              label="Contacto emergencia"
              value={patient.personalData.emergencyContact}
            />
            <SummaryRow label="Tipo sangre" value={patient.personalData.bloodType} />
            <SummaryRow label="Aseguradora" value={patient.personalData.insurance} />
            <SummaryRow label="Estado civil" value={patient.personalData.civilStatus} />
            <SummaryRow label="Ocupacion" value={patient.personalData.occupation} />
            <SummaryRow label="Procedencia" value={patient.personalData.origin} />
            <SummaryRow label="Responsable" value={patient.personalData.guardian} />
          </div>
        </Panel>
      )}

      {activeTab === "background" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Antecedentes clinicos" subtitle="Patologicos, quirurgicos, familiares y alergias">
            <ListBlock title="Patologicos" items={patient.antecedentes.pathological} />
            <ListBlock title="Quirurgicos" items={patient.antecedentes.surgical} />
            <ListBlock title="Farmacologicos" items={patient.antecedentes.pharmacological} />
            <ListBlock title="Alergias" items={patient.antecedentes.allergies} />
            <ListBlock title="Familiares" items={patient.antecedentes.family} />
            <ListBlock title="Gineco-obstetricos" items={patient.antecedentes.gynecoObstetric} />
          </Panel>

          <Panel title="Habitos y enfermedades cronicas" subtitle="Contexto para seguimiento longitudinal">
            <div className="space-y-2 text-xs text-slate-700">
              <SummaryRow label="Tabaco" value={patient.antecedentes.habits.tobacco} />
              <SummaryRow label="Alcohol" value={patient.antecedentes.habits.alcohol} />
              <SummaryRow label="Otras sustancias" value={patient.antecedentes.habits.substances} />
              <SummaryRow
                label="Actividad fisica"
                value={patient.antecedentes.habits.physicalActivity}
              />
              <SummaryRow label="Alimentacion" value={patient.antecedentes.habits.feeding} />
            </div>
            <ListBlock
              title="Hospitalizaciones previas"
              items={patient.antecedentes.hospitalizations}
            />
            <ListBlock
              title="Enfermedades cronicas"
              items={patient.antecedentes.chronicDiseases}
            />
          </Panel>
        </div>
      )}

      {activeTab === "triage" && (
        <Panel title="Triaje y evaluacion inicial" subtitle="Clasificacion de riesgo y conducta sugerida">
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2">
            <SummaryRow label="Fecha evaluacion" value={patient.triageAssessment.evaluatedAt} />
            <SummaryRow
              label="Motivo consulta"
              value={patient.triageAssessment.consultationReason}
            />
            <SummaryRow
              label="Tiempo evolucion"
              value={patient.triageAssessment.evolutionTime}
            />
            <SummaryRow
              label="Clasificacion de riesgo"
              value={patient.triageAssessment.riskClassification}
            />
            <SummaryRow
              label="Color triaje"
              value={patient.triageAssessment.triageColor}
            />
            <SummaryRow
              label="Conducta sugerida"
              value={patient.triageAssessment.suggestedConduct}
            />
            <SummaryRow label="Derivacion" value={patient.triageAssessment.referral} />
            <SummaryRow
              label="Observaciones"
              value={patient.triageAssessment.professionalObservations}
            />
          </div>
          <ListBlock title="Sintomas reportados" items={patient.triageAssessment.symptoms} />
          <ListBlock title="Signos de alarma" items={patient.triageAssessment.warningSigns} />
        </Panel>
      )}

      {activeTab === "vitals" && (
        <div className="space-y-4">
          <Panel title="Signos vitales" subtitle="Registros historicos y tendencias basicas">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">TA</th>
                    <th className="px-3 py-2">FC</th>
                    <th className="px-3 py-2">FR</th>
                    <th className="px-3 py-2">Temp</th>
                    <th className="px-3 py-2">SpO2</th>
                    <th className="px-3 py-2">Glucosa</th>
                    <th className="px-3 py-2">Dolor</th>
                    <th className="px-3 py-2">Peso/IMC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patient.vitalSigns.map((vital) => (
                    <tr key={vital.recordedAt}>
                      <td className="px-3 py-2">{vital.recordedAt}</td>
                      <td className="px-3 py-2">{vital.bloodPressure}</td>
                      <td className="px-3 py-2">{vital.heartRate}</td>
                      <td className="px-3 py-2">{vital.respiratoryRate}</td>
                      <td className="px-3 py-2">{vital.temperature}</td>
                      <td className="px-3 py-2">{vital.spo2}%</td>
                      <td className="px-3 py-2">{vital.glucose}</td>
                      <td className="px-3 py-2">{vital.painScale}/10</td>
                      <td className="px-3 py-2">{vital.weightKg}kg / {vital.bmi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Alertas de rango" subtitle="Variables fuera de rango detectadas en controles">
            <div className="flex flex-wrap gap-2">
              {patient.vitalSigns.flatMap((entry) => entry.outOfRangeFlags).length === 0 && (
                <p className="text-xs text-slate-500">Sin valores fuera de rango en los registros actuales.</p>
              )}
              {patient.vitalSigns.flatMap((entry) => entry.outOfRangeFlags).map((flag, index) => (
                <span
                  key={`${flag}-${index}`}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700"
                >
                  {flag}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <ActionChip label="Agregar nuevo control" />
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "medication" && (
        <Panel title="Medicacion" subtitle="Plan farmacologico, adherencia y estado de administracion">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Agregar medicamento" />
            <ActionChip label="Registrar administracion" />
            <ActionChip label="Ver historial de cambios" />
          </div>
          <div className="space-y-2">
            {patient.medicationRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {record.name} · {record.dose}
                  </p>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      record.administrationStatus === "Pendiente"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : record.administrationStatus === "Administrado"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {record.administrationStatus}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  {record.frequency} · Via {record.route} · Horario {record.schedule}
                </p>
                <p className="text-[11px] text-slate-500">Indicacion: {record.indication}</p>
                <p className="text-[11px] text-slate-500">
                  Prescribe: {record.prescriber} · Adherencia: {record.adherence}
                </p>
                <p className="text-[11px] text-slate-500">Observaciones: {record.notes}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "nursing_notes" && (
        <Panel title="Notas de enfermeria" subtitle="Evolucion cronologica y seguimiento por turno">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Agregar nota de enfermeria" />
            <ActionChip label="Filtrar por fecha" />
          </div>
          <ChronologicalNotes notes={patient.nursingNotes} />
        </Panel>
      )}

      {activeTab === "medical_notes" && (
        <Panel title="Notas medicas" subtitle="Valoracion clinica, impresion diagnostica e indicaciones">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Agregar nota medica" />
            <ActionChip label="Agregar interconsulta" />
          </div>
          <ChronologicalNotes notes={patient.medicalNotes} />
        </Panel>
      )}

      {activeTab === "nursing_report" && (
        <Panel title="Reporte de enfermeria" subtitle="Formato estructurado de turno y plan de cuidados">
          <div className="space-y-3">
            {patient.nursingShiftReports.length === 0 && (
              <p className="text-xs text-slate-500">Sin reportes estructurados registrados.</p>
            )}
            {patient.nursingShiftReports.map((report) => (
              <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Turno {report.shift} · {report.date}
                  </p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {report.service}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
                  <SummaryRow label="Estado general" value={report.generalStatus} />
                  <SummaryRow label="Conciencia" value={report.consciousness} />
                  <SummaryRow label="Respiracion" value={report.breathing} />
                  <SummaryRow label="Dolor" value={report.pain} />
                  <SummaryRow label="Tolerancia oral" value={report.oralTolerance} />
                  <SummaryRow label="Eliminacion" value={report.elimination} />
                  <SummaryRow label="Movilidad" value={report.mobility} />
                  <SummaryRow label="Piel" value={report.skin} />
                  <SummaryRow label="Procedimientos" value={report.proceduresDone} />
                  <SummaryRow label="Respuesta" value={report.patientResponse} />
                  <SummaryRow label="Incidencias" value={report.incidents} />
                  <SummaryRow label="Plan de cuidados" value={report.carePlan} />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "fluid_balance" && (
        <Panel title="Balance hidrico" subtitle="Ingresos, egresos y balance neto por turno o 24 horas">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Registrar balance" />
            <ActionChip label="Vista por turno" />
            <ActionChip label="Vista 24 horas" />
          </div>
          <div className="space-y-3">
            {patient.fluidBalances.length === 0 && (
              <p className="text-xs text-slate-500">No hay registros de balance hidrico.</p>
            )}
            {patient.fluidBalances.map((balance) => {
              const intakeTotal = sumObjectValues(balance.intake);
              const outputTotal = sumObjectValues(balance.output);
              const netBalance = intakeTotal - outputTotal;

              return (
                <article key={balance.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {balance.shift} · {balance.date}
                    </p>
                    <span
                      className={[
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        netBalance < -300
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      ].join(" ")}
                    >
                      Balance neto: {netBalance} ml
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
                    <SummaryRow
                      label="Total ingresos"
                      value={`${intakeTotal} ml (VO ${balance.intake.oral}, IV ${balance.intake.intravenous})`}
                    />
                    <SummaryRow
                      label="Total egresos"
                      value={`${outputTotal} ml (Diuresis ${balance.output.diuresis})`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{balance.observations}</p>
                </article>
              );
            })}
          </div>
        </Panel>
      )}

      {activeTab === "kardex" && (
        <Panel title="Kardex de enfermeria" subtitle="Plan operacional de cuidado por paciente">
          <div className="space-y-3">
            {patient.kardex.length === 0 && (
              <p className="text-xs text-slate-500">No hay kardex registrados.</p>
            )}
            {patient.kardex.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.date}</p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
                  <SummaryRow label="Diagnostico" value={item.diagnosis} />
                  <SummaryRow label="Dieta" value={item.diet} />
                  <SummaryRow label="Actividad" value={item.activity} />
                  <SummaryRow label="Plan signos" value={item.vitalSignsPlan} />
                  <SummaryRow label="Plan medicacion" value={item.medicationPlan} />
                  <SummaryRow label="Soluciones" value={item.solutions} />
                  <SummaryRow label="Procedimientos" value={item.procedures} />
                  <SummaryRow label="Cuidados" value={item.nursingCare} />
                  <SummaryRow label="Eliminacion" value={item.elimination} />
                  <SummaryRow label="Observaciones" value={item.observations} />
                  <SummaryRow label="Indicaciones especiales" value={item.specialIndications} />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "exams" && (
        <Panel title="Examenes" subtitle="Laboratorio, imagenologia y estudios complementarios">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Agregar examen" />
            <ActionChip label="Filtrar por categoria" />
          </div>
          <div className="space-y-2">
            {patient.exams.length === 0 && (
              <p className="text-xs text-slate-500">No hay examenes registrados.</p>
            )}
            {patient.exams.map((exam) => (
              <article key={exam.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{exam.name}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {exam.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{exam.category}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Solicita: {exam.requestedBy} · Solicitado: {exam.requestedAt}
                </p>
                <p className="text-[11px] text-slate-500">
                  Resultado: {exam.resultAt ?? "Pendiente"} · {exam.summary}
                </p>
                <p className="text-[11px] text-slate-500">Obs: {exam.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "diagnoses" && (
        <Panel title="Diagnosticos" subtitle="Principal, secundarios y presuntivos">
          <div className="space-y-2">
            {patient.diagnoses.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.diagnosis}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {item.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Registro: {item.registeredAt} · Estado: {item.status}
                </p>
                <p className="text-[11px] text-slate-500">{item.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "procedures" && (
        <Panel title="Procedimientos e invasivos" subtitle="Control de dispositivos y procedimientos activos">
          <div className="space-y-2">
            {patient.procedures.length === 0 && (
              <p className="text-xs text-slate-500">Sin procedimientos registrados para este paciente.</p>
            )}
            {patient.procedures.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                <p className="text-[11px] text-slate-500">
                  Colocacion: {item.placedAt} · Dias: {item.daysInstalled} · Estado: {item.status}
                </p>
                <p className="text-[11px] text-slate-500">Responsable: {item.responsibleProfessional}</p>
                <p className="text-[11px] text-slate-500">{item.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "nutrition" && (
        <Panel title="Nutricion" subtitle="Estado nutricional, dieta y evolucion">
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-700 md:grid-cols-2">
            <SummaryRow label="Estado nutricional" value={patient.nutrition.nutritionalStatus} />
            <SummaryRow label="Dieta indicada" value={patient.nutrition.diet} />
            <SummaryRow label="Tolerancia alimentaria" value={patient.nutrition.oralTolerance} />
            <SummaryRow label="Ingesta estimada" value={patient.nutrition.estimatedIntake} />
            <SummaryRow label="Riesgo nutricional" value={patient.nutrition.nutritionalRisk} />
            <SummaryRow label="Evolucion" value={patient.nutrition.evolution} />
          </div>
          <ListBlock title="Recomendaciones" items={patient.nutrition.recommendations} />
        </Panel>
      )}

      {activeTab === "vaccination" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Vacunas aplicadas" subtitle="Registro de dosis administradas">
            <div className="space-y-2 text-xs text-slate-700">
              {patient.vaccination.applied.length === 0 && (
                <p className="text-slate-500">No registra vacunas aplicadas en este periodo.</p>
              )}
              {patient.vaccination.applied.map((item) => (
                <article key={`${item.vaccine}-${item.date}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{item.vaccine}</p>
                  <p className="text-[11px] text-slate-500">Fecha: {item.date}</p>
                  <p className="text-[11px] text-slate-500">Lote: {item.lot ?? "No aplica"}</p>
                  <p className="text-[11px] text-slate-500">{item.observations}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Vacunas pendientes" subtitle="Proximas fechas y disponibilidad">
            <div className="space-y-2 text-xs text-slate-700">
              {patient.vaccination.pending.length === 0 && (
                <p className="text-slate-500">No hay vacunas pendientes.</p>
              )}
              {patient.vaccination.pending.map((item) => (
                <article key={`${item.vaccine}-${item.suggestedDate}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="font-semibold text-amber-800">{item.vaccine}</p>
                  <p className="text-[11px] text-amber-700">Sugerida: {item.suggestedDate}</p>
                  <p className="text-[11px] text-amber-700">Centro: {item.availability}</p>
                  <p className="text-[11px] text-amber-700">{item.observations}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "emotional" && (
        <Panel title="Salud emocional" subtitle="Estado actual, seguimiento de animo y recomendaciones">
          <SummaryRow label="Estado emocional actual" value={patient.emotionalHealth.currentState} />
          <ListBlock title="Alertas emocionales" items={patient.emotionalHealth.emotionalAlerts} />
          <ListBlock title="Recomendaciones" items={patient.emotionalHealth.recommendations} />
          <div className="mt-3 space-y-2">
            {patient.emotionalHealth.moodFollowUp.map((entry) => (
              <article key={`${entry.date}-${entry.mood}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{entry.date} · {entry.mood}</p>
                <p className="text-[11px] text-slate-500">Factor: {entry.stressFactor}</p>
                <p className="text-[11px] text-slate-500">{entry.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "care_plan" && (
        <Panel title="Plan de cuidados" subtitle="Diagnosticos de enfermeria, objetivos e intervenciones">
          <div className="space-y-2">
            {patient.carePlan.length === 0 && (
              <p className="text-xs text-slate-500">No hay plan de cuidados estructurado.</p>
            )}
            {patient.carePlan.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{entry.nursingDiagnosis}</p>
                <p className="text-xs text-slate-600">Objetivo: {entry.objective}</p>
                <ListBlock title="Intervenciones" items={entry.interventions} />
                <p className="text-[11px] text-slate-500">Evaluacion: {entry.evaluation}</p>
                <p className="text-[11px] text-slate-500">Observaciones: {entry.observations}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "documents" && (
        <Panel title="Documentos y archivos" subtitle="Reportes PDF, examenes, consentimientos y adjuntos clinicos">
          <div className="space-y-2">
            {patient.documents.length === 0 && (
              <p className="text-xs text-slate-500">Sin documentos disponibles.</p>
            )}
            {patient.documents.map((document) => (
              <article key={document.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">{document.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {document.type} · {document.date} · {document.uploadedBy}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                  {document.status}
                </span>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "education" && (
        <Panel
          title="Educacion en salud"
          subtitle="Material entregado al paciente/familia y nivel de comprension"
        >
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Registro de educacion brindada</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              <SummaryRow label="Tema" value="Medicacion y autocuidado" />
              <SummaryRow label="Fecha" value="2026-03-08" />
              <SummaryRow label="Profesional" value={patient.assignedProfessional} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Comprension reportada: adecuada con apoyo familiar.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {educationResources.map((resource) => (
              <article key={resource.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                <p className="text-xs text-slate-600">{resource.condition}</p>
                <p className="text-[11px] text-slate-500">
                  Formato: {resource.format} · Actualizado: {resource.updatedAt}
                </p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "reports" && (
        <Panel title="Reportes clinicos del paciente" subtitle="Generacion y trazabilidad documental">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <ActionChip label="Generar resumen clinico" />
            <ActionChip label="Exportar PDF" />
            <ActionChip label="Generar reporte de enfermeria" />
          </div>
          <div className="space-y-2">
            {patient.documents.map((document) => (
              <article
                key={`rep-${document.id}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
              >
                <p className="font-semibold text-slate-900">{document.title}</p>
                <p className="text-[11px] text-slate-500">
                  Tipo: {document.type} · Fecha: {document.date} · Estado: {document.status}
                </p>
              </article>
            ))}
            {patient.documents.length === 0 && (
              <p className="text-xs text-slate-500">Sin reportes generados para este paciente.</p>
            )}
          </div>
        </Panel>
      )}

      {activeTab === "timeline" && (
        <Panel title="Historial / linea de tiempo clinica" subtitle="Secuencia de eventos clinicos relevantes">
          <div className="space-y-2">
            {timelineSorted.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{event.category}</p>
                  <span className="text-[11px] text-slate-500">{event.datetime}</span>
                </div>
                <p className="mt-1 text-xs text-slate-700">{event.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      <footer className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] text-slate-500">
          Ficha clinica digital preparada para integracion con backend y flujos multirol.
        </p>
        <Link
          href="/portal/professional/patients"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
        >
          Volver al listado
        </Link>
      </footer>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">Sin registros.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChronologicalNotes({
  notes,
}: {
  notes: Array<{ id: string; datetime: string; professional: string; specialty: string; note: string }>;
}) {
  if (notes.length === 0) {
    return <p className="text-xs text-slate-500">Sin notas registradas.</p>;
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <article key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{note.professional}</p>
            <span className="text-[11px] text-slate-500">{note.datetime}</span>
          </div>
          <p className="text-[11px] text-slate-500">{note.specialty}</p>
          <p className="mt-1 text-xs text-slate-700">{note.note}</p>
        </article>
      ))}
    </div>
  );
}

function ActionChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
    >
      {label}
    </button>
  );
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function sumObjectValues(values: Record<string, number>) {
  return Object.values(values).reduce((total, current) => total + current, 0);
}
