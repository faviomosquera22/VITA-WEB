"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Suspense, type FormEvent, useState } from "react";

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<LoginLoadingState />}>
      <PortalLoginContent />
    </Suspense>
  );
}

function LoginLoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f7] px-4">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" />
        Preparando acceso seguro...
      </div>
    </main>
  );
}

function PortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const role = roleParam === "institution" ? "institution" : "professional";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isInstitution = role === "institution";
  const RoleIcon = isInstitution ? Building2 : Stethoscope;
  const roleLabel = isInstitution ? "institución" : "profesional de salud";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, client: "web" }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const result: { error?: string; redirectTo?: string } = contentType.includes("application/json")
        ? ((await response.json()) as { error?: string; redirectTo?: string })
        : { error: `Error del servidor (${response.status})` };

      if (!response.ok) {
        setErrorMessage(result.error ?? `No se pudo iniciar sesión (HTTP ${response.status})`);
        return;
      }

      router.push(result.redirectTo ?? "/");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/vita-logo.png" alt="VITA" width={44} height={44} className="h-11 w-11 rounded-lg" />
            <div>
              <p className="font-bold">VITA</p>
              <p className="text-xs text-slate-500">EcotecClinic</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 text-xs font-semibold text-teal-700 sm:flex">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Conexión segura
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:py-14">
        <section className="max-w-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
            <RoleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase text-teal-700">Portal clínico</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight">Acceso para {roleLabel}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Usa la cuenta asignada por EcotecClinic. La sesión y las acciones realizadas quedan protegidas y registradas.
          </p>

          <div className="mt-8 border-l-4 border-l-amber-500 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            El acceso está limitado a personal e instituciones previamente autorizados.
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <Link
              href="/portal/login?role=professional"
              className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                !isInstitution ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              Profesional
            </Link>
            <Link
              href="/portal/login?role=institution"
              className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                isInstitution ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Institución
            </Link>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Correo</span>
              <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="nombre@ecotecclinic.ec"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Contraseña</span>
              <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
                <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-11 w-full bg-transparent text-sm outline-none"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {errorMessage ? (
              <p role="alert" className="border-l-4 border-l-red-600 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {loading ? "Verificando acceso..." : "Ingresar"}
            </button>
          </form>

          <Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  );
}
