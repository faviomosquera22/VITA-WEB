import Image from "next/image";

import type { SessionUser } from "@/lib/auth";

import LogoutButton from "./logout-button";

export default function SessionBar({ user }: { user: SessionUser }) {
  const roleLabel =
    user.role === "professional"
      ? "Profesional"
      : user.role === "institution"
        ? "Institución"
        : "Paciente";

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/vita-logo.png" alt="VITA" width={34} height={34} className="h-[34px] w-[34px] rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">
              {user.name} · {roleLabel}
            </p>
            <p className="truncate text-[11px] text-slate-500">{user.centerName}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
