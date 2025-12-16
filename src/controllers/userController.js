// backend/src/controllers/userController.js
import { UserService } from "../services/userService.js";
import { isValid, validateEmail } from "../utils/validator.ts";

export class UserController {
  // Crear usuario (solo admin)
  static async create(req, res, next) {
    try {
      const { role } = req?.user?.role;
      if (role !== "admin") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const { data: user, error } = await UserService.create(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

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

      const { data, error } = await UserService.findAll(page, limit);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          users: data.users,
          totalUsersCount: data.total,
          currentPage: data.page,
          totalPagesCount: data.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  static async getById(req, res, next) {
    try {
      const { data: user, error } = await UserService.findById(req.params.id);

      if (error) {
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

      const { firstUser: user, error } = await UserService.findByEmail(email);
      if (error) {
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

      const { data, error } = await UserService.search(q);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  static async update(req, res, next) {
    try {
      const userId = req.params.id;
      const { role } = req.user.role;
      const body = req.body;
      if (!isValid(body, { dataType: "object" } || !isValid(userId))) {
        throw new Error(`UserId or user data is invalid`);
      }

      const {
        data: {
          user: { _id: existingUserId },
        },
      } = await UserService.findById(userId);
      if (role !== "admin") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      if (existingUserId !== userId) {
        return res.status(401).json({
          success: false,
          message: "must be author or admin",
        });
      }
      const { data, error } = await UserService.update(userId, body);

      if (error) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(200).json({
        success: true,
        message: "User successfully updated",
        data: data.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar usuario
  static async delete(req, res, next) {
    try {
      const { error, data } = await UserService.delete(req.params.id);

      if (error) {
        return res.status(404).json({
          success: false,
          message: error.message,
          data,
        });
      }

      return res.status(200).json({
        success: true,
        message: "User successfully deleted",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteByEmail(req, res, next) {
    try {
      const { error, data } = await UserService.deleteByEmail(req.params.email);

      if (error) {
        return res.status(404).json({
          success: false,
          message: error.message,
          data,
        });
      }

      return res.status(200).json({
        success: true,
        message: "User successfully deleted",
        data,
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
