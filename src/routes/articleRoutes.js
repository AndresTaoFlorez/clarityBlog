// backend/src/routes/articleRoutes.js
import express from "express";
// import { ArticleController } from "../controllers/articleController.js";
import { ArticleController } from "../controllers/articleController.ts";
import { authenticate } from "../middlewares/authMiddleware.ts";

const router = express.Router();

/**
 * @route   POST /api/articles/
 * @desc    Create new article
 * @access  Private
 */
router.post("/", authenticate, ArticleController.create);

/**
 * @route   GET /api/articles/
 * @desc    Get all articles
 * @access  Public
 */
router.get("/", ArticleController.getAll);

/**
 * @route   GET /api/articles/search
 * @desc    Search /articles/artículos
 * @example /api/articles/search?q=depresión
 * @example /api/articles/search?q=<search-term>&page=2&limit=5
 * @access  Public
 */
router.get("/search", ArticleController.search);

/**
 * @route   GET /api/articles/userId/:userId
 * @desc    Get articles by user ID
 * @access  Public
 */
router.get("/userId/:userId", ArticleController.getByUserId);

/**
 * @route   GET /api/articles/:articleId
 * @desc    Get article by Id
 * @access  Public
 */
router.get("/:articleId", ArticleController.getById);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update article by Id
 * @access  Private (only author or admin user role)
 */
router.put("/:articleId", authenticate, ArticleController.update);

/**
 * @route   DELETE /api//articles/:id
 * @desc    Delete article
 * @access  Private (solo el autor o admin)
 */
router.delete("/:articleId", authenticate, ArticleController.delete);

/**
 * @route   DELETE /api//articles/:id
 * @desc    Delete article
 * @access  Private (solo el autor o admin)
 */
router.delete("/hard/:articleId", authenticate, ArticleController.hardDelete);

export default router;
