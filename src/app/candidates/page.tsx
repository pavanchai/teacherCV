"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { AddCandidateModal } from "@/components/candidates/add-candidate-modal";
import { EvalCard } from "@/components/evaluation/eval-card";
import { Modal } from "@/components/ui/modal";
import { getRecommendationConfig, getGradeLabel, truncate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Users, Plus, Mail, Phone, FileText, Trash2, Eye, RefreshCw, BookmarkPlus, IndianRupee, AlertTriangle, CheckCircle } from "lucide-react";
import { Select } from "@/components/ui/input";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cvFileName?: string;
  linkedinUrl?: string;
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
    createdAt: string;
  }>;
  createdAt: string;
}

interface Position {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  budgetCtc?: number | null;
}

interface Shortlist {
  id: string;
  name: string;
  positionId: string;
}

function CandidatesContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const positionFilter = searchParams.get("position") || "";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState(positionFilter);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [reevaluating, setReevaluating] = useState<string | null>(null);
  const [shortlistModal, setShortlistModal] = useState<{ open: boolean; candidateId: string }>({ open: false, candidateId: "" });

  const fetchAll = async () => {
    setLoading(true);
    const [cRes, pRes, sRes] = await Promise.all([
      fetch(`/api/candidates${selectedPos ? `?positionId=${selectedPos}` : ""}`),
      fetch("/api/positions"),
      fetch("/api/shortlists"),
    ]);
    const [cData, pData, sData] = await Promise.all([cRes.json(), pRes.json(), sRes.json()]);
    setCandidates(Array.isArray(cData) ? cData : []);
    setPositions(Array.isArray(pData) ? pData : []);
    setShortlists(Array.isArray(sData) ? sData : []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [selectedPos]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    toast("success", "Candidate removed");
    fetchAll();
  };

  const handleReevaluate = async (candidateId: string) => {
    if (!selectedPos) { toast("error", "Select a position first"); return; }
    setReevaluating(candidateId);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, positionId: selectedPos }),
      });
      if (!res.ok) throw new Error();
      toast("success", "Re-evaluation complete");
      fetchAll();
    } catch {
      toast("error", "Re-evaluation failed");
    } finally {
      setReevaluating(null);
    }
  };

  const handleAddToShortlist = async (shortlistId: string, candidateId: string) => {
    const res = await fetch(`/api/shortlists/${shortlistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    if (res.ok) {
      toast("success", "Added to shortlist");
      setShortlistModal({ open: false, candidateId: "" });
    } else {
      toast("error", "Failed to add to shortlist");
    }
  };

  const getEvalForPosition = (c: Candidate) => {
    if (selectedPos) return c.evaluations.find((e) => e.positionId === selectedPos);
    return c.evaluations[0];
  };

  const relevantShortlists = shortlists.filter((s) => !selectedPos || s.positionId === selectedPos);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Candidates"
        description="All candidates across your teaching positions"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)} disabled={!selectedPos}>
            Add Candidate
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Select
              value={selectedPos}
              onChange={(e) => setSelectedPos(e.target.value)}
              options={positions.map((p) => ({ value: p.id, label: `${p.title} — ${p.subject}` }))}
              placeholder="Filter by position (all)"
            />
          </div>
          {selectedPos && (
            <Badge variant="info">
              {positions.find((p) => p.id === selectedPos)?.subject} —{" "}
              {getGradeLabel(positions.find((p) => p.id === selectedPos)?.gradeLevel || "")}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No candidates yet"
              description={selectedPos ? "Upload CVs to start evaluating candidates for this position." : "Select a position and add candidates."}
              action={
                selectedPos ? (
                  <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
                    Add Candidate
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {candidates.map((c) => {
              const ev = getEvalForPosition(c);
              const recConfig = ev ? getRecommendationConfig(ev.recommendation) : null;

              const budget = positions.find(p => p.id === (selectedPos || ev?.positionId))?.budgetCtc;
              const ctcExceeds = budget && c.expectedCtc ? c.expectedCtc > budget : false;
              const ctcFits = budget && c.expectedCtc ? c.expectedCtc <= budget : false;

              return (
                <Card key={c.id} className={`hover:shadow-sm transition-shadow ${ctcExceeds ? "border-red-200 dark:border-red-900" : ""}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {ev && <ScoreRing score={ev.overallScore} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                          {ev?.meetsBenchmark && <Badge variant="success">CBSE ✓</Badge>}
                          {recConfig && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${recConfig.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${recConfig.dot}`} />
                              {recConfig.label}
                            </span>
                          )}
                          {/* CTC badge */}
                          {c.expectedCtc ? (
                            ctcExceeds ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <AlertTriangle className="h-3 w-3" />
                                ₹{c.expectedCtc} LPA · Exceeds budget
                              </span>
                            ) : ctcFits ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="h-3 w-3" />
                                ₹{c.expectedCtc} LPA · Within budget
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <IndianRupee className="h-3 w-3" />
                                Exp. ₹{c.expectedCtc} LPA
                              </span>
                            )
                          ) : c.currentCtc ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <IndianRupee className="h-3 w-3" />
                              Cur. ₹{c.currentCtc} LPA
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                          {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                          {c.cvFileName && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{c.cvFileName}</span>}
                        </div>
                        {ev && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ev.aiSummary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedPos && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReevaluate(c.id)}
                              loading={reevaluating === c.id}
                              icon={<RefreshCw className="h-4 w-4" />}
                            >
                              Re-eval
                            </Button>
                            {relevantShortlists.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShortlistModal({ open: true, candidateId: c.id })}
                                icon={<BookmarkPlus className="h-4 w-4" />}
                              >
                                Shortlist
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailCandidate(c)}
                          icon={<Eye className="h-4 w-4" />}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id, c.name)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedPos && (
        <AddCandidateModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          positionId={selectedPos}
          onSuccess={fetchAll}
        />
      )}

      {/* Candidate detail modal */}
      <Modal
        open={!!detailCandidate}
        onClose={() => setDetailCandidate(null)}
        title={detailCandidate?.name || ""}
        description={detailCandidate?.email}
        size="xl"
      >
        {detailCandidate && (
          <div className="space-y-4">
            {detailCandidate.evaluations.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No evaluations yet for this candidate.</p>
            ) : (
              detailCandidate.evaluations.map((ev) => {
                const pos = positions.find((p) => p.id === ev.positionId);
                return (
                  <div key={ev.id}>
                    {pos && (
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Evaluation for: {pos.title} — {pos.subject}
                      </p>
                    )}
                    <EvalCard eval={ev} showDetails />
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>

      {/* Add to shortlist modal */}
      <Modal
        open={shortlistModal.open}
        onClose={() => setShortlistModal({ open: false, candidateId: "" })}
        title="Add to Shortlist"
        size="sm"
      >
        <div className="space-y-2">
          {relevantShortlists.length === 0 ? (
            <p className="text-sm text-slate-500">No shortlists for this position.</p>
          ) : (
            relevantShortlists.map((sl) => (
              <button
                key={sl.id}
                onClick={() => handleAddToShortlist(sl.id, shortlistModal.candidateId)}
                className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {sl.name}
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesContent />
    </Suspense>
  );
}
