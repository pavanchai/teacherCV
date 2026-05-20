import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.includes("linkedin.com")) {
      return NextResponse.json({ error: "Valid LinkedIn URL required" }, { status: 400 });
    }

    // LinkedIn blocks automated scraping. We return a placeholder so the user
    // can manually paste in the profile text. A production integration would
    // use LinkedIn's official Partner API.
    return NextResponse.json({
      name: "",
      email: "",
      phone: "",
      text: `LinkedIn Profile: ${url}\n\nPlease paste the candidate's profile text manually in the text field, or use a CV upload instead. LinkedIn's terms of service restrict automated profile scraping.`,
      linkedinUrl: url,
      note: "manual_entry_required",
    });
  } catch {
    return NextResponse.json({ error: "Failed to process LinkedIn URL" }, { status: 500 });
  }
}
