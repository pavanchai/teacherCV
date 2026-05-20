"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CVUpload } from "./cv-upload";
import { useToast } from "@/components/ui/toast";
import { GraduationCap, Briefcase, BookOpen, Award, Clock, IndianRupee } from "lucide-react";

interface ParsedData {
  name: string;
  email: string;
  phone?: string;
  text: string;
  fileName?: string;
  qualifications?: string[];
  experience?: string[];
  subjects?: string[];
  certifications?: string[];
  totalExperienceYears?: number;
  currentOrLastRole?: string;
  summary?: string;
}

interface AddCandidateModalProps {
  open: boolean;
  onClose: () => void;
  positionId: string;
  onSuccess: () => void;
}

export function AddCandidateModal({ open, onClose, positionId, onSuccess }: AddCandidateModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"upload" | "details">("upload");
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", currentCtc: "", expectedCtc: "" });

  const handleParsed = (data: ParsedData) => {
    setParsedData(data);
    setForm({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      currentCtc: "",
      expectedCtc: "",
    });
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !parsedData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          cvText: parsedData.text,
          cvFileName: parsedData.fileName,
          positionId,
          currentCtc: form.currentCtc || null,
          expectedCtc: form.expectedCtc || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save candidate");
      toast("success", "Candidate added", `${form.name} has been added and is being evaluated.`);
      onSuccess();
      onClose();
      setStep("upload");
      setParsedData(null);
      setForm({ name: "", email: "", phone: "", currentCtc: "", expectedCtc: "" });
    } catch {
      toast("error", "Failed to add candidate");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep("upload");
    setParsedData(null);
    setForm({ name: "", email: "", phone: "", currentCtc: "", expectedCtc: "" });
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Candidate" description="Upload a CV or link LinkedIn profile" size="xl">
      {step === "upload" ? (
        <CVUpload onFileParsed={handleParsed} positionId={positionId} />
      ) : (
        <div className="space-y-5">
          {/* AI extracted summary */}
          {parsedData?.summary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">AI Summary</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">{parsedData.summary}</p>
            </div>
          )}

          {/* Editable contact fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Candidate full name"
            />
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="candidate@email.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+91 XXXXX XXXXX"
            />
            {parsedData?.totalExperienceYears !== undefined && parsedData.totalExperienceYears > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Experience</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {parsedData.totalExperienceYears} year{parsedData.totalExperienceYears !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CTC fields */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">CTC Details (₹ LPA)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Current CTC</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.currentCtc}
                    onChange={(e) => setForm((p) => ({ ...p, currentCtc: e.target.value }))}
                    placeholder="e.g. 4.5"
                    className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <p className="text-xs text-slate-400">Lakhs per annum</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Expected CTC</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.expectedCtc}
                    onChange={(e) => setForm((p) => ({ ...p, expectedCtc: e.target.value }))}
                    placeholder="e.g. 6.0"
                    className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <p className="text-xs text-slate-400">Lakhs per annum</p>
              </div>
            </div>
          </div>

          {/* Extracted data preview */}
          <div className="grid grid-cols-2 gap-4">
            {parsedData?.qualifications && parsedData.qualifications.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Qualifications</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.qualifications.map((q, i) => (
                    <Badge key={i} variant="info">{q}</Badge>
                  ))}
                </div>
              </div>
            )}

            {parsedData?.certifications && parsedData.certifications.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Certifications</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.certifications.map((c, i) => (
                    <Badge key={i} variant="success">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {parsedData?.subjects && parsedData.subjects.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subjects</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.subjects.map((s, i) => (
                    <Badge key={i} variant="default">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {parsedData?.experience && parsedData.experience.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Briefcase className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Experience</span>
                </div>
                <ul className="space-y-1">
                  {parsedData.experience.slice(0, 4).map((e, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                      <span className="text-amber-400 mt-0.5 shrink-0">•</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!form.name || !form.email} className="flex-1">
              Save & Evaluate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
