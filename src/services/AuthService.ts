// backend/src/services/AuthService.ts
// backend/src/services/AuthService.ts
import { User } from "../models/User.ts";
import { ControllerResponse } from "../utils/ControllerResponse.ts";
import { equal, isValid } from "../utils/validator.ts";
import { UserService } from "./UserService.ts";
import jwt from "jsonwebtoken";
import { TokenBlacklist } from "./redis-client.ts";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

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

      const transformedData = this.translateToGenerateToken(userCreated);
      const token = this.generateToken(transformedData);

      return {
        error: false,
        data: {
          user: userCreated.toJSON(),
          token,
          expiresIn: "15m",
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
          expiresIn: "15m",
        },
      };
    } catch (error: any) {
      throw new Error(`Login error: ${error.message}`);
    }
  }

  /**
   * Logout user from current device (add token to blacklist)
   * @param token - JWT token to invalidate
   */
  static async logout(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const expiresIn = this.getTokenExpirationTime(token);

      if (expiresIn > 0) {
        await TokenBlacklist.add(token, expiresIn);
      }

      return { success: true, message: "Logged out successfully" };
    } catch (error: any) {
      console.error("Logout error:", error);
      return { success: false, message: "Logout failed" };
    }
  }

  /**
   * Logout user from all devices (increment token version)
   * @param userId - User ID
   */
  static async logoutAllDevices(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await UserService.incrementTokenVersion(userId);

      if (!result.success) {
        return { success: false, message: "Failed to logout from all devices" };
      }

      return { success: true, message: "Logged out from all devices" };
    } catch (error: any) {
      console.error("Logout all devices error:", error);
      return { success: false, message: "Logout failed" };
    }
  }

  /**
   * Translate User model to token payload format
   */
  static translateToGenerateToken(user: User): {
    id: string;
    email: string;
    role: string;
    tokenVersion: number;
  } {
    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    };
  }

  /**
   * Generate JWT token for user with token version
   * @param user - User object with token version
   * @returns Signed JWT token
   */
  static generateToken(user: {
    id: string;
    email: string;
    role?: string;
    tokenVersion: number;
  }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }, // Short-lived tokens
    );
  }

  /**
   * Verify JWT token
   * @param token - JWT string
   * @returns Decoded payload
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    } catch (error: any) {
      throw new Error("Invalid token");
    }
  }

  /**
   * Get token expiration time in seconds
   * @param token - JWT string
   * @returns Remaining seconds until expiration
   */
  static getTokenExpirationTime(token: string): number {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) return 0;

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;

      return expiresIn > 0 ? expiresIn : 0;
    } catch (error) {
      return 0;
    }
  }
}
