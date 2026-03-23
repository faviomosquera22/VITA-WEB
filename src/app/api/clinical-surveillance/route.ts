import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import {
  getClinicalSurveillanceAiProvider,
  getClinicalSurveillanceNarrativeAdapter,
  isClinicalSurveillanceAiEnabled,
} from "@/lib/clinical-surveillance/narrative-provider";
import { buildClinicalSurveillancePayload } from "@/lib/clinical-surveillance/observations-service";
import { syncClinicalSurveillanceObservations } from "@/lib/clinical-surveillance/store";
import { buildCountsByPriority, sortByPriority } from "@/lib/clinical-surveillance/helpers";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const patientId = request.nextUrl.searchParams.get("patientId") ?? undefined;
  const aiNarrativeEnabled = isClinicalSurveillanceAiEnabled();
  const aiNarrativeProvider = getClinicalSurveillanceAiProvider();

  const generatedPayload = await buildClinicalSurveillancePayload({
    adapter: getClinicalSurveillanceNarrativeAdapter(),
  });
  const syncedObservations = syncClinicalSurveillanceObservations({
    generatedAt: generatedPayload.generatedAt,
    observations: generatedPayload.observations,
  });

  const visibleObservations = sortByPriority(
    syncedObservations.filter((observation) => {
      if (patientId && observation.patientId !== patientId) {
        return false;
      }

      return observation.status === "new" || observation.status === "acknowledged";
    })
  );

  return NextResponse.json({
    generatedAt: generatedPayload.generatedAt,
    total: visibleObservations.length,
    countsByPriority: buildCountsByPriority(visibleObservations),
    observations: visibleObservations,
    dataSource: generatedPayload.dataSource,
    aiNarrativeEnabled,
    aiNarrativeProvider,
  });
}
