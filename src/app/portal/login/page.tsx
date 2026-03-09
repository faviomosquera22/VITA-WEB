"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense } from "react";

export default function PortalLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-200/70 p-6 md:p-7">
            <p className="text-sm text-slate-500">Cargando acceso al portal...</p>
          </div>
        </main>
      }
    >
      <PortalLoginContent />
    </Suspense>
  );
}

function PortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "professional";

  const roleLabel =
    role === "institution" ? "institución de salud" : "profesional de salud";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role === "institution") {
      router.push("/portal/institution");
    } else {
      router.push("/portal/professional");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-200/70 p-6 md:p-7 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide">
            Vita · Portal
          </p>
          <h1 className="text-xl font-semibold">
            Ingresar como {roleLabel}
          </h1>
          <p className="text-sm text-slate-500">
            Usa cualquier correo y contraseña en esta demo. Más adelante se
            conectará con usuarios reales.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              type="email"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              placeholder="profesional@hospital.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 text-white text-sm font-medium py-2.5 hover:bg-sky-700 transition"
          >
            Entrar (demo)
          </button>
        </form>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <Link href="/portal" className="hover:underline">
            ← Volver al portal
          </Link>
          <span>Estado: conectado a API demo.</span>
        </div>
      </div>
    </main>
  );
}
