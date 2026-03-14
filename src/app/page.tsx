import Link from "next/link";

const operationalSignals = [
  {
    label: "Admisiones estructuradas",
    value: "HCU",
    detail: "Ingreso, anamnesis, consentimiento y plan en una sola ruta.",
  },
  {
    label: "Urgencias y triaje",
    value: "24/7",
    detail: "Priorizacion clinica con flujo Manchester y subprotocolos.",
  },
  {
    label: "Cumplimiento MSP",
    value: "Visible",
    detail: "Brechas, formularios y trazabilidad expuestos dentro del sistema.",
  },
];

const prioritizedQueue = [
  {
    patient: "Maria Lopez",
    caseTitle: "Dolor toracico de alto riesgo",
    meta: "68 anios · llegada por app · ECG pendiente",
    level: "Rojo",
    wait: "Atencion inmediata",
    tone: "bg-red-500",
  },
  {
    patient: "Luis Medina",
    caseTitle: "Disnea progresiva en reposo",
    meta: "59 anios · ingreso institucional · SpO2 89%",
    level: "Naranja",
    wait: "10 min",
    tone: "bg-orange-500",
  },
  {
    patient: "Ana Torres",
    caseTitle: "Dolor lumbar con recurrencia",
    meta: "32 anios · seguimiento clinico · analgesia previa",
    level: "Verde",
    wait: "90 min",
    tone: "bg-emerald-500",
  },
];

const quickRoutes = [
  {
    eyebrow: "Ruta 01",
    title: "Ingreso clinico",
    description:
      "Abre la historia clinica estructurada con identificacion, examen, CIE-11, consentimiento y referencias.",
    href: "/portal/professional/patients/ingreso",
    action: "Abrir ingreso",
    accent:
      "from-[#d96f3a]/15 via-white to-white border-[#d96f3a]/25",
  },
  {
    eyebrow: "Ruta 02",
    title: "Triaje operativo",
    description:
      "Prioriza urgencias con discriminadores, color de riesgo, tiempos maximos y subprotocolos MSP.",
    href: "/portal/professional/triage/ingreso",
    action: "Ir a triaje",
    accent:
      "from-[#0f766e]/15 via-white to-white border-[#0f766e]/20",
  },
  {
    eyebrow: "Ruta 03",
    title: "Cumplimiento MSP",
    description:
      "Revisa dominios implementados, brechas criticas, evidencia operativa y pendientes para auditoria.",
    href: "/portal/professional/cumplimiento",
    action: "Ver tablero",
    accent:
      "from-[#1d4ed8]/12 via-white to-white border-[#1d4ed8]/20",
  },
];

const productPillars = [
  {
    title: "Historia clinica utilizable",
    detail:
      "No solo muestra formularios: el sistema valida, persiste y puntua cumplimiento por expediente.",
  },
  {
    title: "Continuidad asistencial real",
    detail:
      "Consentimiento, interconsulta, referencia, vigilancia y plan terapeutico viven en el mismo caso.",
  },
  {
    title: "Lectura rapida para el equipo",
    detail:
      "La portada dirige a tres acciones claras: ingreso, triaje y control de cumplimiento.",
  },
  {
    title: "Gobernanza del producto",
    detail:
      "Las brechas estructurales quedan visibles para decidir que hace falta antes de operar institucionalmente.",
  },
];

