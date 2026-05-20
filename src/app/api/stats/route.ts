import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "org_default";

export async function GET() {
  const [candidates, positions, shortlists, evals] = await Promise.all([
    prisma.candidate.count({ where: { organizationId: DEFAULT_ORG_ID } }),
    prisma.position.count({ where: { organizationId: DEFAULT_ORG_ID } }),
    prisma.shortlist.count({ where: { organizationId: DEFAULT_ORG_ID } }),
    prisma.candidateEval.findMany({
      where: { candidate: { organizationId: DEFAULT_ORG_ID } },
      select: { overallScore: true, meetsBenchmark: true, recommendation: true },
    }),
  ]);

  const avgScore = evals.length
    ? Math.round(evals.reduce((sum, e) => sum + e.overallScore, 0) / evals.length)
    : 0;

  const benchmarkMet = evals.filter((e) => e.meetsBenchmark).length;

  const recCounts = evals.reduce<Record<string, number>>((acc, e) => {
    acc[e.recommendation] = (acc[e.recommendation] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    candidates,
    positions,
    shortlists,
    evaluations: evals.length,
    avgScore,
    benchmarkMet,
    recCounts,
  });
}
