// backend/src/services/AuthService.ts
import { User } from "../models/User.ts";
import { ControllerResponse } from "../utils/ControllerResponse.ts";
import { equal, isValid } from "../utils/validator.ts";
import { UserService } from "./UserService.ts";
import jwt from "jsonwebtoken";

interface AuthResponse {
  error?: { message: string } | boolean;
  data?: {
    user: any;
    token: string;
    expiresIn: string;
  };
}

export class AuthService {
  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Success response with user and token or error
   */
  static async register(userData: any): Promise<AuthResponse> {
    try {
      if (!isValid(userData, { dataType: "object", deep: true })) {
        throw new Error("user data is invalid");
      }

      const email = userData.email;
      const emailMatched = await UserService.findByEmail(email);
      if (!emailMatched.success) {
        const response = ControllerResponse.notFound(emailMatched.message);
        throw new Error(response.message);
      }

      const { data } = await UserService.create(userData);
      const userCreated = data[0];
      console.log(userCreated);

      const transformedData = this.translateToGenerateToken(userCreated);
      const token = this.generateToken(transformedData);

      return {
        error: false,
        data: {
          user: userCreated.toJSON(),
          token,
          expiresIn: "24h",
        },
      };
    } catch (error: any) {
      throw new Error(`Register error: ${error.message}`);
    }
  }

  /**
   * Login user with credentials
   * @param credentials - { email, password }
   * @returns Success response with user and token or error
   */
  static async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      const userResponse = await UserService.findByEmail(email);
      const user = userResponse.data[0];

      if (!userResponse.success) {
        return {
          error: { message: userResponse.message },
          data: { user: "", token: "", expiresIn: "" },
        };
      }

      const isValidPassword = await UserService.verifyPassword(
        password,
        user.password,
      );

      if (!isValidPassword) {
        throw new Error("Invalid password");
      }

      const transformedData = this.translateToGenerateToken(user);
      const token = this.generateToken(transformedData);

      return {
        error: false,
        data: {
          user: user.toJSON(),
          token,
          expiresIn: "24h",
        },
      };
    } catch (error: any) {
      throw new Error(`Login error: ${error.message}`);
    }
  }

  static translateToGenerateToken(user: User): {
    id: string;
    email: string;
    role: string;
  } {
    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Generate JWT token for user
   * @param user - User object
   * @returns Signed JWT token
   */
  static generateToken(user: {
    id: string;
    email: string;
    role?: string;
  }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" },
    );
  }

  /**
   * Verify JWT token
   * @param token - JWT string
   * @returns Decoded payload
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error: any) {
      throw new Error("Invalid token");
    }
  }
}
