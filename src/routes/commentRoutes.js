// backend/src/routes/commentRoutes.js
import express from 'express';
import { CommentController } from '../controllers/commentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/comments
 * @desc    Crear comentario
 * @access  Private
 * @body    { article_id: uuid, comment: string }
 * @returns 201 Created con { id, content, userId, articleId, createdAt, author }
 */
router.post('/', authenticate, CommentController.createRoot);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Eliminar comentario
 * @access  Private (solo el autor o admin)
 */
router.delete('/:id', authenticate, CommentController.delete);

/**
 * @route   PUT /api/comments/:id
 * @desc    Actualizar comentario
 * @access  Private (solo el autor o admin)
 */
router.put('/:id', authenticate, CommentController.update);

/**
 * @route   GET /api/comments/:id
 * @desc    Obtener comentario por ID
 * @access  Public
 */
router.get('/:id', CommentController.getById);

export default router;
