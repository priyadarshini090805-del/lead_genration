import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstagramAnalytics, getInstagramProfile } from "@/lib/instagram";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const integration = await prisma.integration.findFirst({ where: { userId: session.user.id, provider: "instagram", status: "CONNECTED" } });
  if (!integration) return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
  const profile = await getInstagramProfile(integration.accessToken);
  const analytics = profile ? await getInstagramAnalytics(profile.id, integration.accessToken) : null;
  return NextResponse.json({ profile, analytics });
}
