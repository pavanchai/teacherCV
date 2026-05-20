"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/ui/score-ring";
import { useToast } from "@/components/ui/toast";
import { getRecommendationConfig, getGradeLabel } from "@/lib/utils";
import { generateShortlistPDF } from "@/lib/pdf/report-generator";
import {
  Plus, BookmarkCheck, Users, Mail, FileDown, Trash2, Send,
  CheckCircle, XCircle, UserPlus, UserMinus, ChevronRight,
  IndianRupee, AlertTriangle,
} from "lucide-react";

interface Eval {
  id: string; positionId: string; overallScore: number; qualificationScore: number;
  experienceScore: number; subjectScore: number; softSkillScore: number;
  strengths: string; weaknesses: string; recommendation: string;
  meetsBenchmark: boolean; aiSummary: string; createdAt: string;
}

interface Candidate {
  id: string; name: string; email: string; phone?: string; cvFileName?: string;
  currentCtc?: number | null; expectedCtc?: number | null;
  evaluations: Eval[];
}

interface ShortlistItem {
  id: string; candidateId: string; rank: number; emailSent: boolean;
  candidate: Candidate;
}

interface Shortlist {
  id: string; name: string; positionId: string; status: string;
  position: { id: string; title: string; subject: string; gradeLevel: string; budgetCtc?: number | null };
  items: ShortlistItem[];
  _count: { items: number };
  createdAt: string;
}

interface Position {
  id: string; title: string; subject: string; gradeLevel: string;
}

