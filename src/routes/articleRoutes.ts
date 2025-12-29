// backend/src/routes/articleRoutes.js
import type { Router } from "express";
import express from "express";
import { ArticleController } from "../controllers/ArticleController";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware";

const router: Router = express.Router();

/**
 * @route   POST /api/articles/
 * @desc    Create new article
 * @access  private
 */
router.post("/", authenticate, ArticleController.create);

/**
 * @route   GET /api/articles/
 * @desc    Get all articles
 * @access  public
 */
router.get("/", ArticleController.getAll);

/**
 * @route   GET /api/articles/a
 * @desc    Get all articles for admin
 * @access  private
 */
router.get("/a", authenticate, authorizeAdmin, ArticleController.getAll);

/**
 * @route   GET /api/articles/oneormore
 * @desc    Get articles by Ids --> Body > ids: [id1, id2, id3]
 * @access  public
 */
router.get("/oneormore", ArticleController.getArticleByIds);

/**
 * @route   GET /api/articles/search
 * @desc    Search /articles/artículos
 * @example /api/articles/search?q=depresión
 * @example /api/articles/search?q=<search-term>&page=2&limit=5
 * @access  public
 */
router.get("/search", ArticleController.search);

/**
 * @route   GET /api/articles/:articleId
 * @desc    Get article by Id
 * @access  public
 */
router.get("/:articleId", ArticleController.getArticleById);

/**
 * @route   GET /api/articles/userId/:userId
 * @desc    Get articles by user ID
 * @access  public
 */
router.get("/userId/:userId", ArticleController.getByUserId);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update article by Id
 * @access   private (only author or admin user role)
 */
router.put("/:articleId", authenticate, ArticleController.update);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Hard delete article
 * @access   private (only author or admin user)
 */
router.delete("/hard/:articleId?", authenticate, ArticleController.hardDelete);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Soft delete article
 * @access   private (only author or admin user)
 */
router.delete("/:articleId?", authenticate, ArticleController.delete);

/**
 * @route   PATCH /api//articles/:id
 * @desc    Delete article
 * @access   private (only admin user)
 */
router.patch(
  "/recover/:articleId?",
  authenticate,
  authorizeAdmin,
  ArticleController.recover,
);
export default router;
