import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardPlus,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const accessRoutes = [
  {
    title: "Paciente",
    description: "Inicia una evaluación de triaje y registra el motivo de consulta.",
    action: "Iniciar triaje",
    href: "/triage",
    icon: ClipboardPlus,
    accent: "border-l-[#d24b4b]",
    iconTone: "bg-red-50 text-red-700",
  },
  {
    title: "Profesional de salud",
    description: "Consulta casos, pacientes y seguimiento clínico autorizado.",
    action: "Acceso profesional",
    href: "/portal/login?role=professional",
    icon: Stethoscope,
    accent: "border-l-[#197b83]",
    iconTone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Institución",
    description: "Supervisa la operación de triaje y la atención de EcotecClinic.",
    action: "Acceso institucional",
    href: "/portal/login?role=institution",
    icon: Building2,
    accent: "border-l-[#294f73]",
    iconTone: "bg-blue-50 text-blue-800",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/vita-logo.png"
              alt="VITA"
              width={48}
              height={48}
              priority
              className="h-12 w-12 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-950">VITA</p>
              <p className="truncate text-xs font-medium text-slate-500">EcotecClinic</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs font-semibold text-emerald-700 sm:flex">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Sistema disponible
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:py-14">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase text-teal-700">
              Triaje y continuidad asistencial
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Atención organizada desde el primer contacto
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Selecciona el acceso correspondiente para iniciar una evaluación o ingresar al
              entorno clínico autorizado.
            </p>
          </div>

          <div className="border-l-4 border-l-teal-600 bg-[#eef7f6] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Acceso protegido</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Los portales profesional e institucional requieren una cuenta activa de
                  EcotecClinic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">Selecciona tu perfil</h2>
          <p className="mt-1 text-sm text-slate-500">Cada acceso muestra únicamente las funciones autorizadas.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {accessRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.title}
                href={route.href}
                className={`group flex min-h-56 flex-col border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${route.accent}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${route.iconTone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{route.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{route.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-800">
                  {route.action}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>VITA · EcotecClinic</span>
          <span>La orientación digital no reemplaza la valoración clínica ni la atención de emergencia.</span>
        </div>
      </footer>
    </main>
  );
}
