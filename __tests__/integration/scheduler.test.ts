import { validate, scheduledTaskSchema } from "@/lib/validate";

describe("ScheduledTask payload validation", () => {
  it("validates a FOLLOW_UP task", () => {
    const { data, error } = validate(scheduledTaskSchema, {
      type: "FOLLOW_UP",
      scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      timezone: "UTC",
      leadId: "clxxxxxxxxxxxxxxxxxxxxxxx",
      autoGenerate: true,
    });
    expect(error).toBeNull();
    expect(data?.type).toBe("FOLLOW_UP");
    expect(data?.timezone).toBe("UTC");
  });

  it("validates a CONTENT_PUBLISH task", () => {
    const { data, error } = validate(scheduledTaskSchema, {
      type: "CONTENT_PUBLISH",
      scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      timezone: "America/New_York",
      contentId: "clxxxxxxxxxxxxxxxxxxxxxxx",
    });
    expect(error).toBeNull();
    expect(data?.type).toBe("CONTENT_PUBLISH");
  });

  it("rejects past scheduledFor date format", () => {
    const { error } = validate(scheduledTaskSchema, {
      type: "FOLLOW_UP",
      scheduledFor: "not-a-date",
      leadId: "clxxxxxxxxxxxxxxxxxxxxxxx",
    });
    expect(error).not.toBeNull();
  });
});
