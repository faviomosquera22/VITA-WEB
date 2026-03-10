"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ModulePage, Panel, StatCard } from "../../_components/clinical-ui";
import type { CedulaLookupErrorResponse, CedulaLookupResponse } from "@/types/paciente-cedula";
import type { RegisteredPatientRecord, RegisteredPatientSummary } from "@/types/patient-intake";

type FormState = {
  source: "manual" | "registro_civil";
  documentType: "cedula" | "pasaporte" | "carne_refugiado";
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  birthDate: string;
  sexBiological: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  civilStatus: string;
  educationLevel: string;
  occupation: string;
  workplace: string;
  religion: string;
  address: string;
  parish: string;
  canton: string;
  province: string;
  gpsLat: string;
  gpsLng: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsapp: string;
  email: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  legalRepresentative: string;
  affiliationType: "IESS" | "ISSFA" | "ISSPOL" | "privado" | "particular" | "otro";
  iessNumber: string;
  privateInsurer: string;
  privatePolicyNumber: string;
  employer: string;
  copayExemption: string;
  disabilityPercent: string;
  conadisNumber: string;
  bloodGroup: string;
  personalPathological: string;
  familyHistory: string;
  surgeries: string;
  previousHospitalizations: string;
  allergiesMedications: string;
  allergiesFoods: string;
  allergiesEnvironmental: string;
  allergiesContrastLatex: string;
  tobacco: string;
  alcohol: string;
  drugs: string;
  physicalActivityMinutesPerWeek: string;
  dietType: string;
  sleepHours: string;
  occupationalRiskExposure: string;
  consultationType: "primera_vez" | "subsecuente" | "urgencia" | "teleconsulta";
  literalReason: string;
  evolutionTime: string;
  mainSymptom: string;
  currentIllnessNarrative: string;
  previousEpisodeTreatments: string;
  reviewGeneral: string;
  reviewCardiovascular: string;
  reviewRespiratory: string;
  reviewDigestive: string;
  reviewGenitourinary: string;
  reviewNeurologic: string;
  reviewMusculoskeletal: string;
  reviewDermatologic: string;
  reviewPsychiatric: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  capillaryGlucose: string;
  painScale: string;
  glasgow: string;
  generalAppearance: string;
  skin: string;
  headNeck: string;
  ent: string;
  thoraxLungs: string;
  cardiovascularExam: string;
  abdomen: string;
  extremities: string;
  neurologicExam: string;
  genitourinaryExam: string;
  rectalExam: string;
  gynecoExam: string;
  cie11Code: string;
  diagnosisDescription: string;
  diagnosisType: "definitivo" | "presuntivo" | "descartado";
  diagnosisCondition: "principal" | "secundario" | "complicacion";
  pregnancyRelated: boolean;
  nonPharmacological: string;
  followUpInstructions: string;
  alarmSignsExplained: string;
  referralDestination: string;
  prescriptionDci: string;
  prescriptionDose: string;
  prescriptionRoute: string;
  prescriptionFrequency: string;
  prescriptionDuration: string;
  prescriptionInstructions: string;
};

