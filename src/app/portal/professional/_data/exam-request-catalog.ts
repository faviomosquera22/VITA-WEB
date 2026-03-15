import type { ExamRecord } from "./clinical-mock-data";

export type ExamRequestPriority = "rutina" | "urgente" | "critico";

export type ExamCatalogOption = {
  id: string;
  name: string;
  category: ExamRecord["category"];
  group: string;
  defaultPriority: ExamRequestPriority;
};

export type ExamRequestProfile = {
  id: string;
  label: string;
  optionIds: string[];
};

export const examRequestCatalog: ExamCatalogOption[] = [
  { id: "troponina_i", name: "Troponina I", category: "Laboratorio", group: "Cardiaco urgente", defaultPriority: "critico" },
  { id: "troponina_t", name: "Troponina T", category: "Laboratorio", group: "Cardiaco urgente", defaultPriority: "critico" },
  { id: "ck_mb", name: "CK-MB", category: "Laboratorio", group: "Cardiaco urgente", defaultPriority: "urgente" },
  { id: "bnp", name: "BNP", category: "Laboratorio", group: "Cardiaco urgente", defaultPriority: "urgente" },
  { id: "mioglobina", name: "Mioglobina", category: "Laboratorio", group: "Cardiaco urgente", defaultPriority: "urgente" },
  { id: "ecg_12", name: "ECG 12 derivaciones", category: "Electrocardiograma", group: "Cardiaco urgente", defaultPriority: "critico" },
  { id: "ecg_seriado", name: "ECG seriado", category: "Electrocardiograma", group: "Cardiaco urgente", defaultPriority: "critico" },
  { id: "holter_24h", name: "Holter 24 horas", category: "Otro", group: "Cardiaco urgente", defaultPriority: "rutina" },
  { id: "hemograma", name: "Hemograma completo", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "biometria", name: "Biometria hematica", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "glucosa", name: "Glucosa", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "urea", name: "Urea", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "rutina" },
  { id: "creatinina", name: "Creatinina", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "sodio", name: "Sodio", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "potasio", name: "Potasio", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "cloro", name: "Cloro", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "rutina" },
  { id: "calcio", name: "Calcio", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "rutina" },
  { id: "magnesio", name: "Magnesio", category: "Laboratorio", group: "Laboratorio general", defaultPriority: "urgente" },
  { id: "gasometria_arterial", name: "Gasometria arterial", category: "Laboratorio", group: "Respiratorio y gases", defaultPriority: "critico" },
  { id: "gasometria_venosa", name: "Gasometria venosa", category: "Laboratorio", group: "Respiratorio y gases", defaultPriority: "urgente" },
  { id: "tp_ttp_inr", name: "TP / TTP / INR", category: "Laboratorio", group: "Coagulacion", defaultPriority: "urgente" },
  { id: "fibrinogeno", name: "Fibrinogeno", category: "Laboratorio", group: "Coagulacion", defaultPriority: "urgente" },
  { id: "dimero_d", name: "Dimero D", category: "Laboratorio", group: "Coagulacion", defaultPriority: "urgente" },
  { id: "lactato", name: "Lactato", category: "Laboratorio", group: "Coagulacion", defaultPriority: "urgente" },
  { id: "hba1c", name: "Hemoglobina glicosilada", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "perfil_hepatico", name: "Perfil hepatico", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "ast_tgo", name: "AST / TGO", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "alt_tgp", name: "ALT / TGP", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "bilirrubina", name: "Bilirrubina total y directa", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "fosfatasa", name: "Fosfatasa alcalina", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "perfil_lipidico", name: "Perfil lipidico", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "rutina" },
  { id: "amilasa", name: "Amilasa", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "urgente" },
  { id: "lipasa", name: "Lipasa", category: "Laboratorio", group: "Metabolico y endocrino", defaultPriority: "urgente" },
  { id: "pcr", name: "Proteina C reactiva", category: "Laboratorio", group: "Infeccioso", defaultPriority: "urgente" },
  { id: "procalcitonina", name: "Procalcitonina", category: "Laboratorio", group: "Infeccioso", defaultPriority: "urgente" },
  { id: "hemocultivo", name: "Hemocultivo", category: "Microbiologia", group: "Infeccioso", defaultPriority: "urgente" },
  { id: "urocultivo", name: "Urocultivo", category: "Microbiologia", group: "Infeccioso", defaultPriority: "rutina" },
  { id: "orina", name: "Examen general de orina", category: "Laboratorio", group: "Infeccioso", defaultPriority: "rutina" },
  { id: "coprocultivo", name: "Coprocultivo", category: "Microbiologia", group: "Infeccioso", defaultPriority: "rutina" },
  { id: "baciloscopia", name: "Baciloscopia", category: "Microbiologia", group: "Infeccioso", defaultPriority: "rutina" },
  { id: "panel_respiratorio", name: "Panel respiratorio viral", category: "Prueba rapida", group: "Infeccioso", defaultPriority: "urgente" },
  { id: "covid_flu", name: "Prueba rapida COVID / Influenza", category: "Prueba rapida", group: "Infeccioso", defaultPriority: "urgente" },
  { id: "rx_torax", name: "Radiografia de torax", category: "Imagenologia", group: "Imagenologia", defaultPriority: "urgente" },
  { id: "eco_abdomen", name: "Ecografia abdominal", category: "Imagenologia", group: "Imagenologia", defaultPriority: "rutina" },
  { id: "tac_craneo", name: "TAC de craneo", category: "Imagenologia", group: "Imagenologia", defaultPriority: "urgente" },
  { id: "tac_torax", name: "TAC de torax", category: "Imagenologia", group: "Imagenologia", defaultPriority: "urgente" },
  { id: "tac_abdomen", name: "TAC abdominal", category: "Imagenologia", group: "Imagenologia", defaultPriority: "urgente" },
  { id: "eco_corazon", name: "Ecocardiograma", category: "Imagenologia", group: "Imagenologia", defaultPriority: "rutina" },
  { id: "doppler_venoso", name: "Doppler venoso", category: "Imagenologia", group: "Imagenologia", defaultPriority: "urgente" },
  { id: "rm_simple", name: "Resonancia magnetica simple", category: "Imagenologia", group: "Imagenologia", defaultPriority: "rutina" },
];

export const examRequestProfiles: ExamRequestProfile[] = [
  { id: "cardiaco", label: "Perfil cardiaco", optionIds: ["troponina_i", "troponina_t", "ck_mb", "bnp", "ecg_12"] },
  { id: "metabolico", label: "Perfil metabolico", optionIds: ["glucosa", "urea", "creatinina", "sodio", "potasio", "cloro"] },
  { id: "infeccioso", label: "Perfil infeccioso", optionIds: ["hemograma", "pcr", "procalcitonina", "hemocultivo", "orina"] },
  { id: "renal_electrolitico", label: "Perfil renal-electrolitico", optionIds: ["urea", "creatinina", "sodio", "potasio", "magnesio", "calcio"] },
  { id: "coagulacion", label: "Perfil de coagulacion", optionIds: ["tp_ttp_inr", "fibrinogeno", "dimero_d", "lactato"] },
  { id: "abdomen_agudo", label: "Perfil abdomen agudo", optionIds: ["hemograma", "amilasa", "lipasa", "eco_abdomen", "tac_abdomen"] },
];
