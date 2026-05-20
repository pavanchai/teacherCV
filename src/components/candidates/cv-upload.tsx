"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Link2, X, CheckCircle, ClipboardPaste, HardDriveDownload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CVUploadProps {
  onFileParsed: (data: {
    name: string; email: string; phone?: string; text: string; fileName?: string;
    qualifications?: string[]; experience?: string[]; subjects?: string[];
    certifications?: string[]; totalExperienceYears?: number;
    currentOrLastRole?: string; summary?: string;
  }) => void;
  positionId: string;
}

export function CVUpload({ onFileParsed, positionId }: CVUploadProps) {
  const [mode, setMode] = useState<"file" | "linkedin" | "drive">("file");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [linkedinText, setLinkedinText] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      setError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("positionId", positionId);
        const res = await fetch("/api/candidates/parse", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }
        const data = await res.json();
        setUploaded(file.name);
        onFileParsed({ ...data, fileName: file.name });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [positionId, onFileParsed]
  );

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

  const handleDriveImport = async () => {
    if (!driveUrl.trim()) return;
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/candidates/parse-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: driveUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to import from Drive");
      }
      const data = await res.json();
      setUploaded(data.fileName || "Google Drive file");
      onFileParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setUploading(false);
    }
  };

  const handleLinkedInPaste = async () => {
    if (!linkedinText.trim()) return;
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/candidates/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: linkedinText }),
      });
      if (!res.ok) throw new Error("Failed to parse profile text");
      const data = await res.json();
      setUploaded("LinkedIn profile");
      onFileParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {([
          { key: "file", icon: <Upload className="h-4 w-4" />, label: "Upload CV" },
          { key: "drive", icon: <HardDriveDownload className="h-4 w-4" />, label: "Google Drive" },
          { key: "linkedin", icon: <Link2 className="h-4 w-4" />, label: "LinkedIn" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setMode(tab.key); setUploaded(null); setError(""); }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              mode === tab.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : uploaded
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
          )}
        >
          <input {...getInputProps()} />
          {uploaded ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Uploaded: {uploaded}</p>
              <button onClick={(e) => { e.stopPropagation(); setUploaded(null); }} className="text-xs text-slate-500 underline">
                Replace
              </button>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Parsing CV...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isDragActive ? "Drop the file here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, DOCX, or TXT — max 10MB</p>
              </div>
            </div>
          )}
        </div>
      ) : mode === "drive" ? (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <HardDriveDownload className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-300">
              <p className="font-medium mb-1">How to share from Google Drive:</p>
              <ol className="space-y-0.5 text-xs list-decimal list-inside text-green-700 dark:text-green-400">
                <li>Open the resume file in Google Drive</li>
                <li>Right-click → <strong>Share</strong> → set to <strong>"Anyone with the link"</strong></li>
                <li>Click <strong>Copy link</strong> and paste it below</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Google Drive Link</label>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-slate-400">Supports PDF, DOCX, and Google Docs links</p>
          </div>

          {uploaded && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Imported: {uploaded}</p>
            </div>
          )}

          <Button
            onClick={handleDriveImport}
            loading={uploading}
            disabled={!driveUrl.trim() || uploading}
            icon={<HardDriveDownload className="h-4 w-4" />}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {uploading ? "Downloading & Parsing…" : "Import from Google Drive"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Instructions */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">How to copy from LinkedIn:</p>
              <ol className="space-y-0.5 text-xs list-decimal list-inside text-blue-700 dark:text-blue-400">
                <li>Open the candidate's LinkedIn profile</li>
                <li>Select all text on the page (<kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Ctrl+A</kbd> or <kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">⌘+A</kbd>)</li>
                <li>Copy (<kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Ctrl+C</kbd>) and paste below</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Paste LinkedIn profile text
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-colors"
              rows={8}
              placeholder="Paste the copied LinkedIn profile text here..."
              value={linkedinText}
              onChange={(e) => setLinkedinText(e.target.value)}
            />
            <p className="text-xs text-slate-400">{linkedinText.length} characters</p>
          </div>

          {uploaded && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Profile parsed successfully</p>
            </div>
          )}

          <Button
            onClick={handleLinkedInPaste}
            loading={uploading}
            disabled={linkedinText.trim().length < 50}
            icon={<ClipboardPaste className="h-4 w-4" />}
            className="w-full"
          >
            Parse Profile Text
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
