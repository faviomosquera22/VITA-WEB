import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session });
}
