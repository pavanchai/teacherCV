"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Users, CheckCircle, XCircle, Clock,
  Copy, Check, Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string | null;
  marks: number;
  order: number;
}

interface Response {
  id: string;
  questionId: string;
  answer: string;
  score: number | null;
  aiFeedback: string | null;
  question: Question;
}

interface Attempt {
  id: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string | null;
  status: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  aiSummary: string | null;
  startedAt: string;
  submittedAt: string | null;
  responses: Response[];
}

interface TestTemplate {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string | null;
  questionTypes: string;
  totalQuestions: number;
  timeLimitMins: number | null;
  passingScore: number;
  status: string;
  shareToken: string;
  questions: Question[];
  attempts: Attempt[];
}

const GRADE_LABELS: Record<string, string> = {
  PRIMARY_1_5: "Primary (1–5)",
  UPPER_PRIMARY_6_8: "Upper Primary (6–8)",
  SECONDARY_9_10: "Secondary (9–10)",
  SR_SECONDARY_11_12: "Sr. Secondary (11–12)",
};

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [test, setTest] = useState<TestTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then((r) => r.json())
      .then(setTest)
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = () => {
    if (!test) return;
    navigator.clipboard.writeText(`${window.location.origin}/take-test/${test.shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = async () => {
    if (!test) return;
    const { generateQuestionPaperPDF } = await import("@/lib/pdf/question-paper");
    generateQuestionPaperPDF(test);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Test Details" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Test Not Found" />
        <div className="p-6">
          <p className="text-slate-500">This test does not exist.</p>
        </div>
      </div>
    );
  }

  const submitted = test.attempts.filter((a) => a.status === "SUBMITTED");
  const passed = submitted.filter((a) => a.passed);
  const avgPct = submitted.length
    ? Math.round(submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length)
    : null;
  const types: string[] = JSON.parse(test.questionTypes);

  return (
    <div className="flex flex-col h-full">
      <Header
        title={test.title}
        description={`${test.subject} · ${GRADE_LABELS[test.gradeLevel] ?? test.gradeLevel}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={downloadPDF}>
              Download PDF
            </Button>
            <Button
              variant="outline"
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={copyLink}
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Questions", value: test.totalQuestions, icon: <ClipboardList className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50 dark:bg-blue-900/30" },
            { label: "Attempts", value: submitted.length, icon: <Users className="h-5 w-5 text-violet-600" />, bg: "bg-violet-50 dark:bg-violet-900/30" },
            { label: "Passed", value: passed.length, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-900/30" },
            { label: "Avg Score", value: avgPct !== null ? `${avgPct}%` : "—", icon: <Clock className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50 dark:bg-amber-900/30" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stat.value}</p>
                  </div>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.bg)}>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test meta */}
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Test Configuration</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-slate-400">Question Types</p><div className="flex gap-1 mt-1 flex-wrap">{types.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">{t}</span>)}</div></div>
              <div><p className="text-xs text-slate-400">Time Limit</p><p className="font-medium mt-1">{test.timeLimitMins ? `${test.timeLimitMins} min` : "No limit"}</p></div>
              <div><p className="text-xs text-slate-400">Passing Score</p><p className="font-medium mt-1">{test.passingScore}%</p></div>
              <div><p className="text-xs text-slate-400">Status</p><Badge className="mt-1" variant={test.status === "ACTIVE" ? "success" : "default"}>{test.status}</Badge></div>
            </div>
            {test.description && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">{test.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Question paper preview */}
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Question Paper ({test.questions.length} questions)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.questions.map((q, i) => (
              <div key={q.id} className="flex gap-3">
                <span className="text-sm font-semibold text-slate-400 w-6 shrink-0 mt-0.5">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded font-medium">{q.type}</span>
                    <span className="text-xs text-slate-400">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{q.question}</p>
                  {q.options && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {q.options.map((opt, j) => (
                        <span key={j} className={cn("text-xs px-2 py-1 rounded border", opt === q.correctAnswer ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400")}>
                          {String.fromCharCode(65 + j)}. {opt}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.type === "TRUE_FALSE" && (
                    <p className="text-xs text-emerald-600 mt-1">Answer: {q.correctAnswer}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Attempt results */}
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Teacher Submissions ({submitted.length})</p>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {submitted.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No submissions yet. Share the test link to get started.</p>
            ) : (
              submitted.map((attempt) => (
                <AttemptRow
                  key={attempt.id}
                  attempt={attempt}
                  passingScore={test.passingScore}
                  expanded={expandedAttempt === attempt.id}
                  onToggle={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttemptRow({
  attempt, passingScore, expanded, onToggle,
}: {
  attempt: Attempt;
  passingScore: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pct = attempt.percentage ?? 0;
  const passed = attempt.passed;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", passed ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40")}>
          {passed
            ? <CheckCircle className="h-4 w-4 text-emerald-600" />
            : <XCircle className="h-4 w-4 text-red-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{attempt.teacherName}</p>
          <p className="text-xs text-slate-400">{attempt.teacherEmail}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{attempt.totalScore}/{attempt.maxScore}</p>
          <p className="text-xs text-slate-400">{pct}%</p>
        </div>
        <div className="w-16 shrink-0">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", pct >= passingScore ? "bg-emerald-500" : "bg-red-400")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 space-y-3 pt-3">
          {attempt.aiSummary && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">AI Summary</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">{attempt.aiSummary}</p>
            </div>
          )}
          <div className="space-y-2">
            {attempt.responses.map((r, idx) => (
              <div key={r.id} className="text-xs border border-slate-100 dark:border-slate-800 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Q{idx + 1}. {r.question.question}</span>
                  <span className={cn("shrink-0 font-bold", (r.score ?? 0) === r.question.marks ? "text-emerald-600" : "text-slate-500")}>
                    {r.score ?? "—"}/{r.question.marks}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 italic">"{r.answer || "(no answer)"}"</p>
                {r.aiFeedback && <p className="mt-1 text-slate-400">{r.aiFeedback}</p>}
              </div>
            ))}
          </div>
          {attempt.submittedAt && (
            <p className="text-xs text-slate-400 text-right">
              Submitted {format(new Date(attempt.submittedAt), "d MMM yyyy, h:mm a")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
