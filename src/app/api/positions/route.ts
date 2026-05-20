import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "org_default";

export async function GET() {
  const positions = await prisma.position.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: {
      _count: { select: { shortlists: true } },
      shortlists: {
        include: { _count: { select: { items: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(positions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, subject, gradeLevel, description, requirements, minQualification, experience, benchmark, budgetCtc } = body;

    if (!title || !subject || !gradeLevel || !requirements || !minQualification) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let org = await prisma.organization.findUnique({ where: { id: DEFAULT_ORG_ID } });
    if (!org) {
      org = await prisma.organization.create({
        data: { id: DEFAULT_ORG_ID, name: "Default School", email: "admin@school.edu.in" },
      });
    }

    const position = await prisma.position.create({
      data: {
        title,
        subject,
        gradeLevel,
        description: description || null,
        requirements,
        minQualification,
        experience: experience || 0,
        budgetCtc: budgetCtc ? parseFloat(budgetCtc) : null,
        benchmark: benchmark || "CBSE",
        organizationId: DEFAULT_ORG_ID,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("POST /api/positions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
