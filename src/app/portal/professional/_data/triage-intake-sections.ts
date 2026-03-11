export type TriageIntakeSectionId =
  | "diagnostico_triaje"
  | "inicio_atencion"
  | "accidentes"
  | "antecedentes_personales"
  | "enfermedad_actual"
  | "constantes_vitales"
  | "examen_fisico"
  | "examen_fisico_critico"
  | "embarazo_parto"
  | "examenes_complementarios"
  | "diagnosticos"
  | "plan_tratamiento"
  | "condicion_egreso";

export interface TriageIntakeSection {
  id: TriageIntakeSectionId;
  code: string;
  label: string;
  shortLabel: string;
  helper: string;
}

export const triageIntakeSections: TriageIntakeSection[] = [
  {
    id: "diagnostico_triaje",
    code: "B",
    label: "Diagnostico Triaje",
    shortLabel: "Diag. triaje",
    helper: "Clasificacion inicial, prioridad y conducta inmediata.",
  },
  {
    id: "inicio_atencion",
    code: "C",
    label: "Inicio de Atencion",
    shortLabel: "Inicio atencion",
    helper: "Datos administrativos y hora de apertura de la atencion.",
  },
  {
    id: "accidentes",
    code: "D",
    label: "Accidentes",
    shortLabel: "Accidentes",
    helper: "Registro de evento accidental, mecanismo y contexto.",
  },
  {
    id: "antecedentes_personales",
    code: "E",
    label: "Antecedentes Personales",
    shortLabel: "Antecedentes",
    helper: "Historia clinica previa relevante para la atencion actual.",
  },
  {
    id: "enfermedad_actual",
    code: "F",
    label: "Enfermedad Actual",
    shortLabel: "Enf. actual",
    helper: "Motivo de consulta, evolucion y sintomas vigentes.",
  },
  {
    id: "constantes_vitales",
    code: "G",
    label: "Constantes Vitales",
    shortLabel: "Constantes",
    helper: "Signos vitales iniciales para estratificacion de riesgo.",
  },
  {
    id: "examen_fisico",
    code: "H",
    label: "Examen Fisico",
    shortLabel: "Examen fisico",
    helper: "Hallazgos sistematicos del examen fisico general.",
  },
  {
    id: "examen_fisico_critico",
    code: "I",
    label: "Examen Fisico Critico",
    shortLabel: "Fisico critico",
    helper: "Evaluacion rapida ABCD en contexto de urgencia.",
  },
  {
    id: "embarazo_parto",
    code: "J",
    label: "Embarazo Parto",
    shortLabel: "Embarazo/parto",
    helper: "Datos obstetricos para pacientes gestantes o puerperio.",
  },
  {
    id: "examenes_complementarios",
    code: "K",
    label: "Examenes Complementarios",
    shortLabel: "Examenes comp.",
    helper: "Solicitudes y resultados de apoyo diagnostico.",
  },
  {
    id: "diagnosticos",
    code: "L",
    label: "Diagnosticos",
    shortLabel: "Diagnosticos",
    helper: "Diagnosticos codificados y clasificacion clinica.",
  },
  {
    id: "plan_tratamiento",
    code: "N",
    label: "Plan de Tratamiento",
    shortLabel: "Plan",
    helper: "Plan terapeutico inicial, indicaciones y seguimiento.",
  },
  {
    id: "condicion_egreso",
    code: "O",
    label: "Condicion al Egreso",
    shortLabel: "Condicion egreso",
    helper: "Estado final, recomendaciones y destino al egreso.",
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
