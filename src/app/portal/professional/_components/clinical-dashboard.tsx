"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Activity,
  ArrowUpRight,
  BedDouble,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Stethoscope,
  X,
} from "lucide-react";
import type { CaseItem } from "@/lib/repositories/case-repository";
import {
  belongsToGroup,
  caseCode,
  type CareArea,
  type FlowStatus,
  statusLabels,
} from "@/lib/case-flow";
import { professionalSidebarModules } from "../_data/clinical-mock-data";
const triageStyles = {
  rojo: "bg-red-50 text-red-700 border-red-200",
  naranja: "bg-orange-50 text-orange-800 border-orange-200",
  amarillo: "bg-amber-50 text-amber-800 border-amber-200",
  verde: "bg-emerald-50 text-emerald-800 border-emerald-200",
  azul: "bg-sky-50 text-sky-800 border-sky-200",
};
export default function ClinicalDashboard({
  name,
  centerName,
}: {
  name: string;
  centerName: string;
}) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const requestKey = useRef<string | null>(null);
  const [newCase, setNewCase] = useState(false);
  const [editing, setEditing] = useState<CaseItem | null>(null);
  const [message, setMessage] = useState("");
  const [loadedAt, setLoadedAt] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/cases", { cache: "no-store" });
      if (!r.ok)
        throw new Error(
          r.status === 401
            ? "La sesión finalizó. Vuelve a ingresar."
            : "No se pudieron consultar los casos.",
        );
      const data = await r.json();
      setCases(data);
      setLoaded(true);
      setLoadedAt(new Date().toLocaleTimeString("es-EC"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar.");
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    requestKey.current ??= crypto.randomUUID();
    const payload = editing
      ? {
          status: form.get("status"),
          careArea: form.get("careArea"),
          updatedAt: editing.updatedAt,
        }
      : {
          patientName: form.get("patientName"),
          age: Number(form.get("age")),
          reason: form.get("reason"),
          triage: form.get("triage"),
          origin: "web",
          idempotencyKey: requestKey.current,
        };
    try {
      const r = await fetch(
        editing ? `/api/cases/${editing.id}` : "/api/cases",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "No se pudo guardar.");
      requestKey.current = null;
      setNewCase(false);
      setEditing(null);
      setMessage(
        "Cambio guardado. El monitor institucional lo mostrará en su próxima actualización.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar.");
      setBusy(false);
    }
  }
  const visible = cases.filter(
    (c) =>
      (filter === "all" ||
        (filter === "hospital"
          ? c.careArea === "hospitalizacion" && c.status === "en_atencion"
          : c.status === filter)) &&
      `${c.patientName} ${caseCode(c.id)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const stats = [
    {
      label: "Emergencias",
      group: "emergency" as const,
      icon: HeartPulse,
      tone: "text-red-600 bg-red-50",
    },
    {
      label: "Casos nuevos",
      group: "new" as const,
      icon: Clock3,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "En atención",
      group: "attention" as const,
      icon: Stethoscope,
      tone: "text-teal-700 bg-teal-50",
    },
    {
      label: "Hospitalización",
      group: "hospital" as const,
      icon: BedDouble,
      tone: "text-blue-700 bg-blue-50",
    },
  ];
  return (
    <main className="min-h-screen bg-[#f4f7f7] p-4 sm:p-7">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-700">
              {centerName} · Centro operativo
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Hola, {name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              El estado de la atención, en un solo lugar.
            </p>
          </div>
          <button
            onClick={() => {
              setError("");
              requestKey.current = null;
              setNewCase(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Plus size={18} />
            Registrar caso
          </button>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <article
              key={s.group}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{s.label}</p>
                <span className={`rounded-xl p-2 ${s.tone}`}>
                  <s.icon size={20} />
                </span>
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
                {loaded
                  ? cases.filter((c) => belongsToGroup(c, s.group)).length
                  : "—"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                En los últimos 200 registros
              </p>
            </article>
          ))}
        </section>
        {message && (
          <p
            role="status"
            className="flex gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800"
          >
            <CheckCircle2 size={18} />
            {message}
          </p>
        )}
        {error && !newCase && !editing && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Actividad clínica
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Casos compartidos con la app móvil y el panel institucional.
              </p>
            </div>
            <button
              onClick={load}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
            >
              <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex flex-wrap gap-1">
              {[
                ["all", "Todos"],
                ["pendiente", "Nuevos"],
                ["en_atencion", "En atención"],
                ["hospital", "Hospitalización"],
                ["finalizado", "Finalizados"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === id ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400">
              <Search size={16} />
              <input
                aria-label="Buscar casos"
                placeholder="Nombre o código de caso"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-44 text-xs text-slate-700 outline-none"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  {[
                    "Paciente / caso",
                    "Prioridad",
                    "Estado",
                    "Origen",
                    "Ingreso",
                    "Acción",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-5 py-3 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <Link
                        href={`/portal/professional/case/${c.id}`}
                        className="font-semibold text-slate-900 hover:text-teal-700"
                      >
                        {c.patientName}
                      </Link>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {caseCode(c.id)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-semibold capitalize ${triageStyles[c.triage]}`}
                      >
                        {c.triage}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {c.status === "en_atencion" &&
                      c.careArea === "hospitalizacion"
                        ? "Hospitalización"
                        : statusLabels[c.status]}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        {c.origin === "app" ? (
                          <Smartphone size={14} />
                        ) : (
                          <Activity size={14} />
                        )}{" "}
                        {c.origin === "app" ? "App móvil" : "Web"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {new Date(c.date).toLocaleString("es-EC", {
                        timeZone: "America/Guayaquil",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setError("");
                          setEditing(c);
                        }}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length && (
            <div className="px-5 py-14 text-center">
              <Activity className="mx-auto mb-3 text-slate-300" size={30} />
              <p className="text-sm font-medium text-slate-600">
                {busy && !loaded
                  ? "Cargando casos…"
                  : !loaded
                    ? "Los casos no están disponibles"
                    : "No hay casos para mostrar"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Los registros de la app aparecerán aquí al actualizar.
              </p>
            </div>
          )}
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {cases.length} registros recientes · Última consulta:{" "}
            {loadedAt || "pendiente"}
          </p>
        </section>
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Herramientas clínicas
            </h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">
              Módulos existentes con datos de demostración
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {professionalSidebarModules
              .filter(
                (m) => m.id !== "home" && m.roles.includes("professional"),
              )
              .map((m) => (
                <Link
                  key={m.id}
                  href={m.path}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:shadow-sm"
                >
                  {m.label}
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-slate-300 group-hover:text-teal-700"
                  />
                </Link>
              ))}
          </div>
        </section>
      </div>
      {(newCase || editing) && (
        <CaseDialog
          item={editing}
          onClose={() => {
            setNewCase(false);
            setEditing(null);
            setError("");
          }}
          onSubmit={save}
          busy={busy}
          error={error}
        />
      )}
    </main>
  );
}
function CaseDialog({
  item,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  item: CaseItem | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  error: string;
}) {
  const [status, setStatus] = useState<FlowStatus>(item?.status ?? "pendiente");
  const [area, setArea] = useState<CareArea>(item?.careArea ?? "general");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="case-title"
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="case-title" className="text-xl font-semibold">
            {item ? "Gestionar atención" : "Registrar caso"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {item ? item.patientName : "Registro compartido con el centro"}
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar"
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {item ? (
          <>
            <label className="block text-sm font-medium">
              Estado
              <select
                name="status"
                value={status}
                onChange={(e) => {
                  const next = e.target.value as FlowStatus;
                  setStatus(next);
                  if (next === "pendiente") setArea("general");
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              >
                {Object.entries(statusLabels).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Área
              <select
                name="careArea"
                value={area}
                onChange={(e) => {
                  const next = e.target.value as CareArea;
                  setArea(next);
                  if (next === "hospitalizacion" && status === "pendiente")
                    setStatus("en_atencion");
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              >
                <option value="general">Atención general</option>
                <option value="hospitalizacion">Hospitalización</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium">
              Nombre del paciente
              <input
                name="patientName"
                required
                maxLength={150}
                autoFocus
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Edad
              <input
                name="age"
                type="number"
                required
                min={0}
                max={130}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Motivo de consulta
              <textarea
                name="reason"
                required
                maxLength={2000}
                rows={2}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Prioridad asignada por el profesional
              <select
                name="triage"
                required
                defaultValue=""
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              >
                <option value="" disabled>
                  Seleccionar prioridad
                </option>
                {Object.keys(triageStyles).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </dialog>
  );
}
