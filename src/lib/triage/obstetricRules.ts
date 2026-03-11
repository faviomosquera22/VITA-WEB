import type { TriageConfig, TriageInput, TriageRuleResult } from "./triageTypes";

export function evaluateObstetricRules(
  input: TriageInput,
  config: TriageConfig
): TriageRuleResult | null {
  const obstetric = input.protocolInputs.obstetrico;
  const vitals = input.vitals;
  const isObstetricContext =
    input.identification.possiblePregnancy ||
    (obstetric.gestationalWeeks !== null && obstetric.gestationalWeeks > 0);

  if (!isObstetricContext) {
    return null;
  }

  const reasons: string[] = [];
  const alerts: string[] = [];
  const actions: string[] = [];

  const severeBp =
    (vitals.systolicBp !== null && vitals.systolicBp >= config.obstetric.severeSystolicBp) ||
    (vitals.diastolicBp !== null && vitals.diastolicBp >= config.obstetric.severeDiastolicBp) ||
    obstetric.severeHypertension;

  if (obstetric.postpartumHemorrhage || (obstetric.vaginalBleeding && obstetric.severeAbdominalPain)) {
    reasons.push("Hemorragia obstetrica o sangrado con dolor severo.");
    alerts.push("Emergencia obstetrica");
    actions.push("Activar ruta obstetrica de emergencia inmediata.");
  }

  if (severeBp) {
    reasons.push("Cifras tensionales severas en contexto obstetrico.");
    alerts.push("Riesgo de preeclampsia/eclampsia");
    actions.push("Iniciar manejo de hipertension severa segun MSP.");
  }

  if (reasons.length > 0) {
    return {
      source: "obstetric",
      priority: 1,
      reasons,
      alerts,
      immediateActions: actions,
      activatedProtocols: ["obstetrico"],
    };
  }

  const moderateReasons: string[] = [];
  if (obstetric.contractions && (obstetric.gestationalWeeks ?? 0) < 37) {
    moderateReasons.push("Contracciones con probable amenaza de parto pretermino.");
  }
  if (obstetric.decreasedFetalMovements) {
    moderateReasons.push("Disminucion de movimientos fetales referida.");
  }

  if (moderateReasons.length > 0) {
    return {
      source: "obstetric",
      priority: 2,
      reasons: moderateReasons,
      alerts: ["Valoracion obstetrica prioritaria"],
      immediateActions: ["Monitorizacion materno-fetal y valoracion por gineco-obstetricia."],
      activatedProtocols: ["obstetrico"],
    };
  }

  return {
    source: "obstetric",
    priority: 3,
    reasons: ["Contexto obstetrico activo sin criterios inmediatos de inestabilidad."],
    alerts: [],
    immediateActions: ["Mantener seguimiento obstetrico y reevaluacion continua."],
    activatedProtocols: ["obstetrico"],
  };
}
