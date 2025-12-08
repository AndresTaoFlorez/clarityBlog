// backend/src/routes/userRoutes.js
import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/usuarios/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticate, UserController.getProfile);

/**
 * @route   GET /api/usuarios/search
 * @desc    Buscar usuarios
 * @access  Public
 */
router.get('/search', UserController.search);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios con paginación
 * @access  Public
 */
router.get('/', UserController.getAll);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Public
 */
router.get('/:id', UserController.getById);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (solo el usuario mismo o admin)
 */
router.put('/:id', authenticate, UserController.update);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario
 * @access  Private (solo admin)
 */
router.delete('/:id', authenticate, authorizeAdmin, UserController.delete);

export default router;
