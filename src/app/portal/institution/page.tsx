"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Maximize,
  Minimize,
  Settings2,
  Wifi,
  WifiOff,
  HeartPulse,
  Clock3,
  Stethoscope,
  BedDouble,
  CircleCheck,
} from "lucide-react";
import {
  monitorGroups,
  type MonitorGroup,
  type MonitorSnapshot,
} from "@/lib/case-flow";
const icons = {
  emergency: HeartPulse,
  new: Clock3,
  attention: Stethoscope,
  hospital: BedDouble,
  completed: CircleCheck,
};
const tones = {
  emergency: "border-red-400/40 bg-red-400/10 text-red-300",
  new: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  attention: "border-teal-400/40 bg-teal-400/10 text-teal-200",
  hospital: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  completed: "border-slate-500 bg-slate-400/10 text-slate-200",
};
const dots = {
  rojo: "bg-red-400",
  naranja: "bg-orange-400",
  amarillo: "bg-amber-300",
  verde: "bg-emerald-400",
  azul: "bg-sky-400",
};
export default function InstitutionHomePage() {
  const root = useRef<HTMLElement>(null);
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [full, setFull] = useState(false);
  const [settings, setSettings] = useState(false);
  const [selected, setSelected] = useState<MonitorGroup[]>(
    monitorGroups.map((g) => g.id),
  );
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("vita-monitor-groups") ?? "null",
      );
      if (Array.isArray(saved)) {
        const valid = monitorGroups
          .filter((g) => saved.includes(g.id))
          .map((g) => g.id);
        if (valid.length >= 1) setSelected(valid);
      }
    } catch {
      /* Invalid preferences use defaults. */
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const response = await fetch("/api/institution/monitor", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(12000),
          ]),
        });
        if (response.status === 401) {
          if (active) {
            setSnapshot(null);
            setError("Sesión finalizada. Vuelve a ingresar al panel.");
          }
          return;
        }
        if (!response.ok)
          throw new Error(
            "Conexión interrumpida. Los datos pueden estar desactualizados.",
          );
        const data: MonitorSnapshot = await response.json();
        if (active) {
          setSnapshot(data);
          setError("");
        }
      } catch {
        if (active)
          setError(
            "Conexión interrumpida. Los datos pueden estar desactualizados.",
          );
      } finally {
        if (active) timer = setTimeout(poll, 10000);
      }
    }
    void poll();
    const clock = setInterval(() => setNow(new Date()), 1000);
    const onFullscreen = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);
  const stale =
    snapshot && now
      ? now.getTime() - new Date(snapshot.generatedAt).getTime() > 30000
      : false;
  async function toggleFull() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setError("No se pudo activar pantalla completa en este navegador.");
    }
  }
  function toggleGroup(id: MonitorGroup) {
    const next = selected.includes(id)
      ? selected.filter((g) => g !== id)
      : [...selected, id];
    if (!next.length) return;
    setSelected(next);
    localStorage.setItem("vita-monitor-groups", JSON.stringify(next));
  }
  return (
    <main
      ref={root}
      className="monitor-screen min-h-screen overflow-auto bg-[#101f30] p-5 text-white sm:p-8"
    >
      <header className="mb-7 flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-teal-400/10 p-3 text-teal-300">
            <Activity size={30} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-teal-300">
              VITA · Monitor institucional
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {snapshot?.centerName ?? "Actividad asistencial"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="mr-3 text-right">
            <p className="font-mono text-2xl tabular-nums">
              {now?.toLocaleTimeString("es-EC", {
                timeZone: "America/Guayaquil",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }) ?? "—"}
            </p>
            <p className="text-xs text-slate-400">Hora de Ecuador</p>
          </div>
          <button
            onClick={() => setSettings(!settings)}
            aria-expanded={settings}
            className="rounded-xl border border-white/20 p-3 hover:bg-white/10"
            aria-label="Seleccionar cuadrantes"
          >
            <Settings2 size={20} />
          </button>
          <button
            onClick={toggleFull}
            className="rounded-xl border border-white/20 p-3 hover:bg-white/10"
            aria-label={
              full ? "Salir de pantalla completa" : "Pantalla completa"
            }
          >
            {full ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>
      {settings && (
        <fieldset className="mb-6 flex flex-wrap gap-4 rounded-xl border border-white/15 p-4">
          <legend className="px-2 text-sm text-slate-300">
            Cuadrantes visibles
          </legend>
          {monitorGroups.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(g.id)}
                disabled={selected.length === 1 && selected.includes(g.id)}
                onChange={() => toggleGroup(g.id)}
                className="accent-teal-400"
              />
              {g.label}
            </label>
          ))}
        </fieldset>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-300">
          <strong className="mr-2 text-3xl font-semibold text-white">
            {snapshot?.totalActive ?? "—"}
          </strong>
          casos activos
        </p>
        <p
          role="status"
          className={`flex items-center gap-2 text-sm ${error || stale ? "text-amber-300" : "text-teal-300"}`}
        >
          {error || stale ? <WifiOff size={17} /> : <Wifi size={17} />}{" "}
          {error ||
            (stale
              ? "Datos desactualizados"
              : snapshot
                ? "Conectado · actualización cada 10 s"
                : "Conectando con el centro…")}
        </p>
      </div>
      <section
        className={`grid gap-4 md:grid-cols-2 ${selected.length === 5 ? "xl:grid-cols-6" : "xl:grid-cols-2"}`}
      >
        {monitorGroups
          .filter((g) => selected.includes(g.id))
          .map((group, index) => {
            const data = snapshot?.groups.find((g) => g.id === group.id);
            const Icon = icons[group.id];
            return (
              <article
                key={group.id}
                className={`min-h-64 rounded-2xl border p-5 ${tones[group.id]} ${selected.length === 5 ? (index < 2 ? "xl:col-span-3" : "xl:col-span-2") : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon size={21} />
                      <h2 className="text-lg font-semibold">{group.label}</h2>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      {group.detail}
                    </p>
                  </div>
                  <p className="font-mono text-5xl font-semibold tabular-nums">
                    {data?.count ?? "—"}
                  </p>
                </div>
                <div className="mt-5 border-t border-white/10 pt-2">
                  {data?.cases.length ? (
                    data.cases.map((c) => (
                      <div
                        key={c.code}
                        className="flex items-center justify-between gap-3 py-2 text-sm text-slate-100"
                      >
                        <span className="font-mono font-medium">{c.code}</span>
                        <span className="flex items-center gap-2 capitalize text-slate-300">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${dots[c.triage]}`}
                          />
                          {c.triage}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-sm text-slate-400">
                      {snapshot
                        ? "Sin casos en este grupo"
                        : "Esperando datos…"}
                    </p>
                  )}
                  {data && data.count > 5 && (
                    <p className="mt-2 text-xs text-slate-300">
                      + {data.count - 5} casos adicionales
                    </p>
                  )}
                </div>
              </article>
            );
          })}
      </section>
      <footer className="mt-6 flex flex-wrap justify-between gap-3 text-xs leading-5 text-slate-400">
        <p>
          Vista de solo lectura · Identidades protegidas · Emergencias también
          se incluyen en su estado de atención.
        </p>
        <p>
          Última actualización:{" "}
          {snapshot
            ? new Date(snapshot.generatedAt).toLocaleTimeString("es-EC", {
                timeZone: "America/Guayaquil",
              })
            : "pendiente"}
        </p>
      </footer>
    </main>
  );
}
