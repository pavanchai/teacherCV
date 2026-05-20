import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateCandidate } from "@/lib/ai/evaluator";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "org_default";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const positionId = searchParams.get("positionId");

  const candidates = await prisma.candidate.findMany({
    where: {
      organizationId: DEFAULT_ORG_ID,
      ...(positionId
        ? { evaluations: { some: { positionId } } }
        : {}),
    },
    include: {
      evaluations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(candidates);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, cvText, cvFileName, linkedinUrl, positionId, currentCtc, expectedCtc } = body;

    if (!name || !email || !cvText) {
      return NextResponse.json({ error: "name, email and cvText are required" }, { status: 400 });
    }

    let org = await prisma.organization.findUnique({ where: { id: DEFAULT_ORG_ID } });
    if (!org) {
      org = await prisma.organization.create({
        data: { id: DEFAULT_ORG_ID, name: "Default School", email: "admin@school.edu.in" },
      });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone: phone || null,
        cvText,
        cvFileName: cvFileName || null,
        linkedinUrl: linkedinUrl || null,
        currentCtc: currentCtc ? parseFloat(currentCtc) : null,
        expectedCtc: expectedCtc ? parseFloat(expectedCtc) : null,
        organizationId: DEFAULT_ORG_ID,
      },
    });

    if (positionId) {
      const position = await prisma.position.findUnique({ where: { id: positionId } });
      if (position) {
        try {
          const evalResult = await evaluateCandidate({
            cvText,
            positionTitle: position.title,
            subject: position.subject,
            gradeLevel: position.gradeLevel,
            requirements: position.requirements,
            minQualification: position.minQualification,
            minExperience: position.experience,
          });

          await prisma.candidateEval.create({
            data: {
              candidateId: candidate.id,
              positionId: position.id,
              overallScore: evalResult.overallScore,
              qualificationScore: evalResult.qualificationScore,
              experienceScore: evalResult.experienceScore,
              subjectScore: evalResult.subjectScore,
              softSkillScore: evalResult.softSkillScore,
              strengths: JSON.stringify(evalResult.strengths),
              weaknesses: JSON.stringify(evalResult.weaknesses),
              recommendation: evalResult.recommendation,
              meetsBenchmark: evalResult.meetsBenchmark,
              aiSummary: evalResult.aiSummary,
              rawEvaluation: evalResult.detailedAnalysis,
            },
          });
        } catch (evalError) {
          console.error("Evaluation failed:", evalError);
        }
      }
    }

    const result = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: { evaluations: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/candidates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
