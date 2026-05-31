import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishInstagramPost, getInstagramProfile } from "@/lib/instagram";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { contentId, imageUrl, caption } = await req.json();
    if (!imageUrl || !caption)
      return NextResponse.json(
        { error: "imageUrl and caption required" },
        { status: 400 }
      );

    const integration = await prisma.integration.findFirst({
      where: { userId: session.user.id, provider: "instagram", status: "CONNECTED" },
    });
    if (!integration)
      return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });

    const profile = await getInstagramProfile(integration.accessToken);
    if (!profile)
      return NextResponse.json(
        { error: "Could not retrieve Instagram profile" },
        { status: 400 }
      );

    const result = await publishInstagramPost(
      profile.id,
      integration.accessToken,
      imageUrl,
      caption
    );

    if (result.success && contentId) {
      await prisma.content.update({
        where: { id: contentId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
