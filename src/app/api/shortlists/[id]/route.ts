import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shortlist = await prisma.shortlist.findUnique({
    where: { id },
    include: {
      position: true,
      items: {
        include: {
          candidate: {
            include: { evaluations: { orderBy: { createdAt: "desc" } } },
          },
        },
        orderBy: { rank: "asc" },
      },
    },
  });
  if (!shortlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shortlist);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shortlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
