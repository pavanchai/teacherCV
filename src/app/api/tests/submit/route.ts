import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gradeTestResponses, type QuestionType } from "@/lib/ai/test-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, teacherName, teacherEmail, teacherPhone, answers } = body;
    // answers: { [questionId: string]: string }

    if (!token || !teacherName || !teacherEmail || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const test = await prisma.testTemplate.findUnique({
      where: { shareToken: token },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    if (test.status !== "ACTIVE")
      return NextResponse.json({ error: "Test is no longer active" }, { status: 403 });

    // Build grading input
    const gradingInput = test.questions.map((q) => ({
      type: q.type as QuestionType,
      question: q.question,
      correctAnswer: q.correctAnswer ?? undefined,
      marks: q.marks,
      answer: answers[q.id] ?? "",
    }));

    const result = await gradeTestResponses({
      subject: test.subject,
      gradeLevel: test.gradeLevel,
      questions: gradingInput,
    });

    // Persist attempt + responses
    const attempt = await prisma.testAttempt.create({
      data: {
        templateId: test.id,
        teacherName,
        teacherEmail,
        teacherPhone: teacherPhone || null,
        status: "SUBMITTED",
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.percentage >= test.passingScore,
        aiSummary: result.aiSummary,
        submittedAt: new Date(),
        responses: {
          create: test.questions.map((q, idx) => {
            const scored = result.scores.find((s) => s.index === idx);
            return {
              questionId: q.id,
              answer: answers[q.id] ?? "",
              score: scored?.score ?? null,
              aiFeedback: scored?.feedback ?? null,
            };
          }),
        },
      },
      include: { responses: true },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: attempt.passed,
      aiSummary: result.aiSummary,
      scores: result.scores,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Failed to submit test" }, { status: 500 });
  }
}
