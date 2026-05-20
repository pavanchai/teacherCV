import Anthropic from "@anthropic-ai/sdk";
import type { EvaluationResult } from "@/types";
import { getBenchmarkForPosition } from "@/constants/benchmarks/cbse";
import { extractFromCV } from "@/lib/parsers/cv-extractor";

export interface ExtractedCVData {
  name: string;
  email: string;
  phone: string;
  qualifications: string[];
  experience: string[];
  subjects: string[];
  certifications: string[];
  totalExperienceYears: number;
  currentOrLastRole: string;
  summary: string;
}

const isMockMode = !process.env.ANTHROPIC_API_KEY ||
  process.env.ANTHROPIC_API_KEY === "your-anthropic-api-key-here";

const client = isMockMode
  ? null
  : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Local (no-API) helpers ───────────────────────────────────────────────────

function localEvaluate(cvText: string, params: EvaluateParams): EvaluationResult {
  const extracted = extractFromCV(cvText);
  const text = cvText.toLowerCase();

  // Score qualifications
  const hasBEd = /\bb\.ed\b/i.test(cvText);
  const hasMasters = /\bm\.sc\b|\bm\.a\b|\bm\.ed\b|\bm\.tech\b|\bmca\b/i.test(cvText);
  const hasCTET = /\bctet\b|\btet\b|\bstet\b/i.test(cvText);
  const subjectMatch = params.subject && text.includes(params.subject.toLowerCase());

  const qualScore = Math.min(100,
    (hasBEd ? 35 : 0) +
    (hasMasters ? 30 : 20) +
    (hasCTET ? 20 : 0) +
    (extracted.qualifications.length > 1 ? 15 : 5)
  );

  const expYears = extracted.totalExperienceYears;
  const expScore = Math.min(100,
    expYears >= params.minExperience
      ? 60 + Math.min(expYears * 5, 40)
      : (expYears / Math.max(params.minExperience, 1)) * 60
  );

  const subjectScore = Math.min(100,
    (subjectMatch ? 50 : 20) +
    (extracted.subjects.length * 10)
  );

  const softScore = Math.min(100,
    50 +
    (extracted.experience.length * 8) +
    (extracted.certifications.length * 5)
  );

  const overall = Math.round((qualScore * 0.35) + (expScore * 0.25) + (subjectScore * 0.25) + (softScore * 0.15));
  const meetsBenchmark = hasBEd && (hasCTET || params.gradeLevel.includes("SECONDARY")) && expYears >= params.minExperience;

  let recommendation: EvaluationResult["recommendation"];
  if (overall >= 75 && meetsBenchmark) recommendation = "STRONGLY_RECOMMENDED";
  else if (overall >= 65) recommendation = "RECOMMENDED";
  else if (overall >= 50) recommendation = "CONSIDER";
  else recommendation = "NOT_RECOMMENDED";

  const strengths = [];
  if (hasBEd) strengths.push("Holds B.Ed — meets NCTE teaching requirement");
  if (hasMasters) strengths.push("Postgraduate qualification in subject area");
  if (hasCTET) strengths.push("CTET/TET certified — eligible for CBSE schools");
  if (expYears >= params.minExperience) strengths.push(`${expYears}+ years experience meets position requirement`);
  if (subjectMatch) strengths.push(`Subject expertise in ${params.subject} confirmed`);
  if (strengths.length === 0) strengths.push("CV successfully parsed");

  const weaknesses = [];
  if (!hasBEd) weaknesses.push("B.Ed not detected — check if candidate holds teaching degree");
  if (!hasCTET && params.gradeLevel.includes("PRIMARY")) weaknesses.push("CTET not found — required for primary/upper primary positions");
  if (expYears < params.minExperience) weaknesses.push(`Experience (${expYears} yrs) may be below required ${params.minExperience} yrs`);
  if (!subjectMatch) weaknesses.push(`${params.subject} not explicitly mentioned in CV`);

  return {
    overallScore: overall,
    qualificationScore: qualScore,
    experienceScore: Math.round(expScore),
    subjectScore: Math.round(subjectScore),
    softSkillScore: Math.round(softScore),
    strengths,
    weaknesses,
    recommendation,
    meetsBenchmark,
    aiSummary: extracted.summary,
    detailedAnalysis: `Local evaluation based on keyword analysis. Qualification score: ${qualScore}/100. Experience: ${expYears} years. Add ANTHROPIC_API_KEY for full AI-powered evaluation.`,
  };
}

