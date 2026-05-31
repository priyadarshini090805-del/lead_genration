import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMessage } from "@/lib/openai";

// Schedule follow-up for a lead
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { leadId, type, content, scheduledFor, autoGenerate } = await req.json();
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.user.id } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    let messageContent = content;
    if (autoGenerate || !messageContent) {
      messageContent = await generateMessage({
        leadName: lead.name,
        platform: lead.platform,
        notes: lead.notes || undefined,
        type: type || "FOLLOW_UP",
        company: lead.company || undefined,
        title: lead.title || undefined,
      });
    }

    const message = await prisma.message.create({
      data: {
        content: messageContent,
        type: type || "FOLLOW_UP",
        status: scheduledFor ? "PENDING" : "APPROVED",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        sentAt: !scheduledFor ? new Date() : null,
        leadId,
        userId: session.user.id,
      },
    });

    if (!scheduledFor) {
      await prisma.lead.update({ where: { id: leadId }, data: { status: "CONTACTED" } });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get outreach history + scheduled messages
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const where: any = { userId: session.user.id };
  if (leadId) where.leadId = leadId;
  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { lead: { select: { name: true, platform: true, company: true } } },
  });
  return NextResponse.json({ messages });
}