const assuranceNotes = [
  "Ingreso clinico con consentimiento, referencia e interconsulta",
  "Checklist MSP por expediente y tablero de cumplimiento transversal",
  "Motor de triaje con protocolos y priorizacion por color",
  "Bitacora de auditoria y vista institucional/profesional",
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3ede3] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,111,58,0.18),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(15,118,110,0.18),transparent_28%),radial-gradient(circle_at_65%_78%,rgba(30,64,175,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-10%] top-24 h-64 w-64 rounded-full bg-[#d96f3a]/12 blur-3xl" />
        <div className="absolute bottom-10 right-[-8%] h-72 w-72 rounded-full bg-[#0f766e]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-10">
        <header className="landing-enter rounded-[28px] border border-slate-900/10 bg-white/80 px-4 py-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-[22px] bg-[#0f172a] text-lg font-bold text-[#f3ede3] shadow-[0_12px_32px_rgba(15,23,42,0.24)]">
                V
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Vita HIS
                </p>
                <p className="text-lg font-semibold text-slate-950">
                  Sistema clinico con foco en operacion MSP
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <span className="landing-pulse h-2 w-2 rounded-full bg-emerald-500" />
                Modulos conectados
              </span>
              <Link
                href="/portal/professional"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Portal profesional
              </Link>
              <Link
                href="/portal/professional/cumplimiento"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Cumplimiento MSP
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Proyecto
              </Link>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-8 xl:grid-cols-[minmax(0,1.08fr)_430px] xl:items-start">
          <div className="space-y-6">
            <div className="landing-enter landing-enter-delay-1 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
              Admisiones, urgencias, HCE y cumplimiento
            </div>

            <div className="landing-enter landing-enter-delay-1 max-w-4xl space-y-5">
              <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-slate-950 sm:text-6xl xl:text-7xl">
                Una portada que ya se siente como la entrada de un
                <span className="block text-[#0f766e]"> sistema de salud serio.</span>
              </h1>

              <p className="max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                Vita deja de presentarse como una demo abstracta y pasa a
                orientar al equipo clinico desde el primer vistazo: ingresar
                pacientes, priorizar urgencias y medir cumplimiento MSP sin
                perder el contexto operativo.
              </p>
            </div>

            <div className="landing-enter landing-enter-delay-2 flex flex-wrap gap-3">
              <Link
                href="/portal/professional"
                className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Entrar al portal profesional
                <span aria-hidden>+</span>
              </Link>
              <Link
                href="/portal/professional/patients/ingreso"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                Abrir ingreso clinico
                <span aria-hidden>+</span>
              </Link>
              <Link
                href="/portal/institution"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                Vista institucional
                <span aria-hidden>+</span>
              </Link>
            </div>

            <div className="landing-enter landing-enter-delay-2 grid gap-3 md:grid-cols-3">
              {operationalSignals.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[28px] border border-slate-900/10 bg-white/78 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>

            <section className="landing-enter landing-enter-delay-2 rounded-[34px] border border-slate-900/10 bg-[#0f172a] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Direccion del producto
                  </p>
                  <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-white">
                    La UX ahora empuja al usuario hacia tareas clinicas
                    concretas, no hacia una bienvenida decorativa.
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-6 text-white/70">
                  Menos ruido, mas orientacion. Las rutas principales viven
                  arriba y el estado operativo se entiende en segundos.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {productPillars.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="landing-enter landing-enter-delay-2 xl:pt-6">
            <div className="landing-float rounded-[34px] border border-slate-900/10 bg-white/82 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-5">
              <div className="rounded-[28px] bg-[#f7f2eb] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Panel de turno
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                      Urgencias metropolitanas
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      3 profesionales conectados · ingreso unificado · trazabilidad activa
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="landing-pulse h-2 w-2 rounded-full bg-emerald-500" />
                    En linea
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <SignalTile label="Casos activos" value="18" accent="text-[#d96f3a]" />
                  <SignalTile label="Riesgo alto" value="5" accent="text-[#b91c1c]" />
                  <SignalTile label="MSP hoy" value="91%" accent="text-[#0f766e]" />
                </div>
              </div>

              <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      Cola priorizada
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      Vista resumida del trabajo clinico inmediato
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/65">
                    Profesional
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {prioritizedQueue.map((item) => (
                    <article
                      key={item.patient}
                      className="rounded-[22px] border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {item.caseTitle}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                            {item.patient}
                          </p>
                          <p className="mt-2 text-[11px] leading-5 text-white/65">
                            {item.meta}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[10px] font-semibold text-white/75">
                            {item.wait}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                          {item.level}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <article className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Guardrails MSP
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Consentimiento, referencia y vigilancia quedan visibles.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    La experiencia ya no oculta las obligaciones operativas del sistema.
                  </p>
                </article>

                <article className="rounded-[24px] border border-slate-200 bg-[#f7f2eb] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Estado del producto
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Lo implementado y lo pendiente ya se gobiernan desde una sola vista.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    La portada dirige a la operacion; el tablero dirige a la madurez del HIS.
                  </p>
                </article>
              </div>
            </div>
          </aside>
        </section>

        <section className="landing-enter landing-enter-delay-2 grid gap-4 border-t border-slate-900/10 pt-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Rutas rapidas
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {quickRoutes.map((item) => (
                <article
                  key={item.title}
                  className={`rounded-[28px] border bg-gradient-to-br p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${item.accent}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.eyebrow}
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
                  >
                    {item.action}
                    <span aria-hidden>+</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <article className="rounded-[30px] border border-slate-900/10 bg-white/78 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Cobertura actual
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              La portada ahora explica el producto con pruebas, no con promesas.
            </h2>
            <div className="mt-4 space-y-3">
              {assuranceNotes.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-[#faf7f2] px-3 py-3"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer className="mt-6 border-t border-slate-900/10 pt-4 text-[11px] text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Vita Demo · entorno de desarrollo, diseno y validacion funcional.</span>
            <span>
              Esta portada prioriza navegacion clara y lectura operativa desde el primer clic.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function SignalTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${accent}`}>
        {value}
      </p>
    </article>
  );
}
