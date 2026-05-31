import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = await prisma.campaign.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { name, description, type, platform, messageTemplate, scheduledAt } = body;
    if (!name || !type) return NextResponse.json({ error: "Name and type required" }, { status: 400 });
    const campaign = await prisma.campaign.create({
      data: { name, description, type, platform: platform || "all", messageTemplate, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, userId: session.user.id },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
