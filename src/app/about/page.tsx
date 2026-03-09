"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 -left-10 h-80 w-80 rounded-full bg-sky-500 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6">
        {/* Barra superior */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold shadow-lg shadow-sky-500/40">
              V
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Vita</p>
              <p className="text-[11px] text-slate-300">
                Demo académica · Portal conectado con app móvil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <Link
              href="/"
              className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 hover:border-sky-500 hover:text-sky-100"
            >
              Volver al inicio
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <section className="flex-1 space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur">
          <h1 className="text-xl font-semibold sm:text-2xl">
            Acerca de Vita · Demo académica
          </h1>

          <div className="space-y-4 text-sm text-slate-200">
            <div>
              <h2 className="text-sm font-semibold text-sky-300">
                ¿Qué es Vita?
              </h2>
              <p className="mt-1 text-sm text-slate-200">
                Vita es un prototipo de aplicación de triaje y seguimiento
                clínico que conecta una app móvil con un portal web para
                profesionales e instituciones de salud. Esta versión está
                pensada como entorno de simulación y práctica, no como sistema
                asistencial real.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sky-300">
                Propósito académico
              </h2>
              <p className="mt-1 text-sm text-slate-200">
                El proyecto se desarrolla en el contexto de la formación en
                ciencias de la salud y tecnología, con el objetivo de explorar
                cómo una herramienta digital podría apoyar la priorización de
                pacientes, la visualización de casos y la comunicación entre
                niveles de atención.
              </p>
              <p className="mt-1 text-[13px] text-slate-400">
                La demo utiliza datos ficticios y una API simple en memoria.
                No almacena historias clínicas reales ni debe usarse para
                tomar decisiones diagnósticas o terapéuticas.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sky-300">
                Relación con el ODS 3: Salud y bienestar
              </h2>
              <p className="mt-1 text-sm text-slate-200">
                Vita se alinea con el Objetivo de Desarrollo Sostenible 3 al
                proponer, a futuro, herramientas que podrían contribuir a:
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-200">
                <li>
                  Facilitar un acceso más ágil a orientación básica en salud.
                </li>
                <li>
                  Apoyar la priorización temprana de pacientes según gravedad
                  (triaje por colores).
                </li>
                <li>
                  Mejorar la comunicación entre pacientes, profesionales y
                  servicios de salud.
                </li>
              </ul>
              <p className="mt-1 text-[13px] text-slate-400">
                Esta versión es solo una maqueta tecnológica para demostrar
                la idea y sus posibles aplicaciones futuras.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sky-300">
                Alcances y límites
              </h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-200">
                <li>Datos simulados y generados para pruebas.</li>
                <li>No conectado a bases de datos clínicas reales.</li>
                <li>No reemplaza sistemas de historia clínica electrónica.</li>
                <li>No sustituye la valoración de un profesional de salud.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sky-300">
                Sobre el desarrollo
              </h2>
              <p className="mt-1 text-sm text-slate-200">
                El proyecto integra:
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-200">
                <li>App móvil desarrollada en SwiftUI (iOS).</li>
                <li>Portal web con Next.js y Tailwind CSS.</li>
                <li>API interna simple para sincronizar casos y pacientes.</li>
              </ul>
              <p className="mt-2 text-[13px] text-slate-400">
                La intención es mostrar el potencial de soluciones
                digitales en salud, combinando conocimientos de enfermería,
                tecnología y UX centrada en la persona.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-4 text-[11px] text-slate-500">
          Demo académica de Vita · Uso educativo, no asistencial.
        </footer>
      </div>
    </main>
  );
}