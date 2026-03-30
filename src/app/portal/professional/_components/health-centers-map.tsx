"use client";

import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { healthCenters } from "../_data/clinical-mock-data";
import { healthCenterLocations } from "../_data/health-center-locations";

const centerMapRows = healthCenters.reduce<
  Array<(typeof healthCenters)[number] & (typeof healthCenterLocations)[number]>
>((collection, center) => {
  const location = healthCenterLocations.find((item) => item.centerId === center.id);
  if (!location) {
    return collection;
  }

  collection.push({
    ...center,
    ...location,
  });

  return collection;
}, []);

export default function HealthCentersMap({ selectedCenterId }: { selectedCenterId: string }) {
  const selectedCenter =
    centerMapRows.find((center) => center.id === selectedCenterId) ?? centerMapRows[0];

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <MapContainer
        key={selectedCenterId}
        center={[selectedCenter.latitude, selectedCenter.longitude]}
        zoom={6}
        scrollWheelZoom={false}
        className="h-[360px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {centerMapRows.map((center) => (
          <Marker
            key={center.id}
            position={[center.latitude, center.longitude]}
            icon={divIcon({
              className: "",
              html: `
                <div style="
                  width: 18px;
                  height: 18px;
                  border-radius: 9999px;
                  background: ${center.id === selectedCenterId ? "#0284c7" : "#0f172a"};
                  border: 3px solid rgba(255,255,255,0.92);
                  box-shadow: 0 8px 24px rgba(15,23,42,0.22);
                "></div>
              `,
            })}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{center.name}</p>
                <p className="text-xs text-slate-600">{center.city}</p>
                <p className="text-xs text-slate-600">Espera estimada: {center.waitTimeMinutes} min</p>
                <p className="text-xs text-slate-600">Derivacion: {center.referralFocus}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
