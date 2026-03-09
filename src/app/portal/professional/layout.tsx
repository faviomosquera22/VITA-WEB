import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
import SessionBar from "@/app/portal/_components/session-bar";

import ProfessionalSidebar from "./_components/professional-sidebar";

export default async function ProfessionalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/portal/login?role=professional");
  }

  if (session.role !== "professional") {
    redirect("/portal/institution");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <ProfessionalSidebar role="professional" />
      <div className="min-w-0 flex-1">
        <SessionBar user={session} />
        {children}
      </div>
    </div>
  );
}
