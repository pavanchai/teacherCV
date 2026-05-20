"use client";

import { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Send, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  marks: number;
  order: number;
}

interface TestData {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string | null;
  timeLimitMins: number | null;
  passingScore: number;
  totalQuestions: number;
  questions: Question[];
}

interface SubmitResult {
  attemptId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  aiSummary: string;
  scores: Array<{ index: number; score: number; feedback: string }>;
}

const GRADE_LABELS: Record<string, string> = {
  PRIMARY_1_5: "Primary (1–5)",
  UPPER_PRIMARY_6_8: "Upper Primary (6–8)",
  SECONDARY_9_10: "Secondary (9–10)",
  SR_SECONDARY_11_12: "Sr. Secondary (11–12)",
};

type Stage = "register" | "test" | "submitted";

export default function TakeTestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [test, setTest] = useState<TestData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingTest, setLoadingTest] = useState(true);

  const [stage, setStage] = useState<Stage>("register");
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [regError, setRegError] = useState("");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    fetch(`/api/tests/token/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.error || "Test not found");
        }
        return r.json();
      })
      .then(setTest)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoadingTest(false));
  }, [token]);

  // Timer
  useEffect(() => {
    if (stage !== "test" || !test?.timeLimitMins) return;
    setTimeLeft(test.timeLimitMins * 60);
  }, [stage, test]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft]);

  const startTest = () => {
    if (!teacherName.trim() || !teacherEmail.trim()) {
      setRegError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherEmail)) {
      setRegError("Enter a valid email address.");
      return;
    }
    setRegError("");
    setStage("test");
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (forced = false) => {
    if (!forced && !test) return;
    if (!forced) {
      const unanswered = test!.questions.filter((q) => !answers[q.id]?.trim()).length;
      if (unanswered > 0) {
        if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, teacherName, teacherEmail, teacherPhone, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setResult(data);
      setStage("submitted");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Loading / error
  if (loadingTest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading test…</p>
        </div>
      </div>
    );
  }

  if (loadError || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Test Not Available</h2>
          <p className="text-slate-500 mt-2 text-sm">{loadError || "This test link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  // Registration screen
  if (stage === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Teacher Assessment</h1>
            <p className="text-slate-500 text-sm mt-1">TeacherCV · CBSE Portal</p>
          </div>

          {/* Test info card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{test.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {test.subject} · {GRADE_LABELS[test.gradeLevel] ?? test.gradeLevel}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />{test.totalQuestions} questions</span>
              {test.timeLimitMins && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-blue-500" />{test.timeLimitMins} min time limit</span>}
              <span className="flex items-center gap-1">Passing: {test.passingScore}%</span>
            </div>
            {test.description && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">{test.description}</p>
            )}
          </div>

          {/* Registration form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm">Your Details</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email Address *</label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phone (optional)</label>
              <input
                type="tel"
                value={teacherPhone}
                onChange={(e) => setTeacherPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {regError && <p className="text-sm text-red-500">{regError}</p>}
            <Button className="w-full" size="lg" onClick={startTest}>
              Start Test
            </Button>
            <p className="text-xs text-center text-slate-400">
              {test.timeLimitMins
                ? `Timer starts when you click "Start Test". You have ${test.timeLimitMins} minutes.`
                : "Take as much time as you need — there is no timer."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (stage === "submitted" && result) {
    const passed = result.passed;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            {/* Result banner */}
            <div className={cn("px-6 py-8 text-center", passed ? "bg-emerald-500" : "bg-slate-700")}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                {passed
                  ? <CheckCircle className="h-8 w-8 text-white" />
                  : <XCircle className="h-8 w-8 text-white" />
                }
              </div>
              <h2 className="text-2xl font-bold text-white">{passed ? "Test Passed!" : "Test Completed"}</h2>
              <p className="text-white/80 mt-1 text-sm">{passed ? "Great work, you met the passing criteria." : "Your results have been submitted for review."}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Score */}
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{result.totalScore}</p>
                  <p className="text-xs text-slate-400">out of {result.maxScore}</p>
                </div>
                <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center flex-1">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{result.percentage}%</p>
                  <p className="text-xs text-slate-400">score</p>
                </div>
                <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center flex-1">
                  <p className={cn("text-sm font-bold px-3 py-1 rounded-full", passed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400")}>
                    {passed ? "PASS" : "FAIL"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">result</p>
                </div>
              </div>

              {/* AI summary */}
              {result.aiSummary && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">AI Evaluation</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{result.aiSummary}</p>
                </div>
              )}

              {/* Per-question scores */}
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Question Breakdown</p>
                <div className="space-y-2">
                  {test.questions.map((q, idx) => {
                    const scored = result.scores.find((s) => s.index === idx);
                    const full = scored?.score === q.marks;
                    return (
                      <div key={q.id} className="flex items-start gap-3 text-xs">
                        <span className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white", full ? "bg-emerald-500" : (scored?.score ?? 0) > 0 ? "bg-amber-400" : "bg-red-400")}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-1">{q.question}</p>
                          {scored?.feedback && <p className="text-slate-400 mt-0.5 italic">{scored.feedback}</p>}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                          {scored?.score ?? 0}/{q.marks}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-center text-slate-400 pt-2">
                Your results have been sent to the school portal for review.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test screen
  const q = test.questions[current];
  const answered = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const isLast = current === test.questions.length - 1;
  const timerWarning = timeLeft !== null && timeLeft < 120;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{test.title}</p>
            <p className="text-xs text-slate-400">{teacherName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500">{answered}/{test.questions.length} answered</span>
          {timeLeft !== null && (
            <span className={cn("flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1 rounded-lg", timerWarning ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300")}>
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6 gap-5">
        {/* Question navigator */}
        <div className="flex flex-wrap gap-1.5">
          {test.questions.map((tq, idx) => (
            <button
              key={tq.id}
              onClick={() => setCurrent(idx)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                idx === current
                  ? "bg-blue-600 text-white shadow-sm"
                  : answers[tq.id]?.trim()
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded font-medium">{q.type}</span>
              <span className="text-xs text-slate-400">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
            </div>
            <span className="text-xs text-slate-400">Q{current + 1} of {test.questions.length}</span>
          </div>

          <div className="px-6 py-5 space-y-5">
            <p className="text-slate-900 dark:text-slate-100 text-base leading-relaxed">{q.question}</p>

            {/* MCQ */}
            {q.type === "MCQ" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswer(q.id, opt)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                      answers[q.id] === opt
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                  >
                    <span className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0", answers[q.id] === opt ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-400")}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={cn("text-sm", answers[q.id] === opt ? "text-blue-700 dark:text-blue-300 font-medium" : "text-slate-700 dark:text-slate-300")}>
                      {opt}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* True / False */}
            {q.type === "TRUE_FALSE" && (
              <div className="flex gap-3">
                {["True", "False"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(q.id, opt)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                      answers[q.id] === opt
                        ? opt === "True" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Short answer */}
            {q.type === "SHORT" && (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={4}
                placeholder="Write your answer here (2–4 sentences)…"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}

            {/* Long answer */}
            {q.type === "LONG" && (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={8}
                placeholder="Write a detailed answer here…"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Previous
          </Button>

          {isLast ? (
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={() => handleSubmit(false)}
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Submit Test
            </Button>
          ) : (
            <Button
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setCurrent((c) => Math.min(test.questions.length - 1, c + 1))}
            >
              Next
            </Button>
          )}
        </div>

        {/* Submit shortcut from any question */}
        {!isLast && answered === test.questions.length && (
          <div className="text-center">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="text-sm text-emerald-600 hover:underline font-medium"
            >
              All questions answered — submit now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
