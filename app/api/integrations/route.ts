import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ integrations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { provider, accessToken } = await req.json();
    if (!provider || !accessToken)
      return NextResponse.json(
        { error: "provider and accessToken required" },
        { status: 400 }
      );
    const integration = await prisma.integration.upsert({
      where: { userId_provider: { userId: session.user.id, provider } },
      update: { accessToken, status: "CONNECTED", lastSyncAt: new Date() },
      create: { provider, accessToken, status: "CONNECTED", userId: session.user.id },
    });
    return NextResponse.json(integration);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { provider } = await req.json();
    if (!provider)
      return NextResponse.json({ error: "provider required" }, { status: 400 });
    await prisma.integration.deleteMany({
      where: { userId: session.user.id, provider },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
