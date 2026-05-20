import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendShortlistEmail } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  try {
    const { shortlistItemIds, customMessage, schoolName } = await req.json();

    if (!shortlistItemIds?.length) {
      return NextResponse.json({ error: "No shortlist items specified" }, { status: 400 });
    }

    const items = await prisma.shortlistItem.findMany({
      where: { id: { in: shortlistItemIds } },
      include: {
        candidate: true,
        shortlist: { include: { position: true } },
      },
    });

    const results = await Promise.allSettled(
      items.map(async (item) => {
        await sendShortlistEmail({
          candidateName: item.candidate.name,
          candidateEmail: item.candidate.email,
          positionTitle: item.shortlist.position.title,
          schoolName: schoolName || "Our School",
          subject: item.shortlist.position.subject,
          gradeLevel: item.shortlist.position.gradeLevel,
          customMessage,
        });

        await prisma.shortlistItem.update({
          where: { id: item.id },
          data: { emailSent: true, emailSentAt: new Date() },
        });

        return { id: item.id, name: item.candidate.name, status: "sent" };
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed, results });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
