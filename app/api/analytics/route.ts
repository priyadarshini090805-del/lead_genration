import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const [
      totalLeads, newLeads, contactedLeads, convertedLeads,
      linkedinLeads, googleLeads, manualLeads,
      totalSent, totalReceived, positiveReplies, negativeReplies,
      totalCampaigns, activeCampaigns,
      recentActivity,
    ] = await Promise.all([
      prisma.lead.count({ where: { userId } }),
      prisma.lead.count({ where: { userId, status: "NEW" } }),
      prisma.lead.count({ where: { userId, status: "CONTACTED" } }),
      prisma.lead.count({ where: { userId, status: "CONVERTED" } }),
      prisma.lead.count({ where: { userId, platform: "linkedin" } }),
      prisma.lead.count({ where: { userId, platform: "google" } }),
      prisma.lead.count({ where: { userId, platform: "manual" } }),
      prisma.message.count({ where: { userId, isIncoming: false } }),
      prisma.message.count({ where: { userId, isIncoming: true } }),
      prisma.message.count({ where: { userId, isIncoming: true, sentiment: "POSITIVE" } }),
      prisma.message.count({ where: { userId, isIncoming: true, sentiment: "NEGATIVE" } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId, status: "ACTIVE" } }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Build daily chart data for last N days
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);   dayEnd.setHours(23, 59, 59, 999);
      const [dayLeads, dayMsgs] = await Promise.all([
        prisma.lead.count({ where: { userId, createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.message.count({ where: { userId, isIncoming: false, createdAt: { gte: dayStart, lte: dayEnd } } }),
      ]);
      chartData.push({ date: dateStr, leads: dayLeads, messages: dayMsgs });
    }

    return NextResponse.json({
      summary: {
        leads: { total: totalLeads, new: newLeads, contacted: contactedLeads, converted: convertedLeads },
        platforms: { linkedin: linkedinLeads, google: googleLeads, manual: manualLeads },
        messaging: {
          sent: totalSent,
          received: totalReceived,
          replyRate: totalSent > 0 ? +((totalReceived / totalSent) * 100).toFixed(1) : 0,
        },
        sentiment: {
          positive: positiveReplies,
          negative: negativeReplies,
          neutral: totalReceived - positiveReplies - negativeReplies,
        },
        campaigns: { total: totalCampaigns, active: activeCampaigns },
        conversionRate:
          totalLeads > 0 ? +((convertedLeads / totalLeads) * 100).toFixed(1) : 0,
      },
      chartData,
      recentActivity,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
