import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { leadIds, content, type = "GROUP", platform, scheduledFor, relayId } = await req.json();
    if (!leadIds?.length || !content) return NextResponse.json({ error: "leadIds and content required" }, { status: 400 });

    const results: any[] = [];
    for (const leadId of leadIds) {
      const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.user.id } });
      if (!lead) continue;
      const msg = await prisma.message.create({
        data: {
          content,
          type,
          isIncoming: false,
          platform: platform || lead.platform,
          isGroupMsg: true,
          relayId,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          sentAt: !scheduledFor ? new Date() : null,
          status: scheduledFor ? "PENDING" : "SENT",
          leadId,
          userId: session.user.id,
        },
      });
      await prisma.lead.update({ where: { id: leadId }, data: { status: "CONTACTED" } });
      results.push(msg);
    }

    await prisma.activityLog.create({ data: { action: "GROUP_MESSAGE_SENT", status: "SUCCESS", details: `Sent to ${results.length} leads via relay: ${relayId || "default"}`, userId: session.user.id } });
    return NextResponse.json({ sent: results.length, messages: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
