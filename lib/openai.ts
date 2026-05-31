import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function generateMessage(params: {
  leadName: string;
  platform: string;
  notes?: string;
  type: "CONNECTION" | "FOLLOW_UP" | "PITCH" | "GROUP";
  company?: string;
  title?: string;
}): Promise<string> {
  const { leadName, platform, notes, type, company, title } = params;

  const systemPrompt = `You are Hanexis AI, an expert B2B outbound sales specialist.
Write highly personalized, professional, concise outreach messages.
- Keep messages under 3-4 sentences
- Non-spammy, human tone
- Include a clear, soft CTA
- Match the platform tone (LinkedIn = professional, others = casual-professional)`;

  const typeMap = {
    CONNECTION: "initial connection request",
    FOLLOW_UP: "follow-up message (2nd or 3rd touch)",
    PITCH: "sales pitch / value proposition",
    GROUP: "group broadcast message",
  };

  const prompt = `Write a ${typeMap[type]} for:
- Name: ${leadName}
- Platform: ${platform}
- Company: ${company || "unknown"}
- Title: ${title || "unknown"}
- Context: ${notes || "Business professional, interested in automation and growth"}

Output only the message text, no subject line, no quotes.`;

  const response = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0].message.content || "";
}

export async function generateContent(params: {
  type: "POST" | "POSTER" | "VIDEO_SCRIPT" | "JOB_POST";
  topic: string;
  platform?: string;
  tone?: string;
}): Promise<string> {
  const { type, topic, platform, tone } = params;

  const prompt = `Create a ${type.replace("_", " ").toLowerCase()} about: "${topic}"
Platform: ${platform || "LinkedIn"}
Tone: ${tone || "professional, engaging"}

Output only the content, ready to post.`;

  const response = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 500,
  });

  return response.choices[0].message.content || "";
}

export async function generateSmartReplies(lastMessage: string, leadName: string): Promise<string[]> {
  const prompt = `Given this inbound message from "${leadName}": "${lastMessage}"

Generate 3 short, professional reply options. Return as JSON array: ["reply1", "reply2", "reply3"]`;

  const response = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
    max_tokens: 200,
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return parsed.replies || parsed.options || Object.values(parsed)[0] as string[] || [];
  } catch {
    return ["Thank you for reaching out!", "I'd love to connect and learn more.", "Let's schedule a quick call."];
  }
}

export async function analyzeSentiment(text: string): Promise<{ sentiment: string; score: number; explanation: string }> {
  const prompt = `Analyze sentiment of this business message: "${text}"
Return JSON: {"sentiment": "POSITIVE"|"NEUTRAL"|"NEGATIVE", "score": 0.0-1.0, "explanation": "brief reason"}`;

  const response = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 100,
  });

  try {
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch {
    return { sentiment: "NEUTRAL", score: 0.5, explanation: "Could not analyze" };
  }
}
