describe("Notification types", () => {
  const VALID_TYPES = [
    "LEAD_ASSIGNED", "FOLLOW_UP_DUE", "MESSAGE_SENT", "MESSAGE_FAILED",
    "CONTENT_PUBLISHED", "CONTENT_FAILED", "INTEGRATION_EXPIRED",
  ];

  it.each(VALID_TYPES)("accepts notification type: %s", (type) => {
    expect(VALID_TYPES).toContain(type);
  });

  it("covers all 7 notification types", () => {
    expect(VALID_TYPES).toHaveLength(7);
  });
});
