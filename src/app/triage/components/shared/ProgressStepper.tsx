"use client";

interface ProgressStepperProps {
  steps: string[];
  activeIndex: number;
  completedIndexes: number[];
  onStepClick?: (index: number) => void;
}

export default function ProgressStepper({
  steps,
  activeIndex,
  completedIndexes,
  onStepClick,
}: ProgressStepperProps) {
  return (
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = completedIndexes.includes(index);

        return (
          <li key={step}>
            <button
              type="button"
              onClick={() => onStepClick?.(index)}
              className={[
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                isActive
                  ? "border-sky-500 bg-sky-50 text-sky-900"
                  : isCompleted
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-sky-600 text-white"
                    : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-700",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
