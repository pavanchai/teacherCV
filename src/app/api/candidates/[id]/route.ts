import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      evaluations: { orderBy: { createdAt: "desc" } },
      shortlistItems: {
        include: { shortlist: { include: { position: true } } },
      },
    },
  });

  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(candidate);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
