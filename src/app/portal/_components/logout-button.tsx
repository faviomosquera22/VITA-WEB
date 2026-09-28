"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/portal");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      {loading ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}
