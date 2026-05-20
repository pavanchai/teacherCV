import { Resend } from "resend";

interface SendShortlistEmailParams {
  candidateName: string;
  candidateEmail: string;
  positionTitle: string;
  schoolName: string;
  subject: string;
  gradeLevel: string;
  fromEmail?: string;
  customMessage?: string;
}

export async function sendShortlistEmail(params: SendShortlistEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = params.fromEmail || "noreply@yourschool.edu.in";

  const gradeLabelMap: Record<string, string> = {
    PRIMARY_1_5: "Primary (Class 1–5)",
    UPPER_PRIMARY_6_8: "Upper Primary (Class 6–8)",
    SECONDARY_9_10: "Secondary (Class 9–10)",
    SR_SECONDARY_11_12: "Senior Secondary (Class 11–12)",
  };

  const gradeLabel = gradeLabelMap[params.gradeLevel] || params.gradeLevel;

  await resend.emails.send({
    from: fromEmail,
    to: params.candidateEmail,
    subject: `Shortlisted for ${params.positionTitle} – ${params.schoolName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations!</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">You have been shortlisted</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Dear <strong>${params.candidateName}</strong>,</p>
    <p>We are pleased to inform you that your profile has been shortlisted for the following teaching position at <strong>${params.schoolName}</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Position</td><td style="padding: 8px 0; font-weight: 600;">${params.positionTitle}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subject</td><td style="padding: 8px 0; font-weight: 600;">${params.subject}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Grade Level</td><td style="padding: 8px 0; font-weight: 600;">${gradeLabel}</td></tr>
      </table>
    </div>
    ${params.customMessage ? `<div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 20px 0;"><p style="margin: 0;">${params.customMessage}</p></div>` : ""}
    <p>Our team will be in touch with you shortly regarding the next steps in the selection process. Please keep your documents ready for further verification.</p>
    <p>If you have any questions, please do not hesitate to contact us.</p>
    <p style="margin-top: 30px;">Warm regards,<br><strong>HR Department</strong><br>${params.schoolName}</p>
  </div>
  <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">This is an automated message from the Teacher CV Shortlisting Portal.</p>
</body>
</html>`,
  });
}
