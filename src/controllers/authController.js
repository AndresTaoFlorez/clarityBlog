// backend/src/controllers/authController.js
import { AuthService } from "../services/authService.js";

export class AuthController {
  // Registro
  static async register(req, res, next) {
    try {
      const { data: result, error } = await AuthService.register(req.body);

      if (error) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(201).json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Login
  static async login(req, res, next) {
    try {
      const { data: result, error } = await AuthService.login(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar token
  static async verifyToken(req, res, next) {
    try {
      res.status(200).json({
        user: req.user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}
