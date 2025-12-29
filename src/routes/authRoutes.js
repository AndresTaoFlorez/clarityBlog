// backend/src/routes/authRoutes.ts
import express from "express";
import { AuthController } from "../controllers/AuthController.ts";
import { authenticate } from "../middlewares/authMiddleware.ts";

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Protected routes (authentication required)
router.get("/verify", authenticate, AuthController.verifyToken);
router.get("/profile", authenticate, AuthController.getProfile);
router.post("/logout", authenticate, AuthController.logout);
router.post("/logout-all/:userId", authenticate, AuthController.logoutAll);
router.post("/refresh", authenticate, AuthController.refreshToken);

export default router;
