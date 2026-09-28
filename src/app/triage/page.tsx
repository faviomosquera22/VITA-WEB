import Image from "next/image";

import TriageWizard from "./components/TriageWizard";

export default function TriagePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f7] p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-4 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
          <Image src="/vita-logo.png" alt="VITA" width={48} height={48} className="h-12 w-12 rounded-lg" />
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">VITA · EcotecClinic</p>
            <h1 className="text-2xl font-bold text-slate-900">Triaje clínico asistido</h1>
            <p className="text-sm text-slate-600">
              Evaluación estructurada con priorización y trazabilidad del caso.
            </p>
          </div>
        </header>

        <TriageWizard />
      </section>
    </main>
  );
}
