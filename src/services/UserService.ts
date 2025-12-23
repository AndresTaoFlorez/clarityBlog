// backend/src/services/userService.ts
import { db } from "../config/database.ts";
import { User } from "../models/User.ts";
import bcrypt from "bcrypt";
import { isValid, merge } from "../utils/validator.ts";
import { ServiceResponse } from "../utils/index.ts";

interface UserData {
  email: string;
  password: string;
  name?: string;
  [key: string]: any;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedUsers {
  users: User[] | [];
  total: number;
  page: number;
  pages: number;
}

export class UserService {
  static async create(userData: UserData): Promise<ServiceResponse<User>> {
    try {
      const user = User.create(userData);
      if (!user.isValid()) {
        return ServiceResponse.error([], "Invalid user data");
      }

      // Generate password hash
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.setPassword(hashedPassword);

      const insertionData = user.toInsert();

      // Insert into users db table
      const { data: newUser, error: userError } = await db
        .from("users")
        .insert(insertionData)
        .select("*")
        .is("deleted_at", null)
        .single();

      if (userError) {
        console.error("Database error creating user:", userError);
        return ServiceResponse.error(
          [],
          `Failed to create user: ${userError.message}`,
        );
      }

      if (!newUser) {
        return ServiceResponse.error([], "No user data returned from database");
      }

      return ServiceResponse.ok(
        [User.fromDatabase(newUser)],
        "User created successfully",
      );
    } catch (error) {
      console.error("Error in UserService.create:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating user",
      );
    }
  }

  /**
   * Find user by ID
   * @param id - The user's ID
   * @returns ServiceResponse with user data
   */
  static async findById(id: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) {
        return ServiceResponse.error(
          [],
          `Failed to fetch user: ${error.message}`,
        );
      }

      if (!isValid(data) || data?.length === 0) {
        return ServiceResponse.error([], "User not found");
      }

      const user = User.fromDatabase(data);

      return ServiceResponse.ok([user], "User retrieved successfully");
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching user",
      );
    }
  }

  /**
   * Find user by email
   * @param email - The user's email
   * @returns ServiceResponse with user data
   */
  static async findByEmail(email: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error, count } = await db
        .from("users")
        .select("*", { count: "exact" })
        .eq("email", email)
        .is("deleted_at", null);

      if (error) {
        console.error("Database error fetching user by email:", error);
        return ServiceResponse.error(
          [],
          `Failed to fetch user: ${error.message}`,
        );
      }

      if (!data || data.length === 0 || count === 0) {
        return ServiceResponse.error([], "User not found");
      }

      const firstUser = User.fromDatabase(data[0]);

      if (!isValid(firstUser)) {
        return ServiceResponse.error([], "User not found");
      }

      return ServiceResponse.ok([firstUser], "User retrieved successfully");
    } catch (error) {
      console.error("Error in UserService.findByEmail:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching user",
      );
    }
  }

  /**
   * Get all users with pagination
   * @param params - Pagination parameters
   * @returns ServiceResponse with paginated users
   */
  static async findAll({
    page = 1,
    limit = 10,
  }: PaginationParams = {}): Promise<ServiceResponse<PaginatedUsers>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("users_active")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return ServiceResponse.error(
          [],
          `Failed to fetch users: ${error.message}`,
        );
      }

      if (!isValid(data) || data.length === 0) {
        return ServiceResponse.error(
          [
            {
              users: [],
              total: 0,
              page,
              pages: 0,
            },
          ],
          "No users found",
        );
      }

      const users = User.fromDatabaseList(data);

      const paginatedResult: PaginatedUsers = {
        users,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        [paginatedResult],
        "Users retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching users",
      );
    }
  }

  /**
   * Update user
   * @param id - The user's ID
   * @param userData - Data to update
   * @returns ServiceResponse with updated user
   */
  static async update(
    id: string,
    userData: Partial<UserData> = {},
  ): Promise<ServiceResponse<User>> {
    try {
      const updateData: any = { ...userData };

      if (userData.password) {
        // If password is being updated, hash it
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      updateData.updated_at = new Date().toISOString();

      // Update user
      const { data, error } = await db
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .is("deleted_at", null)
        .single();

      if (error) {
        console.error("Database error updating user:", error);
        return ServiceResponse.error(
          [],
          `Failed to update user: ${error.message}`,
        );
      }

      if (!data || !isValid(data?._id || data?.id)) {
        return ServiceResponse.error([], "User not found");
      }

      return ServiceResponse.ok(
        [User.fromDatabase(data)],
        "User updated successfully",
      );
    } catch (error) {
      console.error("Error in UserService.update:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating user",
      );
    }
  }

  /**
   * Delete user (soft delete)
   * @param id - The user's ID
   * @returns ServiceResponse with deleted user
   */
  static async delete(id: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) {
        console.error("Database error deleting user:", error);
        return ServiceResponse.error(
          [],
          `Failed to delete user: ${error.message}`,
        );
      }

      if (!data || !isValid(data?._id || data?.id)) {
        return ServiceResponse.error([], "User not found");
      }

      return ServiceResponse.ok(
        [User.fromDatabase(data)],
        "User deleted successfully",
      );
    } catch (error) {
      console.error("Error in UserService.delete:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting user",
      );
    }
  }

  /**
   * Delete user by email (soft delete)
   * @param email - The user's email
   * @returns ServiceResponse with deleted user
   */
  static async deleteByEmail(email: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .select("*")
        .eq("email", email)
        .is("deleted_at", null)
        .single();

      if (error) {
        console.error("Database error deleting user by email:", error);
        return ServiceResponse.error(
          [],
          `Failed to delete user: ${error.message}`,
        );
      }

      if (!data || !isValid(data?.email)) {
        return ServiceResponse.error([], "User not found");
      }

      return ServiceResponse.ok(
        [User.fromDatabase(data)],
        "User deleted successfully",
      );
    } catch (error) {
      console.error("Error in UserService.deleteByEmail:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting user",
      );
    }
  }

  /**
   * Search users by query
   * @param query - Search query string
   * @returns ServiceResponse with matching users
   */
  static async search(
    query: string,
    { page = 1, limit = 10 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedUsers>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("users_active")
        .select("*", { count: "exact" })
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !isValid(data) || data.length === 0) {
        return ServiceResponse.error([], `User not found : ${error?.message}`);
      }

      const users = User.fromDatabaseList(data);

      const paginatedResult: PaginatedUsers = {
        users,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        [paginatedResult],
        "Users retrieved successfully",
      );
    } catch (error) {
      console.error("Error in UserService.search:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while searching users",
      );
    }
  }

  /**
   * Verify password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Boolean indicating if password matches
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
