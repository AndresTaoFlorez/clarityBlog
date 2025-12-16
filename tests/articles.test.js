import request from "supertest";

const BASE_URL = "http://localhost:5000";

describe("Articles API Integration Tests", () => {
  let authToken;
  let testUserId;
  let testArticleId;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(BASE_URL).post("/api/auth/login").send({
      email: "admin@healthblog.com",
      password: "admin123456",
    });

    authToken = loginRes.body.token;
    testUserId = loginRes.body.user._id;
  });

  describe("GET /api/articles", () => {
    it("should return paginated articles", async () => {
      const res = await request(BASE_URL).get("/api/articles").expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toBeDefined();
      expect(Array.isArray(res.body.data.articles)).toBe(true);
      expect(res.body.pagination).toMatchObject({
        total: expect.any(Number),
        page: expect.any(Number),
        pages: expect.any(Number),
        limit: expect.any(Number),
      });
    });

    it("should return paginated articles with custom page and limit", async () => {
      const res = await request(BASE_URL)
        .get("/api/articles?page=2&limit=3")
        .expect(200);

      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(3);
    });
  });

  describe("GET /api/articles/:articleId", () => {
    it("should return a single article", async () => {
      const res = await request(BASE_URL)
        .get("/api/articles/e2039f5a-59f7-4670-951a-49d0178abc91")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("e2039f5a-59f7-4670-951a-49d0178abc91");
      expect(res.body.data.title).toBeDefined();
      expect(res.body.data.content).toBeDefined();
    });

    it("should return 404 for non-existent article", async () => {
      const res = await request(BASE_URL)
        .get("/api/articles/00000000-0000-0000-0000-000000000000")
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/articles/user/:userId", () => {
    it("should return articles for specific user", async () => {
      const res = await request(BASE_URL)
        .get(`/api/articles/user/${testUserId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toBeDefined();
      expect(res.body.data.articles.every((a) => a.userId === testUserId)).toBe(
        true,
      );
    });
  });

  describe("POST /api/articles", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(BASE_URL)
        .post("/api/articles")
        .send({
          title: "Test Article",
          content: "Test content with enough length",
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it("should create article with authentication", async () => {
      const res = await request(BASE_URL)
        .post("/api/articles")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Article Created",
          content: "This is test content with sufficient length for validation",
          categories: ["c8d04c31-4d2e-4f4b-9054-434f526141e1"],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Test Article Created");
      testArticleId = res.body.data.id;
    });
  });

  describe("PUT /api/articles/:articleId", () => {
    it("should return 401 without authentication", async () => {
      await request(BASE_URL)
        .put(`/api/articles/${testArticleId}`)
        .send({ title: "Updated" })
        .expect(401);
    });

    it("should update article with authentication", async () => {
      const res = await request(BASE_URL)
        .put(`/api/articles/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Test Article",
          content: "Updated content with sufficient length",
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Updated Test Article");
    });
  });

  describe("DELETE /api/articles/:articleId", () => {
    it("should return 401 without authentication", async () => {
      await request(BASE_URL)
        .delete(`/api/articles/${testArticleId}`)
        .expect(401);
    });

    it("should delete article with authentication", async () => {
      const res = await request(BASE_URL)
        .delete(`/api/articles/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted/i);
    });
  });
});
