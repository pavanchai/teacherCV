import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const test = await prisma.testTemplate.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        attempts: {
          orderBy: { submittedAt: "desc" },
          include: { responses: { include: { question: true } } },
        },
      },
    });
    if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parsed = {
      ...test,
      questions: test.questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      })),
      attempts: test.attempts.map((a) => ({
        ...a,
        responses: a.responses.map((r) => ({
          ...r,
          question: {
            ...r.question,
            options: r.question.options ? JSON.parse(r.question.options) : null,
          },
        })),
      })),
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { status } = body;
    const test = await prisma.testTemplate.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(test);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.testTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}
