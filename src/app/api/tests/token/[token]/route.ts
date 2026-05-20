import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — returns test without correct answers
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const test = await prisma.testTemplate.findUnique({
      where: { shareToken: token },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    if (test.status !== "ACTIVE")
      return NextResponse.json({ error: "This test is no longer active" }, { status: 403 });

    // Strip correct answers before sending to teacher
    const safeQuestions = test.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options ? JSON.parse(q.options) : null,
      marks: q.marks,
      order: q.order,
    }));

    return NextResponse.json({
      id: test.id,
      title: test.title,
      subject: test.subject,
      gradeLevel: test.gradeLevel,
      description: test.description,
      timeLimitMins: test.timeLimitMins,
      passingScore: test.passingScore,
      totalQuestions: test.totalQuestions,
      questions: safeQuestions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load test" }, { status: 500 });
  }
}
