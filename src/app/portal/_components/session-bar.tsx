import type { SessionUser } from "@/lib/auth";

import LogoutButton from "./logout-button";

export default function SessionBar({ user }: { user: SessionUser }) {
  return (
    <div className="border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-800">
            {user.name} · {user.role === "professional" ? "Profesional" : "Institucion"}
          </p>
          <p className="truncate text-[11px] text-slate-500">{user.centerName}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
