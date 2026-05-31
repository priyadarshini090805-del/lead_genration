import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outreachQueue, contentQueue } from "@/lib/queues";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { scheduledFor, timezone } = body;
  const task = await prisma.scheduledTask.update({
    where: { id: params.id, userId: session.user.id },
    data: { scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined, timezone, status: "SCHEDULED" },
  });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const task = await prisma.scheduledTask.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try to remove from queue
  if (task.jobId) {
    try {
      const q = task.type === "CONTENT_PUBLISH" ? contentQueue : outreachQueue;
      const job = await q.getJob(task.jobId);
      await job?.remove();
    } catch { /* best effort */ }
  }

  await prisma.scheduledTask.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ success: true });
}
