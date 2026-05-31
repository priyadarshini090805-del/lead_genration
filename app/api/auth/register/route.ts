import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validate, registerSchema } from "@/lib/validate";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { limit: 10, window: 60 });
  if (!rl.success) return rateLimitResponse(rl.reset);

  const body = await req.json();
  const { data, error } = validate(registerSchema, body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const existing = await prisma.user.findUnique({ where: { email: data!.email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const passwordHash = await bcrypt.hash(data!.password, 12);
    const user = await prisma.user.create({ data: { email: data!.email, name: data!.name || data!.email.split("@")[0], passwordHash, isVerified: true } });
    await prisma.workspace.create({ data: { name: `${user.name}'s Workspace`, userId: user.id } });

    logger.info(`New user registered: ${user.email}`);
    return NextResponse.json({ success: true, message: "Account created. Please sign in." });
  } catch (err: any) {
    logger.error(`Register error: ${err.message}`);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
