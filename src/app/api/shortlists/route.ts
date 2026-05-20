import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "org_default";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const positionId = searchParams.get("positionId");

  const shortlists = await prisma.shortlist.findMany({
    where: {
      organizationId: DEFAULT_ORG_ID,
      ...(positionId ? { positionId } : {}),
    },
    include: {
      position: true,
      items: {
        include: {
          candidate: {
            include: {
              evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { rank: "asc" },
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(shortlists);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, positionId } = body;

    if (!name || !positionId) {
      return NextResponse.json({ error: "name and positionId required" }, { status: 400 });
    }

    const shortlist = await prisma.shortlist.create({
      data: { name, positionId, organizationId: DEFAULT_ORG_ID },
      include: { position: true, items: true },
    });
    return NextResponse.json(shortlist, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
