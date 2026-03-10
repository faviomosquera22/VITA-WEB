"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type JSX } from "react";

import {
  getDashboardMetrics,
  professionalSidebarModules,
  type ProfessionalModuleId,
  type SidebarSectionId,
  type UserRole,
} from "../_data/clinical-mock-data";

const sectionOrder: SidebarSectionId[] = [
  "main",
  "clinical",
  "support",
  "system",
];

const sectionMeta: Record<SidebarSectionId, { title: string }> = {
  main: { title: "Principal" },
  clinical: { title: "Clinica" },
  support: { title: "Gestion y apoyo" },
  system: { title: "Sistema" },
};

const moduleIconMap: Record<ProfessionalModuleId, (className: string) => JSX.Element> = {
  home: homeIcon,
  patients: patientsIcon,
  triage: triageIcon,
  follow_up: followUpIcon,
  shift: shiftIcon,
  hce: hceIcon,
  prescription: prescriptionIcon,
  lis_ris: lisRisIcon,
  hospitalization: hospitalizationIcon,
  surgery: surgeryIcon,
  population: populationIcon,
  vitals: vitalsIcon,
  medication: medicationIcon,
  vaccination: vaccinationIcon,
  nutrition: nutritionIcon,
  emotional_health: emotionalHealthIcon,
  reports: reportsIcon,
  health_centers: healthCentersIcon,
  health_education: educationIcon,
  alerts: alertsIcon,
  care_team: careTeamIcon,
  compliance: complianceIcon,
  settings: settingsIcon,
};

const modulePathMatchers: Array<{
  id: ProfessionalModuleId;
  matcher: (pathname: string) => boolean;
}> = [
  { id: "home", matcher: (pathname) => pathname === "/portal/professional" },
  {
    id: "patients",
    matcher: (pathname) =>
      pathname.startsWith("/portal/professional/patients") ||
      pathname.startsWith("/portal/professional/patient") ||
      pathname.startsWith("/portal/professional/care-plan") ||
      pathname.startsWith("/portal/professional/clinical-documents"),
  },
  {
    id: "triage",
    matcher: (pathname) =>
      pathname.startsWith("/portal/professional/triage") ||
      pathname.startsWith("/portal/professional/case"),
  },
  {
    id: "follow_up",
    matcher: (pathname) =>
      pathname.startsWith("/portal/professional/follow-up") ||
      pathname.startsWith("/portal/professional/fluid-balance") ||
      pathname.startsWith("/portal/professional/kardex"),
  },
  {
    id: "shift",
    matcher: (pathname) => pathname.startsWith("/portal/professional/turno"),
  },
  {
    id: "hce",
    matcher: (pathname) => pathname.startsWith("/portal/professional/hce"),
  },
  {
    id: "prescription",
    matcher: (pathname) => pathname.startsWith("/portal/professional/prescripcion"),
  },
  {
    id: "lis_ris",
    matcher: (pathname) => pathname.startsWith("/portal/professional/lis-ris"),
  },
  {
    id: "hospitalization",
    matcher: (pathname) => pathname.startsWith("/portal/professional/hospitalizacion"),
  },
  {
    id: "surgery",
    matcher: (pathname) => pathname.startsWith("/portal/professional/quirurgico"),
  },
  {
    id: "population",
    matcher: (pathname) => pathname.startsWith("/portal/professional/programas"),
  },
  { id: "vitals", matcher: (pathname) => pathname.startsWith("/portal/professional/vitals") },
  {
    id: "medication",
    matcher: (pathname) => pathname.startsWith("/portal/professional/medication"),
  },
  {
    id: "vaccination",
    matcher: (pathname) => pathname.startsWith("/portal/professional/vaccination"),
  },
  {
    id: "nutrition",
    matcher: (pathname) => pathname.startsWith("/portal/professional/nutrition"),
  },
  {
    id: "emotional_health",
    matcher: (pathname) => pathname.startsWith("/portal/professional/emotional-health"),
  },
  {
    id: "reports",
    matcher: (pathname) =>
      pathname.startsWith("/portal/professional/reports") ||
      pathname.startsWith("/portal/professional/nursing-report") ||
      pathname.startsWith("/portal/professional/exams"),
  },
  {
    id: "health_centers",
    matcher: (pathname) => pathname.startsWith("/portal/professional/health-centers"),
  },
  {
    id: "health_education",
    matcher: (pathname) => pathname.startsWith("/portal/professional/health-education"),
  },
  {
    id: "alerts",
    matcher: (pathname) => pathname.startsWith("/portal/professional/alerts"),
  },
  {
    id: "care_team",
    matcher: (pathname) => pathname.startsWith("/portal/professional/care-team"),
  },
  {
    id: "compliance",
    matcher: (pathname) => pathname.startsWith("/portal/professional/cumplimiento"),
  },
  {
    id: "settings",
    matcher: (pathname) => pathname.startsWith("/portal/professional/settings"),
  },
];

