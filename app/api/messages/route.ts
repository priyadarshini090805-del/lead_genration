import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const where: any = { userId: session.user.id };
  if (leadId) where.leadId = leadId;
  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { leadId, content, type = "INBOX_CHAT", isIncoming = false, scheduledFor, platform } = await req.json();
    if (!leadId || !content) return NextResponse.json({ error: "leadId and content required" }, { status: 400 });
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.user.id } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Analyze sentiment for incoming messages
    let sentiment: string | undefined;
    if (isIncoming) {
      const lower = content.toLowerCase();
      if (lower.match(/yes|interested|great|love|sure|call|schedule|definitely/)) sentiment = "POSITIVE";
      else if (lower.match(/no|stop|remove|spam|unsubscribe|not interested/)) sentiment = "NEGATIVE";
      else sentiment = "NEUTRAL";
    }

    const message = await prisma.message.create({
      data: { content, type, isIncoming, sentiment, platform: platform || lead.platform, scheduledFor: scheduledFor ? new Date(scheduledFor) : null, sentAt: !scheduledFor ? new Date() : null, status: scheduledFor ? "PENDING" : "SENT", leadId, userId: session.user.id },
    });
    await prisma.lead.update({ where: { id: leadId }, data: isIncoming ? { unreadCount: { increment: 1 } } : { status: "CONTACTED" } });
    await prisma.activityLog.create({ data: { action: isIncoming ? "MESSAGE_RECEIVED" : "MESSAGE_SENT", status: "SUCCESS", details: `${type} message`, userId: session.user.id, leadId } });
    return NextResponse.json(message, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
