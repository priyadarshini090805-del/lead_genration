import { z } from "zod";

// Helper: treat empty string as undefined so optional fields don't fail when the
// frontend sends name="" (blank input).
const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: optionalString(100),
});

export const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  platform: z.enum(["linkedin", "google", "instagram", "manual"]),
  profileUrl: z.string().url().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  status: z.enum(["NEW", "CONTACTED", "REPLIED", "CONVERTED", "LOST"]).optional(),
  tags: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  linkedinId: z.string().max(200).optional().nullable(),
});

export const messageSchema = z.object({
  leadId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(["CONNECTION", "FOLLOW_UP", "PITCH", "GROUP", "INBOX_CHAT"]).optional(),
  isIncoming: z.boolean().optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  platform: z.string().optional().nullable(),
});

export const groupMessageSchema = z.object({
  leadIds: z.array(z.string().cuid()).min(1).max(500),
  content: z.string().min(1).max(5000),
  type: z.enum(["CONNECTION", "FOLLOW_UP", "PITCH", "GROUP", "INBOX_CHAT"]).optional(),
  platform: z.string().optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  relayId: z.string().optional().nullable(),
});

export const campaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(["OUTREACH", "FOLLOW_UP", "GROUP_MESSAGE"]),
  platform: z.enum(["linkedin", "google", "instagram", "all"]),
  messageTemplate: z.string().max(5000).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const contentSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(10000),
  type: z.enum(["POST", "POSTER", "VIDEO_SCRIPT", "JOB_POST"]),
  platform: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const scheduledTaskSchema = z.object({
  type: z.enum(["FOLLOW_UP", "CONTENT_PUBLISH", "CAMPAIGN_SEND"]),
  scheduledFor: z.string().datetime(),
  timezone: z.string().default("UTC"),
  leadId: z.string().cuid().optional(),
  contentId: z.string().cuid().optional(),
  campaignId: z.string().cuid().optional(),
  message: z.string().max(5000).optional(),
  autoGenerate: z.boolean().optional(),
});

export const aiSchema = z.object({
  action: z.enum(["generate-message", "generate-content", "smart-replies", "sentiment", "generate-group-message"]),
  leadName: z.string().max(200).optional(),
  platform: z.string().optional(),
  notes: z.string().max(2000).optional(),
  type: z.string().optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  topic: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  lastMessage: z.string().max(2000).optional(),
  text: z.string().max(2000).optional(),
  audience: z.string().max(200).optional(),
});

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      data: null,
      error: result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; "),
    };
  }
  return { data: result.data, error: null };
}
