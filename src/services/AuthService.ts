// backend/src/services/AuthService.ts
// backend/src/services/AuthService.ts
import { User } from "../models/User";
import jwt, { SignOptions, TokenExpiredError } from "jsonwebtoken";
import type { StringValue } from "ms";
import { ControllerResponse } from "../utils/ControllerResponse";
import { equal, isValid } from "../utils/validator";
import { UserService } from "./UserService";
import { TokenBlacklist } from "./redis-client";
import { ServiceResponse } from "@/utils";
import { UUID } from "node:crypto";
import { UserRole } from "@/models/value-objects/UserRole";
import { UserInsert } from "@/types/database.types";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export class AuthService {
  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Success response with user and token or error
   */
  static async register(userData: UserInsert): Promise<ServiceResponse> {
    try {
      const {
        data: userCreated,
        success,
        message,
      } = await UserService.create(userData);

      if (!success) {
        return ServiceResponse.error(userCreated, message);
      }

      const transformedData = this.translateToGenerateToken(userCreated);
      const { token, expiresIn } = this.generateToken(transformedData);

      return ServiceResponse.ok(
        {
          user: userCreated.toJSON,
          token,
          expiresIn,
        },
        "User registered successful",
      );
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
  }): Promise<ServiceResponse> {
    try {
      const { email, password } = credentials;
      const userResponse = await UserService.findByEmail(email);
      const user = userResponse.data;

      if (!userResponse.success) {
        return ServiceResponse.error(
          { user: "", token: "", expiresIn: "" },
          userResponse.message,
        );
      }

      const isValidPassword = await UserService.verifyPassword(
        password,
        user.password,
      );

      if (!isValidPassword) {
        return ServiceResponse.error({}, "Invalid password");
      }

      const transformedData = this.translateToGenerateToken(user);
      const { token, expiresIn } = this.generateToken(transformedData);

      return ServiceResponse.ok(
        {
          user: user.toJSON(),
          token,
          expiresIn,
        },
        "Login successful",
      );
    } catch (error: any) {
      return ServiceResponse.error(`Login error: ${error.message}`);
    }
  }

  /**
   * Logout user from current device (add token to blacklist)
   * @param token - JWT token to invalidate
   */
  static async logout(token: string): Promise<ServiceResponse> {
    try {
      const expiresIn = this.getTokenExpirationTime(token);

      if (expiresIn > 0) {
        await TokenBlacklist.add(token, expiresIn);
      }

      return ServiceResponse.ok({}, "Logged out successfully");
    } catch (error: any) {
      return ServiceResponse.error({}, `Logout failed ${error.message}`);
    }
  }

  /**
   * Logout user from all devices (increment token version)
   * @param userId - User ID
   */
  static async logoutAllDevices(userId: string): Promise<ServiceResponse> {
    try {
      const result = await UserService.incrementTokenVersion(userId);

      if (!result.success) {
        return ServiceResponse.error({}, "Failed to logout from all devices");
      }

      return ServiceResponse.ok({}, "Logged out from all devices");
    } catch (error: any) {
      return ServiceResponse.error(`Logout failed: ${error.message}`);
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
    id: string | UUID;
    email: string;
    role?: string | UserRole;
    tokenVersion: number;
  }): { token: string; expiresIn: string } {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const options: SignOptions = {
      expiresIn: expiresIn as StringValue | number,
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role ?? "user",
        tokenVersion: user.tokenVersion,
      },
      secret,
      options,
    );

    return { token, expiresIn };
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
