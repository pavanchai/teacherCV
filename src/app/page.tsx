"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  Users, Briefcase, BookmarkCheck, TrendingUp, CheckCircle, Star,
  Link2, Copy, Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getGradeLabel } from "@/lib/utils";

interface Stats {
  candidates: number;
  positions: number;
  shortlists: number;
  evaluations: number;
  avgScore: number;
  benchmarkMet: number;
  recCounts: Record<string, number>;
}

interface Position {
  id: string; title: string; subject: string; gradeLevel: string;
}

function CopyLinkButton({ positionId }: { positionId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/apply/${positionId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    fetch("/api/positions").then(r => r.json()).then(d => setPositions(Array.isArray(d) ? d.slice(0, 6) : [])).catch(() => {});
  }, []);

  const statCards = [
    {
      label: "Total Candidates",
      value: stats?.candidates ?? "—",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-50 dark:bg-blue-900/30",
      href: "/candidates",
    },
    {
      label: "Active Positions",
      value: stats?.positions ?? "—",
      icon: <Briefcase className="h-5 w-5 text-violet-600" />,
      bg: "bg-violet-50 dark:bg-violet-900/30",
      href: "/positions",
    },
    {
      label: "Shortlists",
      value: stats?.shortlists ?? "—",
      icon: <BookmarkCheck className="h-5 w-5 text-emerald-600" />,
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      href: "/shortlists",
    },
    {
      label: "AI Evaluations",
      value: stats?.evaluations ?? "—",
      icon: <Star className="h-5 w-5 text-amber-600" />,
      bg: "bg-amber-50 dark:bg-amber-900/30",
      href: "/candidates",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        description="Overview of your teacher recruitment pipeline"
        actions={
          <Link href="/positions">
            <Button icon={<Briefcase className="h-4 w-4" />}>New Position</Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{card.label}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{card.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                      {card.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avg score ring */}
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-slate-700 mb-4">Average Candidate Score</p>
              <div className="flex items-center gap-6">
                <ScoreRing score={stats?.avgScore ?? 0} size="lg" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold">{stats?.benchmarkMet ?? 0}</span> meet CBSE benchmark
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold">{stats?.evaluations ?? 0}</span> evaluations done
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation breakdown */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-slate-700 mb-4">Recommendation Breakdown</p>
              {stats?.recCounts ? (
                <div className="space-y-3">
                  {[
                    { key: "STRONGLY_RECOMMENDED", label: "Strongly Recommended", color: "bg-emerald-500" },
                    { key: "RECOMMENDED", label: "Recommended", color: "bg-blue-500" },
                    { key: "CONSIDER", label: "Consider", color: "bg-amber-500" },
                    { key: "NOT_RECOMMENDED", label: "Not Recommended", color: "bg-red-500" },
                  ].map(({ key, label, color }) => {
                    const count = stats.recCounts[key] || 0;
                    const total = stats.evaluations || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-40 shrink-0">{label}</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">No evaluations yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-700 mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href: "/positions", icon: <Briefcase className="h-5 w-5" />, label: "Create Position", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
                { href: "/candidates", icon: <Users className="h-5 w-5" />, label: "Add Candidate", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/30" },
                { href: "/shortlists", icon: <BookmarkCheck className="h-5 w-5" />, label: "View Shortlists", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
                { href: "/compare", icon: <TrendingUp className="h-5 w-5" />, label: "Compare Candidates", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30" },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer group">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application links */}
        {positions.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Share Application Links</p>
                    <p className="text-xs text-slate-400">Send these links to teachers — they can apply directly</p>
                  </div>
                </div>
                <Link href="/positions" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-2">
                {positions.map(pos => (
                  <div key={pos.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{pos.title}</p>
                      <p className="text-xs text-slate-400 truncate">{pos.subject} · {getGradeLabel(pos.gradeLevel)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/apply/${pos.id}`}
                        target="_blank"
                        className="text-xs text-slate-400 hover:text-blue-600 underline underline-offset-2 transition-colors"
                      >
                        Preview
                      </Link>
                      <CopyLinkButton positionId={pos.id} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CBSE info banner */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">CBSE & NCTE Qualification Benchmarks</h3>
              <p className="text-blue-200 text-sm mt-1 leading-relaxed">
                All candidate evaluations are benchmarked against official CBSE/NCTE minimum qualification norms —
                including CTET/TET requirements for Primary and Upper Primary, and B.Ed requirements for Secondary and
                Senior Secondary levels. Scores include a <strong>Meets Benchmark</strong> flag so shortlisting decisions
                stay compliant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
