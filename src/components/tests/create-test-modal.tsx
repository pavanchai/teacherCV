"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "English", "Hindi", "Social Science", "History", "Geography",
  "Political Science", "Economics", "Computer Science",
  "Physical Education", "Art & Craft", "Music", "General",
];

const GRADE_LEVELS = [
  { value: "PRIMARY_1_5", label: "Primary (Class 1–5)" },
  { value: "UPPER_PRIMARY_6_8", label: "Upper Primary (Class 6–8)" },
  { value: "SECONDARY_9_10", label: "Secondary (Class 9–10)" },
  { value: "SR_SECONDARY_11_12", label: "Senior Secondary (Class 11–12)" },
];

const QUESTION_TYPES = [
  { value: "MCQ", label: "MCQ", desc: "4-option multiple choice (auto-graded)" },
  { value: "TRUE_FALSE", label: "True / False", desc: "Simple T/F (auto-graded)" },
  { value: "SHORT", label: "Short Answer", desc: "2–4 line answer (AI graded)" },
  { value: "LONG", label: "Long / Descriptive", desc: "Paragraph answer (AI graded)" },
];

const TIME_OPTIONS = [
  { value: "", label: "No time limit" },
  { value: "15", label: "15 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "2 hours" },
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTestModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [description, setDescription] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["MCQ"]);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimitMins, setTimeLimitMins] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? (prev.length > 1 ? prev.filter((t) => t !== type) : prev) : [...prev, type]
    );
  };

  const submit = async () => {
    if (!title || !subject || !gradeLevel || selectedTypes.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          gradeLevel,
          description: description || undefined,
          customTopic: customTopic || undefined,
          questionTypes: selectedTypes,
          totalQuestions,
          timeLimitMins: timeLimitMins ? Number(timeLimitMins) : null,
          passingScore,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create test");
      }
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Create AI Test</p>
                <p className="text-xs text-slate-400">Claude will generate questions automatically</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mathematics Competency Test – Grade 6–8"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select grade</option>
                    {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Specific Topic (optional)
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Fractions and decimals, Photosynthesis, Mughal Empire…"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Leave blank for broad subject coverage</p>
              </div>
            </div>

            {/* Question types */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Question Types <span className="text-red-500">*</span>
                <span className="ml-1 font-normal text-slate-400">(select one or more)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUESTION_TYPES.map((qt) => {
                  const active = selectedTypes.includes(qt.value);
                  return (
                    <button
                      key={qt.value}
                      type="button"
                      onClick={() => toggleType(qt.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all",
                        active
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <p className={cn("text-sm font-medium", active ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>
                        {qt.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{qt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count + time + pass */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={3}
                  max={50}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">3–50 questions</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Time Limit
                </label>
                <select
                  value={timeLimitMins}
                  onChange={(e) => setTimeLimitMins(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Instructions or notes for the teacher taking this test…"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-400">
              Claude AI will generate {totalQuestions} questions for {subject || "the selected subject"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={submit} loading={loading} icon={<Sparkles className="h-4 w-4" />}>
                {loading ? "Generating…" : "Generate Test"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
