import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { candidateId, notes, rank } = await req.json();

    const item = await prisma.shortlistItem.upsert({
      where: { shortlistId_candidateId: { shortlistId: id, candidateId } },
      create: { shortlistId: id, candidateId, notes: notes || null, rank: rank || 0 },
      update: { notes: notes || null, rank: rank || 0 },
      include: { candidate: true },
    });

    await prisma.shortlist.update({ where: { id }, data: { updatedAt: new Date() } });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add to shortlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { candidateId } = await req.json();

  await prisma.shortlistItem.delete({
    where: { shortlistId_candidateId: { shortlistId: id, candidateId } },
  });

  return NextResponse.json({ ok: true });
}
