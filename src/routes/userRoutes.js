// backend/src/routes/userRoutes.js
import express from "express";
import { UserController } from "../controllers/userController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.ts";

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
 * @desc    Create User
 * @access  Private (solo admin)
 */
router.post("/", authenticate, authorizeAdmin, UserController.create);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination
 * @access  Public
 */
router.get("/", UserController.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    Get User by ID
 * @access  Public
 */
router.get("/:id", UserController.getById);

/**
 * @route   GET /api/users/email/:email
 * @desc    Get Uesr by email
 * @access  Public
 */
router.get("/email/:email", UserController.getByEmail);

/**
 * @route   PUT /api/users/:id
 * @desc    Update User
 * @access  Private (solo el  User mismo o admin)
 */
router.put("/:id", authenticate, UserController.update);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete User by id
 * @access  Private (solo admin)
 */
router.delete("/:id", authenticate, authorizeAdmin, UserController.delete);

/**
 * @route   DELETE /api/users/email/:email
 * @desc    Delete User by email
 * @access  Private (solo admin)
 */
router.delete(
  "/email/:email",
  authenticate,
  authorizeAdmin,
  UserController.deleteByEmail,
);

export default router;
