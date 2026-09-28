// src/app/portal/layout.tsx
import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f7]">
      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-700">VITA · EcotecClinic</span>
          <span>Acceso restringido a usuarios autorizados.</span>
        </div>
      </footer>
    </div>
  );
}
