"use client";

interface VitalInputProps {
  label: string;
  value?: number;
  unit: string;
  placeholder?: string;
  onChange: (value: number | undefined) => void;
  status?: "normal" | "alert" | "critical" | "missing";
}

export default function VitalInput({
  label,
  value,
  unit,
  placeholder,
  onChange,
  status = "normal",
}: VitalInputProps) {
  const statusClassName =
    status === "critical"
      ? "border-red-500 bg-red-50"
      : status === "alert"
        ? "border-amber-400 bg-amber-50"
        : status === "missing"
          ? "border-slate-300 bg-slate-100"
          : "border-emerald-300 bg-emerald-50";

  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-3">
      <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) {
              onChange(undefined);
              return;
            }
            onChange(Number(next));
          }}
          className={["w-full rounded-lg border px-3 py-2 text-sm outline-none", statusClassName].join(" ")}
        />
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{unit}</span>
      </div>
      {status === "critical" ? (
        <span className="mt-1 inline-flex rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
          VALOR CRITICO
        </span>
      ) : null}
    </label>
  );
}
