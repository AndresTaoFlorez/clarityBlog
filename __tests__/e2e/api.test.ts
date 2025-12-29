// __tests__/e2e/api.test.ts
import request from "supertest";
import app from "@/app";

describe("API E2E Tests", () => {
  test("should run a basic test", () => {
    expect(2 + 2).toBe(4);
  });

  test("GET api/health should return 200", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });
});

// describe('API E2E Tests', () => {
//   test('GET /health should return 200', async () => {
//     const response = await request(app).get('/health');
//     expect(response.status).toBe(200);
//     expect(response.body).toHaveProperty('message');
//   });
// });
