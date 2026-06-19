"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Briefcase, BookmarkCheck,
  GitCompareArrows, FileBarChart2, GraduationCap, ClipboardList,
  Sun, Moon, Link2, Copy, Check, X, ExternalLink, ChevronRight,
} from "lucide-react";
import { cn, getGradeLabel } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/positions", icon: Briefcase, label: "Positions" },
  { href: "/candidates", icon: Users, label: "Candidates" },
  { href: "/shortlists", icon: BookmarkCheck, label: "Shortlists" },
  { href: "/compare", icon: GitCompareArrows, label: "Compare" },
  { href: "/reports", icon: FileBarChart2, label: "Reports" },
  { href: "/tests", icon: ClipboardList, label: "Tests" },
];

interface Position {
  id: string; title: string; subject: string; gradeLevel: string;
}

// ── copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy link"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
        copied
          ? "bg-emerald-500 text-white"
          : "bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── share panel ─────────────────────────────────────────────────────────────

function SharePanel({ onClose }: { onClose: () => void }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/positions")
      .then(r => r.json())
      .then(d => setPositions(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel — slides in from left, sits beside the sidebar */}
      <div className="fixed top-0 left-64 z-50 h-full w-96 max-w-[calc(100vw-16rem)] bg-white dark:bg-slate-900 shadow-2xl flex flex-col">

        {/* header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Share Application Links</p>
                <p className="text-xs text-blue-200">Send to teachers to apply directly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* how it works */}
        <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Each position has a unique link. Share it via WhatsApp, email, or notice board —
            teachers fill their details and upload their CV directly.
          </p>
        </div>

        {/* position list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                <Briefcase className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No positions yet</p>
              <p className="text-xs text-slate-400 mt-1">Create a position first to get its link</p>
              <Link
                href="/positions"
                onClick={onClose}
                className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Go to Positions <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            positions.map((pos) => {
              const url = `${origin}/apply/${pos.id}`;
              return (
                <div
                  key={pos.id}
                  className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* position info */}
                  <div className="px-4 pt-3.5 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{pos.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {pos.subject} · {getGradeLabel(pos.gradeLevel)}
                        </p>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shrink-0"
                        title="Preview page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* link row */}
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                      <p className="flex-1 text-xs text-slate-500 dark:text-slate-400 truncate font-mono">{url}</p>
                      <CopyBtn url={url} />
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Apply for ${pos.title} (${pos.subject}): ${url}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700"
                        title="Share via WhatsApp"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-center text-slate-400">
            Applications auto-appear in your{" "}
            <Link href="/candidates" onClick={onClose} className="text-blue-600 hover:underline">
              Candidates
            </Link>{" "}
            page after submission
          </p>
        </div>
      </div>
    </>
  );
}

// ── theme toggle ────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <div className="flex items-center gap-2">
        {isDark
          ? <Moon className="h-4 w-4 text-blue-400" />
          : <Sun className="h-4 w-4 text-amber-400" />
        }
        <span className="text-xs font-medium text-slate-400">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      </div>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle dark mode"
        style={{
          position: "relative", width: 44, height: 24, borderRadius: 12,
          border: "none", cursor: "pointer", flexShrink: 0,
          backgroundColor: isDark ? "#475569" : "#3b82f6",
          transition: "background-color 0.3s",
        }}
      >
        <span
          style={{
            position: "absolute", top: 2, left: isDark ? 2 : 22,
            width: 20, height: 20, borderRadius: "50%",
            backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left 0.3s",
          }}
        />
      </button>
    </div>
  );
}

// ── sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <aside className="w-64 h-screen bg-slate-900 flex flex-col shrink-0 overflow-hidden">
        {/* logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">TeacherCV</p>
              <p className="text-slate-400 text-xs">Shortlisting Portal</p>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {/* share button — sits right below the nav list */}
          <div className="pt-2">
            <button
              onClick={() => setShareOpen(true)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30",
                "text-blue-400 hover:text-white hover:from-blue-600 hover:to-indigo-600 hover:border-transparent",
                shareOpen && "from-blue-600 to-indigo-600 text-white border-transparent"
              )}
            >
              <Link2 className="h-4 w-4 shrink-0" />
              <span>Share Apply Links</span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            </button>
          </div>
        </nav>

        {/* bottom */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <ThemeToggle />
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-slate-300 text-xs font-medium mb-1">CBSE Benchmarks</p>
            <p className="text-slate-500 text-xs">Evaluations follow NCTE & CBSE qualification norms.</p>
          </div>
        </div>
      </aside>

      {/* share panel */}
      {shareOpen && <SharePanel onClose={() => setShareOpen(false)} />}
    </>
  );
}
