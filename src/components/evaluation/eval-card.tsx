"use client";

import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getRecommendationConfig, getScoreColor } from "@/lib/utils";
import { CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import type { EvalSummary } from "@/types";

interface EvalCardProps {
  eval: EvalSummary;
  showDetails?: boolean;
}

const scoreLabels = [
  { key: "qualificationScore", label: "Qualification" },
  { key: "experienceScore", label: "Experience" },
  { key: "subjectScore", label: "Subject Expertise" },
  { key: "softSkillScore", label: "Soft Skills" },
] as const;

export function EvalCard({ eval: ev, showDetails = false }: EvalCardProps) {
  const recConfig = getRecommendationConfig(ev.recommendation);
  const strengths = JSON.parse(ev.strengths || "[]") as string[];
  const weaknesses = JSON.parse(ev.weaknesses || "[]") as string[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoreRing score={ev.overallScore} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Overall Score</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${recConfig.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${recConfig.dot}`} />
                {recConfig.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ev.meetsBenchmark ? (
              <Badge variant="success">
                <CheckCircle className="h-3 w-3" /> Meets CBSE Benchmark
              </Badge>
            ) : (
              <Badge variant="danger">
                <XCircle className="h-3 w-3" /> Below Benchmark
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {scoreLabels.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                <span className={`text-xs font-semibold ${getScoreColor(ev[key])}`}>
                  {Math.round(ev[key])}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    ev[key] >= 75 ? "bg-emerald-500" : ev[key] >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${ev[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{ev.aiSummary}</p>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-4">
            {strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Strengths</span>
                </div>
                <ul className="space-y-1">
                  {strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gaps</span>
                </div>
                <ul className="space-y-1">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
