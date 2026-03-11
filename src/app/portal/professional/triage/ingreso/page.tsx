"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../../_components/clinical-ui";

type TriageIntakeSectionId =
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

type TriageField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "datetime-local";
  placeholder?: string;
  options?: string[];
};

const triageIntakeSections: Array<{
  id: TriageIntakeSectionId;
  code: string;
  label: string;
  helper: string;
}> = [
  {
    id: "diagnostico_triaje",
    code: "B",
    label: "Diagnostico Triaje",
    helper: "Clasificacion inicial, prioridad y conducta inmediata.",
  },
  {
    id: "inicio_atencion",
    code: "C",
    label: "Inicio de Atencion",
    helper: "Datos administrativos y hora de apertura de la atencion.",
  },
  {
    id: "accidentes",
    code: "D",
    label: "Accidentes",
    helper: "Registro de evento accidental, mecanismo y contexto.",
  },
  {
    id: "antecedentes_personales",
    code: "E",
    label: "Antecedentes Personales",
    helper: "Historia clinica previa relevante para la atencion actual.",
  },
  {
    id: "enfermedad_actual",
    code: "F",
    label: "Enfermedad Actual",
    helper: "Motivo de consulta, evolucion y sintomas vigentes.",
  },
  {
    id: "constantes_vitales",
    code: "G",
    label: "Constantes Vitales",
    helper: "Signos vitales iniciales para estratificacion de riesgo.",
  },
  {
    id: "examen_fisico",
    code: "H",
    label: "Examen Fisico",
    helper: "Hallazgos sistematicos del examen fisico general.",
  },
  {
    id: "examen_fisico_critico",
    code: "I",
    label: "Examen Fisico Critico",
    helper: "Evaluacion rapida ABCD en contexto de urgencia.",
  },
  {
    id: "embarazo_parto",
    code: "J",
    label: "Embarazo Parto",
    helper: "Datos obstetricos para pacientes gestantes o puerperio.",
  },
  {
    id: "examenes_complementarios",
    code: "K",
    label: "Examenes Complementarios",
    helper: "Solicitudes y resultados de apoyo diagnostico.",
  },
  {
    id: "diagnosticos",
    code: "L",
    label: "Diagnosticos",
    helper: "Diagnosticos codificados y clasificacion clinica.",
  },
  {
    id: "plan_tratamiento",
    code: "N",
    label: "Plan de Tratamiento",
    helper: "Plan terapeutico inicial, indicaciones y seguimiento.",
  },
  {
    id: "condicion_egreso",
    code: "O",
    label: "Condicion al Egreso",
    helper: "Estado final, recomendaciones y destino al egreso.",
  },
];

