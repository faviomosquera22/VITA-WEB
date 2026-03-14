import Link from "next/link";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { getAvailableMspForms } from "@/lib/msp-form-reports";
import {
  getRegisteredPatientById,
  listRegisteredPatientSummaries,
} from "@/lib/patient-intake-store";

export const dynamic = "force-dynamic";

const secondaryReports = [
  {
    title: "Reporte de enfermeria",
    description: "Narrativa de turno y seguimiento PAE.",
    href: "/portal/professional/nursing-report",
  },
  {
    title: "Signos vitales",
    description: "Control de constantes y seguimiento clinico.",
    href: "/portal/professional/vitals",
  },
  {
    title: "Medicacion",
    description: "Registro operativo de medicamentos y administraciones.",
    href: "/portal/professional/medication",
  },
  {
    title: "Vacunacion",
    description: "Registro de dosis aplicadas y stock.",
    href: "/portal/professional/vaccination",
  },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { patientId } = await searchParams;
  const summaries = listRegisteredPatientSummaries();
  const selectedPatientId = patientId ?? summaries[0]?.id ?? "";
  const selectedRecord = selectedPatientId
    ? getRegisteredPatientById(selectedPatientId)
    : null;
  const selectedForms = selectedRecord ? getAvailableMspForms(selectedRecord) : [];
  const readyForms = selectedForms.filter((item) => item.availability !== "sin_datos").length;

  return (
    <ModulePage
      title="Reportes MSP y documentos clinicos"
      subtitle="Generacion de formularios oficiales, reportes imprimibles y salidas documentales por paciente."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            Nuevo ingreso
          </Link>
          <Link
            href="/portal/professional/clinical-documents"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Documentos clinicos
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Formularios MSP" value={7} hint="008, 005, 007, 010A, 012A, 024 y 053" />
        <StatCard label="Pacientes con expediente" value={summaries.length} hint="Registros listos para generar documentos" />
        <StatCard
          label="Formularios listos"
          value={selectedRecord ? readyForms : 0}
          hint={selectedRecord ? `Paciente: ${selectedRecord.identification.firstNames}` : "Selecciona un paciente"}
        />
        <StatCard
          label="Pendientes criticos MSP"
          value={selectedRecord ? selectedRecord.mspCompliance.criticalPendingItems.length : 0}
          hint="Checklist del expediente seleccionado"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Panel
          title="Seleccion de paciente"
          subtitle="Los formularios oficiales se generan a partir del expediente clinico persistido"
        >
          {summaries.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Aun no hay pacientes ingresados con el flujo clinico estructurado.
              </p>
              <Link
                href="/portal/professional/patients/ingreso"
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Crear primer expediente
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {summaries.map((patient) => {
                const selected = patient.id === selectedPatientId;
                return (
                  <Link
                    key={patient.id}
                    href={`/portal/professional/reports?patientId=${patient.id}`}
                    className={[
                      "block rounded-2xl border px-4 py-3 transition",
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{patient.fullName}</p>
                        <p
                          className={[
                            "text-[11px]",
                            selected ? "text-white/70" : "text-slate-500",
                          ].join(" ")}
                        >
                          HC {patient.medicalRecordNumber} · {patient.documentNumber}
                        </p>
                        <p
                          className={[
                            "mt-1 text-xs",
                            selected ? "text-white/80" : "text-slate-600",
                          ].join(" ")}
                        >
                          {patient.consultationReason}
                        </p>
                      </div>
                      <span
                        className={[
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          selected
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-slate-200 bg-white text-slate-600",
                        ].join(" ")}
                      >
                        MSP {patient.mspScore}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Formularios MSP disponibles"
          subtitle="Catalogo imprimible del expediente seleccionado"
        >
          {!selectedRecord ? (
            <p className="text-sm text-slate-600">
              Selecciona un paciente para abrir sus formularios oficiales.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedRecord.identification.firstNames} {selectedRecord.identification.lastNames}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  HC {selectedRecord.medicalRecordNumber} · {selectedRecord.identification.documentNumber}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Pendientes criticos:{" "}
                  {selectedRecord.mspCompliance.criticalPendingItems.length
                    ? selectedRecord.mspCompliance.criticalPendingItems.join(" · ")
                    : "Sin pendientes criticos visibles"}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {selectedForms.map((form) => (
                  <article
                    key={form.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {form.id} · {form.title}
                      </p>
                      <AvailabilityBadge availability={form.availability} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{form.code}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-600">
                      {form.description}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {form.availabilityNote}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/portal/professional/reports/forms/${form.id}?patientId=${selectedRecord.id}`}
                        className="rounded-full border border-slate-300 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                      >
                        Abrir formulario
                      </Link>
                      <Link
                        href={`/portal/professional/patients/ingreso/${selectedRecord.id}`}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ver expediente
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Otros reportes operativos"
        subtitle="Flujos secundarios del portal que siguen generando salidas narrativas o de control"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {secondaryReports.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </Panel>
    </ModulePage>
  );
}

function AvailabilityBadge({
  availability,
}: {
  availability: "listo" | "parcial" | "sin_datos";
}) {
  const tone =
    availability === "listo"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : availability === "parcial"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {availability}
    </span>
  );
}
