import { NextRequest, NextResponse } from "next/server";
import { extractCVData } from "@/lib/ai/evaluator";
import { extractFromCV } from "@/lib/parsers/cv-extractor";

function extractFileId(url: string): { id: string; type: "file" | "doc" | "docx" } | null {
  // https://drive.google.com/file/d/{ID}/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return { id: fileMatch[1], type: "file" };

  // https://drive.google.com/open?id={ID}  or  ?id={ID}
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return { id: openMatch[1], type: "file" };

  // https://docs.google.com/document/d/{ID}/edit
  const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) return { id: docMatch[1], type: "doc" };

  return null;
}

async function downloadDriveFile(id: string, type: "file" | "doc" | "docx"): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
  let downloadUrl: string;
  let fileName: string;
  let mimeType: string;

  if (type === "doc") {
    // Export Google Doc as PDF
    downloadUrl = `https://docs.google.com/document/d/${id}/export?format=pdf`;
    fileName = "resume.pdf";
    mimeType = "application/pdf";
  } else {
    // Direct file download
    downloadUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
    fileName = "resume";
    mimeType = "application/octet-stream";
  }

  const res = await fetch(downloadUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Could not download file (HTTP ${res.status}). Make sure the file is shared as "Anyone with the link".`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const contentDisposition = res.headers.get("content-disposition") ?? "";

  // Detect actual mime type
  if (contentType.includes("pdf")) {
    mimeType = "application/pdf";
    fileName = "resume.pdf";
  } else if (contentType.includes("wordprocessingml") || contentType.includes("docx")) {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    fileName = "resume.docx";
  } else if (contentType.includes("text/plain")) {
    mimeType = "text/plain";
    fileName = "resume.txt";
  }

  // Try to get filename from content-disposition
  const nameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
  if (nameMatch) fileName = decodeURIComponent(nameMatch[1].replace(/['"]/g, ""));

  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mimeType, fileName };
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (mimeType.includes("wordprocessingml") || mimeType.includes("docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  // Try PDF as fallback
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  } catch {
    throw new Error("Unsupported file format. Please share a PDF, DOCX, or TXT file.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url?.trim()) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    const parsed = extractFileId(url.trim());
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid Google Drive URL. Share the file and paste the link here." },
        { status: 400 }
      );
    }

    const { buffer, mimeType, fileName } = await downloadDriveFile(parsed.id, parsed.type);
    const text = await extractTextFromBuffer(buffer, mimeType);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from the file. Make sure it's a readable PDF or DOCX." },
        { status: 400 }
      );
    }

    // Try AI extraction, fall back to local parser
    let data;
    try {
      data = await extractCVData(text);
    } catch {
      data = extractFromCV(text);
    }

    return NextResponse.json({ ...data, text, fileName });
  } catch (err) {
    console.error("Drive parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process Drive file" },
      { status: 500 }
    );
  }
}
