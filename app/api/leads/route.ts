import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validate, leadSchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const where: any = { userId: session.user.id };
  if (status) where.status = status;
  if (platform) where.platform = platform;
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    { company: { contains: search, mode: "insensitive" } },
    { tags: { contains: search, mode: "insensitive" } },
  ];
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.lead.count({ where }),
  ]);
  return NextResponse.json({ leads, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { data, error } = validate(leadSchema, body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    const lead = await prisma.lead.create({ data: { ...data!, userId: session.user.id } });
    await prisma.activityLog.create({ data: { action: "LEAD_CREATED", status: "SUCCESS", details: `Created: ${lead.name}`, userId: session.user.id, leadId: lead.id } });
    return NextResponse.json(lead, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
