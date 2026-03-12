"use client";

interface CriticalBannerProps {
  title: string;
  description: string;
  tone?: "critical" | "warning" | "info";
}

export default function CriticalBanner({ title, description, tone = "critical" }: CriticalBannerProps) {
  const toneClassName =
    tone === "critical"
      ? "border-red-300 bg-red-50 text-red-900"
      : tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-sky-300 bg-sky-50 text-sky-900";

  return (
    <div className={["rounded-2xl border px-4 py-3", toneClassName].join(" ")} role="alert">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs">{description}</p>
    </div>
  );
}
