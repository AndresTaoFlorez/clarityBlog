// backend/src/routes/articleRoutes.js
import express from "express";
import { ArticleController } from "../controllers/articleController.js";
import { CommentController } from "../controllers/commentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/articles/
 * @desc    Crear nueva nota/artículo
 * @access  Private
 */
router.post("/", authenticate, ArticleController.create);

/**
 * @route   GET /api/articles/
 * @desc    Obtener todas las /articles/artículos
 * @access  Public
 */
router.get("/", ArticleController.getAll);

/**
 * @route   GET /api/articles/search
 * @desc    Buscar /articles/artículos
 * @access  Public
 */
router.get("/search", ArticleController.search);

/**
 * @route   GET /api/articles/usuario/:userId
 * @desc    Obtener /articles de un usuario específico
 * @access  Public
 */
router.get("/user/:userId", ArticleController.getByUserId);

/**
 * @route   GET /api//rticles/:id
 * @desc    Obtener nota/artículo por ID
 * @access  Public
 */
router.get("/:id", ArticleController.getById);

/**
 * @route   PUT /api/articles/:id
 * @desc    Actualizar nota/artículo
 * @access  Private (solo el autor o admin)
 */
router.put("/:id", authenticate, ArticleController.update);

/**
 * @route   DELETE /api//articles/:id
 * @desc    Eliminar nota/artículo
 * @access  Private (solo el autor o admin)
 */
router.delete("/:id", authenticate, ArticleController.delete);

export default router;
