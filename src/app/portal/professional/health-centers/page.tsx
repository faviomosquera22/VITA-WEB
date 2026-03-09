"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { getCenterVaccineInventory, healthCenters } from "../_data/clinical-mock-data";

export default function HealthCentersPage() {
  const [selectedCenterId, setSelectedCenterId] = useState(healthCenters[0]?.id ?? "");

  const selectedCenter =
    healthCenters.find((center) => center.id === selectedCenterId) ?? healthCenters[0];

  const inventory = useMemo(
    () => (selectedCenter ? getCenterVaccineInventory(selectedCenter.id) : []),
    [selectedCenter]
  );

  return (
    <ModulePage
      title="Centros de salud"
      subtitle="Informacion operativa de centros, servicios, capacidad y disponibilidad de vacunas."
      actions={
        <Link
          href="/portal/professional/vaccination"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Ir a vacunacion
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Centros disponibles" value={healthCenters.length} hint="Red de atencion activa" />
        <StatCard
          label="Profesionales activos"
          value={healthCenters.reduce((sum, center) => sum + center.professionalsActive, 0)}
          hint="Personal en red"
        />
        <StatCard
          label="Servicios promedio"
          value={Math.round(
            healthCenters.reduce((sum, center) => sum + center.services.length, 0) / healthCenters.length
          )}
          hint="Cobertura asistencial"
        />
        <StatCard
          label="Vacunas con stock"
          value={inventory.filter((item) => item.status !== "Agotada").length}
          hint="Centro seleccionado"
        />
      </div>

      <Panel title="Selector de centro" subtitle="Consulta horario, capacidad, equipo y observaciones del centro">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">Centro de salud</label>
            <select
              value={selectedCenterId}
              onChange={(event) => setSelectedCenterId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              {healthCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
          <InfoField label="Ciudad" value={selectedCenter?.city ?? "-"} />
          <InfoField label="Horario" value={selectedCenter?.schedule ?? "-"} />
          <InfoField label="Capacidad" value={selectedCenter?.capacity ?? "-"} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Servicios disponibles</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {selectedCenter?.services.map((service) => (
                <span key={service} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                  {service}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Profesionales activos: {selectedCenter?.professionalsActive ?? 0}</p>
            <p className="text-[11px] text-slate-500">Contacto: {selectedCenter?.contact ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Observaciones: {selectedCenter?.observations ?? "-"}</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Vacunas y stock del centro</p>
            <div className="mt-2 space-y-2">
              {inventory.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-slate-900">{item.vaccine}</p>
                  <p className="text-[11px] text-slate-500">Stock: {item.stock} · Actualizacion: {item.updatedAt}</p>
                  <span
                    className={[
                      "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px]",
                      item.status === "Disponible"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.status === "Baja disponibilidad"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    ].join(" ")}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </Panel>
    </ModulePage>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}
