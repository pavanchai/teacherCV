"use client";

import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Button } from "@/components/ui/button";
import { getRecommendationConfig, getGradeLabel, cn } from "@/lib/utils";
import {
  Users, TrendingUp, ShieldCheck, Award,
  Search, X, CheckCircle, XCircle,
  Mail, Phone, FileText, BookmarkCheck,
  ChevronRight, Star, AlertTriangle,
} from "lucide-react";

interface Eval {
  id: string; positionId: string; overallScore: number; qualificationScore: number;
  experienceScore: number; subjectScore: number; softSkillScore: number;
  strengths: string; weaknesses: string; recommendation: string;
  meetsBenchmark: boolean; aiSummary: string; rawEvaluation?: string; createdAt: string;
}

interface Candidate {
  id: string; name: string; email: string; phone?: string; cvFileName?: string;
  evaluations: Eval[];
}

interface CandidateDetail extends Candidate {
  shortlistItems: Array<{
    shortlist: { name: string; position: { title: string; subject: string } };
  }>;
}

interface Position {
  id: string; title: string; subject: string; gradeLevel: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

function parseArr(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function avatarColor(score: number) {
  if (score >= 75) return { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" };
  if (score >= 50) return { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" };
  return { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" };
}

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500 dark:text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-8 text-right">{score}</span>
    </div>
  );
}

// ── slide-over panel ───────────────────────────────────────────────────────

function DetailPanel({
  detail, posMap, onClose,
}: {
  detail: CandidateDetail;
  posMap: Record<string, Position>;
  onClose: () => void;
}) {
  const ev = detail.evaluations[0];
  const recConfig = ev ? getRecommendationConfig(ev.recommendation) : null;
  const av = ev ? avatarColor(ev.overallScore) : avatarColor(0);
  const strengths = ev ? parseArr(ev.strengths) : [];
  const weaknesses = ev ? parseArr(ev.weaknesses) : [];
  const position = ev ? posMap[ev.positionId] : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <div className="w-[500px] max-w-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Candidate Profile</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* identity */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${av.bg} ${av.text}`}>
              {initials(detail.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{detail.name}</h2>
              {position && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {position.title} — {position.subject}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {recConfig && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${recConfig.color}`}>
                    {recConfig.label}
                  </span>
                )}
                {ev?.meetsBenchmark ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> CBSE Compliant
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full">
                    <XCircle className="h-3 w-3" /> Below Benchmark
                  </span>
                )}
              </div>
            </div>
            {ev && <ScoreRing score={ev.overallScore} size="md" label="Overall" />}
          </div>

          {/* contact */}
          <div className="grid grid-cols-2 gap-3">
            <a href={`mailto:${detail.email}`} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
              <Mail className="h-4 w-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
              <span className="truncate">{detail.email}</span>
            </a>
            {detail.phone ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">{detail.phone}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span>No phone</span>
              </div>
            )}
          </div>

          {/* score breakdown */}
          {ev && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Score Breakdown</p>
              </div>
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
                <ScoreBar label="Qualification" score={ev.qualificationScore} />
                <ScoreBar label="Experience" score={ev.experienceScore} />
                <ScoreBar label="Subject Match" score={ev.subjectScore} />
                <ScoreBar label="Soft Skills" score={ev.softSkillScore} />
              </div>
            </div>
          )}

          {/* ai summary */}
          {ev?.aiSummary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wide">AI Summary</p>
              <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{ev.aiSummary}</p>
            </div>
          )}

          {/* strengths */}
          {strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Strengths</p>
              </div>
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* weaknesses */}
          {weaknesses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Areas to Review</p>
              </div>
              <ul className="space-y-1.5">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* shortlist membership */}
          {detail.shortlistItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">In Shortlists</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.shortlistItems.map((si, i) => (
                  <Badge key={i} variant="info">{si.shortlist.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* cv file */}
          {detail.cvFileName && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{detail.cvFileName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

const REC_ORDER = ["STRONGLY_RECOMMENDED", "RECOMMENDED", "CONSIDER", "NOT_RECOMMENDED"];

export default function ReportsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [posMap, setPosMap] = useState<Record<string, Position>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRec, setFilterRec] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<CandidateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates").then(r => r.json()),
      fetch("/api/positions").then(r => r.json()),
    ]).then(([cData, pData]) => {
      setCandidates(Array.isArray(cData) ? cData : []);
      const map: Record<string, Position> = {};
      (Array.isArray(pData) ? pData : []).forEach((p: Position) => { map[p.id] = p; });
      setPosMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const handleCandidateClick = async (id: string) => {
    setDetailLoading(true);
    const data = await fetch(`/api/candidates/${id}`).then(r => r.json());
    setSelectedDetail(data);
    setDetailLoading(false);
  };

  // ── derived stats ────────────────────────────────────────────────────────

  const withEval = candidates.filter(c => c.evaluations.length > 0);
  const avgScore = withEval.length
    ? Math.round(withEval.reduce((s, c) => s + c.evaluations[0].overallScore, 0) / withEval.length)
    : 0;
  const cbseReady = withEval.filter(c => c.evaluations[0].meetsBenchmark).length;
  const recommended = withEval.filter(c =>
    ["STRONGLY_RECOMMENDED", "RECOMMENDED"].includes(c.evaluations[0].recommendation)
  ).length;

  const recBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    REC_ORDER.forEach(r => { counts[r] = 0; });
    withEval.forEach(c => { counts[c.evaluations[0].recommendation]++; });
    return counts;
  }, [withEval]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    withEval.forEach(c => {
      const pos = posMap[c.evaluations[0].positionId];
      if (pos) set.add(pos.subject);
    });
    return Array.from(set).sort();
  }, [withEval, posMap]);

  // ── filtered list ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const ev = c.evaluations[0];
      const pos = ev ? posMap[ev.positionId] : null;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
          !c.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRec && ev?.recommendation !== filterRec) return false;
      if (filterSubject && pos?.subject !== filterSubject) return false;
      return true;
    }).sort((a, b) => (b.evaluations[0]?.overallScore || 0) - (a.evaluations[0]?.overallScore || 0));
  }, [candidates, search, filterRec, filterSubject, posMap]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" description="Full candidate analytics and profile deep-dive" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            label="Total Candidates"
            value={candidates.length}
            sub={`${withEval.length} evaluated`}
            color="bg-blue-50 dark:bg-blue-900/30"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
            label="Average Score"
            value={avgScore > 0 ? avgScore : "—"}
            sub="across all evaluations"
            color="bg-violet-50 dark:bg-violet-900/30"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
            label="CBSE Compliant"
            value={cbseReady}
            sub={withEval.length ? `${Math.round((cbseReady / withEval.length) * 100)}% of evaluated` : "no data yet"}
            color="bg-emerald-50 dark:bg-emerald-900/30"
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-amber-600" />}
            label="Recommended+"
            value={recommended}
            sub="strongly rec. or recommended"
            color="bg-amber-50 dark:bg-amber-900/30"
          />
        </div>

        {/* ── recommendation breakdown ── */}
        {withEval.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Recommendation Breakdown</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {REC_ORDER.map(rec => {
                const cfg = getRecommendationConfig(rec);
                const count = recBreakdown[rec] || 0;
                const pct = withEval.length ? Math.round((count / withEval.length) * 100) : 0;
                return (
                  <div
                    key={rec}
                    onClick={() => setFilterRec(filterRec === rec ? "" : rec)}
                    className={cn(
                      "rounded-xl p-4 border cursor-pointer transition-all",
                      filterRec === rec
                        ? "ring-2 ring-blue-500 border-blue-300 dark:border-blue-700"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color} mb-3`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.dot} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── candidate list ── */}
        <div className="space-y-3">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            {subjects.length > 0 && (
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {(filterRec || filterSubject || search) && (
              <button
                onClick={() => { setSearch(""); setFilterRec(""); setFilterSubject(""); }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <p className="text-sm text-slate-400 ml-auto">{filtered.length} candidate{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {/* list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-16 text-center">
              <Users className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                {candidates.length === 0 ? "No candidates yet. Upload CVs to get started." : "No candidates match your filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c, idx) => {
                const ev = c.evaluations[0];
                const pos = ev ? posMap[ev.positionId] : null;
                const recConfig = ev ? getRecommendationConfig(ev.recommendation) : null;
                const av = ev ? avatarColor(ev.overallScore) : avatarColor(0);

                return (
                  <button
                    key={c.id}
                    onClick={() => handleCandidateClick(c.id)}
                    disabled={detailLoading}
                    className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* rank + avatar */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-slate-400 w-5 text-right">#{idx + 1}</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${av.bg} ${av.text}`}>
                          {initials(c.name)}
                        </div>
                      </div>

                      {/* name + position */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                          {ev?.meetsBenchmark && (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {pos && <span className="text-xs text-slate-500 dark:text-slate-400">{pos.subject}</span>}
                          {pos && <span className="text-xs text-slate-300 dark:text-slate-600">·</span>}
                          {pos && <span className="text-xs text-slate-400">{getGradeLabel(pos.gradeLevel)}</span>}
                        </div>
                      </div>

                      {/* 4 score pills */}
                      {ev && (
                        <div className="hidden md:flex items-center gap-2 shrink-0">
                          {[
                            { label: "Qual", score: ev.qualificationScore },
                            { label: "Exp", score: ev.experienceScore },
                            { label: "Subj", score: ev.subjectScore },
                            { label: "Soft", score: ev.softSkillScore },
                          ].map(({ label, score }) => (
                            <div key={label} className="flex flex-col items-center gap-0.5">
                              <div className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                score >= 75
                                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                  : score >= 50
                                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                  : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                              }`}>{score}</div>
                              <span className="text-[10px] text-slate-400">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* recommendation + overall */}
                      <div className="flex items-center gap-3 shrink-0">
                        {recConfig && (
                          <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${recConfig.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${recConfig.dot}`} />
                            {recConfig.label}
                          </span>
                        )}
                        {ev && (
                          <div className={`text-lg font-bold ${
                            ev.overallScore >= 75 ? "text-emerald-600" :
                            ev.overallScore >= 50 ? "text-amber-600" : "text-red-500"
                          }`}>
                            {ev.overallScore}
                          </div>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* slide-over */}
      {selectedDetail && (
        <DetailPanel
          detail={selectedDetail}
          posMap={posMap}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </div>
  );
}
