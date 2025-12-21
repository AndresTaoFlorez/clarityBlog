// backend/src/services/authService.js
import { equal, isValid } from "../utils/validator.ts";
import { UserService } from "./UserService.ts";
import jwt from "jsonwebtoken";

export class AuthService {
  // Registrar usuario
  static async register(userData) {
    try {
      if (!isValid(userData, { dataType: "object", deep: true })) {
        throw new Error(`user data is invalid`);
      }

      const email = userData.email;
      const { firstUser } = await UserService.findByEmail(email);
      const { email: existingEmail } = firstUser;

      if (equal(email, existingEmail)) {
        return {
          error: {
            message: `User already exist: ${JSON.stringify(firstUser)}`,
          },
        };
      }

      const user = await UserService.create(userData);
      const token = this.generateToken(user);

      return {
        error: false,
        data: {
          user,
          token,
          expiresIn: "24h",
        },
      };
    } catch (error) {
      throw new Error(`Register error: ${error.message}`);
    }
  }

  // Login
  static async login(credentials) {
    try {
      // Mapear campos del frontend (español)
      const email = credentials.email;
      const password = credentials.password;

      // Buscar usuario por email
      const { firstUser: user, error } = await UserService.findByEmail(email);
      if (error) {
        return { error: { message: `User already exist: ${firstUser}` } };
      }

      // Verificar contraseña
      const isValidPassword = await UserService.verifyPassword(
        password,
        user.password,
      );

      if (!isValid(isValidPassword)) {
        throw new Error("Invalid password");
      }

      // Generar token
      const token = this.generateToken(user);

      return {
        error: false,
        data: {
          user: user.toJSON(),
          token,
          expiresIn: "24h",
        },
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
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
  }

  // Verificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error("Token inválido");
    }
  }
}
