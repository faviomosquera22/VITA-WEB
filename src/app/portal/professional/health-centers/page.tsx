"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { getCenterVaccineInventory, healthCenters } from "../_data/clinical-mock-data";
import { healthCenterLocations } from "../_data/health-center-locations";

const HealthCentersMap = dynamic(() => import("../_components/health-centers-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-[28px] border border-slate-200 bg-white text-sm text-slate-500">
      Cargando mapa de centros...
    </div>
  ),
});

export default function HealthCentersPage() {
  const [selectedCenterId, setSelectedCenterId] = useState(healthCenters[0]?.id ?? "");

  const selectedCenter =
    healthCenters.find((center) => center.id === selectedCenterId) ?? healthCenters[0];

  const selectedCenterLocation =
    healthCenterLocations.find((center) => center.centerId === selectedCenterId) ?? healthCenterLocations[0];

  const inventory = useMemo(
    () => (selectedCenter ? getCenterVaccineInventory(selectedCenter.id) : []),
    [selectedCenter]
  );

  return (
    <ModulePage
      title="Centros de salud"
      subtitle="Mapa, capacidad operativa, tiempos de respuesta y disponibilidad para futuras derivaciones."
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
          label="Espera estimada"
          value={`${selectedCenterLocation?.waitTimeMinutes ?? 0} min`}
          hint="Centro seleccionado"
        />
        <StatCard
          label="Vacunas con stock"
          value={inventory.filter((item) => item.status !== "Agotada").length}
          hint="Centro seleccionado"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title="Selector de centro" subtitle="Perfil operativo y lectura rapida de derivacion">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Centro de salud
              </span>
              <select
                value={selectedCenterId}
                onChange={(event) => setSelectedCenterId(event.target.value)}
                className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {healthCenters.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Ciudad" value={selectedCenter?.city ?? "-"} />
              <InfoField label="Horario" value={selectedCenter?.schedule ?? "-"} />
              <InfoField label="Capacidad" value={selectedCenter?.capacity ?? "-"} />
              <InfoField label="Espera" value={`${selectedCenterLocation?.waitTimeMinutes ?? 0} min`} />
            </div>

            <article className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Derivacion preferente</p>
              <p className="mt-2 text-sm text-slate-600">{selectedCenterLocation?.referralFocus ?? "-"}</p>
              <p className="mt-3 text-xs text-slate-500">
                {selectedCenter?.observations ?? "Sin observaciones registradas."}
              </p>
            </article>

            <article className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Servicios</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCenter?.services.map((service) => (
                  <span key={service} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                    {service}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </Panel>

        <HealthCentersMap selectedCenterId={selectedCenterId} />
      </div>

      <Panel title="Inventario y soporte de red" subtitle="Disponibilidad operativa por centro seleccionado">
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Vacunas y stock</p>
            <div className="mt-3 space-y-2">
              {inventory.map((item) => (
                <div key={item.id} className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.vaccine}</p>
                  <p className="text-xs text-slate-500">Stock: {item.stock} · Actualizacion: {item.updatedAt}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Contacto y cobertura</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p>Contacto: {selectedCenter?.contact ?? "-"}</p>
              <p>Profesionales activos: {selectedCenter?.professionalsActive ?? 0}</p>
              <p>Disponibilidad vacunal: {selectedCenter?.vaccineAvailability ?? "-"}</p>
              <p>
                Este bloque deja lista una base visual y tecnica para centros cercanos, puntos de atencion,
                referencias y red de derivacion.
              </p>
            </div>
          </article>
        </div>
      </Panel>
    </ModulePage>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}
