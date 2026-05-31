import { GET } from "@/app/api/health/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]) },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG") },
  getRedisStatus: jest.fn().mockResolvedValue("ok"),
}));

jest.mock("@/lib/queues", () => ({
  getQueueStats: jest.fn().mockResolvedValue({ outreach: {}, content: {}, notifications: {} }),
}));

describe("GET /api/health", () => {
  it("returns 200 healthy when all services up", async () => {
    const req = new NextRequest("http://localhost/api/health");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.services.database).toBe("ok");
  });
});
