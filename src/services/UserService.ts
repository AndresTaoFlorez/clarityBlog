// backend/src/services/userService.ts
import { db } from "../config/database.ts";
import { User } from "../models/User.ts";
import bcrypt from "bcrypt";
import { isValid } from "../utils/validator.ts";
import { ServiceResponse } from "../utils/index.ts";
import type { UUID } from "crypto";

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

interface PaginatedUsers<T = User[]> {
  users: T;
  total: number;
  page: number;
  pages: number;
}

export class UserService {
  /**
   * Create a new user
   * @param {UserData} userData - User data object containing email, password, name, and optional fields
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with created user or error * @description Creates a new user with hashed password. Validates user data and inserts into database.
   * Only returns users where deleted_at is null
   * @example
   * const result = await UserService.create({
   *   email: "john@example.com",
   *   password: "SecurePass123!",
   *   name: "John Doe"
   * });
   * // Returns: { success: true, data: User, message: "User created successfully" }
   */
  static async create(userData: UserData): Promise<ServiceResponse<User>> {
    try {
      const user = User.create(userData);
      if (!user.isValid()) {
        return ServiceResponse.error({} as User, "Invalid user data");
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
        return ServiceResponse.error(
          {} as User,
          `Failed to create user: ${userError.message}`,
        );
      }

      if (!newUser) {
        return ServiceResponse.error(
          {} as User,
          "No user data returned from database",
        );
      }

      return ServiceResponse.ok(
        User.fromDatabase(newUser),
        "User created successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating user",
      );
    }
  }

