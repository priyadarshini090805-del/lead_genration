import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { messages: true } } },
    });
    let csv =
      "Name,Email,Company,Title,Platform,Status,Tags,Messages,Location,Created\n";
    for (const l of leads) {
      // Escape double-quotes inside field values
      const esc = (s: string) => s.replace(/"/g, '""');
      csv += `"${esc(l.name)}","${esc(l.email || "")}","${esc(l.company || "")}","${esc(l.title || "")}","${l.platform}","${l.status}","${esc(l.tags || "")}",${l._count.messages},"${esc(l.location || "")}","${l.createdAt.toISOString()}"\n`;
    }
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hanexis-leads-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