const triageSectionFields: Record<TriageIntakeSectionId, TriageField[]> = {
  diagnostico_triaje: [
    {
      name: "triaje_color",
      label: "Color de triaje",
      type: "select",
      options: ["Rojo", "Naranja", "Amarillo", "Verde", "Azul"],
    },
    {
      name: "triaje_nivel",
      label: "Nivel de prioridad",
      type: "select",
      options: ["Emergencia", "Muy urgente", "Urgente", "Prioritario", "No urgente"],
    },
    {
      name: "triaje_motivo",
      label: "Motivo de triaje",
      type: "textarea",
      placeholder: "Describa brevemente por que se clasifica en este nivel.",
    },
    {
      name: "triaje_conducta",
      label: "Conducta inmediata",
      placeholder: "Ej. Observacion, ingreso a box critico, derivacion.",
    },
  ],
  inicio_atencion: [
    { name: "atencion_fecha_hora", label: "Fecha y hora de inicio", type: "datetime-local" },
    { name: "atencion_area", label: "Area de atencion", placeholder: "Ej. Emergencia adultos" },
    { name: "atencion_profesional", label: "Profesional responsable", placeholder: "Nombre y cargo" },
    { name: "atencion_observaciones", label: "Observaciones iniciales", type: "textarea" },
  ],
  accidentes: [
    {
      name: "accidente_tipo",
      label: "Tipo de accidente",
      type: "select",
      options: ["Transito", "Laboral", "Domiciliario", "Escolar", "Otro"],
    },
    { name: "accidente_fecha", label: "Fecha del evento", type: "date" },
    {
      name: "accidente_mecanismo",
      label: "Mecanismo de lesion",
      type: "textarea",
      placeholder: "Describa como ocurrio el evento.",
    },
    { name: "accidente_lesiones", label: "Lesiones aparentes", type: "textarea" },
  ],
  antecedentes_personales: [
    {
      name: "antecedentes_patologicos",
      label: "Antecedentes patologicos",
      type: "textarea",
      placeholder: "HTA, DM2, asma, etc.",
    },
    {
      name: "antecedentes_quirurgicos",
      label: "Antecedentes quirurgicos",
      type: "textarea",
    },
    {
      name: "antecedentes_alergias",
      label: "Alergias conocidas",
      type: "textarea",
      placeholder: "Medicamentos, alimentos, ambientales.",
    },
    {
      name: "antecedentes_medicacion",
      label: "Medicacion habitual",
      type: "textarea",
    },
  ],
  enfermedad_actual: [
    {
      name: "enfermedad_motivo_consulta",
      label: "Motivo de consulta",
      type: "textarea",
      placeholder: "Motivo literal referido por el paciente.",
    },
    { name: "enfermedad_tiempo", label: "Tiempo de evolucion", placeholder: "Ej. 6 horas" },
    {
      name: "enfermedad_sintomas",
      label: "Sintomas actuales",
      type: "textarea",
    },
    {
      name: "enfermedad_narrativa",
      label: "Narrativa de enfermedad actual",
      type: "textarea",
      placeholder: "Descripcion clinica ordenada de la evolucion.",
    },
  ],
  constantes_vitales: [
    { name: "vitales_pa", label: "Presion arterial", placeholder: "Ej. 120/80 mmHg" },
    { name: "vitales_fc", label: "Frecuencia cardiaca", placeholder: "lpm" },
    { name: "vitales_fr", label: "Frecuencia respiratoria", placeholder: "rpm" },
    { name: "vitales_temp", label: "Temperatura", placeholder: "C" },
    { name: "vitales_spo2", label: "SpO2", placeholder: "%" },
    { name: "vitales_dolor", label: "Escala de dolor", placeholder: "0 - 10" },
  ],
  examen_fisico: [
    { name: "fisico_estado_general", label: "Estado general", type: "textarea" },
    { name: "fisico_cabeza_cuello", label: "Cabeza y cuello", type: "textarea" },
    { name: "fisico_torax", label: "Torax y pulmones", type: "textarea" },
    { name: "fisico_cardiovascular", label: "Cardiovascular", type: "textarea" },
    { name: "fisico_abdomen", label: "Abdomen", type: "textarea" },
    { name: "fisico_extremidades", label: "Extremidades y neurologico", type: "textarea" },
  ],
  examen_fisico_critico: [
    {
      name: "critico_via_aerea",
      label: "Via aerea",
      type: "select",
      options: ["Permeable", "Comprometida", "Asegurada"],
    },
    {
      name: "critico_respiracion",
      label: "Respiracion",
      type: "select",
      options: ["Sin dificultad", "Dificultad moderada", "Insuficiencia respiratoria"],
    },
    {
      name: "critico_circulacion",
      label: "Circulacion",
      type: "select",
      options: ["Estable", "Compromiso hemodinamico", "Shock"],
    },
    {
      name: "critico_neuro",
      label: "Estado neurologico",
      type: "select",
      options: ["Alerta", "Somnoliento", "Obnubilado", "Coma"],
    },
  ],
  embarazo_parto: [
    {
      name: "obstetrico_aplica",
      label: "Situacion obstetrica",
      type: "select",
      options: ["No aplica", "Embarazo actual", "Puerperio", "Trabajo de parto"],
    },
    { name: "obstetrico_semanas", label: "Semanas de gestacion", placeholder: "Si aplica" },
    {
      name: "obstetrico_complicaciones",
      label: "Complicaciones obstetricas",
      type: "textarea",
      placeholder: "Sangrado, dolor abdominal, HTA gestacional, etc.",
    },
    { name: "obstetrico_fcf", label: "Frecuencia cardiaca fetal", placeholder: "Si aplica" },
  ],
  examenes_complementarios: [
    {
      name: "examenes_solicitados",
      label: "Examenes solicitados",
      type: "textarea",
      placeholder: "Laboratorio, imagen, pruebas rapidas.",
    },
    {
      name: "examenes_resultados",
      label: "Resultados relevantes",
      type: "textarea",
    },
    {
      name: "examenes_observaciones",
      label: "Observaciones",
      type: "textarea",
    },
  ],
  diagnosticos: [
    { name: "diagnostico_principal", label: "Diagnostico principal" },
    {
      name: "diagnostico_secundario",
      label: "Diagnosticos secundarios",
      type: "textarea",
    },
    { name: "diagnostico_cie11", label: "Codigo CIE-11" },
    {
      name: "diagnostico_tipo",
      label: "Tipo de diagnostico",
      type: "select",
      options: ["Definitivo", "Presuntivo", "Descartado"],
    },
  ],
  plan_tratamiento: [
    {
      name: "plan_farmacologico",
      label: "Plan farmacologico",
      type: "textarea",
      placeholder: "DCI, dosis, frecuencia y via.",
    },
    {
      name: "plan_no_farmacologico",
      label: "Plan no farmacologico",
      type: "textarea",
    },
    {
      name: "plan_seguimiento",
      label: "Indicaciones y seguimiento",
      type: "textarea",
    },
    {
      name: "plan_referencia",
      label: "Referencia / derivacion",
      placeholder: "Servicio o unidad de destino",
    },
  ],
  condicion_egreso: [
    {
      name: "egreso_condicion",
      label: "Condicion al egreso",
      type: "select",
      options: ["Alta", "Observacion", "Hospitalizacion", "Referencia", "Traslado"],
    },
    {
      name: "egreso_destino",
      label: "Destino",
      placeholder: "Domicilio, sala, hospital de referencia, etc.",
    },
    {
      name: "egreso_instrucciones",
      label: "Instrucciones de egreso",
      type: "textarea",
      placeholder: "Cuidados, signos de alarma y control.",
    },
  ],
};

