import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outreachQueue, contentQueue } from "@/lib/queues";
import { validate, scheduledTaskSchema } from "@/lib/validate";
import { generateMessage } from "@/lib/openai";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: any = { userId: session.user.id };
  if (status) where.status = status;
  const tasks = await prisma.scheduledTask.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    include: { lead: { select: { name: true, platform: true, company: true } } },
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = validate(scheduledTaskSchema, body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { type, scheduledFor, timezone, leadId, contentId, campaignId, message, autoGenerate } = data!;

  let resolvedMessage = message;

  // Auto-generate AI message for follow-ups
  if (type === "FOLLOW_UP" && (autoGenerate || !message) && leadId) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.user.id } });
    if (lead) {
      resolvedMessage = await generateMessage({ leadName: lead.name, platform: lead.platform, notes: lead.notes || undefined, type: "FOLLOW_UP", company: lead.company || undefined, title: lead.title || undefined });
    }
  }

  const payload = JSON.stringify({ leadId, contentId, campaignId, message: resolvedMessage });

  const task = await prisma.scheduledTask.create({
    data: {
      userId: session.user.id,
      type,
      scheduledFor: new Date(scheduledFor),
      timezone,
      payload,
      leadId: leadId || null,
      status: "SCHEDULED",
    },
  });

  // Enqueue job with delay
  const delay = Math.max(0, new Date(scheduledFor).getTime() - Date.now());

  let job;
  if (type === "FOLLOW_UP" && leadId) {
    job = await outreachQueue.add("send-followup", { scheduledTaskId: task.id, userId: session.user.id, leadId, message: resolvedMessage || "", platform: "linkedin", type: "FOLLOW_UP" }, { delay });
  } else if (type === "CONTENT_PUBLISH" && contentId) {
    job = await contentQueue.add("publish-content", { scheduledTaskId: task.id, userId: session.user.id, contentId, platform: "linkedin" }, { delay });
  }

  if (job) {
    await prisma.scheduledTask.update({ where: { id: task.id }, data: { jobId: job.id?.toString() } });
  }

  return NextResponse.json(task, { status: 201 });
}
