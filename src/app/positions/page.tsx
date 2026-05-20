"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { GRADE_LEVELS, SUBJECTS, getBenchmarkForPosition } from "@/constants/benchmarks/cbse";
import { getGradeLabel } from "@/lib/utils";
import { Plus, Briefcase, Users, BookmarkCheck, Trash2, Info, Link2, Copy, Check, IndianRupee } from "lucide-react";
import Link from "next/link";

interface Position {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description?: string;
  requirements: string;
  minQualification: string;
  experience: number;
  budgetCtc?: number | null;
  status: string;
  createdAt: string;
  _count?: { shortlists: number };
  shortlists?: Array<{ _count: { items: number } }>;
}

function CopyLinkButton({ positionId }: { positionId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const url = `${window.location.origin}/apply/${positionId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

export default function PositionsPage() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [benchmarkPreview, setBenchmarkPreview] = useState("");
  const [form, setForm] = useState({
    title: "",
    subject: "Mathematics",
    gradeLevel: "SECONDARY_9_10",
    description: "",
    requirements: "",
    minQualification: "",
    experience: "0",
    budgetCtc: "",
  });

  const fetchPositions = async () => {
    setLoading(true);
    const res = await fetch("/api/positions");
    const data = await res.json();
    setPositions(data);
    setLoading(false);
  };

  useEffect(() => { fetchPositions(); }, []);

  useEffect(() => {
    if (form.gradeLevel && form.subject) {
      const bm = getBenchmarkForPosition(form.gradeLevel, form.subject);
      setBenchmarkPreview(bm);
      if (!form.minQualification) {
        setForm((p) => ({ ...p, minQualification: bm }));
      }
    }
  }, [form.gradeLevel, form.subject]);

  const handleSave = async () => {
    if (!form.title || !form.subject || !form.gradeLevel || !form.requirements) {
      toast("error", "Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, experience: parseInt(form.experience), budgetCtc: form.budgetCtc || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("success", "Position created");
      setModalOpen(false);
      setForm({ title: "", subject: "Mathematics", gradeLevel: "SECONDARY_9_10", description: "", requirements: "", minQualification: "", experience: "0", budgetCtc: "" });
      fetchPositions();
    } catch {
      toast("error", "Failed to create position");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete position "${title}"?`)) return;
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    toast("success", "Position deleted");
    fetchPositions();
  };

  const totalCandidates = (p: Position) =>
    p.shortlists?.reduce((sum, s) => sum + s._count.items, 0) ?? 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Positions"
        description="Manage teaching positions and their requirements"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            New Position
          </Button>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : positions.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title="No positions yet"
              description="Create your first teaching position to start evaluating candidates."
              action={
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
                  Create Position
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {positions.map((pos) => (
              <Card key={pos.id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{pos.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{getGradeLabel(pos.gradeLevel)}</p>
                    </div>
                    <Badge variant="info" className="shrink-0">{pos.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-3">
                  {pos.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{pos.description}</p>
                  )}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Min. Qualification</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{pos.minQualification}</p>
                  </div>
                  {/* stats row — fixed height, no wrapping */}
                  <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="h-3.5 w-3.5" /> {totalCandidates(pos)} candidates
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <BookmarkCheck className="h-3.5 w-3.5" /> {pos._count?.shortlists ?? 0} shortlists
                    </span>
                    {pos.budgetCtc ? (
                      <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                        <IndianRupee className="h-3 w-3" />{pos.budgetCtc} LPA
                      </span>
                    ) : (
                      <span className="shrink-0">{pos.experience}+ yrs exp</span>
                    )}
                  </div>
                  {/* action row — always at the bottom */}
                  <div className="flex gap-2 pt-1 mt-auto">
                    <Link href={`/candidates?position=${pos.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Candidates
                      </Button>
                    </Link>
                    <CopyLinkButton positionId={pos.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pos.id, pos.title)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Teaching Position"
        description="Define the role and qualification requirements"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Position Title *"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Senior Mathematics Teacher"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Grade Level *"
              value={form.gradeLevel}
              onChange={(e) => setForm((p) => ({ ...p, gradeLevel: e.target.value, minQualification: "" }))}
              options={GRADE_LEVELS}
            />
            <Select
              label="Subject *"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value, minQualification: "" }))}
              options={SUBJECTS.map((s) => ({ value: s, label: s }))}
            />
          </div>

          {benchmarkPreview && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-0.5">CBSE Benchmark Auto-filled</p>
                <p className="text-xs text-blue-700">{benchmarkPreview}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Years of Experience"
              type="number"
              min="0"
              value={form.experience}
              onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-amber-500" /> Budget CTC (₹ LPA)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.budgetCtc}
                  onChange={(e) => setForm((p) => ({ ...p, budgetCtc: e.target.value }))}
                  placeholder="e.g. 8.0"
                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400">Max budget per year</p>
            </div>
          </div>
          <Textarea
            label="Position Requirements *"
            value={form.requirements}
            onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
            placeholder="Describe specific requirements, skills, responsibilities..."
            rows={3}
          />
          <Textarea
            label="Minimum Qualification Required *"
            value={form.minQualification}
            onChange={(e) => setForm((p) => ({ ...p, minQualification: e.target.value }))}
            placeholder="Auto-filled from CBSE benchmark — edit as needed"
            rows={2}
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Additional information about the position..."
            rows={2}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              Create Position
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
