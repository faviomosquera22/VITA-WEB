export type TriageIntakeSectionId =
  | "ingreso_identificacion"
  | "motivo_discriminador"
  | "signos_vitales"
  | "hallazgos_criticos"
  | "antecedentes_enfermedad"
  | "subprotocolos"
  | "resultado";

export interface TriageIntakeSection {
  id: TriageIntakeSectionId;
  code: string;
  label: string;
  shortLabel: string;
  helper: string;
}

export const triageIntakeSections: TriageIntakeSection[] = [
  {
    id: "ingreso_identificacion",
    code: "A",
    label: "Ingreso e Identificacion",
    shortLabel: "Ingreso",
    helper: "Datos generales y de identificacion del paciente.",
  },
  {
    id: "motivo_discriminador",
    code: "B",
    label: "Motivo y Discriminador",
    shortLabel: "Motivo",
    helper: "Motivo de consulta y discriminador clinico principal.",
  },
  {
    id: "signos_vitales",
    code: "C",
    label: "Signos Vitales",
    shortLabel: "Signos",
    helper: "Captura de constantes vitales y deteccion de valores criticos.",
  },
  {
    id: "hallazgos_criticos",
    code: "D",
    label: "Hallazgos Criticos",
    shortLabel: "Criticos",
    helper: "Banderas clinicas inmediatas de alto riesgo.",
  },
  {
    id: "antecedentes_enfermedad",
    code: "E",
    label: "Antecedentes y Enfermedad Actual",
    shortLabel: "Antecedentes",
    helper: "Contexto clinico para completar el nucleo general obligatorio.",
  },
  {
    id: "subprotocolos",
    code: "S",
    label: "Subprotocolos Automaticos",
    shortLabel: "Subprotocolos",
    helper: "Protocolos MSP activados automaticamente segun contexto clinico.",
  },
  {
    id: "resultado",
    code: "R",
    label: "Resultado Integrado",
    shortLabel: "Resultado",
    helper: "Color sugerido, prioridad final, razones y acciones inmediatas.",
  },
];

export function isTriageIntakeSectionId(
  value: string | null
): value is TriageIntakeSectionId {
  if (!value) {
    return false;
  }

  return triageIntakeSections.some((section) => section.id === value);
}
