"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function ScoreRing({ score, size = "md", label, className }: ScoreRingProps) {
  const sizes = { sm: 56, md: 80, lg: 100 };
  const strokeWidths = { sm: 4, md: 6, lg: 8 };
  const r_sizes = { sm: 22, md: 32, lg: 42 };

  const sz = sizes[size];
  const sw = strokeWidths[size];
  const r = r_sizes[size];
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  const textSize = { sm: "text-sm", md: "text-xl", lg: "text-2xl" };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: sz, height: sz }}>
        <svg
          width={sz}
          height={sz}
          viewBox={`0 0 ${sz} ${sz}`}
          className="-rotate-90"
        >
          <circle
            cx={sz / 2}
            cy={sz / 2}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={sw}
          />
          <circle
            cx={sz / 2}
            cy={sz / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn("font-bold text-slate-800", textSize[size])}
            style={{ fontSize: size === "sm" ? "0.75rem" : undefined }}
          >
            {Math.round(score)}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-500 text-center">{label}</span>}
    </div>
  );
}
