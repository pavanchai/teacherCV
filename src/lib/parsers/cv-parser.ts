import type { ParsedCV } from "@/types";

export async function parsePDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text;
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function extractStructuredData(text: string): Partial<ParsedCV> {
  const emailRegex = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];

  const qualificationKeywords = [
    "B.Ed", "M.Ed", "B.Sc", "M.Sc", "B.A", "M.A", "MBA", "M.Phil", "Ph.D",
    "BCA", "MCA", "B.Tech", "M.Tech", "CTET", "TET", "D.El.Ed", "B.El.Ed",
    "B.P.Ed", "M.P.Ed", "NET", "SET", "PGDCA", "Diploma",
  ];

  const qualifications = qualificationKeywords.filter((kw) =>
    new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i").test(text)
  );

  return {
    email: emails[0] || "",
    phone: phones[0] || "",
    qualifications,
    text,
  };
}

export async function parseCV(
  file: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedCV> {
  let text = "";

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    text = await parsePDF(file);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    text = await parseDOCX(file);
  } else if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    text = file.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const structured = extractStructuredData(text);

  return {
    name: "",
    email: structured.email || "",
    phone: structured.phone,
    text,
    qualifications: structured.qualifications || [],
    experience: [],
    subjects: [],
    certifications: [],
  };
}