export default function TriageIntakePage() {
  const [activeSectionId, setActiveSectionId] = useState<TriageIntakeSectionId>("diagnostico_triaje");
  const [values, setValues] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const activeSection = useMemo(
    () => triageIntakeSections.find((item) => item.id === activeSectionId) ?? triageIntakeSections[0],
    [activeSectionId]
  );

  const activeFields = triageSectionFields[activeSection.id];

  const completedSections = useMemo(() => {
    return triageIntakeSections.filter((section) => {
      const fields = triageSectionFields[section.id];
      return fields.every((field) => (values[field.name] ?? "").trim().length > 0);
    }).length;
  }, [values]);

  const saveDraft = () => {
    const now = new Date();
    setLastSavedAt(now.toLocaleString());
  };

  return (
    <ModulePage
      title="Ingreso de triaje"
      subtitle="Formulario estructurado con secciones B-O para recopilacion clinica inicial."
      actions={
        <div className="flex gap-2">
          <Link
            href="/portal/professional/triage"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Volver a triaje
          </Link>
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Guardar
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Secciones completadas"
          value={`${completedSections}/${triageIntakeSections.length}`}
          hint="Cada seccion se marca completa cuando todos sus campos tienen valor"
        />
        <StatCard
          label="Seccion activa"
          value={`${activeSection.code}`}
          hint={activeSection.label}
        />
        <StatCard
          label="Ultimo guardado"
          value={lastSavedAt ? "Listo" : "Pendiente"}
          hint={lastSavedAt ?? "Sin guardar en esta sesion"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px,1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-2 rounded-xl bg-emerald-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Atencion</p>
            <p className="text-xs text-emerald-800">Opciones de recopilacion de datos</p>
          </div>

          <ul className="space-y-1">
            {triageIntakeSections.map((section) => {
              const isActive = section.id === activeSection.id;
              const isComplete = triageSectionFields[section.id].every(
                (field) => (values[field.name] ?? "").trim().length > 0
              );

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition",
                      isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <span className="truncate">
                      {section.code} {section.label}
                    </span>
                    {isComplete ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        OK
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <Panel title={`${activeSection.code} ${activeSection.label}`} subtitle={activeSection.helper}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {activeFields.map((field) => {
              const value = values[field.name] ?? "";

              return (
                <label key={field.name} className="flex flex-col gap-1 text-xs text-slate-700">
                  <span className="font-medium text-slate-600">{field.label}</span>

                  {field.type === "textarea" ? (
                    <textarea
                      value={value}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder={field.placeholder}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={value}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Seleccionar</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      value={value}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Guardar seccion
            </button>
            <button
              type="button"
              onClick={() => {
                const clearValues = { ...values };
                activeFields.forEach((field) => {
                  delete clearValues[field.name];
                });
                setValues(clearValues);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Limpiar seccion
            </button>
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
