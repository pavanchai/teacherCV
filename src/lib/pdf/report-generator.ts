"use client";

import jsPDF from "jspdf";
import type { CandidateWithEval, EvalSummary } from "@/types";

interface ReportData {
  positionTitle: string;
  subject: string;
  gradeLevel: string;
  shortlistName: string;
  candidates: Array<{ candidate: CandidateWithEval; eval: EvalSummary }>;
  generatedAt: Date;
}

function getGradeLabel(gradeLevel: string): string {
  const map: Record<string, string> = {
    PRIMARY_1_5: "Primary (Class 1-5)",
    UPPER_PRIMARY_6_8: "Upper Primary (Class 6-8)",
    SECONDARY_9_10: "Secondary (Class 9-10)",
    SR_SECONDARY_11_12: "Senior Secondary (Class 11-12)",
  };
  return map[gradeLevel] || gradeLevel;
}

function getRecommendationColor(rec: string): [number, number, number] {
  switch (rec) {
    case "STRONGLY_RECOMMENDED": return [5, 150, 105];
    case "RECOMMENDED": return [37, 99, 235];
    case "CONSIDER": return [217, 119, 6];
    case "NOT_RECOMMENDED": return [220, 38, 38];
    default: return [100, 116, 139];
  }
}

export function generateShortlistPDF(data: ReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 0;

  // Header
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Teacher CV Shortlist Report", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${data.generatedAt.toLocaleString("en-IN")}`, margin, 28);
  doc.text(`${data.candidates.length} Candidate(s)`, pageW - margin, 28, { align: "right" });

  y = 50;

  // Position details box
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, contentW, 30, 3, 3, "F");
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Position Details", margin + 5, y + 8);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Position: ${data.positionTitle}`, margin + 5, y + 16);
  doc.text(`Subject: ${data.subject}`, margin + 5, y + 22);
  doc.text(`Grade Level: ${getGradeLabel(data.gradeLevel)}`, margin + 70, y + 16);
  doc.text(`Shortlist: ${data.shortlistName}`, margin + 70, y + 22);

  y += 38;

  data.candidates.forEach((item, index) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const { candidate, eval: ev } = item;
    const recColor = getRecommendationColor(ev.recommendation);

    // Candidate card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, 70, 3, 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, 70, 3, 3, "S");

    // Rank badge
    doc.setFillColor(30, 58, 95);
    doc.circle(margin + 8, y + 8, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}`, margin + 8, y + 10, { align: "center" });

    // Candidate name and details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(candidate.name, margin + 16, y + 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(candidate.email, margin + 16, y + 16);
    if (candidate.phone) doc.text(candidate.phone, margin + 16, y + 21);

    // Overall score circle
    const scoreX = pageW - margin - 20;
    const scoreY = y + 18;
    doc.setFillColor(37, 99, 235);
    doc.circle(scoreX, scoreY, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${ev.overallScore}`, scoreX, scoreY + 1, { align: "center" });
    doc.setFontSize(6);
    doc.text("/100", scoreX, scoreY + 6, { align: "center" });

    // Score bars
    const scores = [
      { label: "Qualification", value: ev.qualificationScore },
      { label: "Experience", value: ev.experienceScore },
      { label: "Subject", value: ev.subjectScore },
      { label: "Soft Skills", value: ev.softSkillScore },
    ];

    const barStartX = margin + 5;
    const barY = y + 28;
    const barW = (contentW - 50) / 2;

    scores.forEach((score, si) => {
      const bx = barStartX + (si % 2) * (barW + 10);
      const by = barY + Math.floor(si / 2) * 10;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${score.label}: ${score.value}`, bx, by);
      doc.setFillColor(226, 232, 240);
      doc.rect(bx, by + 1, barW - 20, 3, "F");
      const color = score.value >= 70 ? [5, 150, 105] : score.value >= 50 ? [217, 119, 6] : [220, 38, 38];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(bx, by + 1, ((barW - 20) * score.value) / 100, 3, "F");
    });

    // Recommendation badge
    doc.setFillColor(recColor[0], recColor[1], recColor[2]);
    const recLabel = ev.recommendation.replace(/_/g, " ");
    doc.roundedRect(margin + 5, y + 50, 55, 6, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(recLabel, margin + 32, y + 54, { align: "center" });

    // Benchmark badge
    if (ev.meetsBenchmark) {
      doc.setFillColor(5, 150, 105);
    } else {
      doc.setFillColor(220, 38, 38);
    }
    doc.roundedRect(margin + 63, y + 50, 35, 6, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(ev.meetsBenchmark ? "Meets CBSE Benchmark" : "Below Benchmark", margin + 80, y + 54, { align: "center" });

    // AI Summary
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(ev.aiSummary, contentW - 10);
    doc.text(summaryLines.slice(0, 2), margin + 5, y + 62);

    y += 76;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 287, pageW, 10, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Teacher CV Shortlisting Portal — Powered by Claude AI", margin, 293);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, 293, { align: "right" });
  }

  doc.save(`shortlist-${data.shortlistName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
