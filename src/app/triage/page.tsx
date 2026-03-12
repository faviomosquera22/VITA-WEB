import TriageWizard from "./components/TriageWizard";

export default function TriagePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Vita HIS | MSP Ecuador</p>
          <h1 className="text-2xl font-black text-slate-900">Triaje Clinico Asistido Unificado</h1>
          <p className="text-sm text-slate-600">
            Flujo unico de triaje con nucleo general, subprotocolos automaticos y trazabilidad clinica completa.
          </p>
        </header>

        <TriageWizard />
      </section>
    </main>
  );
}
