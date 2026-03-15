import Link from "next/link";

import AutoPrint from "./auto-print";
import PrintButton from "./print-button";
import { generateMspFormReport, getAvailableMspForms } from "@/lib/msp-form-reports";
import { getRegisteredPatientById } from "@/lib/patient-intake-store";

export const dynamic = "force-dynamic";

export default async function MspFormReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ patientId?: string; print?: string }>;
}) {
  const { formId } = await params;
  const { patientId, print } = await searchParams;
  const record = patientId ? getRegisteredPatientById(patientId) : null;

  if (!patientId || !record) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Formulario MSP</p>
          <p className="mt-2 text-sm text-red-700">
            No se encontro el paciente solicitado para generar el formulario.
          </p>
          <div className="mt-4">
            <Link
              href="/portal/professional/reports"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver a reportes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const report = generateMspFormReport(formId, record);
  if (!report) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Formulario MSP no disponible</p>
          <p className="mt-2 text-sm text-red-700">
            El formulario solicitado no esta implementado en el catalogo actual.
          </p>
          <div className="mt-4">
            <Link
              href="/portal/professional/reports"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver a reportes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formCatalog = getAvailableMspForms(record);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:px-0 print:py-0">
      {print === "1" ? <AutoPrint /> : null}
      <div className="mx-auto max-w-5xl space-y-4 print:max-w-none print:space-y-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Reporte MSP
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {report.form.code} · {report.form.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Paciente: {report.patientName} · HC {report.medicalRecordNumber}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/portal/professional/reports?patientId=${record.id}`}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver a reportes
            </Link>
            <PrintButton />
          </div>
        </div>

        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-8 print:shadow-none">
          <header className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Ministerio de Salud Publica
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  {report.form.code}
                </h2>
                <p className="mt-1 text-lg text-slate-700">{report.form.title}</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {report.form.description}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Generado
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(report.generatedAt)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Paciente: {report.patientName}
                </p>
              </div>
            </div>
          </header>

          <div className="mt-6 grid gap-4">
            {report.sections.map((section) => (
              <section key={section.title} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {section.title}
                  </h3>
                  {section.description ? (
                    <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <article
                      key={`${section.title}-${field.label}`}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {field.label}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
                        {field.value}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
              Notas de generacion
            </h3>
            <div className="mt-3 space-y-2">
              {report.notes.map((note) => (
                <p key={note} className="text-sm leading-6 text-slate-700">
                  {note}
                </p>
              ))}
            </div>
          </section>
        </article>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Otros formularios MSP
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Formularios disponibles para este paciente
              </h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
              {formCatalog.length} plantillas
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {formCatalog.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.id} · {item.title}
                  </p>
                  <AvailabilityBadge availability={item.availability} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{item.code}</p>
                <p className="mt-2 text-xs leading-6 text-slate-600">{item.description}</p>
                <p className="mt-2 text-[11px] text-slate-500">{item.availabilityNote}</p>
                <Link
                  href={`/portal/professional/reports/forms/${item.id}?patientId=${record.id}`}
                  className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Abrir formulario
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
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

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}
