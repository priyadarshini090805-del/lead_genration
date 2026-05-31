import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInstagramOAuthUrl } from "@/lib/instagram";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/instagram/callback`;
  const state = Buffer.from(session.user.id).toString("base64");
  const url = getInstagramOAuthUrl(redirectUri, state);
  return NextResponse.json({ url });
}
