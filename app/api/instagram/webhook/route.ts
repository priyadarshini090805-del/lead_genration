import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Instagram webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.INSTAGRAM_WEBHOOK_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Instagram webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    logger.info(`[Instagram Webhook] Received event: ${JSON.stringify(body)}`);
    // Process webhook events (content updates, account events)
    const entries = body.entry || [];
    for (const entry of entries) {
      logger.info(`[Instagram Webhook] Processing entry for: ${entry.id}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error(`[Instagram Webhook] Error: ${err.message}`);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
