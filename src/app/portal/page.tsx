import Link from "next/link";

export default function PortalPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-200/70 p-6 md:p-7 space-y-5">
        {/* Logo y título */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
            V
          </div>
          <div className="text-center">
            <p className="text-xs tracking-wide text-slate-500 uppercase">
              Vita · Portal web
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              El puente con tu app de triaje
            </h1>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-sm text-center text-slate-500">
          Accede al panel de tu <span className="font-medium">institución</span>{" "}
          o ingresa como <span className="font-medium">profesional</span> para
          ver los mismos casos que registras en la app móvil.
        </p>

        {/* Botones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <Link
            href="/portal/login?role=professional"
            className="rounded-xl border border-sky-500 bg-sky-50/60 py-2.5 text-sm font-medium text-center text-sky-700 hover:bg-sky-100 transition"
          >
            Soy profesional
          </Link>
          <Link
            href="/portal/login?role=institution"
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-center hover:bg-slate-50 transition"
          >
            Soy institución
          </Link>
        </div>

        {/* Nota de demo */}
        <div className="pt-1 border-t border-dashed border-slate-200">
          <p className="text-[11px] text-center text-slate-400">
            Versión demo · Datos simulados desde la API interna de Vita.
          </p>
        </div>
      </div>
    </main>
  );
}