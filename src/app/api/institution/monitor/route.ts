import { type NextRequest, NextResponse } from "next/server";
import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { getInstitutionMonitor } from "@/lib/repositories/case-repository";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const actor = await getRequestSession(request);
  if (!actor) return unauthorizedResponse();
  if (!["professional", "institution"].includes(actor.role))
    return NextResponse.json({ error: "Acceso restringido" }, { status: 403 });
  try {
    return NextResponse.json(await getInstitutionMonitor(actor), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el panel. Reintentando conexión." },
      { status: 503 },
    );
  }
}