const bloodGroups = ["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const emptyForm: FormState = {
  source: "manual",
  documentType: "cedula",
  documentNumber: "",
  firstNames: "",
  lastNames: "",
  birthDate: "",
  sexBiological: "",
  gender: "",
  nationality: "Ecuatoriana",
  ethnicity: "",
  civilStatus: "",
  educationLevel: "",
  occupation: "",
  workplace: "",
  religion: "",
  address: "",
  parish: "",
  canton: "",
  province: "",
  gpsLat: "",
  gpsLng: "",
  phonePrimary: "",
  phoneSecondary: "",
  whatsapp: "",
  email: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  legalRepresentative: "",
  affiliationType: "particular",
  iessNumber: "",
  privateInsurer: "",
  privatePolicyNumber: "",
  employer: "",
  copayExemption: "",
  disabilityPercent: "",
  conadisNumber: "",
  bloodGroup: "",
  personalPathological: "",
  familyHistory: "",
  surgeries: "",
  previousHospitalizations: "",
  allergiesMedications: "",
  allergiesFoods: "",
  allergiesEnvironmental: "",
  allergiesContrastLatex: "",
  tobacco: "",
  alcohol: "",
  drugs: "",
  physicalActivityMinutesPerWeek: "",
  dietType: "",
  sleepHours: "",
  occupationalRiskExposure: "",
  consultationType: "primera_vez",
  literalReason: "",
  evolutionTime: "",
  mainSymptom: "",
  currentIllnessNarrative: "",
  previousEpisodeTreatments: "",
  reviewGeneral: "",
  reviewCardiovascular: "",
  reviewRespiratory: "",
  reviewDigestive: "",
  reviewGenitourinary: "",
  reviewNeurologic: "",
  reviewMusculoskeletal: "",
  reviewDermatologic: "",
  reviewPsychiatric: "",
  bloodPressure: "",
  heartRate: "",
  respiratoryRate: "",
  temperature: "",
  spo2: "",
  weightKg: "",
  heightCm: "",
  capillaryGlucose: "",
  painScale: "",
  glasgow: "",
  generalAppearance: "",
  skin: "",
  headNeck: "",
  ent: "",
  thoraxLungs: "",
  cardiovascularExam: "",
  abdomen: "",
  extremities: "",
  neurologicExam: "",
  genitourinaryExam: "",
  rectalExam: "",
  gynecoExam: "",
  cie11Code: "",
  diagnosisDescription: "",
  diagnosisType: "definitivo",
  diagnosisCondition: "principal",
  pregnancyRelated: false,
  nonPharmacological: "",
  followUpInstructions: "",
  alarmSignsExplained: "",
  referralDestination: "",
  prescriptionDci: "",
  prescriptionDose: "",
  prescriptionRoute: "",
  prescriptionFrequency: "",
  prescriptionDuration: "",
  prescriptionInstructions: "",
};

