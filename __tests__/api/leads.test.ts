import { GET, POST } from "@/app/api/leads/route";
import { NextRequest } from "next/server";

const mockSession = { user: { id: "user-1", email: "test@example.com", name: "Test" } };

jest.mock("next-auth", () => ({ getServerSession: jest.fn().mockResolvedValue(mockSession) }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findMany: jest.fn().mockResolvedValue([{ id: "lead-1", name: "John Doe", platform: "linkedin", status: "NEW", createdAt: new Date() }]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue({ id: "lead-2", name: "Jane Smith", platform: "linkedin", status: "NEW", createdAt: new Date() }),
    },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

describe("GET /api/leads", () => {
  it("returns leads list", async () => {
    const req = new NextRequest("http://localhost/api/leads");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.leads)).toBe(true);
    expect(body.total).toBe(1);
  });
});

describe("POST /api/leads", () => {
  it("creates a lead with valid data", async () => {
    const req = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({ name: "Jane Smith", platform: "linkedin" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Jane Smith");
  });

  it("rejects lead without name", async () => {
    const req = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({ platform: "linkedin" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
