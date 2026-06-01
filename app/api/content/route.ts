import { contentQueue } from "@/lib/queues";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const where: any = { userId: session.user.id };
  if (type) where.type = type;
  const contents = await prisma.content.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ contents });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { title, body: contentBody, type, platform, scheduledAt } = body;
    if (!title || !contentBody || !type) return NextResponse.json({ error: "title, body, type required" }, { status: 400 });
    const content = await prisma.content.create({
      data: { title, body: contentBody, type, platform, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, status: scheduledAt ? "SCHEDULED" : "DRAFT", userId: session.user.id },
    });
    if (scheduledAt) {
  await contentQueue.add(
    "publish-content",
    {
      contentId: content.id,
      userId: session.user.id,
      platform,
      scheduledTaskId: content.id,
    },
    {
      delay: new Date(scheduledAt).getTime() - Date.now(),
    }
  );
}
    return NextResponse.json(content, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
