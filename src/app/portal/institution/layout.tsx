import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import SessionBar from "@/app/portal/_components/session-bar";
import { getServerSession } from "@/lib/auth";

export default async function InstitutionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/portal/login?role=institution");
  }

  if (session.role !== "institution") {
    redirect("/portal/professional");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <SessionBar user={session} />
      {children}
    </div>
  );
}
