"use client";

import type { SubprotocolType } from "@/lib/triage/triageTypes";

import BurnProtocol from "../subprotocols/BurnProtocol";
import IntoxicationProtocol from "../subprotocols/IntoxicationProtocol";
import MentalHealthProtocol from "../subprotocols/MentalHealthProtocol";
import ObstetricProtocol from "../subprotocols/ObstetricProtocol";
import SexualViolenceProtocol from "../subprotocols/SexualViolenceProtocol";
import TraumaProtocol from "../subprotocols/TraumaProtocol";

interface Step6SubprotocolsProps {
  activeSubprotocols: SubprotocolType[];
}

export default function Step6Subprotocols({ activeSubprotocols }: Step6SubprotocolsProps) {
  if (activeSubprotocols.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-slate-900">Paso F. Subprotocolos</h2>
        <p className="text-sm text-slate-600">No hay subprotocolos activados para este caso.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-slate-900">Paso F. Subprotocolos activados</h2>
        <p className="text-sm text-slate-600">
          Completa solo los subprotocolos detectados automaticamente por motivo/hallazgos.
        </p>
      </header>

      <div className="space-y-4">
        {activeSubprotocols.includes("SEXUAL_VIOLENCE") ? <SexualViolenceProtocol /> : null}
        {activeSubprotocols.includes("TRAUMA") ? <TraumaProtocol /> : null}
        {activeSubprotocols.includes("BURNS") ? <BurnProtocol /> : null}
        {activeSubprotocols.includes("OBSTETRIC") ? <ObstetricProtocol /> : null}
        {activeSubprotocols.includes("INTOXICATION") ? <IntoxicationProtocol /> : null}
        {activeSubprotocols.includes("MENTAL_HEALTH") ? <MentalHealthProtocol /> : null}
      </div>
    </section>
  );
}
