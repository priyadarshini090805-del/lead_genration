import { validate, registerSchema, leadSchema, messageSchema } from "@/lib/validate";

describe("validate — registerSchema", () => {
  it("accepts valid registration data", () => {
    const { data, error } = validate(registerSchema, { email: "test@example.com", password: "Password123" });
    expect(error).toBeNull();
    expect(data?.email).toBe("test@example.com");
  });

  it("rejects short password", () => {
    const { error } = validate(registerSchema, { email: "a@b.com", password: "short" });
    expect(error).toContain("8 characters");
  });

  it("rejects invalid email", () => {
    const { error } = validate(registerSchema, { email: "not-an-email", password: "password123" });
    expect(error).not.toBeNull();
  });
});

describe("validate — leadSchema", () => {
  it("accepts valid lead", () => {
    const { data, error } = validate(leadSchema, { name: "John Doe", platform: "linkedin" });
    expect(error).toBeNull();
    expect(data?.name).toBe("John Doe");
  });

  it("rejects unknown platform", () => {
    const { error } = validate(leadSchema, { name: "Jane", platform: "twitter" });
    expect(error).not.toBeNull();
  });

  it("rejects missing name", () => {
    const { error } = validate(leadSchema, { platform: "linkedin" });
    expect(error).not.toBeNull();
  });
});

describe("validate — messageSchema", () => {
  it("accepts valid message", () => {
    const { data, error } = validate(messageSchema, { leadId: "clxxxxxxxxxxxxxxxxxxxxxxx", content: "Hello there!" });
    expect(error).toBeNull();
  });

  it("rejects empty content", () => {
    const { error } = validate(messageSchema, { leadId: "clxxxxxxxxxxxxxxxxxxxxxxx", content: "" });
    expect(error).not.toBeNull();
  });
});
