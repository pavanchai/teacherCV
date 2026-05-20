import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

export function getScoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-50 border-emerald-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export function getRecommendationConfig(rec: string) {
  const configs = {
    STRONGLY_RECOMMENDED: {
      label: "Strongly Recommended",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
    },
    RECOMMENDED: {
      label: "Recommended",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      dot: "bg-blue-500",
    },
    CONSIDER: {
      label: "Consider",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    },
    NOT_RECOMMENDED: {
      label: "Not Recommended",
      color: "bg-red-100 text-red-800 border-red-200",
      dot: "bg-red-500",
    },
  };
  return configs[rec as keyof typeof configs] || configs.CONSIDER;
}

export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function getGradeLabel(gradeLevel: string): string {
  const map: Record<string, string> = {
    PRIMARY_1_5: "Primary (Class 1–5)",
    UPPER_PRIMARY_6_8: "Upper Primary (Class 6–8)",
    SECONDARY_9_10: "Secondary (Class 9–10)",
    SR_SECONDARY_11_12: "Senior Secondary (Class 11–12)",
  };
  return map[gradeLevel] || gradeLevel;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
