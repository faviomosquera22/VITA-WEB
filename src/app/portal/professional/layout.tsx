import type { ReactNode } from "react";

import ProfessionalSidebar from "./_components/professional-sidebar";

export default function ProfessionalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <ProfessionalSidebar role="professional" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
