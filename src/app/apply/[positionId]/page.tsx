"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  GraduationCap, Upload, FileText, CheckCircle, XCircle,
  Loader2, User, Mail, Phone, BookOpen, Building2, AlertCircle, IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGradeLabel } from "@/lib/utils";

interface Position {
  id: string; title: string; subject: string; gradeLevel: string;
  description?: string; requirements: string; minQualification: string;
  experience: number;
}

type Step = "form" | "uploading" | "success" | "error";

export default function ApplyPage() {
  const { positionId } = useParams<{ positionId: string }>();
  const [position, setPosition] = useState<Position | null>(null);
  const [posLoading, setPosLoading] = useState(true);
  const [posError, setPosError] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", currentCtc: "", expectedCtc: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/positions/${positionId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPosition)
      .catch(() => setPosError(true))
      .finally(() => setPosLoading(false));
  }, [positionId]);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setCvFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (!cvFile) errs.cv = "Please upload your CV";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep("uploading");

    try {
      // 1. parse the CV
      const fd = new FormData();
      fd.append("file", cvFile!);
      fd.append("positionId", positionId);
      const parseRes = await fetch("/api/candidates/parse", { method: "POST", body: fd });
      if (!parseRes.ok) throw new Error("Failed to read CV");
      const parsed = await parseRes.json();

      // 2. create the candidate (triggers AI evaluation)
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || parsed.name,
          email: form.email.trim() || parsed.email,
          phone: form.phone.trim() || parsed.phone || null,
          cvText: parsed.text,
          cvFileName: cvFile!.name,
          positionId,
          currentCtc: form.currentCtc || null,
          expectedCtc: form.expectedCtc || null,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  // ── loading / error states ────────────────────────────────────────────────

  if (posLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (posError || !position) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 p-8 max-w-md w-full text-center shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Position not found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            This application link may be expired or invalid. Please contact the school directly.
          </p>
        </div>
      </div>
    );
  }

  // ── success ───────────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Application Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm leading-relaxed">
            Your CV has been received and is being evaluated for the{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{position.title}</span> position.
            The school will contact you if you are shortlisted.
          </p>
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left space-y-1.5">
            <p className="text-xs text-slate-500">Applied for</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{position.title}</p>
            <p className="text-xs text-slate-500">{position.subject} · {getGradeLabel(position.gradeLevel)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 p-8 max-w-md w-full text-center shadow-xl">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submission failed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{errorMsg}</p>
          <button
            onClick={() => setStep("form")}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── uploading ─────────────────────────────────────────────────────────────

  if (step === "uploading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 max-w-md w-full text-center shadow-2xl">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <GraduationCap className="absolute inset-0 m-auto h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Processing your CV…</h2>
          <p className="text-sm text-slate-400 mt-2">Our AI is evaluating your application. This may take a moment.</p>
        </div>
      </div>
    );
  }

  // ── main form ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-5">

        {/* header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 shadow-sm">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Teacher Application</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{position.title}</h1>
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-slate-500">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{position.subject}</span>
            <span className="text-slate-300">·</span>
            <span>{getGradeLabel(position.gradeLevel)}</span>
            {position.experience > 0 && <>
              <span className="text-slate-300">·</span>
              <span>{position.experience}+ yrs experience</span>
            </>}
          </div>
        </div>

        {/* position details card */}
        {(position.description || position.minQualification) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            {position.description && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">About this role</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{position.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Minimum Qualification</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{position.minQualification}</p>
            </div>
          </div>
        )}

        {/* form card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Your Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in your information and upload your CV</p>
          </div>

          <div className="p-6 space-y-4">
            {/* name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" /> Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: "" })); }}
                placeholder="e.g. Priya Sharma"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                  formErrors.name ? "border-red-400" : "border-slate-300 dark:border-slate-600"
                )}
              />
              {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
            </div>

            {/* email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: "" })); }}
                placeholder="you@example.com"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                  formErrors.email ? "border-red-400" : "border-slate-300 dark:border-slate-600"
                )}
              />
              {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
            </div>

            {/* phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* CTC */}
            <div className="space-y-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <label className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4" /> CTC Details (₹ LPA)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Current CTC</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.currentCtc}
                      onChange={e => setForm(p => ({ ...p, currentCtc: e.target.value }))}
                      placeholder="e.g. 4.5"
                      className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Lakhs per annum</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Expected CTC</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.expectedCtc}
                      onChange={e => setForm(p => ({ ...p, expectedCtc: e.target.value }))}
                      placeholder="e.g. 6.0"
                      className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Lakhs per annum</p>
                </div>
              </div>
            </div>

            {/* cv upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Upload CV / Resume *
              </label>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : cvFile
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                    : formErrors.cv
                    ? "border-red-400 bg-red-50 dark:bg-red-900/10"
                    : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                )}
              >
                <input {...getInputProps()} />
                {cvFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{cvFile.name}</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setCvFile(null); }}
                      className="text-xs text-slate-400 underline hover:text-slate-600"
                    >
                      Replace file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isDragActive ? "Drop your CV here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-slate-400">PDF, DOCX, or TXT — max 10 MB</p>
                  </div>
                )}
              </div>
              {formErrors.cv && <p className="text-xs text-red-500">{formErrors.cv}</p>}
            </div>

            {/* submit */}
            <button
              onClick={handleSubmit}
              className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Submit Application
            </button>

            <p className="text-xs text-center text-slate-400 mt-2">
              Your data is used only for recruitment evaluation. We don't share it with third parties.
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="text-center flex items-center justify-center gap-2 text-xs text-slate-400">
          <Building2 className="h-3.5 w-3.5" />
          <span>Powered by TeacherCV Portal</span>
        </div>
      </div>
    </div>
  );
}
