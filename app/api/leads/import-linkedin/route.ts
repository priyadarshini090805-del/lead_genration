import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLinkedInLeads } from "@/lib/linkedin";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchQuery } = await req.json();

    const integration = await prisma.integration.findFirst({
      where: { userId: session.user.id, provider: "linkedin", status: "CONNECTED" },
    });
    if (!integration) {
      return NextResponse.json(
        { error: "LinkedIn not connected. Connect LinkedIn first in Integrations." },
        { status: 400 }
      );
    }

    const profiles = await getLinkedInLeads(
      integration.accessToken,
      searchQuery || "CEO founder"
    );
    if (!profiles.length) {
      return NextResponse.json({ message: "No profiles found.", leads: [] });
    }

    const created: any[] = [];
    for (const p of profiles) {
      const exists = await prisma.lead.findFirst({
        where: { linkedinId: p.id, userId: session.user.id },
      });
      if (!exists) {
        const lead = await prisma.lead.create({
          data: {
            name: p.name,
            email: p.email,
            platform: "linkedin",
            profileUrl: p.profileUrl,
            avatarUrl: p.avatarUrl,
            title: p.title,
            company: p.company,
            industry: p.industry,
            location: p.location,
            linkedinId: p.id,
            userId: session.user.id,
          },
        });
        created.push(lead);
      }
    }

    return NextResponse.json({
      leads: created,
      message: `Imported ${created.length} new leads from LinkedIn`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