// ── Real AI functions ───────────────────────────────────────────────────────

export async function extractCVData(cvText: string): Promise<ExtractedCVData> {
  if (isMockMode) return extractFromCV(cvText);

  const message = await client!.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Extract structured information from this CV/resume text. Return ONLY valid JSON.

CV TEXT:
${cvText.slice(0, 4000)}

Return this exact JSON schema (use empty string/array if not found):
{
  "name": "<full name>",
  "email": "<email address>",
  "phone": "<phone number>",
  "qualifications": ["<degree 1>", "<degree 2>"],
  "experience": ["<job title at org, years>"],
  "subjects": ["<subject 1>", "<subject 2>"],
  "certifications": ["<cert 1>"],
  "totalExperienceYears": <number>,
  "currentOrLastRole": "<job title at org>",
  "summary": "<2 sentence professional summary>"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected AI response");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse CV extraction response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    name: parsed.name || "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    totalExperienceYears: Number(parsed.totalExperienceYears) || 0,
    currentOrLastRole: parsed.currentOrLastRole || "",
    summary: parsed.summary || "",
  };
}

interface EvaluateParams {
  cvText: string;
  positionTitle: string;
  subject: string;
  gradeLevel: string;
  requirements: string;
  minQualification: string;
  minExperience: number;
}

export async function evaluateCandidate(params: EvaluateParams): Promise<EvaluationResult> {
  if (isMockMode) return localEvaluate(params.cvText, params);

  const benchmark = getBenchmarkForPosition(params.gradeLevel, params.subject);

  const prompt = `You are an expert teacher recruitment specialist for Indian schools following CBSE norms.

Evaluate the following candidate CV for the position described below. Return a structured JSON evaluation.

## POSITION DETAILS
- Title: ${params.positionTitle}
- Subject: ${params.subject}
- Grade Level: ${params.gradeLevel.replace(/_/g, " ")}
- Minimum Experience Required: ${params.minExperience} years
- Position Requirements: ${params.requirements}
- Minimum Qualification Required: ${params.minQualification}

## CBSE BENCHMARK FOR THIS POSITION
${benchmark}

## CANDIDATE CV
${params.cvText}

## EVALUATION INSTRUCTIONS
Score each dimension from 0–100. Be strict about CBSE/NCTE minimum qualification requirements.

meetsBenchmark = true ONLY if the candidate meets the CBSE minimum qualification AND has required certifications (B.Ed/CTET/TET as applicable).

Return ONLY valid JSON in this exact schema:
{
  "overallScore": <0-100>,
  "qualificationScore": <0-100>,
  "experienceScore": <0-100>,
  "subjectScore": <0-100>,
  "softSkillScore": <0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "<STRONGLY_RECOMMENDED|RECOMMENDED|CONSIDER|NOT_RECOMMENDED>",
  "meetsBenchmark": <true|false>,
  "aiSummary": "<2-3 sentence executive summary>",
  "detailedAnalysis": "<comprehensive paragraph analysis including qualification gaps, teaching experience, subject expertise, and suitability>"
}`;

  const message = await client!.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI evaluation response");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    overallScore: Math.round(parsed.overallScore),
    qualificationScore: Math.round(parsed.qualificationScore),
    experienceScore: Math.round(parsed.experienceScore),
    subjectScore: Math.round(parsed.subjectScore),
    softSkillScore: Math.round(parsed.softSkillScore),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    recommendation: parsed.recommendation,
    meetsBenchmark: Boolean(parsed.meetsBenchmark),
    aiSummary: parsed.aiSummary || "",
    detailedAnalysis: parsed.detailedAnalysis || "",
  };
}