  /**
   * Find user by ID
   * @param {string} id - The user's UUID
   * @param {string} role - User role (default: "user"). Admins can see deleted users
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with user data or error
   * @description Retrieves a single user by UUID. Admins can see soft-deleted users, regular users only see active users
   * @example
   * const result = await UserService.findById("123e4567-e89b-12d3-a456-426614174000", "admin");
   * // Returns: { success: true, data: User, message: "User retrieved successfully" }
   */
  static async findById(
    id: string,
    role: string = "user",
  ): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("id", id)
        .is("deleted_at", role === "admin" ? undefined : null)
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as User,
          `Failed to fetch user: ${error.message}`,
        );
      }

      if (!isValid(data) || data?.length === 0) {
        return ServiceResponse.error({} as User, "User not found");
      }

      const user = User.fromDatabase(data);

      return ServiceResponse.ok(user, "User retrieved successfull");
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error?.message
          : "An unexpected error occurred while fetching user",
      );
    }
  }

  /**
   * Find user by email
   * @param {string} email - The user's email address
   * @param {string} role - User role (default: "user"). Admins can see deleted users
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with user data or error
   * @description Retrieves a single user by email. Admins can see soft-deleted users, regular users only see active users
   * @example
   * const result = await UserService.findByEmail("john@example.com");
   * // Returns: { success: true, data: User, message: "User retrieved successfully" }
   */
  static async findByEmail(
    email: string,
    role: string = "user",
  ): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("email", email)
        .is("deleted_at", role === "admin" ? undefined : null)
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as User,
          `Failed to fetch user: ${error.message}`,
        );
      }

      if (!isValid(data) || data?.length === 0) {
        return ServiceResponse.error({} as User, "User not found");
      }

      const user = User.fromDatabase(data);

      return ServiceResponse.ok(user, "User retrieved successfull");
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching user",
      );
    }
  }

  /**
   * Get all users with pagination
   * @param {PaginationParams} params - Pagination parameters object
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Number of users per page (default: 10)
   * @param {string} params.role - User role (default: "user"). Determines which table to query (users vs users_active)
   * @param {string} params.ids - User ids (default: [])
   * @returns {Promise<ServiceResponse<PaginatedUsers<User[]>>>} ServiceResponse with paginated users or error
   * @description Retrieves all users with pagination. Admins query 'users' table (includes deleted),
   * regular users query 'users_active' view (only active users). Results ordered by created_at descending
   * @example
   * const result = await UserService.findAll({ ids: ["e123d...","y123..."], role: "admin", page: 1, limit: 10 });
   * // Returns: {
   * //   success: true,
   * //   data: { users: [...], total: 100, page: 1, pages: 10 },
   * //   message: "Users retrieved successfully"
   * //   meta: ["e123d...","y123..."]
   * // }
   */
  static async findAll({
    ids = [],
    role = "user",
    page = 1,
    limit = 10,
  }: Partial<PaginationParams> & { ids?: UUID[]; role?: string }): Promise<
    ServiceResponse<PaginatedUsers<User[]>>
  > {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const query = db
        .from(role === "admin" ? "users" : "users_active")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      isValid(ids, { dataType: "array" }) && query.in("id", ids);

      const { data, error, count } = await query;
      const total = count ?? (data?.length as number);

      if (error) {
        return ServiceResponse.error(
          {} as PaginatedUsers,
          `Failed to fetch users: ${error.message}`,
        );
      }

      if (!isValid(data)) {
        return ServiceResponse.error(
          {
            users: [],
            total: 0,
            page,
            pages: 0,
          },
          "No users found",
        );
      }

      const users = User.fromDatabaseList(data);

      const notFoundIds = ids.filter(
        (id) => !users.some((user) => user.id === id),
      );

      const paginatedResult: PaginatedUsers = {
        users,
        total,
        page: limit > 0 ? page : 1,
        pages: limit > 0 ? Math.ceil(total / limit) : 1,
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Users retrieved successfully",
        notFoundIds,
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedUsers,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching users",
      );
    }
  }

  /**
   * Update user information
   * @param {string} id - The user's UUID
   * @param {Partial<UserData>} userData - Partial user data object with fields to update
   * @param {string} role - User role (default: "user"). Only admins can update role and deleted_at fields
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with updated user or error
   * @description Updates user data. Hashes password if provided. Non-admins cannot update role or deleted_at.
   * Returns the updated user object
   * @example
   * const result = await UserService.update("123e4567...", { name: "Jane Doe", bio: "New bio" }, "user");
   * // Returns: { success: true, data: User, message: "User updated successfully" }
   */
  static async update(
    id: string,
    userData: Partial<UserData> = {},
    role: string = "user",
  ): Promise<ServiceResponse<User>> {
    try {
      const updateData: any = { ...userData };

      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      if (role !== "admin" && "role" in updateData) {
        delete updateData.role;
      }

      if (role !== "admin" && "deleted_at" in updateData) {
        delete updateData.deleted_at;
      }

      const { data, error } = await db
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as User,
          `Failed to update user: ${error.message}`,
        );
      }

      return ServiceResponse.ok(
        User.fromDatabase(data),
        "User updated successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating user",
      );
    }
  }

  /**
   * Soft delete a single user
   * @param {string} id - The user's UUID
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with soft-deleted user or error
   * @description Soft deletes a user by setting deleted_at to current timestamp. Only deletes if not already deleted.
   * Also updates updated_at timestamp
   * @example
   * const result = await UserService.softDelete("123e4567-e89b-12d3-a456-426614174000");
   * // Returns: { success: true, data: User, message: "User deleted successfully" }
   */
  static async softDelete(id: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .is("deleted_at", null) // Only delete if not already deleted
        .select("*")
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as User,
          `Failed to delete user: ${error.message}`,
        );
      }

      if (!data) {
        return ServiceResponse.error(
          {} as User,
          "User not found or already deleted",
        );
      }

      return ServiceResponse.ok(
        User.fromDatabase(data),
        "User deleted successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting user",
      );
    }
  }

  /**
   * Soft delete multiple users
   * @param {string[]} userIds - Array of user UUIDs to delete
   * @param {PaginationParams} params - Pagination parameters object
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Number of users per page (default: 10). Use 0 for no pagination
   * @returns {Promise<ServiceResponse<PaginatedUsers<User[]>>>} ServiceResponse with paginated deleted users or error
   * @description Bulk soft deletes users by setting deleted_at timestamp. Only deletes non-deleted users.
   * Returns paginated results with metadata including notFoundIds
   * @example
   * const result = await UserService.softManyDelete(
   *   ["123e...", "456e...", "789e..."],
   *   { limit: 0 }
   * );
   * // Returns: {
   * //   success: true,
   * //   data: { users: [...], total: 2, page: 1, pages: 1 },
   * //   message: "Users deleted successfully",
   * //   meta: { notFoundIds: ["789e..."], totalRequested: 3, totalDeleted: 2 }
   * // }
   */
  static async softManyDelete(
    userIds: string[],
    { page = 1, limit = 10 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedUsers<User[]>>> {
    try {
      let query = db
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", userIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // Apply pagination only if limit > 0
      let data, error, count;
      if (limit > 0) {
        const offset = (page - 1) * limit;
        const result = await query
          .select("*")
          .range(offset, offset + limit - 1);
        data = result.data;
        error = result.error;
        count = result.count;
      } else {
        // limit = 0 means fetch ALL users (no range)
        const result = await query.select("*");
        data = result.data;
        error = result.error;
        count = result.count;
      }

      const isData = !isValid(data, { dataType: "array", deep: true });

      if (error || isData) {
        return ServiceResponse.error(
          {} as PaginatedUsers,
          isData
            ? "Users not found"
            : `Error deleting users: ${error?.message}`,
        );
      }

      const deletedUsers = User.fromDatabaseList(data || []);

      const notFoundIds = userIds.filter(
        (id) => !deletedUsers.some((user) => user.id === id),
      );

      const paginatedResult: PaginatedUsers = {
        users: deletedUsers,
        total: count || 0,
        page: limit > 0 ? page : 1,
        pages: limit > 0 ? Math.ceil((count || 0) / limit) : 1,
      };

      return ServiceResponse.ok(paginatedResult, "Users deleted successfully", {
        notFoundIds,
        totalRequested: userIds.length,
        totalDeleted: deletedUsers.length,
      });
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedUsers,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting users",
      );
    }
  }

  /**
   * Recover a single user (restore from soft delete)
   * @param {string} userId - The user's UUID
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with recovered user or error
   * @description Restores a soft-deleted user by setting deleted_at to null. Only recovers users that are currently deleted.
   * Also updates updated_at timestamp
   * @example
   * const result = await UserService.recoverById("123e4567-e89b-12d3-a456-426614174000");
   * // Returns: { success: true, data: User, message: "User recovered successfully" }
   */
  static async recoverById(userId: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .from("users")
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .not("deleted_at", "is", null) // Only recover deleted users
        .select("*")
        .single();

      const isData = !isValid(data);

      if (error || isData) {
        return ServiceResponse.error(
          {} as User,
          isData
            ? "User not found or already active"
            : `Failed to recover user: ${error?.message}`,
        );
      }

      return ServiceResponse.ok(
        User.fromDatabase(data),
        "User recovered successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while recovering user",
      );
    }
  }

  /**
   * Recover multiple users (restore from soft delete)
   * @param {string[]} userIds - Array of user UUIDs to recover
   * @param {PaginationParams} params - Pagination parameters object
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Number of users per page (default: 10). Use 0 for no pagination
   * @returns {Promise<ServiceResponse<PaginatedUsers<User[]>>>} ServiceResponse with paginated recovered users or error
   * @description Bulk restores soft-deleted users by setting deleted_at to null. Only recovers currently deleted users.
   * Updates all recovered users first, then applies pagination to results. Returns metadata including notFoundIds
   * @example
   * const result = await UserService.recoverByIds(
   *   ["123e...", "456e...", "789e..."],
   *   { page: 1, limit: 10 }
   * );
   * // Returns: {
   * //   success: true,
   * //   data: { users: [...], total: 2, page: 1, pages: 1 },
   * //   message: "Users recovered successfully",
   * //   meta: { notFoundIds: ["789e..."], totalRequested: 3, totalRecovered: 2 }
   * // }
   */
  static async recoverByIds(
    userIds: string[],
    { page = 1, limit = 10 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedUsers<User[]>>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit;
      // Step 1: Update without pagination to get all recovered IDs
      const { data: allRecovered, error } = await db
        .from("users")
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .in("id", userIds)
        .not("deleted_at", "is", null) // Only recover deleted users
        .select("*");

      const isData = !isValid(allRecovered, { dataType: "array", deep: true });

      if (error || isData) {
        return ServiceResponse.error(
          {} as PaginatedUsers,
          isData
            ? "Not users found"
            : `Error recovering users: ${error?.message}`,
        );
      }

      const totalRecovered = allRecovered?.length || 0;

      // Step 2: Apply pagination to the results
      const paginatedData =
        limit > 0 ? (allRecovered || []).slice(from, to) : allRecovered || [];

      const recoveredUsers = User.fromDatabaseList(paginatedData);

      const notFoundIds = userIds.filter(
        (id) => !(allRecovered || []).some((user) => user.id === id),
      );

      const paginatedResult: PaginatedUsers = {
        users: recoveredUsers,
        total: totalRecovered,
        page: limit > 0 ? page : 1,
        pages: limit > 0 ? Math.ceil(totalRecovered / limit) : 1,
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Users recovered successfully",
        {
          notFoundIds,
          totalRequested: userIds.length,
          totalRecovered: totalRecovered,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedUsers,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while recovering users",
      );
    }
  }

  /**
   * Delete user by email (soft delete)
   * @param {string} email - The user's email address
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with deleted user or error
   * @description Soft deletes a user by email address. Sets deleted_at to current timestamp.
   * Only deletes if not already deleted
   * @example
   * const result = await UserService.deleteByEmail("john@example.com");
   * // Returns: { success: true, data: User, message: "User deleted successfully" }
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
        return ServiceResponse.error(
          {} as User,
          `Failed to delete user: ${error.message}`,
        );
      }

      if (!data || !isValid(data?.email)) {
        return ServiceResponse.error({} as User, "User not found");
      }

      return ServiceResponse.ok(
        User.fromDatabase(data),
        "User deleted successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as User,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting user",
      );
    }
  }

  /**
   * Search users by query
   * @param {string} query - Search query string to match against name or email
   * @param {PaginationParams} params - Pagination parameters object
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Number of users per page (default: 10)
   * @returns {Promise<ServiceResponse<PaginatedUsers<User[]>>>} ServiceResponse with paginated matching users or error
   * @description Searches active users (users_active view) by name or email using case-insensitive LIKE matching.
   * Results ordered by created_at descending. Only returns active (non-deleted) users
   * @example
   * const result = await UserService.search("john", { page: 1, limit: 5 });
   * // Returns: {
   * //   success: true,
   * //   data: { users: [...], total: 15, page: 1, pages: 3 },
   * //   message: "Users retrieved successfully"
   * // }
   */
  static async search(
    query: string,
    { page = 1, limit = 10 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedUsers<User[]>>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("users_active")
        .select("*", { count: "exact" })
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !isValid(data) || data.length === 0) {
        return ServiceResponse.error(
          {} as PaginatedUsers,
          `User not found : ${error?.message}`,
        );
      }

      const users = User.fromDatabaseList(data);

      const paginatedResult = {
        users,
        total: count || 0,
        page: limit > 0 ? page : 1,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Users retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedUsers,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while searching users",
      );
    }
  }

  /**
   * Increment user's token version (invalidate all tokens)
   * @param {string} userId - The user's UUID
   * @returns {Promise<ServiceResponse<User>>} ServiceResponse with updated user or error
   * @description Increments the user's token_version field by 1, effectively invalidating all existing JWT tokens.
   * Used for logout from all devices functionality. Calls database RPC function 'increment_token_version'
   * @example
   * const result = await UserService.incrementTokenVersion("123e4567-e89b-12d3-a456-426614174000");
   * // Returns: { success: true, data: User, message: "Token version updated" }
   */
  static async incrementTokenVersion(
    userId: string,
  ): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await db
        .rpc("increment_token_version", { user_id: userId })
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as User,
          "Failed to increment token version",
        );
      }

      return ServiceResponse.ok(
        User.fromDatabase(data),
        "Token version updated",
      );
    } catch (error: any) {
      return ServiceResponse.error({} as User, error.message);
    }
  }

  /**
   * Verify if a plain text password matches the hashed password
   * @param {string} plainPassword - The plain text password provided by the user
   * @param {string} hashedPassword - The hashed password stored in the database (bcrypt hash)
   * @returns {Promise<boolean>} True if passwords match, false otherwise
   * @description Uses bcrypt to compare plain text password against stored hash.
   * Used during login authentication to verify user credentials
   * @example
   * const isValid = await UserService.verifyPassword("userInput123", "$2b$10$...");
   * // Returns: true or false
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
