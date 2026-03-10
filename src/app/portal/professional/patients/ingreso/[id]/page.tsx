"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ModulePage, Panel, StatCard } from "../../../_components/clinical-ui";
import type { RegisteredPatientRecord } from "@/types/patient-intake";

export default function RegisteredPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<RegisteredPatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/paciente/registro/${id}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: RegisteredPatientRecord;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "No se pudo cargar la ficha.");
        }

        setRecord(payload.data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Error inesperado al cargar la ficha."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.id]);

  const patientName = useMemo(() => {
    if (!record) {
      return "Paciente";
    }

    return `${record.identification.firstNames} ${record.identification.lastNames}`.trim();
  }, [record]);

  if (loading) {
    return (
      <ModulePage
        title="Ficha de ingreso"
        subtitle="Cargando informacion clinica..."
        actions={
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver a ingreso
          </Link>
        }
      >
        <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </ModulePage>
    );
  }

  if (error || !record) {
    return (
      <ModulePage
        title="Ficha de ingreso"
        subtitle="No fue posible cargar el registro solicitado."
        actions={
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver a ingreso
          </Link>
        }
      >
        <Panel title="Error de carga">
          <p className="text-xs text-red-700">{error ?? "Registro no encontrado."}</p>
        </Panel>
      </ModulePage>
    );
  }

  const principalDiagnosis =
    record.diagnostics.find((diag) => diag.condition === "principal") ??
    record.diagnostics[0];

  return (
    <ModulePage
      title={`Ficha de ingreso: ${patientName}`}
      subtitle="Resumen de historia clinica registrada desde el modulo de ingreso."
      actions={
        <div className="flex gap-2">
          <Link
            href="/portal/professional/patients"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Pacientes
          </Link>
          <Link
            href="/portal/professional/patients/ingreso"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Nuevo ingreso
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="HC" value={record.medicalRecordNumber} hint="Numero unico de historia clinica" />
        <StatCard label="Documento" value={record.identification.documentNumber} hint={record.identification.documentType} />
        <StatCard label="Edad" value={record.identification.age ?? "No registrada"} hint={`Sexo: ${record.identification.sexBiological || "No registrado"}`} />
        <StatCard
          label="Diagnostico principal"
          value={principalDiagnosis?.cie11Code || "Sin codigo"}
          hint={principalDiagnosis?.description || "Sin diagnostico registrado"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Identificacion">
          <Field label="Nombre completo" value={patientName} />
          <Field label="Nacimiento" value={record.identification.birthDate || "No registrado"} />
          <Field label="Nacionalidad" value={record.identification.nationality || "No registrada"} />
          <Field label="Ocupacion" value={record.identification.occupation || "No registrada"} />
          <Field label="Estado civil" value={record.identification.civilStatus || "No registrado"} />
        </Panel>

        <Panel title="Contacto y financiamiento">
          <Field label="Direccion" value={record.contact.address || "No registrada"} />
          <Field label="Telefono" value={record.contact.phonePrimary || "No registrado"} />
          <Field label="Contacto emergencia" value={record.contact.emergencyName || "No registrado"} />
          <Field label="Afiliacion" value={record.financing.affiliationType} />
          <Field label="Aseguradora" value={record.financing.privateInsurer || "No registra"} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Antecedentes y alergias">
          <ListField label="Patologicos" values={record.antecedentes.personalPathological} />
          <ListField label="Familiares" values={record.antecedentes.familyHistory} />
          <ListField label="Cirugias" values={record.antecedentes.surgeries} />
          <ListField label="Alergias medicamentosas" values={record.antecedentes.allergies.medications} />
          <Field label="Habito tabaco" value={record.antecedentes.lifestyle.tobacco || "No registrado"} />
          <Field label="Habito alcohol" value={record.antecedentes.lifestyle.alcohol || "No registrado"} />
        </Panel>

        <Panel title="Consulta y examen fisico">
          <Field label="Motivo de consulta" value={record.consultation.literalReason || "No registrado"} />
          <Field label="Sintoma principal" value={record.consultation.mainSymptom || "No registrado"} />
          <Field label="Enfermedad actual" value={record.consultation.currentIllnessNarrative || "No registrada"} />
          <Field label="PA / FC / FR" value={`${record.consultation.physicalExam.bloodPressure || "-"} / ${record.consultation.physicalExam.heartRate || "-"} / ${record.consultation.physicalExam.respiratoryRate || "-"}`} />
          <Field label="Temp / SpO2" value={`${record.consultation.physicalExam.temperature || "-"} / ${record.consultation.physicalExam.spo2 || "-"}`} />
          <Field label="Glasgow / Dolor" value={`${record.consultation.physicalExam.glasgow ?? "-"} / ${record.consultation.physicalExam.painScale ?? "-"}`} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Diagnostico y plan">
          {record.diagnostics.length === 0 ? (
            <p className="text-xs text-slate-500">No hay diagnosticos registrados.</p>
          ) : (
            <div className="space-y-2">
              {record.diagnostics.map((diag) => (
                <article key={`${diag.cie11Code}-${diag.description}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-900">
                    {diag.cie11Code || "Sin codigo"} - {diag.description || "Sin descripcion"}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Tipo: {diag.type} · Condicion: {diag.condition}
                  </p>
                </article>
              ))}
            </div>
          )}
          <Field
            label="Plan no farmacologico"
            value={record.therapeuticPlan.nonPharmacological || "No registrado"}
          />
          <Field
            label="Seguimiento"
            value={record.therapeuticPlan.followUpInstructions || "No registrado"}
          />
        </Panel>

        <Panel title="Prescripcion y cumplimiento">
          {record.prescriptions.length === 0 ? (
            <p className="text-xs text-slate-500">Sin prescripcion inicial registrada.</p>
          ) : (
            <div className="space-y-2">
              {record.prescriptions.map((rx, index) => (
                <article key={`${rx.dciName}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-900">{rx.dciName || "Sin DCI"}</p>
                  <p className="text-[11px] text-slate-600">
                    {rx.dose || "-"} · {rx.route || "-"} · {rx.frequency || "-"} · {rx.duration || "-"}
                  </p>
                </article>
              ))}
            </div>
          )}
          <Field label="2FA habilitado" value={record.compliance.twoFactorEnabled ? "Si" : "No"} />
          <Field label="Sesion 15m" value={record.compliance.autoLogout15m ? "Si" : "No"} />
          <Field label="Notas inmutables" value={record.compliance.immutableSignedNotes ? "Si" : "No"} />
          <Field label="Backup 4h" value={record.compliance.backupEvery4h ? "Si" : "No"} />
        </Panel>
      </div>
    </ModulePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xs text-slate-700">{value || "No registrado"}</p>
    </article>
  );
}

function ListField({ label, values }: { label: string; values: string[] }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xs text-slate-700">
        {values.length > 0 ? values.join(", ") : "No registrado"}
      </p>
    </article>
  );
}
