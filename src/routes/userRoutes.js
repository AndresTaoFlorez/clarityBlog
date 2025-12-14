// backend/src/routes/userRoutes.js
import express from "express";
import { UserController } from "../controllers/userController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get("/profile", authenticate, UserController.getProfile);

/**
 * @route   GET /api/users/search
 * @desc    Search user
 * @access  Public
 */
router.get("/search", UserController.search);

/**
 * @route   POST /api/users
 * @desc    Crear User
 * @access  Private (solo admin)
 */
router.post("/", authenticate, authorizeAdmin, UserController.create);

/**
 * @route   GET /api/users
 * @desc    Obtener todos los users con paginación
 * @access  Public
 */
router.get("/", UserController.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener  User por ID
 * @access  Public
 */
router.get("/:id", UserController.getById);

/**
 * @route   GET /api/users/email/:email
 * @desc    Obtener  User por ID
 * @access  Public
 */
router.get("/email/:email", UserController.getByEmail);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar User
 * @access  Private (solo el  User mismo o admin)
 */
router.put("/:id", authenticate, UserController.update);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar User
 * @access  Private (solo admin)
 */
router.delete("/:id", authenticate, authorizeAdmin, UserController.delete);

export default router;
