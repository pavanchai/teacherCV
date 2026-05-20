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
