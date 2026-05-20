import { NextRequest, NextResponse } from "next/server";
import { parseCV } from "@/lib/parsers/cv-parser";
import { extractCVData } from "@/lib/ai/evaluator";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseCV(buffer, file.type, file.name);

    if (!parsed.text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    // Use Claude Haiku to extract structured data from the raw text
    const extracted = await extractCVData(parsed.text);

    return NextResponse.json({
      name: extracted.name,
      email: extracted.email,
      phone: extracted.phone,
      text: parsed.text,
      qualifications: extracted.qualifications,
      experience: extracted.experience,
      subjects: extracted.subjects,
      certifications: extracted.certifications,
      totalExperienceYears: extracted.totalExperienceYears,
      currentOrLastRole: extracted.currentOrLastRole,
      summary: extracted.summary,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse failed" },
      { status: 500 }
    );
  }
}
