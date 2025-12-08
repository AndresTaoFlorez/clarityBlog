// backend/src/services/authService.js
import { UserService } from './userService.js';
import jwt from 'jsonwebtoken';

export class AuthService {
  // Registrar usuario
  static async register(userData) {
    try {
      // Mapear campos del frontend (español) a modelo
      const mappedData = {
        nombre: userData.nombre,
        correo: userData.correo,
        password: userData.password
      };

      // Verificar si el email ya existe
      const existingUser = await UserService.findByEmail(mappedData.correo);
      if (existingUser) {
        throw new Error('El correo ya está registrado');
      }

      // Crear usuario
      const user = await UserService.create(mappedData);

      // Generar token
      const token = this.generateToken(user);

      return {
        user: user.toJSON(),
        token,
        expiresIn: '24h'
      };
    } catch (error) {
      throw new Error(`Error en registro: ${error.message}`);
    }
  }

  // Login
  static async login(credentials) {
    try {
      // Mapear campos del frontend (español)
      const correo = credentials.correo || credentials.email;
      const password = credentials.password;

      // Buscar usuario por email
      const user = await UserService.findByEmail(correo);
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await UserService.verifyPassword(
        password,
        user.password
      );

      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Generar token
      const token = this.generateToken(user);

      return {
        user: user.toJSON(),
        token,
        expiresIn: '24h'
      };
    } catch (error) {
      throw new Error(`Error en login: ${error.message}`);
    }
  }

  // Generar JWT
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Verificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}
