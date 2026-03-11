import type { TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateBaseTriageRules(input: TriageInput): TriageRuleResult | null {
  const reasons: string[] = [];
  const alerts: string[] = [];
  const immediateActions: string[] = [];

  if (input.criticalFindings.airwayCompromise) {
    reasons.push("Compromiso de via aerea detectado en hallazgos criticos.");
    alerts.push("Via aerea en riesgo");
    immediateActions.push("Asegurar via aerea y activar respuesta de emergencia.");
  }

  if (input.criticalFindings.severeRespiratoryDistress) {
    reasons.push("Disnea severa o trabajo respiratorio aumentado.");
    alerts.push("Compromiso respiratorio");
    immediateActions.push("Oxigenoterapia y monitorizacion continua.");
  }

  if (input.criticalFindings.activeUncontrolledBleeding) {
    reasons.push("Sangrado activo no controlado.");
    alerts.push("Hemorragia activa");
    immediateActions.push("Compresion inmediata y control de hemorragia.");
  }

  if (input.criticalFindings.shockSigns) {
    reasons.push("Signos clinicos de choque.");
    alerts.push("Inestabilidad hemodinamica");
    immediateActions.push("Acceso venoso, fluidos y traslado a area critica.");
  }

  if (input.criticalFindings.seizureActive) {
    reasons.push("Crisis convulsiva activa reportada.");
    alerts.push("Convulsion activa");
    immediateActions.push("Proteger via aerea, controlar convulsion y glucemia.");
  }

  if (input.criticalFindings.anaphylaxis) {
    reasons.push("Sospecha de anafilaxia.");
    alerts.push("Riesgo de anafilaxia");
    immediateActions.push("Administrar manejo de anafilaxia segun protocolo.");
  }

  if (input.criticalFindings.alteredConsciousness || input.criticalFindings.focalNeurologicDeficit) {
    reasons.push("Compromiso neurologico agudo detectado.");
    alerts.push("Alerta neurologica");
    immediateActions.push("Evaluar Glasgow y activar codigo neurologico.");
  }

  if (reasons.length > 0) {
    return {
      source: "base",
      priority: 1,
      reasons,
      alerts,
      immediateActions,
    };
  }

  const reason = `${input.complaint.reason} ${input.complaint.discriminator} ${input.complaint.discriminatorTags.join(" ")}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (reason.includes("dolor toracico") || reason.includes("disnea") || reason.includes("accidente")) {
    return {
      source: "base",
      priority: 2,
      reasons: ["Discriminador principal de alto riesgo en nucleo general."],
      alerts: ["Valoracion medica prioritaria"],
      immediateActions: ["Ubicar al paciente en zona de observacion prioritaria."],
    };
  }

  if (reason.includes("fiebre") || reason.includes("vomito") || reason.includes("dolor")) {
    return {
      source: "base",
      priority: 3,
      reasons: ["Discriminador clinico con necesidad de atencion en corto plazo."],
      alerts: [],
      immediateActions: ["Iniciar monitorizacion basica y reevaluacion periodica."],
    };
  }

  return null;
}
