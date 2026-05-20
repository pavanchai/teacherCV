"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { getRecommendationConfig, getGradeLabel, getScoreColor } from "@/lib/utils";
import { GitCompareArrows, CheckCircle, XCircle, TrendingUp, TrendingDown, X, IndianRupee, ArrowRight, AlertTriangle } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  currentCtc?: number | null;
  expectedCtc?: number | null;
  evaluations: Array<{
    id: string;
    positionId: string;
    overallScore: number;
    qualificationScore: number;
    experienceScore: number;
    subjectScore: number;
    softSkillScore: number;
    strengths: string;
    weaknesses: string;
    recommendation: string;
    meetsBenchmark: boolean;
    aiSummary: string;
  }>;
}

interface Position {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  budgetCtc?: number | null;
}

const SCORE_DIMS = [
  { key: "overallScore", label: "Overall Score" },
  { key: "qualificationScore", label: "Qualification" },
  { key: "experienceScore", label: "Experience" },
  { key: "subjectScore", label: "Subject Expertise" },
  { key: "softSkillScore", label: "Soft Skills" },
] as const;

export default function ComparePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/positions").then((r) => r.json()).then((d) => setPositions(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!selectedPosition) { setCandidates([]); return; }
    setLoading(true);
    fetch(`/api/candidates?positionId=${selectedPosition}`)
      .then((r) => r.json())
      .then((d) => { setCandidates(Array.isArray(d) ? d : []); setSelectedCandidates([]); })
      .finally(() => setLoading(false));
  }, [selectedPosition]);

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compareData = selectedCandidates.map((id) => {
    const c = candidates.find((c) => c.id === id)!;
    const ev = c?.evaluations.find((e) => e.positionId === selectedPosition) || c?.evaluations[0];
    return { candidate: c, eval: ev };
  }).filter((d) => d.candidate && d.eval);

  const getBest = (key: typeof SCORE_DIMS[number]["key"]): string | null => {
    if (compareData.length < 2) return null;
    const scores = compareData.map((d) => ({ id: d.candidate.id, score: d.eval![key] }));
    const max = Math.max(...scores.map((s) => s.score));
    return scores.find((s) => s.score === max)?.id || null;
  };

  const position = positions.find((p) => p.id === selectedPosition);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Compare Candidates"
        description="Side-by-side comparison of up to 4 candidates"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-80">
            <Select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              options={positions.map((p) => ({ value: p.id, label: `${p.title} — ${p.subject}` }))}
              placeholder="Select a position to compare"
            />
          </div>
          {position && (
            <Badge variant="info">
              {position.subject} — {getGradeLabel(position.gradeLevel)}
            </Badge>
          )}
        </div>

        {selectedPosition && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Select candidates to compare (max 4)
            </p>
            {loading ? (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
              </div>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-slate-400">No candidates for this position.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidates.map((c) => {
                  const ev = c.evaluations.find((e) => e.positionId === selectedPosition) || c.evaluations[0];
                  const selected = selectedCandidates.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCandidate(c.id)}
                      disabled={!selected && selectedCandidates.length >= 4}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 disabled:opacity-40"
                      }`}
                    >
                      {ev && (
                        <span className={`text-xs font-bold ${selected ? "text-blue-200" : getScoreColor(ev.overallScore)}`}>
                          {Math.round(ev.overallScore)}
                        </span>
                      )}
                      {c.name}
                      {selected && <X className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {compareData.length < 2 && selectedPosition && (
          <Card>
            <EmptyState
              icon={<GitCompareArrows className="h-8 w-8" />}
              title="Select at least 2 candidates"
              description="Pick candidates from the list above to see a side-by-side comparison."
            />
          </Card>
        )}

        {compareData.length >= 2 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-slate-100 dark:bg-slate-800 rounded-tl-xl text-sm font-semibold text-slate-700 dark:text-slate-300 w-48">
                    Dimension
                  </th>
                  {compareData.map((d, i) => {
                    const recConfig = getRecommendationConfig(d.eval!.recommendation);
                    return (
                      <th key={d.candidate.id} className={`p-3 bg-slate-100 dark:bg-slate-800 text-center ${i === compareData.length - 1 ? "rounded-tr-xl" : ""}`}>
                        <div className="flex flex-col items-center gap-2">
                          <ScoreRing score={d.eval!.overallScore} size="md" />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{d.candidate.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${recConfig.color}`}>
                              {recConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {d.eval!.meetsBenchmark ? (
                              <Badge variant="success"><CheckCircle className="h-3 w-3" /> CBSE ✓</Badge>
                            ) : (
                              <Badge variant="danger"><XCircle className="h-3 w-3" /> Below Benchmark</Badge>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SCORE_DIMS.map((dim, rowIdx) => {
                  const bestId = getBest(dim.key);
                  return (
                    <tr key={dim.key} className={rowIdx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/50"}>
                      <td className="p-3 text-sm font-medium text-slate-700">{dim.label}</td>
                      {compareData.map((d) => {
                        const score = d.eval![dim.key];
                        const isBest = d.candidate.id === bestId;
                        return (
                          <td key={d.candidate.id} className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                                {Math.round(score)}
                              </span>
                              <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              {isBest && (
                                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                                  <TrendingUp className="h-3 w-3" /> Best
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* CTC row */}
                <tr className="bg-white dark:bg-slate-900 border-t-2 border-amber-200 dark:border-amber-800">
                  <td className="p-3 align-top">
                    <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                      <IndianRupee className="h-4 w-4 text-amber-500" /> CTC
                    </div>
                    {position?.budgetCtc && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                        Budget: ₹{position.budgetCtc} LPA
                      </p>
                    )}
                  </td>
                  {compareData.map((d) => {
                    const cur = d.candidate.currentCtc;
                    const exp = d.candidate.expectedCtc;
                    const hike = cur && exp ? Math.round(((exp - cur) / cur) * 100) : null;
                    const budget = position?.budgetCtc;
                    const fits = budget && exp ? exp <= budget : null;

                    return (
                      <td key={d.candidate.id} className="p-3 align-top">
                        {cur || exp ? (
                          <div className="space-y-2">
                            {/* current → expected */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cur && (
                                <span className="flex items-center gap-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" />{cur}
                                </span>
                              )}
                              {cur && exp && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
                              {exp && (
                                <span className="flex items-center gap-0.5 text-sm font-bold text-amber-700 dark:text-amber-400">
                                  <IndianRupee className="h-3.5 w-3.5" />{exp}
                                </span>
                              )}
                              {!cur && exp && (
                                <span className="text-xs text-slate-400">Expected:</span>
                              )}
                            </div>

                            {/* hike % */}
                            {hike !== null && (
                              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                hike > 30
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  : hike > 15
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              }`}>
                                <TrendingUp className="h-3 w-3" />
                                {hike > 0 ? `+${hike}% hike` : `${hike}% change`}
                              </div>
                            )}

                            {/* budget fit */}
                            {fits !== null && (
                              <div className={`flex items-center gap-1 text-xs font-medium ${
                                fits ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                              }`}>
                                {fits
                                  ? <><CheckCircle className="h-3.5 w-3.5" /> Within budget</>
                                  : <><AlertTriangle className="h-3.5 w-3.5" /> Exceeds budget</>
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Not provided</p>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* AI Summary row */}
                <tr className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  <td className="p-3 text-sm font-medium text-slate-700 align-top">AI Summary</td>
                  {compareData.map((d) => (
                    <td key={d.candidate.id} className="p-3">
                      <p className="text-xs text-slate-600 leading-relaxed">{d.eval!.aiSummary}</p>
                    </td>
                  ))}
                </tr>

                {/* Strengths row */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <td className="p-3 text-sm font-medium text-slate-700 align-top">
                    <TrendingUp className="h-4 w-4 text-emerald-500 inline mr-1" /> Strengths
                  </td>
                  {compareData.map((d) => {
                    const strengths = JSON.parse(d.eval!.strengths || "[]") as string[];
                    return (
                      <td key={d.candidate.id} className="p-3 align-top">
                        <ul className="space-y-1">
                          {strengths.map((s, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5 shrink-0">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>

                {/* Weaknesses row */}
                <tr className="bg-white dark:bg-slate-900 rounded-b-xl">
                  <td className="p-3 text-sm font-medium text-slate-700 align-top rounded-bl-xl">
                    <TrendingDown className="h-4 w-4 text-red-500 inline mr-1" /> Gaps
                  </td>
                  {compareData.map((d, i) => {
                    const weaknesses = JSON.parse(d.eval!.weaknesses || "[]") as string[];
                    return (
                      <td key={d.candidate.id} className={`p-3 align-top ${i === compareData.length - 1 ? "rounded-br-xl" : ""}`}>
                        <ul className="space-y-1">
                          {weaknesses.map((w, j) => (
                            <li key={j} className="text-xs text-slate-600 flex items-start gap-1">
                              <span className="text-red-400 mt-0.5 shrink-0">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
