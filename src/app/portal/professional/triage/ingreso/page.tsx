"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../../_components/clinical-ui";
import {
  isTriageIntakeSectionId,
  triageIntakeSections,
  type TriageIntakeSectionId,
} from "../../_data/triage-intake-sections";

type TriageField = {
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "textarea" | "select" | "date" | "datetime-local";
  placeholder?: string;
  options?: string[];
};

const DRAFT_STORAGE_KEY = "vita-triaje-ingreso-simple-v1";

const patientQuickFields: TriageField[] = [
  { name: "px_documento", label: "Documento", required: true, placeholder: "Cedula o pasaporte" },
  { name: "px_nombres", label: "Nombres y apellidos", required: true },
  { name: "px_edad", label: "Edad", required: true, placeholder: "Anios" },
  {
    name: "px_sexo",
    label: "Sexo biologico",
    required: true,
    type: "select",
    options: ["Femenino", "Masculino", "Intersexual"],
  },
];

const triageSectionFields: Record<TriageIntakeSectionId, TriageField[]> = {
  diagnostico_triaje: [
    {
      name: "triaje_color",
      label: "Color de triaje",
      required: true,
      type: "select",
      options: ["Rojo", "Naranja", "Amarillo", "Verde", "Azul"],
    },
    {
      name: "triaje_nivel",
      label: "Nivel de prioridad",
      required: true,
      type: "select",
      options: ["Emergencia", "Muy urgente", "Urgente", "Prioritario", "No urgente"],
    },
    {
      name: "triaje_motivo",
      label: "Motivo de triaje",
      required: true,
      type: "textarea",
      placeholder: "Descripcion corta del motivo de clasificacion.",
    },
  ],
  inicio_atencion: [
    { name: "atencion_fecha_hora", label: "Fecha y hora de inicio", required: true, type: "datetime-local" },
    { name: "atencion_area", label: "Area de atencion", required: true, placeholder: "Emergencia adultos" },
    { name: "atencion_profesional", label: "Profesional responsable", required: true },
  ],
  accidentes: [
    {
      name: "accidente_tipo",
      label: "Tipo de accidente",
      type: "select",
      options: ["Transito", "Laboral", "Domiciliario", "Escolar", "Otro"],
    },
    { name: "accidente_fecha", label: "Fecha del evento", type: "date" },
    { name: "accidente_mecanismo", label: "Mecanismo", type: "textarea" },
  ],
  antecedentes_personales: [
    {
      name: "antecedentes_patologicos",
      label: "Antecedentes patologicos",
      required: true,
      type: "textarea",
      placeholder: "HTA, DM2, asma, etc.",
    },
    {
      name: "antecedentes_alergias",
      label: "Alergias",
      required: true,
      type: "textarea",
      placeholder: "Medicamentos, alimentos o ambientales.",
    },
    { name: "antecedentes_medicacion", label: "Medicacion habitual", type: "textarea" },
  ],
  enfermedad_actual: [
    {
      name: "enfermedad_motivo_consulta",
      label: "Motivo de consulta",
      required: true,
      type: "textarea",
    },
    { name: "enfermedad_tiempo", label: "Tiempo de evolucion", required: true, placeholder: "Ej. 6 horas" },
    { name: "enfermedad_sintomas", label: "Sintomas actuales", type: "textarea" },
  ],
  constantes_vitales: [
    { name: "vitales_pa", label: "Presion arterial", required: true, placeholder: "120/80" },
    { name: "vitales_fc", label: "Frecuencia cardiaca", required: true, placeholder: "lpm" },
    { name: "vitales_fr", label: "Frecuencia respiratoria", required: true, placeholder: "rpm" },
    { name: "vitales_temp", label: "Temperatura", required: true, placeholder: "C" },
    { name: "vitales_spo2", label: "SpO2", placeholder: "%" },
    { name: "vitales_dolor", label: "Dolor", placeholder: "0 - 10" },
  ],
  examen_fisico: [
    { name: "fisico_estado_general", label: "Estado general", required: true, type: "textarea" },
    { name: "fisico_torax", label: "Torax y pulmones", type: "textarea" },
    { name: "fisico_abdomen", label: "Abdomen", type: "textarea" },
  ],
  examen_fisico_critico: [
    {
      name: "critico_via_aerea",
      label: "Via aerea",
      required: true,
      type: "select",
      options: ["Permeable", "Comprometida", "Asegurada"],
    },
    {
      name: "critico_respiracion",
      label: "Respiracion",
      required: true,
      type: "select",
      options: ["Sin dificultad", "Dificultad", "Insuficiencia"],
    },
    {
      name: "critico_circulacion",
      label: "Circulacion",
      required: true,
      type: "select",
      options: ["Estable", "Compromiso hemodinamico", "Shock"],
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
    { name: "obstetrico_complicaciones", label: "Complicaciones", type: "textarea" },
  ],
  examenes_complementarios: [
    {
      name: "examenes_solicitados",
      label: "Examenes solicitados",
      type: "textarea",
      placeholder: "Laboratorio, imagen, pruebas rapidas.",
    },
    { name: "examenes_resultados", label: "Resultados relevantes", type: "textarea" },
    { name: "examenes_observaciones", label: "Observaciones", type: "textarea" },
  ],
  diagnosticos: [
    { name: "diagnostico_principal", label: "Diagnostico principal", required: true },
    { name: "diagnostico_cie11", label: "Codigo CIE-11", required: true },
    {
      name: "diagnostico_tipo",
      label: "Tipo",
      type: "select",
      options: ["Definitivo", "Presuntivo", "Descartado"],
    },
  ],
  plan_tratamiento: [
    { name: "plan_farmacologico", label: "Plan farmacologico", required: true, type: "textarea" },
    { name: "plan_no_farmacologico", label: "Plan no farmacologico", type: "textarea" },
    { name: "plan_seguimiento", label: "Seguimiento", required: true, type: "textarea" },
  ],
  condicion_egreso: [
    {
      name: "egreso_condicion",
      label: "Condicion al egreso",
      required: true,
      type: "select",
      options: ["Alta", "Observacion", "Hospitalizacion", "Referencia", "Traslado"],
    },
    { name: "egreso_destino", label: "Destino", required: true },
    { name: "egreso_instrucciones", label: "Instrucciones", type: "textarea" },
  ],
};

export default function TriageIntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      return {};
    }

    try {
      return JSON.parse(rawDraft) as Record<string, string>;
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return {};
    }
  });
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const activeSectionId = useMemo<TriageIntakeSectionId>(() => {
    const section = searchParams.get("section");
    if (isTriageIntakeSectionId(section)) {
      return section;
    }
    return "diagnostico_triaje";
  }, [searchParams]);

  const activeSection =
    triageIntakeSections.find((section) => section.id === activeSectionId) ??
    triageIntakeSections[0];

  const activeSectionIndex = triageIntakeSections.findIndex(
    (section) => section.id === activeSection.id
  );

  const previousSection =
    activeSectionIndex > 0 ? triageIntakeSections[activeSectionIndex - 1] : null;
  const nextSection =
    activeSectionIndex < triageIntakeSections.length - 1
      ? triageIntakeSections[activeSectionIndex + 1]
      : null;

  const completedSections = useMemo(() => {
    return triageIntakeSections.filter((section) => {
      const requiredFields = triageSectionFields[section.id].filter((field) => field.required);
      if (requiredFields.length === 0) {
        return true;
      }

      return requiredFields.every((field) => (values[field.name] ?? "").trim().length > 0);
    }).length;
  }, [values]);

  const requiredCurrentSection = triageSectionFields[activeSection.id].filter(
    (field) => field.required
  );
  const filledCurrentSection = requiredCurrentSection.filter(
    (field) => (values[field.name] ?? "").trim().length > 0
  ).length;

  const goToSection = (sectionId: TriageIntakeSectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", sectionId);
    router.replace(`/portal/professional/triage/ingreso?${params.toString()}`, {
      scroll: false,
    });
  };

  const saveDraft = () => {
    setLastSavedAt(new Date().toLocaleString());
  };

  const clearCurrentSection = () => {
    setValues((previous) => {
      const nextValues = { ...previous };
      triageSectionFields[activeSection.id].forEach((field) => {
        delete nextValues[field.name];
      });
      return nextValues;
    });
  };

  const clearAll = () => {
    if (typeof window !== "undefined") {
      const shouldClear = window.confirm(
        "Se limpiara todo el formulario de triaje. Deseas continuar?"
      );
      if (!shouldClear) {
        return;
      }
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }

    setValues({});
    setLastSavedAt(null);
  };

  return (
    <ModulePage
      title="Ingreso de triaje"
      subtitle="Flujo simple por secciones B-O para registrar un px en pocos pasos."
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
            Guardar borrador
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Secciones completadas"
          value={`${completedSections}/${triageIntakeSections.length}`}
          hint="Calculado con campos obligatorios por seccion"
        />
        <StatCard
          label="Seccion activa"
          value={`${activeSection.code}`}
          hint={activeSection.label}
        />
        <StatCard
          label="Ultimo guardado"
          value={lastSavedAt ? "Listo" : "Pendiente"}
          hint={lastSavedAt ?? "Guardado automatico local activo"}
        />
      </div>

      <Panel
        title="Datos rapidos del paciente"
        subtitle="Completa estos campos una sola vez antes de avanzar por las secciones"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {patientQuickFields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={values[field.name] ?? ""}
              onChange={(nextValue) =>
                setValues((previous) => ({
                  ...previous,
                  [field.name]: nextValue,
                }))
              }
            />
          ))}
        </div>
      </Panel>

      <Panel
        title={`${activeSection.code} ${activeSection.label}`}
        subtitle={`${activeSection.helper} · ${filledCurrentSection}/${requiredCurrentSection.length} obligatorios completados`}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {triageSectionFields[activeSection.id].map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={values[field.name] ?? ""}
              onChange={(nextValue) =>
                setValues((previous) => ({
                  ...previous,
                  [field.name]: nextValue,
                }))
              }
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearCurrentSection}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Limpiar seccion actual
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
          >
            Nuevo formulario
          </button>
          {previousSection ? (
            <button
              type="button"
              onClick={() => goToSection(previousSection.id)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Anterior: {previousSection.code}
            </button>
          ) : null}
          {nextSection ? (
            <button
              type="button"
              onClick={() => goToSection(nextSection.id)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Siguiente: {nextSection.code}
            </button>
          ) : (
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Finalizar ingreso
            </button>
          )}
        </div>
      </Panel>
    </ModulePage>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TriageField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-700">
      <span className="font-medium text-slate-600">
        {field.label}
        {field.required ? (
          <span className="ml-1 text-[10px] font-semibold uppercase text-red-600">* obligatorio</span>
        ) : null}
      </span>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder={field.placeholder}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      )}
    </label>
  );
}
