"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Gradiente de fondo suave */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 -left-10 h-80 w-80 rounded-full bg-sky-500 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
        {/* Barra superior */}
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold shadow-lg shadow-sky-500/40">
              V
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Vita</p>
              <p className="text-[11px] text-slate-300">
                Portal profesional conectado con app móvil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="hidden sm:inline">
              Plataforma para equipos de salud y triaje
            </span>
            <span className="hidden text-slate-500 sm:inline">•</span>
            <Link
              href="/about"
              className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 hover:border-sky-500 hover:text-sky-100"
            >
              Acerca del proyecto
            </Link>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col gap-8 pb-10 lg:flex-row lg:items-center">
          {/* Columna izquierda: texto */}
          <section className="flex-1 space-y-5">
            <h1 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Un portal clínico{" "}
              <span className="text-sky-400">conectado</span> a tu app de
              triaje.
            </h1>

            <p className="max-w-xl text-sm text-slate-200 sm:text-[15px]">
              Vita está pensada para <span className="font-semibold">uso de profesionales</span>:
              médicos, enfermería y equipos de urgencias. Esta demo muestra cómo
              los casos de triaje viajan desde el teléfono al portal web y cómo
              se visualizan los colores de prioridad para apoyar la toma de
              decisiones.
            </p>

            <div className="grid max-w-xl grid-cols-1 gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[11px] text-slate-400">Enfoque</p>
                <p className="mt-1 text-sm font-semibold">
                  Profesionales de salud
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Acceso a casos, pacientes y niveles de riesgo.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[11px] text-slate-400">Casos agudos</p>
                <p className="mt-1 text-sm font-semibold">
                  Colores de triaje
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Azul, verde, amarillo, naranja y rojo para priorizar.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[11px] text-slate-400">Sincronización</p>
                <p className="mt-1 text-sm font-semibold">
                  App ↔ Portal
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Casos creados en el móvil aparecen en el portal y viceversa.
                </p>
              </div>
            </div>

            {/* Chips de funcionalidades clave */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-3 py-1.5 font-medium shadow-md shadow-sky-500/40">
                🔄 Sincronización App ↔ Portal
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5">
                🚑 Pensado para urgencias y seguimiento
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5">
                🎨 Triage por colores (azul · verde · amarillo · naranja · rojo)
              </span>
            </div>

            {/* Botones de acceso al portal */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/portal/professional"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-xs font-medium text-slate-950 shadow-lg shadow-sky-500/50 hover:bg-sky-400"
              >
                Entrar al portal profesional
                <span className="text-[11px]">↗</span>
              </Link>

              <Link
                href="/portal/institution"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-5 py-2.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-100"
              >
                Ver vista institucional
              </Link>
            </div>

            {/* Nota de seguridad */}
            <p className="mt-4 max-w-md text-[11px] text-slate-400">
              Uso exclusivo para demostración y práctica académica. No debe
              emplearse para decisiones diagnósticas ni terapéuticas reales.
            </p>
          </section>

          {/* Columna derecha: preview tipo tablero clínico */}
          <aside className="flex-1">
            <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-2xl shadow-black/60">
              <div className="mb-3 flex items-center justify-between text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Portal profesional · Conectado
                </span>
                <span>http://localhost:3000/portal</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
                  <p className="text-[10px] text-slate-400">Casos activos</p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">18</p>
                  <p className="text-[10px] text-slate-500">
                    Últimos 7 días
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
                  <p className="text-[10px] text-slate-400">Casos de hoy</p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">4</p>
                  <p className="text-[10px] text-slate-500">
                    Desde las 00:00
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
                  <p className="text-[10px] text-slate-400">Riesgo alto</p>
                  <p className="mt-1 text-lg font-semibold text-red-400">2</p>
                  <p className="text-[10px] text-slate-500">
                    Naranja / Rojo
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold">Casos recientes</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                    Vista profesional
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start gap-2 rounded-xl bg-slate-900/80 p-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">
                        Dolor torácico súbito
                      </p>
                      <p className="text-slate-400">
                        María López · 68 años · Origen: Portal web
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      13:10
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-900/70 p-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">
                        Disnea importante en reposo
                      </p>
                      <p className="text-slate-400">
                        Luis Medina · 59 años · Origen: App móvil
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      12:55
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-900/60 p-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">
                        Dolor lumbar
                      </p>
                      <p className="text-slate-400">
                        Ana Torres · 32 años · Seguimiento ambulatorio
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      11:15
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Azul · No urgente
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Verde · Consulta diferida
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    Amarillo · Urgente
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                    Naranja · Alta prioridad
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Rojo · Emergencia
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Pie de página */}
        <footer className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Demo académica de Vita · Uso educativo, no asistencial.
            </span>
            <span className="text-slate-600">
              Enfoque en ODS 3: fortalecer el acceso y la priorización en salud.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}