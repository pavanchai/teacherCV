import { NextRequest, NextResponse } from "next/server";
import { extractCVData } from "@/lib/ai/evaluator";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const extracted = await extractCVData(text);

    return NextResponse.json({
      name: extracted.name,
      email: extracted.email,
      phone: extracted.phone,
      text,
      qualifications: extracted.qualifications,
      experience: extracted.experience,
      subjects: extracted.subjects,
      certifications: extracted.certifications,
      totalExperienceYears: extracted.totalExperienceYears,
      currentOrLastRole: extracted.currentOrLastRole,
      summary: extracted.summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse failed" },
      { status: 500 }
    );
  }
}
