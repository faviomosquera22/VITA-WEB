"use client";

import Link from "next/link";

const quickStats = [
  {
    label: "Tiempo de respuesta",
    value: "-32%",
    detail: "en priorización inicial",
  },
  {
    label: "Casos activos",
    value: "18",
    detail: "entre urgencias y seguimiento",
  },
  {
    label: "Sincronización",
    value: "100%",
    detail: "app móvil + portal web",
  },
];

const triageQueue = [
  {
    title: "Dolor torácico súbito",
    subtitle: "María López · 68 años · Ingreso por app",
    level: "Rojo · Emergencia",
    dotClass: "bg-red-500",
    barClass: "from-red-500/90 to-transparent",
    time: "13:10",
  },
  {
    title: "Disnea importante en reposo",
    subtitle: "Luis Medina · 59 años · Ingreso web",
    level: "Naranja · Alta prioridad",
    dotClass: "bg-orange-400",
    barClass: "from-orange-400/80 to-transparent",
    time: "12:55",
  },
  {
    title: "Dolor lumbar con antecedente",
    subtitle: "Ana Torres · 32 años · Seguimiento",
    level: "Verde · Consulta diferida",
    dotClass: "bg-emerald-400",
    barClass: "from-emerald-400/80 to-transparent",
    time: "11:15",
  },
];

const onboardingSteps = [
  {
    title: "1. Recibir y priorizar",
    description:
      "Los casos llegan desde la app o el portal institucional y se etiquetan por color de triaje.",
  },
  {
    title: "2. Coordinar el cuidado",
    description:
      "El equipo clínico revisa antecedentes, evolución y tareas compartidas en una sola vista.",
  },
  {
    title: "3. Dar seguimiento",
    description:
      "Alertas, reportes y métricas permiten cerrar el ciclo con trazabilidad y continuidad.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(14,165,233,0.35),transparent_46%),radial-gradient(circle_at_82%_80%,rgba(16,185,129,0.26),transparent_44%),radial-gradient(circle_at_55%_45%,rgba(8,47,73,0.35),transparent_52%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-[#020617]/80 to-[#020617]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-5 pt-5 sm:px-6 lg:px-10">
        <header className="landing-enter flex items-center justify-between gap-4 rounded-2xl border border-slate-700/50 bg-slate-950/45 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/25">
              V
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide">Vita Portal</p>
              <p className="text-[11px] text-slate-300">
                Bienvenida para equipos clínicos y de triaje
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="hidden rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-emerald-200 md:inline-flex">
              Estado: sistema conectado
            </span>
            <Link
              href="/about"
              className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1.5 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              Acerca del proyecto
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-10 pb-10 pt-8 lg:grid-cols-[minmax(0,1fr)_470px] lg:items-center lg:gap-12">
          <div className="space-y-7">
            <div className="landing-enter landing-enter-delay-1 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs tracking-wide text-cyan-100">
              Portal clínico en tiempo real
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Demo activa
            </div>

            <div className="landing-enter landing-enter-delay-1 space-y-4">
              <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl lg:text-6xl">
                Bienvenida que convierte datos de triaje en{" "}
                <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                  decisiones clínicas claras.
                </span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-slate-200/90 sm:text-base">
                Vita conecta app móvil, portal profesional y vista institucional
                en un mismo flujo. Desde la primera pantalla, cada equipo sabe
                qué caso atender, con qué prioridad y cuál es el siguiente paso.
              </p>
            </div>

            <div className="landing-enter landing-enter-delay-2 grid max-w-2xl grid-cols-1 gap-3 text-xs sm:grid-cols-3">
              {quickStats.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 backdrop-blur-xl"
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>

            <div className="landing-enter landing-enter-delay-2 flex flex-wrap items-center gap-3">
              <Link
                href="/portal/professional"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-105"
              >
                Ingresar como profesional
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/portal/institution"
                className="inline-flex items-center gap-2 rounded-full border border-slate-500/90 bg-slate-900/75 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
              >
                Ver vista institucional
                <span aria-hidden>↗</span>
              </Link>

              <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
                Uso académico y de simulación clínica
              </span>
            </div>

            <p className="landing-enter landing-enter-delay-2 max-w-md text-[11px] text-slate-400 sm:text-xs">
              Uso exclusivo para demostración y práctica académica. No debe
              emplearse para decisiones diagnósticas ni terapéuticas reales.
            </p>
          </div>

          <aside className="landing-enter landing-enter-delay-2 landing-float relative">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-300/35 via-sky-400/15 to-emerald-300/25 blur-xl" />
            <article className="relative mx-auto max-w-lg rounded-3xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-2xl shadow-black/70 backdrop-blur-2xl sm:p-5">
              <header className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-cyan-100">
                    Turno activo · Urgencias Metropolitana
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    3 profesionales conectados · sincronización en vivo
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Conectado
                </span>
              </header>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <article className="rounded-2xl border border-slate-700 bg-slate-950/75 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Casos hoy
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-100">4</p>
                </article>
                <article className="rounded-2xl border border-slate-700 bg-slate-950/75 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Riesgo alto
                  </p>
                  <p className="mt-1 text-xl font-semibold text-orange-300">2</p>
                </article>
                <article className="rounded-2xl border border-slate-700 bg-slate-950/75 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Tiempo medio
                  </p>
                  <p className="mt-1 text-xl font-semibold text-cyan-200">
                    7 min
                  </p>
                </article>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/65 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    Cola priorizada
                  </p>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-400">
                    Vista profesional
                  </span>
                </div>

                <div className="space-y-2.5">
                  {triageQueue.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-2.5"
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-100">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {item.time}
                        </span>
                      </div>
                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <span
                          className={`block h-full w-3/4 rounded-full bg-gradient-to-r ${item.barClass}`}
                        />
                      </div>
                      <p className="inline-flex items-center gap-1.5 text-[10px] text-slate-300">
                        <span
                          className={`h-2 w-2 rounded-full ${item.dotClass}`}
                        />
                        {item.level}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-300">
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                  Azul · No urgente
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                  Verde · Consulta diferida
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                  Amarillo · Urgente
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                  Naranja · Alta prioridad
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                  Rojo · Emergencia
                </span>
              </div>
            </article>
          </aside>
        </section>

        <section className="landing-enter landing-enter-delay-2 border-t border-slate-800/80 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Flujo de bienvenida
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {onboardingSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4"
              >
                <p className="text-sm font-semibold text-slate-100">
                  {step.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-5 border-t border-slate-800/70 pt-3 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Vita Demo · uso educativo, no asistencial.</span>
            <span className="text-slate-600">
              ODS 3: acceso y priorización en salud.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
