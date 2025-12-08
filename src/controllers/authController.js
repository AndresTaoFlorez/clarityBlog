// backend/src/controllers/authController.js
import { AuthService } from '../services/authService.js';

export class AuthController {
  // Registro
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);

      res.status(201).json({
        token: result.token,
        usuario: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  // Login
  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);

      res.status(200).json({
        token: result.token,
        usuario: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar token
  static async verifyToken(req, res, next) {
    try {
      res.status(200).json({
        usuario: req.user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}