export default function ProfessionalSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("vita-prof-sidebar-collapsed") === "1";
  });

  const [openSections, setOpenSections] = useState<Record<SidebarSectionId, boolean>>({
    main: true,
    clinical: true,
    support: true,
    system: true,
  });

  const metrics = useMemo(() => getDashboardMetrics(), []);

  useEffect(() => {
    window.localStorage.setItem("vita-prof-sidebar-collapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  const activeModule = useMemo(() => {
    const matched = modulePathMatchers.find((item) => item.matcher(pathname));
    return matched?.id ?? "home";
  }, [pathname]);

  const visibleItems = useMemo(
    () => professionalSidebarModules.filter((item) => item.roles.includes(role)),
    [role]
  );

  const itemsBySection = useMemo(
    () =>
      sectionOrder.map((sectionId) => ({
        sectionId,
        items: visibleItems.filter((item) => item.section === sectionId),
      })),
    [visibleItems]
  );

  const toggleSection = (sectionId: SidebarSectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <aside
      className={[
        "sticky top-0 hidden h-screen border-r border-slate-200 bg-white lg:block",
        "transition-[width] duration-200",
        isCollapsed ? "w-[84px]" : "w-[320px]",
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-3 pb-3 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-sm font-semibold text-white">
                V
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">Vita</p>
                  <p className="text-[11px] text-slate-500">Rol: Profesional</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            >
              {isCollapsed ? chevronRightIcon("h-4 w-4") : chevronLeftIcon("h-4 w-4")}
            </button>
          </div>

          {!isCollapsed && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MetricCard label="Activos" value={metrics.activePatients} />
              <MetricCard label="Alertas" value={metrics.activeAlerts} />
              <MetricCard label="Pendientes" value={metrics.dayPending} />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-3">
            {itemsBySection.map(({ sectionId, items }) => {
              if (items.length === 0) {
                return null;
              }

              const sectionIsOpen = openSections[sectionId];

              return (
                <section key={sectionId}>
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(sectionId)}
                      className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50"
                    >
                      <span>{sectionMeta[sectionId].title}</span>
                      {sectionIsOpen
                        ? chevronDownIcon("h-3.5 w-3.5 text-slate-400")
                        : chevronRightIcon("h-3.5 w-3.5 text-slate-400")}
                    </button>
                  ) : (
                    <div className="mx-auto mb-2 h-px w-7 bg-slate-200" />
                  )}

                  {(sectionIsOpen || isCollapsed) && (
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const isActive = activeModule === item.id;
                        const icon = moduleIconMap[item.id];

                        return (
                          <li key={item.id}>
                            <Link
                              href={item.path}
                              className={[
                                "group flex items-center gap-2 rounded-lg border px-2 py-2 text-xs transition",
                                isActive
                                  ? "border-sky-200 bg-sky-50 text-sky-700"
                                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900",
                                isCollapsed ? "justify-center" : "",
                              ].join(" ")}
                              title={item.label}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {icon(
                                [
                                  "h-4 w-4 shrink-0",
                                  isActive
                                    ? "text-sky-600"
                                    : "text-slate-400 group-hover:text-slate-600",
                                ].join(" ")
                              )}
                              {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-3 py-3">
          {isCollapsed ? (
            <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-500" />
          ) : (
            <p className="text-[11px] text-slate-500">
              Plataforma clinica web con navegacion modular y escalable por roles.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function iconBase(className: string, path: JSX.Element) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

function homeIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M6 9.5V21h12V9.5" />
    </>
  );
}

function patientsIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M16 19.5c0-2.2-1.9-4-4.3-4H7.3C5 15.5 3 17.3 3 19.5" />
      <path d="M9.5 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
      <path d="M21 19.5c0-1.8-1.4-3.3-3.2-3.8" />
      <path d="M16.5 4.8a3.2 3.2 0 010 6.3" />
    </>
  );
}

function triageIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M12 3l7 3v6c0 4.5-2.8 7.8-7 9-4.2-1.2-7-4.5-7-9V6l7-3z" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </>
  );
}

function followUpIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M4 18l4-4 3 3 6-7 3 3" />
      <path d="M4 6h16" />
      <path d="M4 21h16" />
    </>
  );
}

function shiftIcon(className: string) {
  return iconBase(
    className,
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M12 12v4l2.5 1.5" />
    </>
  );
}

function hceIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M7 3h10l4 4v14H7z" />
      <path d="M17 3v4h4" />
      <path d="M10 12h8" />
      <path d="M10 16h8" />
      <path d="M10 8h4" />
    </>
  );
}

function prescriptionIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M8 4h8l4 4v12H8z" />
      <path d="M16 4v4h4" />
      <path d="M10 13h8" />
      <path d="M10 17h5" />
      <path d="M4 9l2 2 4-4" />
    </>
  );
}

function lisRisIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M4 6h8v8H4z" />
      <path d="M14 10h6v8h-6z" />
      <path d="M14 6h6" />
      <path d="M17 6v4" />
      <path d="M7 9v3" />
    </>
  );
}

function hospitalizationIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M3 18v-8h9a4 4 0 014 4v4" />
      <path d="M16 10h5v8" />
      <path d="M3 18h18" />
      <path d="M6 10V7" />
    </>
  );
}

function surgeryIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M4 5l6 6" />
      <path d="M10 5L4 11" />
      <path d="M14 4l6 6" />
      <path d="M17 7l-7 7" />
      <path d="M10 14l4 4" />
      <path d="M7 17l3-3" />
    </>
  );
}

function populationIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M4 18h16" />
      <path d="M7 18V8" />
      <path d="M12 18V5" />
      <path d="M17 18v-6" />
      <path d="M5 8l7-3 7 2" />
    </>
  );
}

function vitalsIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M3 12h4l2.2-4 3.3 8 2.5-5H21" />
      <path d="M3 6h18" />
      <path d="M3 18h18" />
    </>
  );
}

function medicationIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M9 4h6l5 5-7 7-5-5V4z" />
      <path d="M9 11h4" />
      <path d="M4 20l4-4" />
    </>
  );
}

function vaccinationIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M6 18l5-5" />
      <path d="M11 13l5 5" />
      <path d="M13 5l6 6" />
      <path d="M15 3l6 6" />
    </>
  );
}

function nutritionIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M12 21s-7-3.6-7-9.2A4.8 4.8 0 0112 8a4.8 4.8 0 017 3.8C19 17.4 12 21 12 21z" />
      <path d="M12 8V3" />
    </>
  );
}

function emotionalHealthIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M12 21s-6-3.4-8.3-7.2A5.2 5.2 0 015.2 6 5.4 5.4 0 0112 7.8 5.4 5.4 0 0118.8 6a5.2 5.2 0 011.5 7.8C18 17.6 12 21 12 21z" />
      <path d="M9 13h6" />
    </>
  );
}

function reportsIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 14h6" />
      <path d="M10 18h4" />
    </>
  );
}

function healthCentersIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M4 21V6l4-3 4 3 4-3 4 3v15" />
      <path d="M9 21v-5h6v5" />
      <path d="M11 9h2" />
      <path d="M12 8v2" />
    </>
  );
}

function educationIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M3 6l9-3 9 3-9 3-9-3z" />
      <path d="M6 8v5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5V8" />
      <path d="M21 9v5" />
    </>
  );
}

function alertsIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M12 4a5 5 0 00-5 5v2.8L5 15h14l-2-3.2V9a5 5 0 00-5-5z" />
      <path d="M10 18a2 2 0 004 0" />
    </>
  );
}

function careTeamIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M8 11a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M16 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path d="M3 20c0-2.5 2.3-4.5 5-4.5s5 2 5 4.5" />
      <path d="M13 20c0-1.9 1.8-3.5 4-3.5s4 1.6 4 3.5" />
    </>
  );
}

function complianceIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M12 3l8 3v6c0 4.4-2.6 7.4-8 9-5.4-1.6-8-4.6-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  );
}

function settingsIcon(className: string) {
  return iconBase(
    className,
    <>
      <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
      <path d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-4 0v-.1a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 010-4h.1a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a2 2 0 012.8-2.8l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4a2 2 0 014 0v.1a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 2.8l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a2 2 0 010 4h-.1a1 1 0 00-.9.6z" />
    </>
  );
}

function chevronDownIcon(className: string) {
  return iconBase(className, <path d="M6 9l6 6 6-6" />);
}

function chevronLeftIcon(className: string) {
  return iconBase(className, <path d="M15 18l-6-6 6-6" />);
}

function chevronRightIcon(className: string) {
  return iconBase(className, <path d="M9 18l6-6-6-6" />);
}
