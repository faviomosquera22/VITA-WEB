"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function WorkspaceNotice() {
  const path = usePathname();
  return (
    <>
      <nav
        aria-label="Accesos rápidos"
        className="flex gap-4 overflow-auto border-b border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-teal-800 lg:hidden"
      >
        <Link href="/portal/professional">Inicio</Link>
        <Link href="/portal/professional/patients">Pacientes</Link>
        <Link href="/portal/professional/triage">Triaje</Link>
        <Link href="/portal/professional/hospitalizacion">Hospitalización</Link>
      </nav>
      {path !== "/portal/professional" &&
        !path.startsWith("/portal/professional/case/") && (
          <p className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-900">
            Módulo de demostración · Los casos compartidos con la app se
            gestionan en{" "}
            <Link
              href="/portal/professional"
              className="font-semibold underline"
            >
              Actividad clínica
            </Link>
            .
          </p>
        )}
    </>
  );
}
