import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTestQuestions, type QuestionType } from "@/lib/ai/test-generator";

export async function GET() {
  try {
    const tests = await prisma.testTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      subject,
      gradeLevel,
      description,
      questionTypes,
      totalQuestions,
      timeLimitMins,
      passingScore,
      customTopic,
      organizationId,
    } = body;

    if (!title || !subject || !gradeLevel || !questionTypes?.length || !totalQuestions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orgId = organizationId || process.env.DEFAULT_ORG_ID || "org_default";

    // Generate questions via AI
    const generatedQuestions = await generateTestQuestions({
      subject,
      gradeLevel,
      questionTypes: questionTypes as QuestionType[],
      totalQuestions: Number(totalQuestions),
      customTopic,
    });

    const template = await prisma.testTemplate.create({
      data: {
        title,
        subject,
        gradeLevel,
        description: description || null,
        questionTypes: JSON.stringify(questionTypes),
        totalQuestions: generatedQuestions.length,
        timeLimitMins: timeLimitMins ? Number(timeLimitMins) : null,
        passingScore: passingScore ? Number(passingScore) : 60,
        organizationId: orgId,
        questions: {
          create: generatedQuestions.map((q, i) => ({
            type: q.type,
            question: q.question,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer ?? null,
            marks: q.marks,
            order: i + 1,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Test creation error:", error);
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}
