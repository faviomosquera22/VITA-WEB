import {
  medicationCatalogBase,
  type MedicationCatalogItem,
} from "./medication-catalog";

export type MedicationKnowledgeStatus = "Fuente oficial" | "Pendiente validacion";

export type MedicationDoseRegimen = {
  id: string;
  label: string;
  population: "Adulto" | "Pediatrico";
  route: string;
  dose: string;
  frequency: string;
  formula: string;
  notes?: string;
  calculation?: {
    basis: "kg";
    amountPerKg: number;
    unit: string;
    roundTo?: number;
    maxDose?: number;
  };
};

export interface MedicationKnowledgeEntry {
  name: string;
  therapeuticGroup: string;
  pharmacologicClass: string;
  routeOptions: string[];
  highAlert: boolean;
  sourceStatus: MedicationKnowledgeStatus;
  presentations: string[];
  adultDoseGuide: string;
  pediatricDoseGuide?: string;
  formulaGuide: string;
  renalGuide?: string;
  dilutionGuide?: string;
  contraindicationNotes: string[];
  administrationTips: string[];
  regimens: MedicationDoseRegimen[];
  sources?: Array<{
    label: string;
    url: string;
  }>;
}

const curatedKnowledgeSeed: MedicationKnowledgeEntry[] = [
  {
    name: "Paracetamol",
    therapeuticGroup: "analgesicos",
    pharmacologicClass: "Analgesico / antipiretico",
    routeOptions: ["Oral", "IV", "Rectal"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["500 mg tableta", "120 mg/5 mL suspension", "1 g/100 mL infusion"],
    adultDoseGuide: "500-1000 mg cada 4-6 h. Maximo 4 g/dia.",
    pediatricDoseGuide: "10-15 mg/kg/dosis cada 4-6 h. Maximo 75 mg/kg/dia.",
    formulaGuide: "Pediatria: mg por dosis = peso (kg) x 10-15 mg.",
    renalGuide: "Ajustar intervalo en dano renal avanzado segun protocolo institucional.",
    contraindicationNotes: ["Precaucion en hepatopatia o uso cronico de alcohol."],
    administrationTips: [
      "Verificar total diario acumulado si existe combinacion con otros analgesicos.",
      "Registrar respuesta clinica y temperatura posterior a la administracion.",
    ],
    regimens: [
      {
        id: "paracetamol-adulto",
        label: "Dolor / fiebre adulto",
        population: "Adulto",
        route: "Oral",
        dose: "500-1000 mg",
        frequency: "Cada 6 h",
        formula: "Dosis fija segun intensidad del dolor. Maximo 4 g/dia.",
      },
      {
        id: "paracetamol-pediatrico",
        label: "Dolor / fiebre pediatrico",
        population: "Pediatrico",
        route: "Oral",
        dose: "10-15 mg/kg/dosis",
        frequency: "Cada 4-6 h",
        formula: "Peso (kg) x 10-15 mg por dosis.",
        calculation: {
          basis: "kg",
          amountPerKg: 15,
          unit: "mg",
          roundTo: 5,
        },
      },
    ],
    sources: [
      {
        label: "DailyMed - Acetaminophen injection",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a8c4f4dd-2b8b-42e6-bb24-7386e83262c1",
      },
    ],
  },
  {
    name: "Acido acetilsalicilico",
    therapeuticGroup: "cardiovasculares",
    pharmacologicClass: "Antiagregante plaquetario",
    routeOptions: ["Oral"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["100 mg tableta", "500 mg tableta"],
    adultDoseGuide: "Antiagregacion: 75-100 mg/dia. Carga: 160-325 mg segun escenario clinico.",
    formulaGuide: "No peso dependiente. Seleccionar pauta de carga o mantenimiento.",
    contraindicationNotes: [
      "Evitar en antecedente de sangrado activo o hipersensibilidad a AINE.",
      "Precaucion si existe terapia combinada con anticoagulantes.",
    ],
    administrationTips: [
      "Administrar preferentemente con alimentos si hay intolerancia gastrica.",
      "Confirmar si la indicacion es antiagregacion o analgesia antes de seleccionar la dosis.",
    ],
    regimens: [
      {
        id: "asa-antiplatelet",
        label: "Antiagregacion mantenimiento",
        population: "Adulto",
        route: "Oral",
        dose: "81-100 mg",
        frequency: "Cada 24 h",
        formula: "Dosis fija habitual para antiagregacion.",
      },
      {
        id: "asa-loading",
        label: "Carga en SCA",
        population: "Adulto",
        route: "Oral",
        dose: "160-325 mg",
        frequency: "Dosis unica",
        formula: "Dosis de carga segun protocolo institucional de sindrome coronario agudo.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Aspirin low dose",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7f6f6eb1-d74e-4f94-9f60-b9840fb4d5e4",
      },
    ],
  },
  {
    name: "Enoxaparina",
    therapeuticGroup: "cardiovasculares",
    pharmacologicClass: "Heparina de bajo peso molecular",
    routeOptions: ["SC"],
    highAlert: true,
    sourceStatus: "Fuente oficial",
    presentations: ["40 mg/0.4 mL jeringa", "60 mg/0.6 mL jeringa", "80 mg/0.8 mL jeringa"],
    adultDoseGuide: "Profilaxis: 40 mg SC cada 24 h. Tratamiento: 1 mg/kg SC cada 12 h.",
    formulaGuide: "Tratamiento: peso (kg) x 1 mg por dosis cada 12 h.",
    renalGuide: "Considerar ajuste o mayor vigilancia si ClCr <30 mL/min.",
    contraindicationNotes: [
      "Valorar sangrado activo, trombocitopenia y terapia dual/triple anticoagulante.",
    ],
    administrationTips: [
      "No expulsar la burbuja de aire de la jeringa precargada.",
      "Rotar sitio de inyeccion y documentar signos de hematoma.",
    ],
    regimens: [
      {
        id: "enoxa-profilaxis",
        label: "Profilaxis tromboembolica",
        population: "Adulto",
        route: "SC",
        dose: "40 mg",
        frequency: "Cada 24 h",
        formula: "Dosis fija estandar de profilaxis en adultos.",
      },
      {
        id: "enoxa-tratamiento",
        label: "Tratamiento anticoagulante",
        population: "Adulto",
        route: "SC",
        dose: "1 mg/kg/dosis",
        frequency: "Cada 12 h",
        formula: "Peso (kg) x 1 mg por dosis.",
        calculation: {
          basis: "kg",
          amountPerKg: 1,
          unit: "mg",
          roundTo: 1,
        },
      },
    ],
    sources: [
      {
        label: "DailyMed - Lovenox",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3786f7b4-58a8-4fca-9a03-0ae1515cbad1",
      },
    ],
  },
  {
    name: "Warfarina",
    therapeuticGroup: "cardiovasculares",
    pharmacologicClass: "Anticoagulante antagonista de vitamina K",
    routeOptions: ["Oral"],
    highAlert: true,
    sourceStatus: "Fuente oficial",
    presentations: ["5 mg tableta"],
    adultDoseGuide: "Inicio habitual: 2-5 mg/dia, con ajuste segun INR objetivo.",
    formulaGuide: "No automatizar dosis final sin INR basal y meta terapeutica documentada.",
    contraindicationNotes: [
      "Verificar sangrado activo, embarazo y combinaciones con AAS o heparinas.",
    ],
    administrationTips: [
      "Registrar INR basal antes de la primera dosis cuando sea posible.",
      "Documentar meta INR y plan de control a 48-72 h.",
    ],
    regimens: [
      {
        id: "warfarina-inicio",
        label: "Inicio estandar",
        population: "Adulto",
        route: "Oral",
        dose: "2-5 mg",
        frequency: "Cada 24 h",
        formula: "Dosis inicial segun INR basal, riesgo de sangrado y protocolo institucional.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Warfarin sodium",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4f39c0f5-9429-41f0-9c03-4ce1a4d7a8d7",
      },
    ],
  },
  {
    name: "Enalapril",
    therapeuticGroup: "cardiovasculares",
    pharmacologicClass: "IECA",
    routeOptions: ["Oral"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["10 mg tableta", "20 mg tableta"],
    adultDoseGuide: "5-20 mg VO cada 12-24 h segun objetivo terapeutico.",
    formulaGuide: "Dosis fija; titular segun PA, funcion renal y potasio.",
    renalGuide: "Vigilar creatinina y potasio luego del inicio o ajuste.",
    contraindicationNotes: [
      "Evitar en antecedente de angioedema relacionado a IECA.",
      "Precaucion en hiperpotasemia o estenosis bilateral de arterias renales.",
    ],
    administrationTips: [
      "Tomar PA antes de la administracion en pacientes inestables.",
      "Registrar tos, hipotension o deterioro renal.",
    ],
    regimens: [
      {
        id: "enalapril-hta",
        label: "HTA / insuficiencia cardiaca",
        population: "Adulto",
        route: "Oral",
        dose: "5-20 mg",
        frequency: "Cada 12-24 h",
        formula: "Titular segun PA, clase funcional y tolerancia clinica.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Enalapril maleate",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=cf8fe22f-f9a4-4ca6-8d65-fc0e9d347aec",
      },
    ],
  },
  {
    name: "Metformina",
    therapeuticGroup: "endocrinos",
    pharmacologicClass: "Biguanida",
    routeOptions: ["Oral"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["500 mg tableta", "850 mg tableta"],
    adultDoseGuide: "500-850 mg con alimentos cada 12 h. Titular segun tolerancia y control glucemico.",
    formulaGuide: "Dosis fija. No automatizar si existe deterioro renal significativo o uso reciente de contraste.",
    renalGuide: "Revisar eGFR antes de iniciar o escalar; suspender temporalmente si se usa contraste yodado segun protocolo.",
    contraindicationNotes: [
      "Evitar en acidosis metabolica o deterioro renal severo.",
    ],
    administrationTips: [
      "Administrar con alimentos para reducir intolerancia gastrointestinal.",
      "Registrar ultima glucosa capilar y funcion renal disponible.",
    ],
    regimens: [
      {
        id: "metformina-estandar",
        label: "DM2 mantenimiento",
        population: "Adulto",
        route: "Oral",
        dose: "500-850 mg",
        frequency: "Cada 12 h",
        formula: "Iniciar bajo y titular de forma progresiva segun control glucemico.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Metformin hydrochloride",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1486ab37-9990-4f85-8554-8d16541ff6b4",
      },
    ],
  },
  {
    name: "Insulina glargina",
    therapeuticGroup: "endocrinos",
    pharmacologicClass: "Insulina basal",
    routeOptions: ["SC"],
    highAlert: true,
    sourceStatus: "Fuente oficial",
    presentations: ["100 UI/mL lapiz", "100 UI/mL frasco"],
    adultDoseGuide: "Inicio frecuente: 0.2 UI/kg/dia SC una vez al dia, con ajuste segun glucemia.",
    formulaGuide: "UI por dia = peso (kg) x 0.2 UI/kg/dia como inicio orientativo.",
    contraindicationNotes: [
      "Verificar glucemia pre-dosis y disponibilidad de protocolo de hipoglucemia.",
    ],
    administrationTips: [
      "No mezclar con otras insulinas en la misma jeringa si se usa frasco.",
      "Registrar glucemia capilar y sitio de aplicacion.",
    ],
    regimens: [
      {
        id: "glargina-inicio",
        label: "Inicio basal adulto",
        population: "Adulto",
        route: "SC",
        dose: "0.2 UI/kg/dia",
        frequency: "Cada 24 h",
        formula: "Peso (kg) x 0.2 UI por dia.",
        calculation: {
          basis: "kg",
          amountPerKg: 0.2,
          unit: "UI",
          roundTo: 1,
        },
      },
    ],
    sources: [
      {
        label: "DailyMed - Lantus",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f7d7f0f9-cb58-4580-bc5d-5b4e694d2df3",
      },
    ],
  },
  {
    name: "Insulina regular",
    therapeuticGroup: "endocrinos",
    pharmacologicClass: "Insulina de accion corta",
    routeOptions: ["SC", "IV"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["100 UI/mL frasco", "100 UI/mL lapiz"],
    adultDoseGuide: "Usar esquema institucional de correccion o infusion IV en protocolos criticos.",
    formulaGuide: "Regimen comun: 0.05-0.1 UI/kg segun glucemia y protocolo institucional.",
    contraindicationNotes: [
      "No administrar sin glucemia reciente documentada.",
      "Tener protocolo de hipoglucemia disponible.",
    ],
    administrationTips: [
      "Verificar doble chequeo de dosis en farmacos de alto riesgo.",
      "Documentar glucemia pre y post dosis cuando aplique.",
    ],
    regimens: [
      {
        id: "regular-correccion",
        label: "Correccion basal inicial",
        population: "Adulto",
        route: "SC",
        dose: "0.05 UI/kg",
        frequency: "Segun protocolo",
        formula: "Peso (kg) x 0.05 UI como referencia inicial, sujeto a protocolo institucional.",
        calculation: {
          basis: "kg",
          amountPerKg: 0.05,
          unit: "UI",
          roundTo: 1,
        },
      },
    ],
  },
  {
    name: "Omeprazol",
    therapeuticGroup: "gastrointestinal",
    pharmacologicClass: "Inhibidor de bomba de protones",
    routeOptions: ["Oral", "IV"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["20 mg capsula", "40 mg vial"],
    adultDoseGuide: "20-40 mg cada 24 h segun indicacion clinica.",
    formulaGuide: "Dosis fija oral o IV; seleccionar presentacion segun tolerancia oral.",
    contraindicationNotes: ["Revisar si el paciente recibe clopidogrel o terapia cronica innecesaria."],
    administrationTips: [
      "Si es oral, preferir antes de alimentos.",
      "En uso IV, confirmar reconstitucion y velocidad institucional.",
    ],
    regimens: [
      {
        id: "omeprazol-oral",
        label: "Proteccion gastrica oral",
        population: "Adulto",
        route: "Oral",
        dose: "20-40 mg",
        frequency: "Cada 24 h",
        formula: "Dosis fija segun indicacion.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Omeprazole delayed-release",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2417f21e-2d0f-4a08-8d37-0f4a7f4f777f",
      },
    ],
  },
  {
    name: "Salbutamol",
    therapeuticGroup: "respiratorios",
    pharmacologicClass: "Broncodilatador beta agonista",
    routeOptions: ["Inhalada"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["100 mcg inhalador", "5 mg/mL nebulizacion"],
    adultDoseGuide: "Inhalador: 1-2 inhalaciones cada 4-6 h PRN. Nebulizacion: 2.5-5 mg por dosis.",
    pediatricDoseGuide: "Nebulizacion y MDI segun edad y protocolo respiratorio.",
    formulaGuide: "Seleccionar MDI o nebulizacion; no peso dependiente en adultos.",
    contraindicationNotes: ["Vigilar taquicardia, temblor y requerimiento repetido de rescate."],
    administrationTips: [
      "Registrar respuesta respiratoria y frecuencia cardiaca luego de la administracion.",
      "Si el paciente requiere multiples rescates, avisar para reevaluacion.",
    ],
    regimens: [
      {
        id: "salbutamol-mdi",
        label: "Rescate inhalador",
        population: "Adulto",
        route: "Inhalada",
        dose: "1-2 inhalaciones",
        frequency: "Cada 4-6 h PRN",
        formula: "Dosis fija por MDI segun sintomas y protocolo respiratorio.",
      },
      {
        id: "salbutamol-neb",
        label: "Nebulizacion",
        population: "Adulto",
        route: "Inhalada",
        dose: "2.5-5 mg",
        frequency: "Cada 4-6 h PRN",
        formula: "Dosis fija por nebulizacion segun intensidad del broncoespasmo.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Albuterol sulfate inhalation aerosol",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6c2afbb7-9d81-430d-8f3f-72d27b0f8a32",
      },
    ],
  },
  {
    name: "Ceftriaxona",
    therapeuticGroup: "antibioticos",
    pharmacologicClass: "Cefalosporina de tercera generacion",
    routeOptions: ["IV", "IM"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["1 g vial", "500 mg vial"],
    adultDoseGuide: "1-2 g cada 24 h; hasta 2 g cada 12-24 h segun gravedad y foco.",
    pediatricDoseGuide: "50-100 mg/kg/dia segun indicacion.",
    formulaGuide: "Seleccionar pauta fija adulto o peso dependiente en pediatria.",
    contraindicationNotes: [
      "Precaucion en alergia severa a betalactamicos.",
      "No mezclar con calcio en neonatos segun advertencias del fabricante.",
    ],
    administrationTips: [
      "Verificar dilucion, tiempo de infusion y compatibilidades.",
      "Documentar foco, cultivo y tiempo de primera dosis.",
    ],
    regimens: [
      {
        id: "ceftriaxona-adulto",
        label: "Infeccion adulto",
        population: "Adulto",
        route: "IV",
        dose: "1-2 g",
        frequency: "Cada 24 h",
        formula: "Dosis fija habitual en adulto; ajustar segun foco y gravedad.",
      },
      {
        id: "ceftriaxona-pediatria",
        label: "Infeccion pediatrica",
        population: "Pediatrico",
        route: "IV",
        dose: "50 mg/kg/dia",
        frequency: "Cada 24 h",
        formula: "Peso (kg) x 50 mg por dia como pauta frecuente.",
        calculation: {
          basis: "kg",
          amountPerKg: 50,
          unit: "mg",
          roundTo: 50,
        },
      },
    ],
    sources: [
      {
        label: "DailyMed - Ceftriaxone for injection",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9695277a-5f34-4b91-9701-854fe2251d73",
      },
    ],
  },
  {
    name: "Amoxicilina",
    therapeuticGroup: "antibioticos",
    pharmacologicClass: "Aminopenicilina",
    routeOptions: ["Oral"],
    highAlert: false,
    sourceStatus: "Fuente oficial",
    presentations: ["500 mg capsula", "250 mg/5 mL suspension"],
    adultDoseGuide: "500 mg cada 8 h o 875 mg cada 12 h segun foco.",
    pediatricDoseGuide: "25-45 mg/kg/dia repartidos cada 8-12 h segun indicacion.",
    formulaGuide: "No usar si existe alergia confirmada a penicilina sin validacion medica.",
    contraindicationNotes: [
      "Bloqueada en pacientes con anafilaxia a penicilina.",
    ],
    administrationTips: [
      "Registrar foco y dias planificados de tratamiento.",
      "Seleccionar suspension en pediatria o dificultad para deglucion.",
    ],
    regimens: [
      {
        id: "amoxi-adulto",
        label: "Infeccion adulto",
        population: "Adulto",
        route: "Oral",
        dose: "500 mg",
        frequency: "Cada 8 h",
        formula: "Dosis fija habitual en adulto segun foco.",
      },
      {
        id: "amoxi-pediatria",
        label: "Infeccion pediatrica",
        population: "Pediatrico",
        route: "Oral",
        dose: "25 mg/kg/dia",
        frequency: "Dividir cada 8 h",
        formula: "Peso (kg) x 25 mg por dia y dividir en 3 tomas.",
        calculation: {
          basis: "kg",
          amountPerKg: 25,
          unit: "mg/dia",
          roundTo: 25,
        },
      },
    ],
    sources: [
      {
        label: "DailyMed - Amoxicillin capsules",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=52c8444c-5f20-45c6-803a-58db31f9f84c",
      },
    ],
  },
  {
    name: "Nitroglicerina",
    therapeuticGroup: "cardiovasculares",
    pharmacologicClass: "Nitrato vasodilatador",
    routeOptions: ["Sublingual", "IV"],
    highAlert: true,
    sourceStatus: "Fuente oficial",
    presentations: ["0.5 mg tableta sublingual", "50 mg/10 mL infusion"],
    adultDoseGuide: "SL: 0.3-0.6 mg cada 5 min hasta 3 dosis. IV: titular segun protocolo hemodinamico.",
    formulaGuide: "No automatizar si el paciente tiene hipotension, uso reciente de inhibidores PDE5 o dolor no coronario.",
    contraindicationNotes: [
      "Evitar en hipotension, infarto de ventriculo derecho o uso reciente de sildenafil/tadalafil.",
    ],
    administrationTips: [
      "Registrar PA antes y despues de cada dosis sublingual.",
      "Si requiere infusion, manejar con bomba y protocolo institucional.",
    ],
    regimens: [
      {
        id: "nitro-sl",
        label: "Rescate sublingual",
        population: "Adulto",
        route: "Sublingual",
        dose: "0.3-0.6 mg",
        frequency: "Cada 5 min hasta 3 dosis",
        formula: "Pauta fija de rescate en dolor toracico segun protocolo.",
      },
    ],
    sources: [
      {
        label: "DailyMed - Nitroglycerin sublingual tablets",
        url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7c6d4ce5-8fbe-4c48-8df4-5372e1d8e8e4",
      },
    ],
  },
  {
    name: "Furosemida",
    therapeuticGroup: "cardiovasculares",
    pharmacologicClass: "Diuretico de asa",
    routeOptions: ["Oral", "IV"],
    highAlert: false,
    sourceStatus: "Pendiente validacion",
    presentations: ["40 mg tableta", "20 mg/2 mL ampolla"],
    adultDoseGuide: "20-40 mg VO/IV con titulacion segun diuresis y congestion.",
    formulaGuide: "No peso dependiente; valorar diuresis, PA, creatinina y potasio.",
    contraindicationNotes: ["Precaucion en hipovolemia, hipotension y alteraciones electroliticas."],
    administrationTips: [
      "Registrar diuresis, PA y balance hidrico luego de la dosis.",
      "Vigilar potasio y sodio en tratamientos repetidos.",
    ],
    regimens: [
      {
        id: "furosemida-iv",
        label: "Descongestion IV",
        population: "Adulto",
        route: "IV",
        dose: "20-40 mg",
        frequency: "Segun respuesta",
        formula: "Titular segun diuresis y contexto hemodinamico.",
      },
    ],
  },
  {
    name: "Ondansetron",
    therapeuticGroup: "gastrointestinal",
    pharmacologicClass: "Antiemetico antagonista 5-HT3",
    routeOptions: ["Oral", "IV"],
    highAlert: false,
    sourceStatus: "Pendiente validacion",
    presentations: ["8 mg tableta", "8 mg/4 mL ampolla"],
    adultDoseGuide: "4-8 mg cada 8 h.",
    formulaGuide: "Dosis fija; valorar QT y causa de emesis si uso repetido.",
    contraindicationNotes: ["Precaucion en prolongacion QT o combinacion con otros farmacos que la generen."],
    administrationTips: [
      "Documentar nausea/vomito y respuesta a la primera dosis.",
    ],
    regimens: [
      {
        id: "ondansetron-adulto",
        label: "Nausea / vomito",
        population: "Adulto",
        route: "IV",
        dose: "4-8 mg",
        frequency: "Cada 8 h",
        formula: "Dosis fija segun intensidad de sintomas.",
      },
    ],
  },
  {
    name: "Dexametasona",
    therapeuticGroup: "corticoides",
    pharmacologicClass: "Glucocorticoide",
    routeOptions: ["Oral", "IV", "IM"],
    highAlert: false,
    sourceStatus: "Pendiente validacion",
    presentations: ["4 mg tableta", "4 mg/mL ampolla"],
    adultDoseGuide: "4-8 mg cada 6-12 h segun indicacion.",
    formulaGuide: "Seleccionar pauta segun protocolo neurologico, respiratorio u oncologico.",
    contraindicationNotes: ["Vigilar hiperglucemia, inmunosupresion y necesidad real de duracion."],
    administrationTips: [
      "Registrar glucemia en pacientes diabeticos.",
      "Definir fecha de suspension o descenso si el uso no es de dosis unica.",
    ],
    regimens: [
      {
        id: "dexa-adulto",
        label: "Antiinflamatorio / edema",
        population: "Adulto",
        route: "IV",
        dose: "4-8 mg",
        frequency: "Cada 8-12 h",
        formula: "Dosis fija segun protocolo clinico aplicable.",
      },
    ],
  },
  {
    name: "Hidrocortisona",
    therapeuticGroup: "corticoides",
    pharmacologicClass: "Glucocorticoide",
    routeOptions: ["IV", "Topica"],
    highAlert: false,
    sourceStatus: "Pendiente validacion",
    presentations: ["100 mg vial", "1% crema"],
    adultDoseGuide: "100 mg IV cada 6-8 h en escenarios agudos frecuentes.",
    formulaGuide: "Pauta fija en adulto; confirmar escenario clinico antes de repetir dosis.",
    contraindicationNotes: ["Vigilar hiperglucemia y retencion de sodio."],
    administrationTips: [
      "Confirmar reconstitucion y via correcta.",
    ],
    regimens: [
      {
        id: "hidrocortisona-aguda",
        label: "Escenario agudo",
        population: "Adulto",
        route: "IV",
        dose: "100 mg",
        frequency: "Cada 8 h",
        formula: "Dosis fija segun protocolo del cuadro agudo.",
      },
    ],
  },
  {
    name: "Morfina",
    therapeuticGroup: "analgesicos",
    pharmacologicClass: "Opioide",
    routeOptions: ["IV", "Oral"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["10 mg/mL ampolla"],
    adultDoseGuide: "2-4 mg IV lenta cada 2-4 h PRN segun dolor y respuesta.",
    formulaGuide: "Titular segun EVA, edad, estado hemodinamico y depresion respiratoria.",
    contraindicationNotes: ["Vigilar FR, sedacion y riesgo de hipotension."],
    administrationTips: [
      "Revalorar dolor y FR posterior a la administracion.",
      "Tener naloxona disponible si se usa de forma repetida.",
    ],
    regimens: [
      {
        id: "morfina-bolo",
        label: "Dolor agudo IV",
        population: "Adulto",
        route: "IV",
        dose: "2-4 mg",
        frequency: "Cada 2-4 h PRN",
        formula: "Titular de forma progresiva segun respuesta y seguridad.",
      },
    ],
  },
  {
    name: "Tramadol",
    therapeuticGroup: "analgesicos",
    pharmacologicClass: "Analgesico opioide atipico",
    routeOptions: ["Oral", "IV", "IM"],
    highAlert: false,
    sourceStatus: "Pendiente validacion",
    presentations: ["50 mg capsula", "100 mg/2 mL ampolla"],
    adultDoseGuide: "50-100 mg cada 6-8 h. Maximo 400 mg/dia.",
    formulaGuide: "Dosis fija segun intensidad del dolor y riesgo de sedacion.",
    contraindicationNotes: ["Precaucion en epilepsia, serotonina y uso con otros depresores SNC."],
    administrationTips: ["Registrar sedacion y nausea en controles posteriores."],
    regimens: [
      {
        id: "tramadol-adulto",
        label: "Dolor moderado",
        population: "Adulto",
        route: "Oral",
        dose: "50-100 mg",
        frequency: "Cada 8 h",
        formula: "Dosis fija hasta maximo diario segun tolerancia.",
      },
    ],
  },
  {
    name: "Diazepam",
    therapeuticGroup: "neurologicos",
    pharmacologicClass: "Benzodiacepina",
    routeOptions: ["Oral", "IV"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["10 mg tableta", "10 mg/2 mL ampolla"],
    adultDoseGuide: "5-10 mg VO/IV segun escenario clinico.",
    formulaGuide: "No automatizar en pacientes con riesgo de depresion respiratoria o delirium.",
    contraindicationNotes: ["Vigilar estado de conciencia y FR."],
    administrationTips: ["Evitar bolo rapido IV. Confirmar indicacion y objetivo clinico."],
    regimens: [
      {
        id: "diazepam-crisis",
        label: "Sedacion / convulsion",
        population: "Adulto",
        route: "IV",
        dose: "5-10 mg",
        frequency: "Dosis unica o segun protocolo",
        formula: "Dosis fija segun protocolo neurologico.",
      },
    ],
  },
  {
    name: "Lorazepam",
    therapeuticGroup: "neurologicos",
    pharmacologicClass: "Benzodiacepina",
    routeOptions: ["Oral", "IV"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["2 mg tableta", "4 mg/mL ampolla"],
    adultDoseGuide: "1-2 mg VO/IV segun sedacion, ansiedad o convulsion.",
    formulaGuide: "Titular segun respuesta clinica y seguridad respiratoria.",
    contraindicationNotes: ["Vigilar sedacion excesiva y necesidad de soporte de via aerea."],
    administrationTips: ["Registrar Glasgow, FR y respuesta luego de la dosis."],
    regimens: [
      {
        id: "lorazepam-agudo",
        label: "Ansiedad / sedacion aguda",
        population: "Adulto",
        route: "IV",
        dose: "1-2 mg",
        frequency: "Cada 6-8 h PRN",
        formula: "Dosis fija segun indicacion.",
      },
    ],
  },
  {
    name: "Meropenem",
    therapeuticGroup: "antibioticos",
    pharmacologicClass: "Carbapenemico",
    routeOptions: ["IV"],
    highAlert: false,
    sourceStatus: "Pendiente validacion",
    presentations: ["1 g vial"],
    adultDoseGuide: "1 g IV cada 8 h segun foco y gravedad.",
    formulaGuide: "Confirmar ajuste renal y cultivos antes de mantener.",
    contraindicationNotes: ["Precaucion en alergia severa a betalactamicos."],
    administrationTips: [
      "Registrar hora de primera dosis y tiempo de infusion.",
      "Revisar cultivos y desescalamiento cuando existan resultados.",
    ],
    regimens: [
      {
        id: "meropenem-adulto",
        label: "Infeccion grave",
        population: "Adulto",
        route: "IV",
        dose: "1 g",
        frequency: "Cada 8 h",
        formula: "Dosis fija adulto segun gravedad y foco.",
      },
    ],
  },
  {
    name: "Vancomicina",
    therapeuticGroup: "antibioticos",
    pharmacologicClass: "Glicopeptido",
    routeOptions: ["IV"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["500 mg vial"],
    adultDoseGuide: "15-20 mg/kg/dosis cada 8-12 h con monitoreo de niveles segun protocolo.",
    formulaGuide: "Peso (kg) x 15 mg por dosis como referencia inicial en adulto.",
    renalGuide: "Ajustar segun funcion renal y niveles.",
    contraindicationNotes: ["No administrar sin confirmar plan de infusion y control renal."],
    administrationTips: [
      "Infundir segun velocidad institucional para reducir sindrome del hombre rojo.",
      "Programar creatinina y niveles cuando corresponda.",
    ],
    regimens: [
      {
        id: "vancomicina-adulto",
        label: "Inicio adulto",
        population: "Adulto",
        route: "IV",
        dose: "15 mg/kg/dosis",
        frequency: "Cada 12 h",
        formula: "Peso (kg) x 15 mg por dosis.",
        calculation: {
          basis: "kg",
          amountPerKg: 15,
          unit: "mg",
          roundTo: 250,
        },
      },
    ],
  },
  {
    name: "Epinefrina",
    therapeuticGroup: "emergencias",
    pharmacologicClass: "Vasopresor / agonista adrenergico",
    routeOptions: ["IM", "IV"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["1 mg/mL ampolla", "0.3 mg autoinyector"],
    adultDoseGuide: "Anafilaxia IM: 0.3-0.5 mg. Pediatria: 0.01 mg/kg IM, max 0.5 mg.",
    formulaGuide: "Pediatria: peso (kg) x 0.01 mg IM por dosis.",
    contraindicationNotes: ["Uso de emergencia. Confirmar concentracion antes de administrar."],
    administrationTips: [
      "Doble chequeo obligatorio de concentracion y via.",
      "Registrar PA, FC y respuesta luego de la dosis.",
    ],
    regimens: [
      {
        id: "epi-anafilaxia-adulto",
        label: "Anafilaxia adulto",
        population: "Adulto",
        route: "IM",
        dose: "0.3-0.5 mg",
        frequency: "Repetir segun protocolo",
        formula: "Dosis fija de emergencia en adulto.",
      },
      {
        id: "epi-anafilaxia-pediatrica",
        label: "Anafilaxia pediatrica",
        population: "Pediatrico",
        route: "IM",
        dose: "0.01 mg/kg",
        frequency: "Repetir segun protocolo",
        formula: "Peso (kg) x 0.01 mg por dosis. Maximo 0.5 mg.",
        calculation: {
          basis: "kg",
          amountPerKg: 0.01,
          unit: "mg",
          roundTo: 0.01,
          maxDose: 0.5,
        },
      },
    ],
  },
  {
    name: "Norepinefrina",
    therapeuticGroup: "emergencias",
    pharmacologicClass: "Vasopresor",
    routeOptions: ["IV"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["4 mg/4 mL ampolla"],
    adultDoseGuide: "Iniciar y titular con bomba de infusion segun PAM objetivo.",
    formulaGuide: "Infusion titulada segun protocolo hemodinamico. No emitir dosis fija sin bomba y vigilancia.",
    contraindicationNotes: ["Manejo exclusivo con monitorizacion continua y control de extravasacion."],
    administrationTips: [
      "Preferir via central o extremar vigilancia si es periferica.",
      "Registrar PAM, FC y sitio de infusion.",
    ],
    regimens: [
      {
        id: "norepi-infusion",
        label: "Shock / hipotension",
        population: "Adulto",
        route: "IV",
        dose: "0.05-1 mcg/kg/min",
        frequency: "Infusion continua",
        formula: "Titular en bomba segun PAM objetivo y protocolo institucional.",
      },
    ],
  },
  {
    name: "Cloruro de potasio",
    therapeuticGroup: "emergencias",
    pharmacologicClass: "Reposicion electrolitica",
    routeOptions: ["IV", "Oral"],
    highAlert: true,
    sourceStatus: "Pendiente validacion",
    presentations: ["2 mEq/mL ampolla"],
    adultDoseGuide: "Reposicion segun potasio y velocidad maxima institucional.",
    formulaGuide: "No administrar IV sin dilucion, bomba y vigilancia ECG cuando aplique.",
    contraindicationNotes: ["Bloqueo operativo hasta documentar potasio actual, dilucion y velocidad."],
    administrationTips: [
      "Doble chequeo obligatorio por ser farmaco de alto riesgo.",
      "Registrar dilucion, via y velocidad.",
    ],
    regimens: [
      {
        id: "kcl-infusion",
        label: "Reposicion IV",
        population: "Adulto",
        route: "IV",
        dose: "10-20 mEq/h",
        frequency: "Infusion",
        formula: "Usar velocidad maxima institucional y monitorizacion.",
      },
    ],
  },
];

const curatedKnowledgeIndex = new Map(
  curatedKnowledgeSeed.map((entry) => [normalizeName(entry.name), entry])
);

const medicationAliases = new Map<string, string>([
  ["aas", "Acido acetilsalicilico"],
  ["asa", "Acido acetilsalicilico"],
  ["insulina glargina 100 ui/ml", "Insulina glargina"],
  ["insulina regular 100 ui/ml", "Insulina regular"],
]);

export const medicationKnowledgeBase: MedicationKnowledgeEntry[] = medicationCatalogBase.map(
  (item) => curatedKnowledgeIndex.get(normalizeName(item.name)) ?? createFallbackKnowledgeEntry(item)
);

export const medicationKnowledgeByName = new Map(
  medicationKnowledgeBase.map((entry) => [normalizeName(entry.name), entry])
);

export const medicationKnowledgeGroups = Array.from(
  new Set(medicationKnowledgeBase.map((entry) => entry.therapeuticGroup))
).sort((a, b) => a.localeCompare(b));

export function resolveMedicationKnowledgeEntry(name: string) {
  const normalized = normalizeName(name);
  const alias = medicationAliases.get(normalized);
  return medicationKnowledgeByName.get(normalized) ?? (alias ? medicationKnowledgeByName.get(normalizeName(alias)) : undefined);
}

function createFallbackKnowledgeEntry(item: MedicationCatalogItem): MedicationKnowledgeEntry {
  const routeOptions = inferRoutes(item.presentations);

  return {
    name: item.name,
    therapeuticGroup: item.therapeuticGroup,
    pharmacologicClass: titleCase(item.therapeuticGroup),
    routeOptions,
    highAlert: isHighAlertMedication(item.name),
    sourceStatus: "Pendiente validacion",
    presentations: item.presentations,
    adultDoseGuide: "Consultar ficha tecnica, protocolo institucional o validacion farmaceutica antes de emitir dosis.",
    formulaGuide: "El sistema tiene presentaciones y vias, pero no una formula automatica validada para este farmaco.",
    contraindicationNotes: inferContraindicationNotes(item.name),
    administrationTips: [
      "Confirmar indicacion clinica, via, horario y duracion antes de registrar la orden.",
      "Verificar alergias y compatibilidad con el perfil activo del paciente.",
    ],
    regimens: item.presentations.slice(0, 3).map((presentation, index) => ({
      id: `${slugify(item.name)}-${index + 1}`,
      label: presentation,
      population: "Adulto",
      route: routeOptions[0] ?? "Oral",
      dose: presentation,
      frequency: "Definir segun protocolo",
      formula: "Sin formula automatica validada en el sistema para este farmaco.",
    })),
  };
}

function inferRoutes(presentations: string[]) {
  const routes = new Set<string>();

  presentations.forEach((presentation) => {
    const value = normalizeName(presentation);

    if (
      value.includes("tableta") ||
      value.includes("capsula") ||
      value.includes("jarabe") ||
      value.includes("suspension") ||
      value.includes("sobre") ||
      value.includes("solucion oral")
    ) {
      routes.add("Oral");
    }
    if (value.includes("ampolla") || value.includes("vial") || value.includes("infusion") || value.includes("bolsa")) {
      routes.add("IV");
    }
    if (value.includes("jeringa")) {
      routes.add("SC");
    }
    if (value.includes("parche")) {
      routes.add("Topica");
    }
    if (value.includes("crema") || value.includes("gel") || value.includes("ungueento") || value.includes("solucion")) {
      routes.add("Topica");
    }
    if (value.includes("inhalador") || value.includes("nebulizacion") || value.includes("capsula inhalatoria")) {
      routes.add("Inhalada");
    }
    if (value.includes("spray nasal")) {
      routes.add("Intranasal");
    }
    if (value.includes("gotas oftalmicas")) {
      routes.add("Oftalmica");
    }
    if (value.includes("ovulo") || value.includes("vaginal")) {
      routes.add("Vaginal");
    }
    if (value.includes("supositorio")) {
      routes.add("Rectal");
    }
    if (value.includes("sublingual")) {
      routes.add("Sublingual");
    }
  });

  return Array.from(routes);
}

function inferContraindicationNotes(name: string) {
  const normalized = normalizeName(name);

  if (normalized.includes("amoxicilina") || normalized.includes("ampicilina") || normalized.includes("penicilina")) {
    return ["Verificar alergia a penicilina o betalactamicos antes de prescribir o administrar."];
  }

  if (
    normalized.includes("ibuprofeno") ||
    normalized.includes("naproxeno") ||
    normalized.includes("diclofenaco") ||
    normalized.includes("ketorolaco") ||
    normalized.includes("meloxicam")
  ) {
    return ["Confirmar antecedente de alergia a AINE, sangrado digestivo y funcion renal."];
  }

  if (isHighAlertMedication(name)) {
    return ["Medicamento de alto riesgo: requiere doble chequeo de dosis, via y paciente correcto."];
  }

  return ["Verificar alergias, duplicidad terapeutica e interacciones antes de emitir la orden."];
}

function isHighAlertMedication(name: string) {
  const normalized = normalizeName(name);
  return [
    "insulina",
    "warfarina",
    "enoxaparina",
    "heparina",
    "morfina",
    "fentanilo",
    "epinefrina",
    "norepinefrina",
    "dopamina",
    "dobutamina",
    "nitroprusiato",
    "cloruro de potasio",
    "vancomicina",
    "diazepam",
    "lorazepam",
    "midazolam",
  ].some((token) => normalized.includes(token));
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value: string) {
  return normalizeName(value).replace(/[^a-z0-9]+/g, "-");
}

function titleCase(value: string) {
  return value
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}
