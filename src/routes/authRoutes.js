// backend/src/routes/authRoutes.js
import express from "express";
import { AuthController } from "../controllers/AuthController.ts";
import { authenticate } from "../middlewares/authMiddleware.ts";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/verify", authenticate, AuthController.verifyToken);

export default router;
