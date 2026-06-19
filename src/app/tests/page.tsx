"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateTestModal } from "@/components/tests/create-test-modal";
import {
  ClipboardList, Plus, Copy, Check, Users, Clock, Trash2,
  ExternalLink, ToggleLeft, ToggleRight, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TestTemplate {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  questionTypes: string;
  totalQuestions: number;
  timeLimitMins: number | null;
  passingScore: number;
  status: string;
  shareToken: string;
  createdAt: string;
  _count: { questions: number; attempts: number };
}

const GRADE_LABELS: Record<string, string> = {
  PRIMARY_1_5: "Primary (1–5)",
  UPPER_PRIMARY_6_8: "Upper Primary (6–8)",
  SECONDARY_9_10: "Secondary (9–10)",
  SR_SECONDARY_11_12: "Sr. Secondary (11–12)",
};

function CopyTokenBtn({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(`${window.location.origin}/take-test/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        copied
          ? "bg-emerald-500 text-white"
          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy Test Link"}
    </button>
  );
}

function WhatsAppButton({ url, text }: { url: string; text: string }) {
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    setShareUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}: ${window.location.origin}${url}`)}`);
  }, [url, text]);

  if (!shareUrl) return null;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
      title="Share via WhatsApp"
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/tests")
      .then((r) => r.json())
      .then(setTests)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteTest = async (id: string) => {
    if (!confirm("Delete this test and all its responses?")) return;
    setDeleting(id);
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  const toggleStatus = async (test: TestTemplate) => {
    setToggling(test.id);
    const newStatus = test.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    await fetch(`/api/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setToggling(null);
    load();
  };

  const active = tests.filter((t) => t.status === "ACTIVE");
  const archived = tests.filter((t) => t.status !== "ACTIVE");

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Teacher Tests"
        description="Create AI-generated tests and share links with teachers"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            Create Test
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Tests", value: tests.length, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
            { label: "Active Tests", value: active.length, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
            {
              label: "Total Attempts",
              value: tests.reduce((s, t) => s + t._count.attempts, 0),
              color: "text-violet-600 bg-violet-50 dark:bg-violet-900/30",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className={cn("text-3xl font-bold mt-1", stat.color.split(" ")[0])}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No tests yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first AI-generated teacher test</p>
              <Button className="mt-4" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                Create Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                  Active
                </h2>
                <div className="space-y-3">
                  {active.map((test) => (
                    <TestCard
                      key={test.id}
                      test={test}
                      onDelete={() => deleteTest(test.id)}
                      onToggle={() => toggleStatus(test)}
                      deleting={deleting === test.id}
                      toggling={toggling === test.id}
                    />
                  ))}
                </div>
              </section>
            )}
            {archived.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-500 mb-3 uppercase tracking-wide">
                  Archived
                </h2>
                <div className="space-y-3">
                  {archived.map((test) => (
                    <TestCard
                      key={test.id}
                      test={test}
                      onDelete={() => deleteTest(test.id)}
                      onToggle={() => toggleStatus(test)}
                      deleting={deleting === test.id}
                      toggling={toggling === test.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateTestModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function TestCard({
  test, onDelete, onToggle, deleting, toggling,
}: {
  test: TestTemplate;
  onDelete: () => void;
  onToggle: () => void;
  deleting: boolean;
  toggling: boolean;
}) {
  const types: string[] = JSON.parse(test.questionTypes);
  const isActive = test.status === "ACTIVE";

  return (
    <Card className={cn(!isActive && "opacity-60")}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{test.title}</h3>
              <Badge variant={isActive ? "success" : "default"}>{isActive ? "Active" : "Archived"}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {test.subject} · {GRADE_LABELS[test.gradeLevel] ?? test.gradeLevel}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <ClipboardList className="h-3.5 w-3.5" />
                {test.totalQuestions} questions
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {test._count.attempts} attempts
              </span>
              {test.timeLimitMins && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {test.timeLimitMins} min
                </span>
              )}
              <div className="flex gap-1">
                {types.map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {isActive && (
              <>
                <CopyTokenBtn token={test.shareToken} />
                <WhatsAppButton url={`/take-test/${test.shareToken}`} text={`Take this test: ${test.title}`} />
              </>
            )}
            <a
              href={`/take-test/${test.shareToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              title="Preview test"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={onToggle}
              disabled={toggling}
              title={isActive ? "Archive test" : "Activate test"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50"
            >
              {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            </button>
            <Link
              href={`/tests/${test.id}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="View results"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              onClick={onDelete}
              disabled={deleting}
              title="Delete test"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
