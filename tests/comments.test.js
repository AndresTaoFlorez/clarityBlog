import request from "supertest";

const BASE_URL = "http://localhost:5000";

describe("Comments API Integration Tests", () => {
  let authToken;
  let testUserId;
  let testArticleId = "59668fdd-02a1-4ea5-8417-f4deb12b99bd"; // Existing article with comments
  let testCommentId;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(BASE_URL).post("/api/auth/login").send({
      email: "admin@healthblog.com",
      password: "admin123456",
    });

    authToken = loginRes.body.token;
    testUserId = loginRes.body.user._id;
  });

  describe("GET /api/comments/articleId/:articleId", () => {
    it("should return paginated comments for an article", async () => {
      const res = await request(BASE_URL)
        .get(`/api/comments/articleId/${testArticleId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.comments).toBeDefined();
      expect(Array.isArray(res.body.data.comments)).toBe(true);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pages).toBeGreaterThanOrEqual(1);
    });

    it("should return paginated comments with custom page and limit", async () => {
      const res = await request(BASE_URL)
        .get(`/api/comments/articleId/${testArticleId}?page=1&limit=3`)
        .expect(200);

      expect(res.body.data.comments.length).toBeLessThanOrEqual(3);
    });

    it("should return empty array for article with no comments", async () => {
      const res = await request(BASE_URL)
        .get("/api/comments/articleId/00000000-0000-0000-0000-000000000000")
        .expect(200);

      expect(res.body.data.comments).toEqual([]);
    });
  });

  describe("GET /api/comments/:commentId", () => {
    it("should return a single comment by id", async () => {
      const commentId = "73faa52f-f6fb-4daa-a3f9-7b5549d889cf";
      const res = await request(BASE_URL)
        .get(`/api/comments/${commentId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(commentId);
      expect(res.body.data.comment).toBeDefined();
      expect(res.body.data.authorName).toBeDefined();
    });

    it("should return 404 for non-existent comment", async () => {
      const res = await request(BASE_URL)
        .get("/api/comments/00000000-0000-0000-0000-000000000000")
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/comments/userId/:userId", () => {
    it("should return paginated comments for a user", async () => {
      const userId = "e0981b64-2ba4-481f-a590-d8398564fc27";
      const res = await request(BASE_URL)
        .get(`/api/comments/userId/${userId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.comments).toBeDefined();
      expect(res.body.data.comments.every((c) => c.userId === userId)).toBe(
        true,
      );
    });
  });

  describe("POST /api/comments/articleId/:articleId", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(BASE_URL)
        .post(`/api/comments/articleId/${testArticleId}`)
        .send({
          comment: "Test comment without auth",
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it("should create comment with authentication", async () => {
      const res = await request(BASE_URL)
        .post(`/api/comments/articleId/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comment: "This is a test comment created by integration test",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBe(
        "This is a test comment created by integration test",
      );
      expect(res.body.data.articleId).toBe(testArticleId);
      testCommentId = res.body.data.id;
    });

    it("should return 400 for empty comment", async () => {
      const res = await request(BASE_URL)
        .post(`/api/comments/articleId/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comment: "",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/comments/:commentId", () => {
    it("should return 401 without authentication", async () => {
      await request(BASE_URL)
        .put(`/api/comments/${testCommentId}`)
        .send({ comment: "Updated without auth" })
        .expect(401);
    });

    it("should update comment with authentication", async () => {
      const res = await request(BASE_URL)
        .put(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comment: "Updated test comment content",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBe("Updated test comment content");
    });

    it("should return 404 for non-existent comment", async () => {
      const res = await request(BASE_URL)
        .put("/api/comments/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comment: "Update non-existent",
        })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/comments/:commentId", () => {
    it("should return 401 without authentication", async () => {
      await request(BASE_URL)
        .delete(`/api/comments/${testCommentId}`)
        .expect(401);
    });

    it("should delete comment with authentication", async () => {
      const res = await request(BASE_URL)
        .delete(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it("should return 404 when deleting already deleted comment", async () => {
      const res = await request(BASE_URL)
        .delete(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
