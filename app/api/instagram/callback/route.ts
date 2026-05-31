import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeInstagramCode, getInstagramProfile } from "@/lib/instagram";
import { encryptToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return NextResponse.redirect(new URL("/dashboard/integrations?error=missing_params", req.url));

  const userId = Buffer.from(state, "base64").toString("utf8");
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/instagram/callback`;
  const accessToken = await exchangeInstagramCode(code, redirectUri);
  if (!accessToken) return NextResponse.redirect(new URL("/dashboard/integrations?error=token_exchange", req.url));

  const profile = await getInstagramProfile(accessToken);

  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider: "instagram" } },
    update: { accessToken, status: "CONNECTED", lastSyncAt: new Date(), metadata: profile ? JSON.stringify(profile) : null },
    create: { userId, provider: "instagram", accessToken, status: "CONNECTED", metadata: profile ? JSON.stringify(profile) : null },
  });

  await prisma.integrationToken.upsert({
    where: { userId_provider: { userId, provider: "instagram" } },
    update: { encryptedToken: encryptToken(accessToken) },
    create: { userId, provider: "instagram", encryptedToken: encryptToken(accessToken) },
  });

  return NextResponse.redirect(new URL("/dashboard/integrations?connected=instagram", req.url));
}
