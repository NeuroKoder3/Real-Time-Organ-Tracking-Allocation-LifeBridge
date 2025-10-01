import request from "supertest";
import app from "../server/index";

describe("Health Check", () => {
  it("should return 200 OK for /api/test/encryption-status", async () => {
    const res = await request(app).get("/api/test/encryption-status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("encrypted", true);
  });
});
