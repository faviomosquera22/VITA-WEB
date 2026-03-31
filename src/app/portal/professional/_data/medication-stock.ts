import { medicationCatalogBase } from "./medication-catalog";

export type MedicationStockStatus = "Disponible" | "Baja disponibilidad" | "Agotado";

export interface MedicationStockSnapshot {
  medicationName: string;
  presentation: string;
  stock: number;
  status: MedicationStockStatus;
  updatedAt: string;
  location: string;
  note?: string;
}

type MedicationStockOverride = Omit<MedicationStockSnapshot, "medicationName">;

const curatedStockOverrides = new Map<string, MedicationStockOverride>([
  [
    normalizeName("Metformina"),
    {
      presentation: "850 mg tableta",
      stock: 184,
      status: "Disponible",
      updatedAt: "2026-03-30 20:45",
      location: "Farmacia hospitalizacion",
      note: "Rotacion alta, reposicion diaria activa.",
    },
  ],
  [
    normalizeName("Enoxaparina"),
    {
      presentation: "40 mg/0.4 mL jeringa",
      stock: 26,
      status: "Disponible",
      updatedAt: "2026-03-30 19:50",
      location: "Farmacia central",
      note: "Lote con vencimiento controlado.",
    },
  ],
  [
    normalizeName("Insulina regular"),
    {
      presentation: "100 UI/mL frasco",
      stock: 14,
      status: "Baja disponibilidad",
      updatedAt: "2026-03-30 18:35",
      location: "Cadena de frio UCI",
      note: "Priorizar validacion de farmacia antes de dispensar.",
    },
  ],
  [
    normalizeName("Ceftriaxona"),
    {
      presentation: "1 g vial",
      stock: 0,
      status: "Agotado",
      updatedAt: "2026-03-30 17:10",
      location: "Farmacia central",
      note: "Sin stock operativo, revisar alternativa institucional o redistribucion.",
    },
  ],
  [
    normalizeName("Paracetamol"),
    {
      presentation: "500 mg tableta",
      stock: 220,
      status: "Disponible",
      updatedAt: "2026-03-30 20:02",
      location: "Botiquin piso",
    },
  ],
]);

export function getMedicationStockSnapshot(
  medicationName: string,
  requestedPresentation?: string
): MedicationStockSnapshot | null {
  const inferredBaseName = extractBaseMedicationName(medicationName);
  const inferredPresentation =
    requestedPresentation || extractPresentationFromVariantName(medicationName);
  const catalogItem = medicationCatalogBase.find(
    (item) => normalizeName(item.name) === normalizeName(medicationName)
  );
  const fallbackCatalogItem =
    catalogItem ??
    medicationCatalogBase.find(
      (item) => normalizeName(item.name) === normalizeName(inferredBaseName)
    );

  if (!fallbackCatalogItem) {
    return null;
  }

  const normalizedName = normalizeName(fallbackCatalogItem.name);
  const override = curatedStockOverrides.get(normalizedName);
  const presentation = resolvePresentation(
    fallbackCatalogItem.presentations,
    inferredPresentation,
    override?.presentation
  );

  if (override) {
    return {
      medicationName: fallbackCatalogItem.name,
      presentation,
      stock: override.stock,
      status: override.status,
      updatedAt: override.updatedAt,
      location: override.location,
      note: override.note,
    };
  }

  const stock = derivePseudoStock(`${fallbackCatalogItem.name}-${presentation}`);

  return {
    medicationName: fallbackCatalogItem.name,
    presentation,
    stock,
    status: getStockStatus(stock),
    updatedAt: "2026-03-30 18:00",
    location: stock <= 0 ? "Pendiente confirmar farmacia" : "Farmacia hospitalaria",
    note:
      stock <= 0
        ? "Sin disponibilidad simulada. Estructura lista para conectarse con inventario real."
        : stock <= 12
          ? "Disponibilidad acotada. Conviene validar reserva antes de cerrar la orden."
          : "Disponibilidad referencial del catalogo local.",
  };
}

function resolvePresentation(
  catalogPresentations: string[],
  requestedPresentation?: string,
  overridePresentation?: string
) {
  if (requestedPresentation) {
    const matched = catalogPresentations.find(
      (item) => normalizeName(item) === normalizeName(requestedPresentation)
    );
    if (matched) {
      return matched;
    }
  }

  if (overridePresentation) {
    const matched = catalogPresentations.find(
      (item) => normalizeName(item) === normalizeName(overridePresentation)
    );
    if (matched) {
      return matched;
    }
    return overridePresentation;
  }

  return catalogPresentations[0] ?? requestedPresentation ?? "Presentacion por confirmar";
}

function derivePseudoStock(seed: string) {
  const value = Array.from(seed).reduce((accumulator, char, index) => {
    return accumulator + char.charCodeAt(0) * (index + 3);
  }, 0);

  const normalized = value % 100;

  if (normalized < 12) {
    return 0;
  }

  if (normalized < 32) {
    return 4 + (normalized % 8);
  }

  return 18 + (normalized % 67);
}

function getStockStatus(stock: number): MedicationStockStatus {
  if (stock <= 0) {
    return "Agotado";
  }

  if (stock <= 12) {
    return "Baja disponibilidad";
  }

  return "Disponible";
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractBaseMedicationName(value: string) {
  const [baseName] = value.split("·");
  return baseName?.trim() || value.trim();
}

function extractPresentationFromVariantName(value: string) {
  const parts = value.split("·");
  return parts.length > 1 ? parts.slice(1).join("·").trim() : "";
}
