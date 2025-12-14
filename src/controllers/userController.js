// backend/src/controllers/userController.js
import { UserService } from "../services/userService.js";
import { isValid, validateEmail } from "../utils/validator.ts";

export class UserController {
  // Crear usuario (solo admin)
  static async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      res.status(201).json({
        success: true,
        message: "User successfully created",
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los usuarios con paginación
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await UserService.findAll(page, limit);

      res.status(200).json({
        success: true,
        data: {
          users: result.users,
          totalUsersCount: result.total,
          currentPage: result.page,
          totalPagesCount: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  static async getById(req, res, next) {
    try {
      const user = await UserService.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByEmail(req, res, next) {
    try {
      const email = req.params.email;
      if (!validateEmail(email)) {
        return res.status(404).json({
          success: false,
          message: "Email is required or invalid",
        });
      }

      const user = await UserService.findByEmail(email);
      if (!isValid(user)) {
        return res.status(404).json({
          success: false,
          message: "User by email not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar usuarios
  static async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!isValid(q)) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const users = await UserService.search(q);

      res.status(200).json({
        success: true,
        data: users.map((user) => user.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  static async update(req, res, next) {
    try {
      const userId = req.params.id;
      const body = req.body;
      if (!isValid(body, { dataType: "object" } || !isValid(userId))) {
        throw new Error(`UserId or user data is invalid`);
      }
      const user = await UserService.update(userId, body);

      res.status(200).json({
        success: true,
        message: "User successfully updated",
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar usuario
  static async delete(req, res, next) {
    try {
      await UserService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: "User successfully deleted",
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req, res, next) {
    try {
      const user = await UserService.findById(req.user.id);

      res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}
