import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateMessage, generateContent, generateSmartReplies, analyzeSentiment } from "@/lib/openai";
import { validate, aiSchema } from "@/lib/validate";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(req, { limit: 30, window: 60, identifier: () => session.user.id });
  if (!rl.success) return rateLimitResponse(rl.reset);

  const body = await req.json();
  const { data, error } = validate(aiSchema, body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const { action } = data!;

    if (action === "generate-message") {
      const { leadName, platform, notes, type, company, title } = data!;
      if (!leadName || !platform) return NextResponse.json({ error: "leadName and platform required" }, { status: 400 });
      const content = await generateMessage({ leadName, platform, notes, type: (type as any) || "CONNECTION", company, title });
      return NextResponse.json({ content });
    }

    if (action === "generate-content") {
      const { type, topic, platform, tone } = data!;
      if (!type || !topic) return NextResponse.json({ error: "type and topic required" }, { status: 400 });
      const content = await generateContent({ type: type as any, topic, platform, tone });
      return NextResponse.json({ content });
    }

    if (action === "smart-replies") {
      const { lastMessage, leadName } = data!;
      if (!lastMessage) return NextResponse.json({ error: "lastMessage required" }, { status: 400 });
      const suggestions = await generateSmartReplies(lastMessage, leadName || "");
      return NextResponse.json({ suggestions });
    }

    if (action === "sentiment") {
      const { text } = data!;
      if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
      const result = await analyzeSentiment(text);
      return NextResponse.json(result);
    }

    if (action === "generate-group-message") {
      const { topic, platform, audience } = data!;
      const content = await generateMessage({ leadName: audience || "valued connection", platform: platform || "linkedin", notes: topic, type: "GROUP" });
      return NextResponse.json({ content });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