export default function ShortlistsPage() {
  const { toast } = useToast();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Shortlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ schoolName: "", customMessage: "" });
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", positionId: "" });
  const [saving, setSaving] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([fetch("/api/shortlists"), fetch("/api/positions")]);
    const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
    const lists: Shortlist[] = Array.isArray(sData) ? sData : [];
    setShortlists(lists);
    setPositions(Array.isArray(pData) ? pData : []);
    // Keep selected in sync
    setSelected(prev => prev ? (lists.find(s => s.id === prev.id) || null) : null);
    setLoading(false);
  };

  // When a shortlist is selected, fetch all candidates for its position
  useEffect(() => {
    if (!selected) { setAllCandidates([]); return; }
    fetch(`/api/candidates?positionId=${selected.positionId}`)
      .then(r => r.json())
      .then(d => setAllCandidates(Array.isArray(d) ? d : []));
  }, [selected?.id]);

  useEffect(() => { fetchAll(); }, []);

  const shortlistedIds = new Set(selected?.items.map(i => i.candidateId) || []);

  const handleCreate = async () => {
    if (!form.name || !form.positionId) { toast("error", "Fill all fields"); return; }
    setSaving(true);
    const res = await fetch("/api/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newList = await res.json();
      toast("success", "Shortlist created");
      setCreateOpen(false);
      setForm({ name: "", positionId: "" });
      await fetchAll();
      setSelected(newList);
    } else {
      toast("error", "Failed to create");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shortlist?")) return;
    await fetch(`/api/shortlists/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    toast("success", "Deleted");
    fetchAll();
  };

  const handleAdd = async (candidateId: string) => {
    if (!selected) return;
    setAddingId(candidateId);
    const res = await fetch(`/api/shortlists/${selected.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    if (res.ok) {
      toast("success", "Added to shortlist");
      fetchAll();
    } else {
      toast("error", "Failed to add");
    }
    setAddingId(null);
  };

  const handleRemove = async (candidateId: string) => {
    if (!selected) return;
    setRemovingId(candidateId);
    await fetch(`/api/shortlists/${selected.id}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    toast("info", "Removed from shortlist");
    fetchAll();
    setRemovingId(null);
  };

  const handleSendEmails = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortlistItemIds: selected.items.map(i => i.id),
          schoolName: emailForm.schoolName,
          customMessage: emailForm.customMessage,
        }),
      });
      const data = await res.json();
      toast("success", `Emails sent: ${data.sent}`);
      setEmailModal(false);
      fetchAll();
    } catch { toast("error", "Failed to send emails"); }
    setSending(false);
  };

  const handleExportPDF = (sl: Shortlist) => {
    const candidates = sl.items.map(item => {
      const ev = item.candidate.evaluations.find(e => e.positionId === sl.positionId) || item.candidate.evaluations[0];
      return {
        candidate: { ...item.candidate, createdAt: new Date(sl.createdAt) },
        eval: ev ? { ...ev, createdAt: new Date(ev.createdAt) } : {
          id: "", positionId: sl.positionId, overallScore: 0, qualificationScore: 0,
          experienceScore: 0, subjectScore: 0, softSkillScore: 0, strengths: "[]",
          weaknesses: "[]", recommendation: "CONSIDER", meetsBenchmark: false,
          aiSummary: "No evaluation", createdAt: new Date(),
        },
      };
    });
    generateShortlistPDF({
      positionTitle: sl.position.title, subject: sl.position.subject,
      gradeLevel: sl.position.gradeLevel, shortlistName: sl.name,
      candidates, generatedAt: new Date(),
    });
  };

  // Candidates sorted by score descending
  const sortedCandidates = [...allCandidates].sort((a, b) => {
    const aEv = a.evaluations.find(e => e.positionId === selected?.positionId) || a.evaluations[0];
    const bEv = b.evaluations.find(e => e.positionId === selected?.positionId) || b.evaluations[0];
    return (bEv?.overallScore || 0) - (aEv?.overallScore || 0);
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Shortlists"
        description="Create shortlists and add the best candidates with one click"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            New Shortlist
          </Button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Shortlist list */}
        <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Shortlists</p>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : shortlists.length === 0 ? (
            <div className="p-6 text-center">
              <BookmarkCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No shortlists yet</p>
              <button onClick={() => setCreateOpen(true)} className="text-xs text-blue-600 mt-1 hover:underline">
                Create one
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {shortlists.map(sl => (
                <button
                  key={sl.id}
                  onClick={() => setSelected(sl)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selected?.id === sl.id
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{sl.name}</p>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${selected?.id === sl.id ? "text-blue-200" : "text-slate-400"}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${selected?.id === sl.id ? "text-blue-200" : "text-slate-500"}`}>
                      {sl.position.subject}
                    </span>
                    <span className={`text-xs ${selected?.id === sl.id ? "text-blue-200" : "text-slate-400"}`}>
                      · {sl._count.items} candidates
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Main panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!selected ? (
            <Card>
              <EmptyState
                icon={<BookmarkCheck className="h-8 w-8" />}
                title="Select a shortlist"
                description="Pick a shortlist from the left panel to view and manage candidates."
                action={
                  <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                    Create Shortlist
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {/* Shortlist header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info">{selected.position.subject}</Badge>
                    <span className="text-sm text-slate-500">{selected.position.title}</span>
                    <span className="text-xs text-slate-400">· {getGradeLabel(selected.position.gradeLevel)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" icon={<FileDown className="h-4 w-4" />} onClick={() => handleExportPDF(selected)} disabled={selected.items.length === 0}>
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm" icon={<Send className="h-4 w-4" />} onClick={() => setEmailModal(true)} disabled={selected.items.length === 0}>
                    Email All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(selected.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Two columns: shortlisted | available */}
              <div className="grid grid-cols-2 gap-4">

                {/* Shortlisted candidates */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Shortlisted ({selected.items.length})
                    </p>
                  </div>
                  {selected.items.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
                      <UserPlus className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No candidates yet</p>
                      <p className="text-xs text-slate-400 mt-1">Add from the panel on the right →</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selected.items.map((item, idx) => {
                        const ev = item.candidate.evaluations.find(e => e.positionId === selected.positionId) || item.candidate.evaluations[0];
                        const budget = selected.position.budgetCtc;
                        const exp = item.candidate.expectedCtc;
                        const ctcExceeds = budget && exp ? exp > budget : false;
                        const ctcFits = budget && exp ? exp <= budget : false;
                        return (
                          <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${ctcExceeds ? "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"}`}>
                            <span className={`text-xs font-bold w-5 text-center ${ctcExceeds ? "text-red-500" : "text-emerald-600"}`}>#{idx+1}</span>
                            {ev && <ScoreRing score={ev.overallScore} size="sm" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.candidate.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {ev?.meetsBenchmark
                                  ? <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                  : <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                                }
                                <p className="text-xs text-slate-500 truncate">{item.candidate.email}</p>
                              </div>
                              {exp && (
                                <div className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs font-semibold ${
                                  ctcExceeds ? "text-red-600 dark:text-red-400" :
                                  ctcFits ? "text-emerald-700 dark:text-emerald-400" :
                                  "text-amber-700 dark:text-amber-400"
                                }`}>
                                  {ctcExceeds && <AlertTriangle className="h-3 w-3" />}
                                  {ctcFits && <CheckCircle className="h-3 w-3" />}
                                  {!ctcExceeds && !ctcFits && <IndianRupee className="h-3 w-3" />}
                                  ₹{exp} LPA {ctcExceeds ? "· Over budget" : ctcFits ? "· In budget" : ""}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {item.emailSent && <Badge variant="success"><Mail className="h-3 w-3" /></Badge>}
                              <button
                                onClick={() => handleRemove(item.candidateId)}
                                disabled={removingId === item.candidateId}
                                className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Remove from shortlist"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available candidates */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      All Candidates ({sortedCandidates.length})
                    </p>
                  </div>
                  {sortedCandidates.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No candidates uploaded yet</p>
                      <p className="text-xs text-slate-400 mt-1">Go to Candidates page to upload CVs</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedCandidates.map(c => {
                        const ev = c.evaluations.find(e => e.positionId === selected.positionId) || c.evaluations[0];
                        const recConfig = ev ? getRecommendationConfig(ev.recommendation) : null;
                        const isShortlisted = shortlistedIds.has(c.id);

                        return (
                          <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            isShortlisted
                              ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                          }`}>
                            {ev && <ScoreRing score={ev.overallScore} size="sm" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{c.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {recConfig && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${recConfig.color}`}>
                                    {recConfig.label}
                                  </span>
                                )}
                                {ev?.meetsBenchmark && <Badge variant="success" className="text-xs py-0">CBSE ✓</Badge>}
                              </div>
                            </div>
                            {isShortlisted ? (
                              <span className="text-xs text-slate-400 shrink-0">Added</span>
                            ) : (
                              <button
                                onClick={() => handleAdd(c.id)}
                                disabled={addingId === c.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0 disabled:opacity-50"
                              >
                                {addingId === c.id
                                  ? <div className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  : <UserPlus className="h-3.5 w-3.5" />
                                }
                                Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Shortlist" description="Give it a name and link it to a position" size="sm">
        <div className="space-y-4">
          <Input label="Shortlist Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Round 1 — Maths Teachers" />
          <Select label="Position *" value={form.positionId} onChange={e => setForm(p => ({ ...p, positionId: e.target.value }))} options={positions.map(p => ({ value: p.id, label: `${p.title} — ${p.subject}` }))} placeholder="Select a position" />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Create</Button>
          </div>
        </div>
      </Modal>

      {/* Email modal */}
      <Modal open={emailModal} onClose={() => setEmailModal(false)} title="Email Shortlisted Candidates" description={`Send to ${selected?.items.length} candidate(s)`} size="md">
        <div className="space-y-4">
          <Input label="School/Organization Name *" value={emailForm.schoolName} onChange={e => setEmailForm(p => ({ ...p, schoolName: e.target.value }))} placeholder="e.g. Delhi Public School" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Message (optional)</label>
            <textarea className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-colors" rows={3} placeholder="Add a personal message..." value={emailForm.customMessage} onChange={e => setEmailForm(p => ({ ...p, customMessage: e.target.value }))} />
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
            Requires RESEND_API_KEY in .env.local to send real emails.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEmailModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSendEmails} loading={sending} disabled={!emailForm.schoolName} icon={<Send className="h-4 w-4" />} className="flex-1">Send Emails</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
