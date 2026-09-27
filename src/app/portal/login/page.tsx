"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";

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
  const roleParam = searchParams.get("role");
  const role = roleParam === "institution" ? "institution" : "professional";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const roleLabel =
    role === "institution" ? "institución de salud" : "profesional de salud";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
          client: "web",
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const result: { error?: string; redirectTo?: string } = contentType.includes("application/json")
        ? ((await response.json()) as { error?: string; redirectTo?: string })
        : { error: `Error del servidor (${response.status})` };

      if (!response.ok) {
        setErrorMessage(result.error ?? `No se pudo iniciar sesion (HTTP ${response.status})`);
        return;
      }

      router.push(result.redirectTo ?? "/portal");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
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
            Acceso seguro para personal autorizado de instituciones vinculadas a VITA.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              placeholder="••••••••"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 text-white text-sm font-medium py-2.5 hover:bg-sky-700 transition disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <Link href="/portal" className="hover:underline">
            ← Volver al portal
          </Link>
          <span>Acceso protegido.</span>
        </div>
      </div>
    </main>
  );
}
