import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      shortlists: {
        include: {
          items: {
            include: {
              candidate: { include: { evaluations: { where: { positionId: id } } } },
            },
            orderBy: { rank: "asc" },
          },
        },
      },
    },
  });
  if (!position) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(position);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const position = await prisma.position.update({ where: { id }, data: body });
  return NextResponse.json(position);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
