// backend/src/routes/noteRoutes.js
import express from 'express';
import { NoteController } from '../controllers/noteController.js';
import { CommentController } from '../controllers/commentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/notas
 * @desc    Crear nueva nota/artículo
 * @access  Private
 */
router.post('/', authenticate, NoteController.create);

/**
 * @route   GET /api/notas
 * @desc    Obtener todas las notas/artículos
 * @access  Public
 */
router.get('/', NoteController.getAll);

/**
 * @route   GET /api/notas/search
 * @desc    Buscar notas/artículos
 * @access  Public
 */
router.get('/search', NoteController.search);

/**
 * @route   GET /api/notas/usuario/:userId
 * @desc    Obtener notas de un usuario específico
 * @access  Public
 */
router.get('/usuario/:userId', NoteController.getByUserId);

/**
 * @route   GET /api/notas/:id
 * @desc    Obtener nota/artículo por ID
 * @access  Public
 */
router.get('/:id', NoteController.getById);

/**
 * @route   PUT /api/notas/:id
 * @desc    Actualizar nota/artículo
 * @access  Private (solo el autor o admin)
 */
router.put('/:id', authenticate, NoteController.update);

/**
 * @route   DELETE /api/notas/:id
 * @desc    Eliminar nota/artículo
 * @access  Private (solo el autor o admin)
 */
router.delete('/:id', authenticate, NoteController.delete);

// Rutas de comentarios relacionados a notas
/**
 * @route   GET /api/notas/:notaId/comentarios
 * @desc    Obtener comentarios de una nota/artículo
 * @access  Public
 */
router.get('/:notaId/comentarios', CommentController.getCommentsByArticle);

/**
 * @route   POST /api/notas/:notaId/comentarios
 * @desc    Crear comentario en una nota/artículo
 * @access  Private
 */
router.post('/:notaId/comentarios', authenticate, CommentController.create);

export default router;
