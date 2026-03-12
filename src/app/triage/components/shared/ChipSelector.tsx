"use client";

export interface ChipOption {
  label: string;
  value: string;
  description?: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export default function ChipSelector({ options, value, onChange, multiple = false }: ChipSelectorProps) {
  const selectedValues = Array.isArray(value) ? value : [value];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const selected = selectedValues.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!multiple) {
                onChange(option.value);
                return;
              }

              if (selected) {
                onChange(selectedValues.filter((entry) => entry !== option.value));
                return;
              }

              onChange([...selectedValues, option.value]);
            }}
            className={[
              "rounded-2xl border px-4 py-3 text-left transition",
              selected
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-slate-200 bg-white text-slate-800 hover:border-slate-400",
            ].join(" ")}
          >
            <div className="text-sm font-semibold">{option.label}</div>
            {option.description ? <div className="mt-1 text-xs opacity-80">{option.description}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
