// backend/src/controllers/userController.js
import { UserService } from '../services/userService.js';

export class UserController {
  // Obtener todos los usuarios con paginación
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await UserService.findAll(page, limit);

      res.status(200).json({
        success: true,
        data: {
          usuarios: result.users.map(user => user.toJSON()),
          totalUsuarios: result.total,
          paginaActual: result.page,
          totalPaginas: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuario por ID
  static async getById(req, res, next) {
    try {
      const user = await UserService.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar usuarios
  static async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Query de búsqueda es requerido'
        });
      }

      const users = await UserService.search(q);

      res.status(200).json({
        success: true,
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  static async update(req, res, next) {
    try {
      const user = await UserService.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user.toJSON()
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
        message: 'Usuario eliminado correctamente'
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
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}
