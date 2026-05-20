import jsPDF from "jspdf";

interface Question {
  type: string;
  question: string;
  options: string[] | string | null;
  marks: number;
  order: number;
}

interface TestTemplate {
  title: string;
  subject: string;
  gradeLevel: string;
  description: string | null;
  timeLimitMins: number | null;
  passingScore: number;
  questions: Question[];
}

const GRADE_LABELS: Record<string, string> = {
  PRIMARY_1_5: "Primary (Class 1–5)",
  UPPER_PRIMARY_6_8: "Upper Primary (Class 6–8)",
  SECONDARY_9_10: "Secondary (Class 9–10)",
  SR_SECONDARY_11_12: "Senior Secondary (Class 11–12)",
};

export function generateQuestionPaperPDF(test: TestTemplate) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  const writeLine = (text: string, fontSize: number, bold = false, color = "#1e293b") => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, contentW) as string[];
    checkPage(lines.length * (fontSize * 0.4 + 2));
    doc.text(lines, margin, y);
    y += lines.length * (fontSize * 0.4 + 2) + 1;
  };

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 36, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#ffffff");
  doc.text("TeacherCV — CBSE Shortlisting Portal", margin, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Teacher Competency Assessment", margin, 22);
  y = 46;

  // Title block
  writeLine(test.title, 14, true);
  writeLine(`${test.subject}  ·  ${GRADE_LABELS[test.gradeLevel] ?? test.gradeLevel}`, 10, false, "#475569");
  y += 2;

  // Meta row
  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0);
  const meta = [
    `Total Questions: ${test.questions.length}`,
    `Total Marks: ${totalMarks}`,
    test.timeLimitMins ? `Time: ${test.timeLimitMins} min` : "Time: No limit",
    `Passing Score: ${test.passingScore}%`,
  ].join("    |    ");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#64748b");
  doc.text(meta, margin, y);
  y += 6;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, W - margin, y);
  y += 5;

  if (test.description) {
    writeLine(`Instructions: ${test.description}`, 9, false, "#475569");
    y += 2;
  }

  // Answer space header
  doc.setFontSize(9);
  doc.setTextColor("#94a3b8");
  doc.text("Name: ___________________________________   Email: _________________________________   Date: ___________", margin, y);
  y += 8;
  doc.line(margin, y, W - margin, y);
  y += 8;

  // Questions
  test.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const typeLabel = q.type === "TRUE_FALSE" ? "T/F" : q.type;
    const marksLabel = `[${q.marks} mark${q.marks > 1 ? "s" : ""}]`;

    checkPage(20);

    // Question number + type badge
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e40af");
    doc.text(`Q${qNum}.`, margin, y);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setFillColor(219, 234, 254);
    doc.setTextColor("#1e40af");
    const badgeW = doc.getTextWidth(typeLabel) + 4;
    doc.roundedRect(margin + 10, y - 4.5, badgeW, 5.5, 1, 1, "F");
    doc.text(typeLabel, margin + 12, y);
    doc.setTextColor("#64748b");
    doc.text(marksLabel, margin + 10 + badgeW + 2, y);

    y += 5;

    // Question text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#1e293b");
    const qLines = doc.splitTextToSize(q.question, contentW - 4) as string[];
    checkPage(qLines.length * 5 + 4);
    doc.text(qLines, margin + 4, y);
    y += qLines.length * 5 + 2;

    // Options for MCQ
    if (q.type === "MCQ" && q.options) {
      const opts: string[] = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      opts.forEach((opt, oi) => {
        checkPage(7);
        doc.setFontSize(9);
        doc.setTextColor("#334155");
        doc.setDrawColor(203, 213, 225);
        doc.circle(margin + 8, y - 1.5, 2, "S");
        doc.text(`${String.fromCharCode(65 + oi)}. ${opt}`, margin + 12, y);
        y += 6;
      });
    }

    // True/False options
    if (q.type === "TRUE_FALSE") {
      checkPage(7);
      doc.setFontSize(9);
      doc.setTextColor("#334155");
      doc.setDrawColor(203, 213, 225);
      doc.circle(margin + 8, y - 1.5, 2, "S");
      doc.text("True", margin + 12, y);
      doc.circle(margin + 35, y - 1.5, 2, "S");
      doc.text("False", margin + 39, y);
      y += 6;
    }

    // Answer space for short/long
    if (q.type === "SHORT") {
      checkPage(18);
      doc.setDrawColor(226, 232, 240);
      for (let l = 0; l < 3; l++) {
        doc.line(margin + 4, y + l * 6, W - margin, y + l * 6);
      }
      y += 20;
    }
    if (q.type === "LONG") {
      checkPage(36);
      doc.setDrawColor(226, 232, 240);
      for (let l = 0; l < 6; l++) {
        doc.line(margin + 4, y + l * 6, W - margin, y + l * 6);
      }
      y += 38;
    }

    y += 3;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, W - margin, y);
    y += 5;
  });

  // Footer
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor("#94a3b8");
    doc.text(`TeacherCV Portal  ·  ${test.title}  ·  Page ${p} of ${totalPages}`, margin, 290);
  }

  const safeName = test.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`${safeName}_question_paper.pdf`);
}
