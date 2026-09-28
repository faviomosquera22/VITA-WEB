export type MedicationStockStatus =
  | "Disponible"
  | "Baja disponibilidad"
  | "Agotado";

export interface MedicationStockSnapshot {
  medicationName: string;
  presentation: string;
  stock: number;
  status: MedicationStockStatus;
  updatedAt: string;
  location: string;
  note?: string;
}

export function getMedicationStockSnapshot(
  _medicationName: string,
  _requestedPresentation?: string
): MedicationStockSnapshot | null {
  void _medicationName;
  void _requestedPresentation;
  return null;
}