export default function PatientIntakePage() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [cedulaLookupInput, setCedulaLookupInput] = useState("");
  const [cedulaLookupLoading, setCedulaLookupLoading] = useState(false);
  const [cedulaLookupMessage, setCedulaLookupMessage] = useState<string | null>(null);
  const [cedulaLookupError, setCedulaLookupError] = useState<string | null>(null);
  const [cedulaLookupExistingUrl, setCedulaLookupExistingUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdRecord, setCreatedRecord] = useState<RegisteredPatientRecord | null>(null);
  const [latest, setLatest] = useState<RegisteredPatientSummary[]>([]);

  useEffect(() => {
    const cedula = searchParams.get("cedula") ?? "";
    const nombres = searchParams.get("nombres") ?? "";
    const apellidos = searchParams.get("apellidos") ?? "";
    const fechaNacimiento = searchParams.get("fechaNacimiento") ?? "";
    const sexo = searchParams.get("sexo") ?? "";

    if (!cedula && !nombres && !apellidos) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      source: cedula ? "registro_civil" : "manual",
      documentNumber: cedula || prev.documentNumber,
      firstNames: nombres || prev.firstNames,
      lastNames: apellidos || prev.lastNames,
      birthDate: fechaNacimiento || prev.birthDate,
      sexBiological: sexo || prev.sexBiological,
      gender: sexo || prev.gender,
    }));
    if (cedula) {
      setCedulaLookupInput(cedula);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const response = await fetch("/api/paciente/registro", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: RegisteredPatientSummary[];
        };
        if (response.ok && payload.data) {
          setLatest(payload.data.slice(0, 6));
        }
      } catch {
        // Ignore list errors in form page.
      }
    };

    loadLatest();
  }, []);

  const requiredMissing = useMemo(() => {
    const missing: string[] = [];
    if (!form.documentNumber.trim()) missing.push("Documento");
    if (!form.firstNames.trim()) missing.push("Nombres");
    if (!form.lastNames.trim()) missing.push("Apellidos");
    if (!form.literalReason.trim()) missing.push("Motivo de consulta");
    return missing;
  }, [form.documentNumber, form.firstNames, form.lastNames, form.literalReason]);

  const onChange =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        event.target instanceof HTMLInputElement && event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatedRecord(null);

    if (requiredMissing.length > 0) {
      setError(`Completa campos obligatorios: ${requiredMissing.join(", ")}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload(form);
      const response = await fetch("/api/paciente/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as {
        data?: RegisteredPatientRecord;
        error?: string;
      };

      if (!response.ok || !responsePayload.data) {
        throw new Error(responsePayload.error ?? "No se pudo registrar el paciente.");
      }

      const created = responsePayload.data;
      setCreatedRecord(created);
      setSuccess(
        `Paciente ingresado correctamente con HC ${created.medicalRecordNumber}.`
      );
      setLatest((prev) => [toSummary(created), ...prev].slice(0, 6));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error inesperado al registrar paciente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCedulaLookup = async () => {
    const cedula = normalizeCedula(cedulaLookupInput);
    setCedulaLookupMessage(null);
    setCedulaLookupError(null);
    setCedulaLookupExistingUrl(null);

    if (cedula.length !== 10) {
      setCedulaLookupError("Ingresa una cedula valida de 10 digitos.");
      return;
    }

    setCedulaLookupLoading(true);
    try {
      const response = await fetch(
        `/api/paciente/cedula?cedula=${encodeURIComponent(cedula)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorPayload = (await response.json()) as CedulaLookupErrorResponse;
        throw new Error(errorPayload.error ?? "No se pudo consultar la cedula.");
      }

      const payload = (await response.json()) as CedulaLookupResponse;
      if (payload.estado === "found") {
        setCedulaLookupExistingUrl(
          payload.paciente.fichaUrl ?? `/portal/professional/patients/${payload.paciente.id}`
        );
        setCedulaLookupMessage(
          `Paciente ya existe en Vita: ${payload.paciente.nombreCompleto} (HC ${payload.paciente.historiaClinicaNumero}).`
        );
      } else {
        setCedulaLookupMessage(
          `Datos cargados desde Registro Civil para ${payload.registroCivil.nombres} ${payload.registroCivil.apellidos}.`
        );
        setForm((prev) => ({
          ...prev,
          source: "registro_civil",
          documentType: "cedula",
          documentNumber: payload.registroCivil.cedula,
          firstNames: payload.registroCivil.nombres,
          lastNames: payload.registroCivil.apellidos,
          birthDate: payload.registroCivil.fecha_nacimiento ?? prev.birthDate,
          sexBiological: payload.registroCivil.sexo ?? prev.sexBiological,
          gender: payload.registroCivil.sexo ?? prev.gender,
        }));
      }
    } catch (lookupError) {
      setCedulaLookupError(
        lookupError instanceof Error
          ? lookupError.message
          : "Error inesperado al buscar la cedula."
      );
    } finally {
      setCedulaLookupLoading(false);
    }
  };

  return (
    <ModulePage
      title="Ingreso de paciente"
      subtitle="Registro integral de historia clinica, antecedentes, consulta, diagnostico y plan terapeutico."
      actions={
        <div className="flex gap-2">
          <Link
            href="/portal/professional/patients"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver a pacientes
          </Link>
        </div>
      }
    >
      <Panel
        title="Busqueda por cedula (Registro Civil)"
        subtitle="Consulta server-side con webservices.ec usando token seguro y autocompleta datos de identificacion"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-sm">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Cedula ecuatoriana
            </label>
            <input
              value={cedulaLookupInput}
              onChange={(event) => setCedulaLookupInput(normalizeCedula(event.target.value))}
              maxLength={10}
              inputMode="numeric"
              placeholder="Ej. 1722334412"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onCedulaLookup}
            disabled={cedulaLookupLoading}
            className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cedulaLookupLoading ? "Consultando..." : "Buscar por cedula"}
          </button>
        </div>
        {cedulaLookupMessage ? <p className="mt-2 text-xs text-emerald-700">{cedulaLookupMessage}</p> : null}
        {cedulaLookupError ? <p className="mt-2 text-xs text-red-700">{cedulaLookupError}</p> : null}
        {cedulaLookupExistingUrl ? (
          <Link href={cedulaLookupExistingUrl} className="mt-2 inline-block text-xs font-semibold text-sky-700 underline">
            Abrir ficha existente
          </Link>
        ) : null}
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Campos obligatorios" value={4} hint="Documento, nombres, apellidos y motivo" />
        <StatCard label="Faltantes actuales" value={requiredMissing.length} hint={requiredMissing.join(", ") || "Formulario listo"} />
        <StatCard label="Registros recientes" value={latest.length} hint="Pacientes ingresados en esta sesion" />
        <StatCard label="Origen" value={form.source === "registro_civil" ? "Registro Civil" : "Manual"} hint="Trazabilidad de identificacion" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Panel title="1) Identificacion del paciente" subtitle="Datos base de historia clinica y estadistica poblacional">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SelectField
              label="Tipo documento"
              value={form.documentType}
              onChange={onChange("documentType")}
              options={[
                { value: "cedula", label: "Cedula" },
                { value: "pasaporte", label: "Pasaporte" },
                { value: "carne_refugiado", label: "Carne refugiado" },
              ]}
            />
            <InputField label="Numero documento *" value={form.documentNumber} onChange={onChange("documentNumber")} />
            <InputField label="Nombres *" value={form.firstNames} onChange={onChange("firstNames")} />
            <InputField label="Apellidos *" value={form.lastNames} onChange={onChange("lastNames")} />
            <InputField label="Fecha nacimiento" type="date" value={form.birthDate} onChange={onChange("birthDate")} />
            <InputField label="Sexo biologico" value={form.sexBiological} onChange={onChange("sexBiological")} />
            <InputField label="Genero" value={form.gender} onChange={onChange("gender")} />
            <InputField label="Nacionalidad" value={form.nationality} onChange={onChange("nationality")} />
            <InputField label="Etnia" value={form.ethnicity} onChange={onChange("ethnicity")} />
            <InputField label="Estado civil" value={form.civilStatus} onChange={onChange("civilStatus")} />
            <InputField label="Nivel instruccion" value={form.educationLevel} onChange={onChange("educationLevel")} />
            <InputField label="Ocupacion" value={form.occupation} onChange={onChange("occupation")} />
            <InputField label="Lugar de trabajo" value={form.workplace} onChange={onChange("workplace")} />
            <InputField label="Religion" value={form.religion} onChange={onChange("religion")} />
            <SelectField
              label="Grupo sanguineo"
              value={form.bloodGroup}
              onChange={onChange("bloodGroup")}
              options={bloodGroups.map((item) => ({ value: item, label: item || "Seleccione" }))}
            />
          </div>
        </Panel>

        <Panel title="2) Contacto y ubicacion" subtitle="Direccion, georreferencia y red de apoyo">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <InputField label="Direccion" value={form.address} onChange={onChange("address")} />
            <InputField label="Parroquia" value={form.parish} onChange={onChange("parish")} />
            <InputField label="Canton" value={form.canton} onChange={onChange("canton")} />
            <InputField label="Provincia" value={form.province} onChange={onChange("province")} />
            <InputField label="GPS lat" value={form.gpsLat} onChange={onChange("gpsLat")} />
            <InputField label="GPS lng" value={form.gpsLng} onChange={onChange("gpsLng")} />
            <InputField label="Telefono principal" value={form.phonePrimary} onChange={onChange("phonePrimary")} />
            <InputField label="Telefono secundario" value={form.phoneSecondary} onChange={onChange("phoneSecondary")} />
            <InputField label="WhatsApp" value={form.whatsapp} onChange={onChange("whatsapp")} />
            <InputField label="Email" type="email" value={form.email} onChange={onChange("email")} />
            <InputField label="Contacto emergencia" value={form.emergencyName} onChange={onChange("emergencyName")} />
            <InputField label="Relacion" value={form.emergencyRelationship} onChange={onChange("emergencyRelationship")} />
            <InputField label="Telefono emergencia" value={form.emergencyPhone} onChange={onChange("emergencyPhone")} />
            <InputField label="Representante legal" value={form.legalRepresentative} onChange={onChange("legalRepresentative")} />
          </div>
        </Panel>

        <Panel title="3) Afiliacion y financiamiento" subtitle="Cobertura de seguro y condicion administrativa">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SelectField
              label="Tipo afiliacion"
              value={form.affiliationType}
              onChange={onChange("affiliationType")}
              options={[
                { value: "particular", label: "Particular" },
                { value: "IESS", label: "IESS" },
                { value: "ISSFA", label: "ISSFA" },
                { value: "ISSPOL", label: "ISSPOL" },
                { value: "privado", label: "Seguro privado" },
                { value: "otro", label: "Otro" },
              ]}
            />
            <InputField label="Numero IESS" value={form.iessNumber} onChange={onChange("iessNumber")} />
            <InputField label="Aseguradora privada" value={form.privateInsurer} onChange={onChange("privateInsurer")} />
            <InputField label="Poliza" value={form.privatePolicyNumber} onChange={onChange("privatePolicyNumber")} />
            <InputField label="Empresa empleadora" value={form.employer} onChange={onChange("employer")} />
            <InputField label="Copago/exoneracion" value={form.copayExemption} onChange={onChange("copayExemption")} />
            <InputField label="% discapacidad" value={form.disabilityPercent} onChange={onChange("disabilityPercent")} />
            <InputField label="Nro CONADIS" value={form.conadisNumber} onChange={onChange("conadisNumber")} />
          </div>
        </Panel>

        <Panel title="4) Antecedentes y alergias" subtitle="Base clinica para seguridad farmacologica y riesgo">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextAreaField
              label="Antecedentes patologicos (uno por linea)"
              value={form.personalPathological}
              onChange={onChange("personalPathological")}
            />
            <TextAreaField
              label="Antecedentes familiares"
              value={form.familyHistory}
              onChange={onChange("familyHistory")}
            />
            <TextAreaField label="Cirugias" value={form.surgeries} onChange={onChange("surgeries")} />
            <TextAreaField
              label="Hospitalizaciones previas"
              value={form.previousHospitalizations}
              onChange={onChange("previousHospitalizations")}
            />
            <TextAreaField
              label="Alergias medicamentosas"
              value={form.allergiesMedications}
              onChange={onChange("allergiesMedications")}
            />
            <TextAreaField
              label="Alergias alimentarias"
              value={form.allergiesFoods}
              onChange={onChange("allergiesFoods")}
            />
            <TextAreaField
              label="Alergias ambientales"
              value={form.allergiesEnvironmental}
              onChange={onChange("allergiesEnvironmental")}
            />
            <TextAreaField
              label="Alergias a contraste/latex"
              value={form.allergiesContrastLatex}
              onChange={onChange("allergiesContrastLatex")}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <InputField label="Tabaco" value={form.tobacco} onChange={onChange("tobacco")} />
            <InputField label="Alcohol" value={form.alcohol} onChange={onChange("alcohol")} />
            <InputField label="Drogas" value={form.drugs} onChange={onChange("drugs")} />
            <InputField
              label="Actividad fisica (min/sem)"
              value={form.physicalActivityMinutesPerWeek}
              onChange={onChange("physicalActivityMinutesPerWeek")}
            />
            <InputField label="Dieta" value={form.dietType} onChange={onChange("dietType")} />
            <InputField label="Sueno (horas)" value={form.sleepHours} onChange={onChange("sleepHours")} />
            <InputField
              label="Riesgo ocupacional"
              value={form.occupationalRiskExposure}
              onChange={onChange("occupationalRiskExposure")}
            />
          </div>
        </Panel>

        <Panel title="5) Consulta, examen fisico y diagnostico" subtitle="Nucleo de atencion medica estructurada">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SelectField
              label="Tipo consulta"
              value={form.consultationType}
              onChange={onChange("consultationType")}
              options={[
                { value: "primera_vez", label: "Primera vez" },
                { value: "subsecuente", label: "Subsecuente" },
                { value: "urgencia", label: "Urgencia" },
                { value: "teleconsulta", label: "Teleconsulta" },
              ]}
            />
            <InputField label="Motivo consulta *" value={form.literalReason} onChange={onChange("literalReason")} />
            <InputField label="Tiempo evolucion" value={form.evolutionTime} onChange={onChange("evolutionTime")} />
            <InputField label="Sintoma principal" value={form.mainSymptom} onChange={onChange("mainSymptom")} />
            <TextAreaField
              label="Enfermedad actual (cronologica)"
              value={form.currentIllnessNarrative}
              onChange={onChange("currentIllnessNarrative")}
            />
            <TextAreaField
              label="Tratamientos previos del episodio"
              value={form.previousEpisodeTreatments}
              onChange={onChange("previousEpisodeTreatments")}
            />
            <TextAreaField label="Rev. sistemas: General" value={form.reviewGeneral} onChange={onChange("reviewGeneral")} />
            <TextAreaField
              label="Rev. sistemas: Cardiovascular"
              value={form.reviewCardiovascular}
              onChange={onChange("reviewCardiovascular")}
            />
            <TextAreaField
              label="Rev. sistemas: Respiratorio"
              value={form.reviewRespiratory}
              onChange={onChange("reviewRespiratory")}
            />
            <TextAreaField
              label="Rev. sistemas: Digestivo"
              value={form.reviewDigestive}
              onChange={onChange("reviewDigestive")}
            />
            <TextAreaField
              label="Rev. sistemas: Genitourinario"
              value={form.reviewGenitourinary}
              onChange={onChange("reviewGenitourinary")}
            />
            <TextAreaField
              label="Rev. sistemas: Neurologico"
              value={form.reviewNeurologic}
              onChange={onChange("reviewNeurologic")}
            />
            <TextAreaField
              label="Rev. sistemas: Musculoesqueletico"
              value={form.reviewMusculoskeletal}
              onChange={onChange("reviewMusculoskeletal")}
            />
            <TextAreaField
              label="Rev. sistemas: Dermatologico"
              value={form.reviewDermatologic}
              onChange={onChange("reviewDermatologic")}
            />
            <TextAreaField
              label="Rev. sistemas: Psiquiatrico"
              value={form.reviewPsychiatric}
              onChange={onChange("reviewPsychiatric")}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <InputField label="PA" value={form.bloodPressure} onChange={onChange("bloodPressure")} />
            <InputField label="FC" value={form.heartRate} onChange={onChange("heartRate")} />
            <InputField label="FR" value={form.respiratoryRate} onChange={onChange("respiratoryRate")} />
            <InputField label="Temp" value={form.temperature} onChange={onChange("temperature")} />
            <InputField label="SpO2" value={form.spo2} onChange={onChange("spo2")} />
            <InputField label="Peso (kg)" value={form.weightKg} onChange={onChange("weightKg")} />
            <InputField label="Talla (cm)" value={form.heightCm} onChange={onChange("heightCm")} />
            <InputField label="Glucometria" value={form.capillaryGlucose} onChange={onChange("capillaryGlucose")} />
            <InputField label="Dolor (0-10)" value={form.painScale} onChange={onChange("painScale")} />
            <InputField label="Glasgow" value={form.glasgow} onChange={onChange("glasgow")} />
            <TextAreaField
              label="Aspecto general"
              value={form.generalAppearance}
              onChange={onChange("generalAppearance")}
            />
            <TextAreaField label="Piel y faneras" value={form.skin} onChange={onChange("skin")} />
            <TextAreaField label="Cabeza y cuello" value={form.headNeck} onChange={onChange("headNeck")} />
            <TextAreaField label="OONG" value={form.ent} onChange={onChange("ent")} />
            <TextAreaField label="Torax y pulmones" value={form.thoraxLungs} onChange={onChange("thoraxLungs")} />
            <TextAreaField
              label="Cardiovascular"
              value={form.cardiovascularExam}
              onChange={onChange("cardiovascularExam")}
            />
            <TextAreaField label="Abdomen" value={form.abdomen} onChange={onChange("abdomen")} />
            <TextAreaField label="Extremidades" value={form.extremities} onChange={onChange("extremities")} />
            <TextAreaField label="Neurologico" value={form.neurologicExam} onChange={onChange("neurologicExam")} />
            <TextAreaField
              label="Genitourinario"
              value={form.genitourinaryExam}
              onChange={onChange("genitourinaryExam")}
            />
            <TextAreaField label="Rectal" value={form.rectalExam} onChange={onChange("rectalExam")} />
            <TextAreaField label="Ginecologico" value={form.gynecoExam} onChange={onChange("gynecoExam")} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <InputField label="Codigo CIE-11" value={form.cie11Code} onChange={onChange("cie11Code")} />
            <InputField
              label="Descripcion diagnostico"
              value={form.diagnosisDescription}
              onChange={onChange("diagnosisDescription")}
            />
            <SelectField
              label="Tipo diagnostico"
              value={form.diagnosisType}
              onChange={onChange("diagnosisType")}
              options={[
                { value: "definitivo", label: "Definitivo" },
                { value: "presuntivo", label: "Presuntivo" },
                { value: "descartado", label: "Descartado" },
              ]}
            />
            <SelectField
              label="Condicion"
              value={form.diagnosisCondition}
              onChange={onChange("diagnosisCondition")}
              options={[
                { value: "principal", label: "Principal" },
                { value: "secundario", label: "Secundario" },
                { value: "complicacion", label: "Complicacion" },
              ]}
            />
            <CheckField
              label="Relacionado a embarazo"
              checked={form.pregnancyRelated}
              onChange={onChange("pregnancyRelated")}
            />
          </div>
        </Panel>

        <Panel title="6) Plan terapeutico y prescripcion inicial" subtitle="Indicaciones farmacologicas y no farmacologicas">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextAreaField
              label="Indicaciones no farmacologicas"
              value={form.nonPharmacological}
              onChange={onChange("nonPharmacological")}
            />
            <TextAreaField
              label="Seguimiento y proximo control"
              value={form.followUpInstructions}
              onChange={onChange("followUpInstructions")}
            />
            <TextAreaField
              label="Signos de alarma explicados"
              value={form.alarmSignsExplained}
              onChange={onChange("alarmSignsExplained")}
            />
            <TextAreaField
              label="Referencia a otro nivel"
              value={form.referralDestination}
              onChange={onChange("referralDestination")}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InputField
              label="DCI medicamento"
              value={form.prescriptionDci}
              onChange={onChange("prescriptionDci")}
            />
            <InputField label="Dosis" value={form.prescriptionDose} onChange={onChange("prescriptionDose")} />
            <InputField label="Via" value={form.prescriptionRoute} onChange={onChange("prescriptionRoute")} />
            <InputField
              label="Frecuencia"
              value={form.prescriptionFrequency}
              onChange={onChange("prescriptionFrequency")}
            />
            <InputField
              label="Duracion"
              value={form.prescriptionDuration}
              onChange={onChange("prescriptionDuration")}
            />
            <TextAreaField
              label="Instrucciones al paciente"
              value={form.prescriptionInstructions}
              onChange={onChange("prescriptionInstructions")}
            />
          </div>
        </Panel>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Registrar paciente"}
            </button>
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Limpiar formulario
            </button>
            {createdRecord ? (
              <Link
                href={`/portal/professional/patients/ingreso/${createdRecord.id}`}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Abrir ficha registrada
              </Link>
            ) : null}
          </div>
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
          {success ? <p className="mt-2 text-xs text-emerald-700">{success}</p> : null}
        </div>
      </form>

      <Panel title="Registros recientes" subtitle="Ultimos pacientes creados desde ingreso clinico">
        {latest.length === 0 ? (
          <p className="text-xs text-slate-500">No hay registros todavia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">HC</th>
                  <th className="px-3 py-2 font-semibold">Paciente</th>
                  <th className="px-3 py-2 font-semibold">Documento</th>
                  <th className="px-3 py-2 font-semibold">Motivo</th>
                  <th className="px-3 py-2 font-semibold">Diagnostico</th>
                  <th className="px-3 py-2 font-semibold">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latest.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">{item.medicalRecordNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{item.fullName}</td>
                    <td className="px-3 py-2 text-slate-700">{item.documentNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{item.consultationReason}</td>
                    <td className="px-3 py-2 text-slate-700">{item.principalDiagnosis}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/portal/professional/patients/ingreso/${item.id}`}
                        className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </ModulePage>
  );
}

function buildPayload(form: FormState) {
  return {
    source: form.source,
    identification: {
      documentType: form.documentType,
      documentNumber: form.documentNumber,
      firstNames: form.firstNames,
      lastNames: form.lastNames,
      birthDate: form.birthDate || null,
      sexBiological: form.sexBiological,
      gender: form.gender,
      nationality: form.nationality,
      ethnicity: form.ethnicity,
      civilStatus: form.civilStatus,
      educationLevel: form.educationLevel,
      occupation: form.occupation,
      workplace: form.workplace,
      religion: form.religion,
    },
    contact: {
      address: form.address,
      parish: form.parish,
      canton: form.canton,
      province: form.province,
      gpsLat: form.gpsLat,
      gpsLng: form.gpsLng,
      phonePrimary: form.phonePrimary,
      phoneSecondary: form.phoneSecondary,
      whatsapp: form.whatsapp,
      email: form.email,
      emergencyName: form.emergencyName,
      emergencyRelationship: form.emergencyRelationship,
      emergencyPhone: form.emergencyPhone,
      legalRepresentative: form.legalRepresentative,
    },
    financing: {
      affiliationType: form.affiliationType,
      iessNumber: form.iessNumber,
      privateInsurer: form.privateInsurer,
      privatePolicyNumber: form.privatePolicyNumber,
      employer: form.employer,
      copayExemption: form.copayExemption,
      disabilityPercent: form.disabilityPercent,
      conadisNumber: form.conadisNumber,
    },
    antecedentes: {
      personalPathological: splitMultiline(form.personalPathological),
      previousHospitalizations: splitMultiline(form.previousHospitalizations),
      surgeries: splitMultiline(form.surgeries),
      familyHistory: splitMultiline(form.familyHistory),
      lifestyle: {
        tobacco: form.tobacco,
        alcohol: form.alcohol,
        drugs: form.drugs,
        physicalActivityMinutesPerWeek: form.physicalActivityMinutesPerWeek,
        dietType: form.dietType,
        sleepHours: form.sleepHours,
        occupationalRiskExposure: form.occupationalRiskExposure,
      },
      allergies: {
        medications: splitMultiline(form.allergiesMedications),
        foods: splitMultiline(form.allergiesFoods),
        environmental: splitMultiline(form.allergiesEnvironmental),
        contrastOrLatex: splitMultiline(form.allergiesContrastLatex),
        visualAlertActive: Boolean(
          form.allergiesMedications.trim() ||
            form.allergiesFoods.trim() ||
            form.allergiesEnvironmental.trim() ||
            form.allergiesContrastLatex.trim()
        ),
      },
    },
    consultation: {
      consultationType: form.consultationType,
      literalReason: form.literalReason,
      evolutionTime: form.evolutionTime,
      mainSymptom: form.mainSymptom,
      currentIllnessNarrative: form.currentIllnessNarrative,
      previousEpisodeTreatments: form.previousEpisodeTreatments,
      reviewBySystems: {
        general: form.reviewGeneral,
        cardiovascular: form.reviewCardiovascular,
        respiratory: form.reviewRespiratory,
        digestive: form.reviewDigestive,
        genitourinary: form.reviewGenitourinary,
        neurologic: form.reviewNeurologic,
        musculoskeletal: form.reviewMusculoskeletal,
        dermatologic: form.reviewDermatologic,
        psychiatric: form.reviewPsychiatric,
      },
      physicalExam: {
        bloodPressure: form.bloodPressure,
        heartRate: form.heartRate,
        respiratoryRate: form.respiratoryRate,
        temperature: form.temperature,
        spo2: form.spo2,
        weightKg: form.weightKg,
        heightCm: form.heightCm,
        capillaryGlucose: form.capillaryGlucose,
        painScale: form.painScale,
        glasgow: form.glasgow,
        generalAppearance: form.generalAppearance,
        skin: form.skin,
        headNeck: form.headNeck,
        ent: form.ent,
        thoraxLungs: form.thoraxLungs,
        cardiovascular: form.cardiovascularExam,
        abdomen: form.abdomen,
        extremities: form.extremities,
        neurologic: form.neurologicExam,
        genitourinary: form.genitourinaryExam,
        rectal: form.rectalExam,
        gyneco: form.gynecoExam,
      },
    },
    diagnostics:
      form.cie11Code || form.diagnosisDescription
        ? [
            {
              cie11Code: form.cie11Code,
              description: form.diagnosisDescription,
              type: form.diagnosisType,
              condition: form.diagnosisCondition,
              pregnancyRelated: form.pregnancyRelated,
            },
          ]
        : [],
    therapeuticPlan: {
      linkedDiagnosisCodes: form.cie11Code ? [form.cie11Code] : [],
      nonPharmacological: form.nonPharmacological,
      followUpInstructions: form.followUpInstructions,
      alarmSignsExplained: form.alarmSignsExplained,
      referralDestination: form.referralDestination,
    },
    prescriptions:
      form.prescriptionDci || form.prescriptionDose
        ? [
            {
              dciName: form.prescriptionDci,
              dose: form.prescriptionDose,
              route: form.prescriptionRoute,
              frequency: form.prescriptionFrequency,
              duration: form.prescriptionDuration,
              patientInstructions: form.prescriptionInstructions,
            },
          ]
        : [],
    indicatorsContext: {
      administrative: form.bloodGroup ? `Grupo sanguineo: ${form.bloodGroup}` : "",
    },
    compliance: {
      twoFactorEnabled: true,
      autoLogout15m: true,
      immutableSignedNotes: true,
      informedConsentDigital: true,
      sensitiveDataConsent: true,
      backupEvery4h: true,
      disasterRecoveryValidated: true,
    },
  };
}

function normalizeCedula(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function splitMultiline(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toSummary(record: RegisteredPatientRecord): RegisteredPatientSummary {
  const primaryDiagnosis =
    record.diagnostics.find((diag) => diag.condition === "principal") ??
    record.diagnostics[0];

  return {
    id: record.id,
    medicalRecordNumber: record.medicalRecordNumber,
    createdAt: record.createdAt,
    source: record.source,
    fullName: `${record.identification.firstNames} ${record.identification.lastNames}`.trim(),
    documentNumber: record.identification.documentNumber,
    age: record.identification.age,
    consultationReason: record.consultation.literalReason || "Sin motivo registrado",
    principalDiagnosis: primaryDiagnosis?.description || "Sin diagnostico registrado",
  };
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-[11px] font-semibold text-slate-600">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-slate-300" />
      {label}
    </label>
  );
}
