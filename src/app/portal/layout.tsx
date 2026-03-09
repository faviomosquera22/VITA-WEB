// src/app/portal/layout.tsx
import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Contenido principal (lo que ya tienes en cada page.tsx) */}
      <div className="flex-1">{children}</div>

      {/* Footer común del portal */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="h-6 w-6 rounded-xl bg-sky-600 text-white flex items-center justify-center text-[11px] font-semibold">
              V
            </div>
            <span>
              Vita · Portal demo para instituciones y profesionales de salud.
            </span>
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Datos simulados desde API interna · Versión académica, sin uso
            clínico real.
          </div>
        </div>
      </footer>
    </div>
  );
}