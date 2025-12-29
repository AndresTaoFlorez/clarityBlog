// backend/src/routes/commentRoutes.js
import express from "express";
import type { Router } from "express";
import { CommentController } from "../controllers/commentController";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware";

const router: Router = express.Router();

/**
 * @route   POST /api/comments
 * @desc    Create comment
 * @access  Private
 * @body    { success, message, data }
 * @returns 201 Created con { id, content, userId, articleId, createdAt, author }
 */
router.post("/articleId/:articleId", authenticate, CommentController.create);

/**
 * @route   POST /api/comments/articleId/:articleId
 * @desc    Get comments to article
 * @access  Private
 * @body    { success, message, data }
 * @returns 201 Created con { id, content, userId, articleId, createdAt, author }
 */
router.get("/articleId/:articleId", CommentController.getCommentsByArticleId);

/**
 * @route   PUT /api/comments/articleId/:articleId
 * @desc    Update comment
 * @access  Private
 * @body    { success, message, data }
 * @returns 201 Created con { id, content, userId, articleId, createdAt, author }
 */
router.put(
  "/:commentId",
  authenticate,
  authorizeAdmin,
  CommentController.updateCommentByArticleId,
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private (only autor or admin)
 */
router.delete("/:commentId", authenticate, CommentController.delete);
/**
 * @route   GET /api/comments/:id
 * @desc    Obtener comentario por ID
 * @access  Public
 */
router.get("/:commentId", CommentController.getById);

/**
 * @route   GET /api/comments/userId/:id
 * @desc    Get comments by User ID
 * @access  Public
 */
router.get("/userId/:userId", CommentController.getByUserId);

export default router;
