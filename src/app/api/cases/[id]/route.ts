import { type NextRequest, NextResponse } from "next/server";
import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { updateCaseFlow } from "@/lib/repositories/case-repository";
import { z } from "zod";
const schema = z
  .object({
    status: z.enum(["pendiente", "en_atencion", "finalizado"]),
    careArea: z.enum(["general", "hospitalizacion"]),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .refine(
    (value) =>
      value.careArea !== "hospitalizacion" || value.status !== "pendiente",
    "Hospitalización requiere un caso en atención o finalizado",
  );
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await getRequestSession(request);
  if (!actor) return unauthorizedResponse();
  if (actor.role !== "professional")
    return NextResponse.json(
      { error: "Solo el profesional puede modificar casos" },
      { status: 403 },
    );
  const { id } = await context.params;
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !input.success)
    return NextResponse.json(
      { error: "Datos de actualización inválidos" },
      { status: 400 },
    );
  try {
    const item = await updateCaseFlow(id, input.data, actor);
    if (!item)
      return NextResponse.json(
        {
          error:
            "El caso cambió o no está disponible. Actualiza la lista antes de continuar.",
        },
        { status: 409 },
      );
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el cambio" },
      { status: 503 },
    );
  }
}
