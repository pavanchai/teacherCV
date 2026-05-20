import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateCandidate } from "@/lib/ai/evaluator";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, positionId } = await req.json();

    if (!candidateId || !positionId) {
      return NextResponse.json({ error: "candidateId and positionId required" }, { status: 400 });
    }

    const [candidate, position] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: candidateId } }),
      prisma.position.findUnique({ where: { id: positionId } }),
    ]);

    if (!candidate || !position) {
      return NextResponse.json({ error: "Candidate or position not found" }, { status: 404 });
    }

    if (!candidate.cvText) {
      return NextResponse.json({ error: "No CV text available for evaluation" }, { status: 400 });
    }

    const evalResult = await evaluateCandidate({
      cvText: candidate.cvText,
      positionTitle: position.title,
      subject: position.subject,
      gradeLevel: position.gradeLevel,
      requirements: position.requirements,
      minQualification: position.minQualification,
      minExperience: position.experience,
    });

    const existing = await prisma.candidateEval.findFirst({
      where: { candidateId, positionId },
    });

    let evalRecord;
    if (existing) {
      evalRecord = await prisma.candidateEval.update({
        where: { id: existing.id },
        data: {
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
    } else {
      evalRecord = await prisma.candidateEval.create({
        data: {
          candidateId,
          positionId,
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
    }

    return NextResponse.json(evalRecord);
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
