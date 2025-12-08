// backend/src/routes/commentRoutes.js
import express from 'express';
import { CommentController } from '../controllers/commentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   DELETE /api/comentarios/:id
 * @desc    Eliminar comentario
 * @access  Private (solo el autor o admin)
 */
router.delete('/:id', authenticate, CommentController.delete);

/**
 * @route   PUT /api/comentarios/:id
 * @desc    Actualizar comentario
 * @access  Private (solo el autor o admin)
 */
router.put('/:id', authenticate, CommentController.update);

/**
 * @route   GET /api/comentarios/:id
 * @desc    Obtener comentario por ID
 * @access  Public
 */
router.get('/:id', CommentController.getById);

export default router;
