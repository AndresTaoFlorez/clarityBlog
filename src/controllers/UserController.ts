import { UserService } from "../services/UserService.ts";
import { ControllerResponse } from "../utils/index.ts";
import { type Response, type Request, type NextFunction } from "express";
import {
  isSecurePassword,
  isValid,
  equal,
  merge,
  checkUuids,
} from "../utils/validator.ts";
import { ArticleService } from "../services/ArticleService.ts";

export class UserController {
  /**
   * Get all users with pagination
   * @param {Request} req - Express request object with query params (page, limit)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with paginated users list
   * @description Retrieves all users with pagination support. Admins see all users including soft-deleted (from 'users' table),
   * regular users see only active users (from 'users_active' view). Extracts role from authenticated user context.
   * Can only get users by Ids from body request like: { ids: ["uuid1", "uuid2", "..."]}
   * Query params: page = 1, limit = 10, role = "admin",
   * @throws {Error} Passes errors to next middleware
   * @example
   * GET /api/users?page=1&limit=10
   * Response: {
   *   success: true,
   *   data: {
   *     users: [...],
   *     total: 100,
   *     page: 1,
   *     pages: 10
   *   },
   *   message: "Users retrieved successfully"
   *   meta: { notFoundIds: []}
   * }
   */
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const ids = req?.body.ids ?? [];
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.user?.role as string;

      const { allFailed, validIds, invalidIds } = checkUuids(ids);

      if (allFailed) {
        const response = ControllerResponse.badRequest(
          "Invalid UUIDS provided",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success, meta } = await UserService.findAll({
        ids: validIds,
        role,
        page,
        limit,
      });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "Users retrieved successfully",
        { notFoundIds: merge(meta, invalidIds) },
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single user by ID
   * @param {Request} req - Express request object with userId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with user data
   * @description Retrieves a user by UUID. Validates ID format using isValid validator.
   * Admins can see deleted users, regular users only see active users.
   * Returns 400 for invalid UUID, 404 if user not found, 200 with user data on success
   * @throws {Error} Passes errors to next middleware
   * @example
   * GET /api/users/123e4567-e89b-12d3-a456-426614174000
   * Response: {
   *   success: true,
   *   data: [{ id: "...", name: "John Doe", email: "...", ... }],
   *   message: "User retrieved successfully"
   * }
   */
  static async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id;
      const role = req.user?.role as string;

      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("User ID is invalid");
        res.status(response.status).json(response);
        return;
      }
      const { data, message, success } = await UserService.findById(
        userId,
        role,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "User retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single user by email address
   * @param {Request} req - Express request object with email in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with user data
   * @description Retrieves a user by email address. Validates email format using isValid validator.
   * Admins can see deleted users, regular users only see active users.
   * Returns 400 for invalid email format, 404 if user not found, 200 with user data on success
   * @throws {Error} Passes errors to next middleware
   * @example
   * GET /api/users/email/john@example.com
   * Response: {
   *   success: true,
   *   data: [{ id: "...", email: "john@example.com", name: "...", ... }],
   *   message: "User retrieved successfully"
   * }
   */
  static async getByEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.params.email;
      const role = req.user?.role as string;
      if (!isValid(email, { dataType: "email" })) {
        const response = ControllerResponse.badRequest("User email is invalid");
        res.status(response.status).json(response);
        return;
      }
      const { data, message, success } = await UserService.findByEmail(
        email,
        role,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "User retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users by query term
   * @param {Request} req - Express request object with query params (q, page, limit)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with matching users
   * @description Searches users by name or email using case-insensitive matching.
   * Validates search query using isValid validator. Returns paginated results.
   * Query params: q (required, search term), page (default: 1), limit (default: 5)
   * Returns 400 for invalid query, 404 if no matches found, 200 with matching users on success
   * @throws {Error} Passes errors to next middleware
   * @example
   * GET /api/users/search?q=john&page=1&limit=5
   * Response: {
   *   success: true,
   *   data: {
   *     users: [...matchingUsers],
   *     total: 15,
   *     page: 1,
   *     pages: 3
   *   },
   *   message: "User retrieved successfully"
   * }
   */
  static async search(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!isValid(query, { dataType: "query" })) {
        const response = ControllerResponse.badRequest(
          "Search term is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } = await UserService.search(query, {
        page,
        limit,
      });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "User retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user information
   * @param {Request} req - Express request object with userId in params and update data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with updated user data
   * @description Updates user profile information. Validates UUID format, password security requirements, and authorization.
   * Users can update their own account, admins can update any account. Role changes require admin privileges.
   * Password is validated using isSecurePassword if provided. Non-admins cannot modify role or deleted_at fields.
   * Returns 400 for invalid UUID or insecure password, 401 if user tries to update another user's account (non-admin),
   * 404 if user not found, 200 with updated user on success
   * @throws {Error} Passes errors to next middleware
   * @example
   * PUT /api/users/123e4567-e89b-12d3-a456-426614174000
   * Body: { "name": "Jane Doe", "bio": "Updated bio", "password": "NewSecure123!" }
   * Response: {
   *   success: true,
   *   data: [{ id: "...", name: "Jane Doe", bio: "Updated bio", ... }],
   *   message: "User updated successfully"
   * }
   */
  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userData = req.body;
      const password = userData.password as string | undefined;
      const { errors, isValid: isPasswordValid } = isSecurePassword(password);
      const role = req.user?.role as string;
      const sessionUserId = req.user?.id as string;
      const userId = req.params.id ?? sessionUserId;

      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("User ID is invalid");
        res.status(response.status).json(response);
        return;
      }

      if (!equal(sessionUserId, userId) && !equal(role, "admin")) {
        const response = ControllerResponse.unauthorized();
        res.status(response.status).json(response);
        return;
      }

      if (!isPasswordValid && password) {
        const response = ControllerResponse.badRequest(errors.join(", "));
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await UserService.update(
        userId,
        userData,
        role,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user(s) - routing function
   * @param {Request} req - Express request object with optional userId in params OR ids array in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} Delegates to deleteByUserId or deleteByUserIds
   * @description Routes deletion request to appropriate handler based on input type.
   * Accepts either single userId in URL params or array of ids in request body, but not both.
   * Returns 400 if both userId and ids array are provided simultaneously.
   * Delegates to private deleteByUserId for single deletion or deleteByUserIds for bulk deletion
   * @throws {Error} Passes errors to next middleware
   * @example
   * DELETE /api/users/123e4567-... (single delete via URL param)
   * DELETE /api/users with body: { "ids": ["...", "..."] } (bulk delete via body)
   */
  static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const isArray: boolean = Array.isArray(req?.body.ids);
      const userId = req.params?.userId;

      if (isArray && isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest(
          "Provide either userId param or ids array in body, not both",
        );
        res.status(response.status).json(response);
        return;
      } else if (isArray) {
        // array of ids in body
        return await UserController.deleteByUserIds(req, res, next);
      } else {
        // single id in param
        return await UserController.deleteByUserId(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a single user by ID (private method)
   * @param {Request} req - Express request object with userId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with deleted user and associated articles
   * @description Soft deletes a user and cascades deletion to all their articles.
   * Validates UUID format and authorization. Users can delete their own account, admins can delete any account.
   * First retrieves user's articles using ArticleService.findByUserId, then soft deletes articles using
   * ArticleService.softManyDelete (with limit: 0 for no pagination), finally soft deletes the user.
   * Returns 400 for invalid UUID, 403 if non-admin tries to delete another user, 404 if user not found,
   * 500 if deletion fails, 200 with deleted user and articles on success
   * @throws {Error} Passes errors to next middleware
   * @example
   * DELETE /api/users/123e4567-e89b-12d3-a456-426614174000
   * Response: {
   *   success: true,
   *   data: [{
   *     user: { id: "...", name: "...", deleted_at: "2024-01-15T10:30:00Z", ... },
   *     deletedArticles: [{ id: "...", title: "...", ... }, ...]
   *   }],
   *   message: "User and associated articles deleted successfully",
   *   meta: { totalArticlesDeleted: 5 }
   * }
   */
  private static async deleteByUserId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user?.id;
      const role = req.user?.role;

      // Validate user ID
      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Invalid User ID");
        res.status(response.status).json(response);
        return;
      }

      // Authorization: users can only delete themselves, admins can delete anyone
      if (userId !== requestingUserId && role !== "admin") {
        const response = ControllerResponse.forbidden(
          "You can only delete your own account",
        );
        res.status(response.status).json(response);
        return;
      }

      // Check if user exists
      const userResponse = await UserService.findById(userId, role);
      if (!userResponse.success) {
        const response = ControllerResponse.notFound("User not found");
        res.status(response.status).json(response);
        return;
      }

      // Get all user's articles to delete them too
      const articlesResponse = await ArticleService.findByUserId(userId, {
        limit: 0,
      });

      const articleIds: string[] =
        articlesResponse.data.articles
          ?.map((a) => a.id)
          .filter((id): id is string => id !== null && id !== undefined) ?? [];

      // Delete user's articles if any exist
      let articlesDeleted = null;
      if (articleIds.length > 0) {
        const deleteArticlesResult = await ArticleService.softManyDelete(
          articleIds,
          { limit: 0 },
        );
        articlesDeleted = deleteArticlesResult.data;
      }

      // Delete the user
      const deleteUserResult = await UserService.softDelete(userId);

      if (!deleteUserResult.success) {
        const response = ControllerResponse.serverError(
          deleteUserResult.message,
        );
        res.status(response.status).json(response);
        return;
      }

      // Success response
      const response = ControllerResponse.ok(
        [
          {
            user: deleteUserResult.data,
            deletedArticles: articlesDeleted?.articles || [],
          },
        ],
        "User and associated articles deleted successfully",
        {
          totalArticlesDeleted: articlesDeleted?.total || 0,
        },
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete multiple users by IDs (private method)
   * @param {Request} req - Express request object with ids array in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with deleted users and their associated articles
   * @description Bulk soft deletes users and all their articles. Validates UUIDs using checkUuids utility.
   * Reports invalid and not-found IDs in response metadata. For each valid user, retrieves their article IDs
   * using ArticleService.getArticleIdsByUserId, then soft deletes articles. Uses Promise.all for parallel processing.
   * Returns 400 if all IDs are invalid, 404 if operation fails, 200 with detailed results on success.
   * Response includes per-user breakdown of deleted articles and aggregate metadata
   * @throws {Error} Passes errors to next middleware
   * @example
   * DELETE /api/users
   * Body: { "ids": ["123e...", "456e...", "invalid-id"] }
   * Response: {
   *   success: true,
   *   data: [[
   *     {
   *       user: { id: "123e...", name: "...", deleted_at: "...", ... },
   *       articles: { articles: [...], total: 3 }
   *     },
   *     {
   *       user: { id: "456e...", name: "...", deleted_at: "...", ... },
   *       articles: { articles: [...], total: 5 }
   *     }
   *   ]],
   *   message: "Users and associated articles deleted successfully",
   *   meta: {
   *     totalUsersRequested: 3,
   *     totalUsersDeleted: 2,
   *     totalArticlesDeleted: 8,
   *     invalidUserIds: ["invalid-id"],
   *     notFoundUserIds: []
   *   }
   * }
   */
  private static async deleteByUserIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userIds = req.body.ids as string[];

      // Validate user IDs
      const {
        allFailed: allIdsWrogn,
        invalidIds: userInvalidIds,
        validIds: userValidIds,
      } = checkUuids(userIds);

      // If full ids validation is failed
      if (allIdsWrogn) {
        const response = ControllerResponse.badRequest(
          `All User IDs are invalid: ${JSON.stringify(userInvalidIds, null, 2)}`,
        );
        res.status(response.status).json(response);
        return;
      }
      const {
        data: userDeleteOperationData,
        meta: userDeleteOperationMeta,
        message: userDeleteOperationMessage,
        success: userDeleteOperationSuccess,
      } = await UserService.softManyDelete(userValidIds, {
        limit: 0,
      });

      if (!userDeleteOperationSuccess) {
        const response = ControllerResponse.notFound(
          userDeleteOperationMessage,
          userDeleteOperationMeta,
        );
        res.status(response.status).json(response);
        return;
      }

      const usersDeleted = userDeleteOperationData.users;

      // Get all article Ids from each user
      const articlesDeletedData: object[] = await Promise.all(
        usersDeleted.map(async (user) => {
          const userId = user.id as string;
          const response = await ArticleService.getArticleIdsByUserId(userId);
          const articleIds = Array.isArray(response.data)
            ? response.data.flat()
            : [];
          const { data: articles } = await ArticleService.softManyDelete(
            articleIds,
            { limit: 0 },
          );
          return {
            user,
            articles: articles,
          };
          // Safely extract and flatten article IDs
        }),
      );

      // Success response
      const response = ControllerResponse.ok(
        [articlesDeletedData],
        "Users and associated articles deleted successfully",
        {
          totalUsersRequested: userIds.length,
          totalUsersDeleted: usersDeleted.length,
          totalArticlesDeleted: articlesDeletedData.length || 0,
          invalidUserIds: userInvalidIds,
          notFoundUserIds: (usersDeleted as any)?.notFoundIds || [],
        },
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recover deleted user(s) - routing function
   * @param {Request} req - Express request object with optional userId in params OR ids array in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} Delegates to recoverById or recoverByIds
   * @description Routes recovery request to appropriate handler based on input type.
   * Accepts either single userId in URL params or array of ids in request body.
   * Returns 400 if neither userId nor ids array is provided.
   * Delegates to private recoverById for single recovery or recoverByIds for bulk recovery.
   * Admin access only (enforced by route middleware)
   * @throws {Error} Passes errors to next middleware
   * @example
   * PATCH /api/users/recover/123e4567-... (single recovery via URL param)
   * PATCH /api/users/recover with body: { "ids": ["...", "..."] } (bulk recovery via body)
   */
  static async recover(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.userId;
      const ids = req.body?.ids;

      // Check if IDs are in body (array)
      const isArray = Array.isArray(ids);

      if (isArray) {
        // Body has ids array
        return await UserController.recoverByIds(req, res, next);
      } else if (userId) {
        // URL param has userId
        return await UserController.recoverById(req, res, next);
      } else {
        // Neither provided
        const response = ControllerResponse.badRequest(
          "Either userId in URL or ids array in body is required",
        );
        res.status(response.status).json(response);
        return;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recover a single deleted user by ID (private method)
   * @param {Request} req - Express request object with userId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with recovered user and associated articles
   * @description Restores a soft-deleted user and cascades recovery to all their articles.
   * Validates UUID format. First recovers the user using UserService.recoverById (sets deleted_at to null),
   * then retrieves user's articles using ArticleService.findByUserId, finally recovers articles using
   * ArticleService.recoverByIds (with limit: 0 for no pagination).
   * Returns 400 for invalid UUID, 404 if user not found or not deleted, 200 with recovered user and articles on success.
   * Admin access only (enforced by route middleware)
   * @throws {Error} Passes errors to next middleware
   * @example
   * PATCH /api/users/recover/123e4567-e89b-12d3-a456-426614174000
   * Response: {
   *   success: true,
   *   data: [{
   *     user: { id: "...", name: "...", deleted_at: null, ... },
   *     recoveredArticles: [{ id: "...", title: "...", ... }, ...]
   *   }],
   *   message: "User and associated articles recovered successfully",
   *   meta: { totalArticlesRecovered: 5 }
   * }
   */
  private static async recoverById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.userId;

      // Validate user ID
      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Invalid User ID");
        res.status(response.status).json(response);
        return;
      }

      // Recover the user (service handles if user exists/is deleted)
      const recoverUserResult = await UserService.recoverById(userId);

      if (!recoverUserResult.success) {
        const response = ControllerResponse.notFound(recoverUserResult.message);
        res.status(response.status).json(response);
        return;
      }

      // Get all user's articles to recover them too
      const articlesResponse = await ArticleService.findByUserId(userId, {
        limit: 0,
      });

      const articleIds: string[] =
        articlesResponse.data.articles
          ?.map((a) => a.id)
          .filter((id): id is string => id !== null && id !== undefined) ?? [];

      // Recover user's articles if any exist
      let articlesRecovered = null;
      if (articleIds.length > 0) {
        const recoverArticlesResult = await ArticleService.recoverByIds(
          articleIds,
          { limit: 0 },
        );
        articlesRecovered = recoverArticlesResult.data;
      }

      // Success response
      const response = ControllerResponse.ok(
        [
          {
            user: recoverUserResult.data,
            recoveredArticles: articlesRecovered?.articles || [],
          },
        ],
        "User and associated articles recovered successfully",
        {
          totalArticlesRecovered: articlesRecovered?.total || 0,
        },
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recover multiple deleted users by IDs (private method)
   * @param {Request} req - Express request object with ids array in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} JSON response with recovered users and their associated articles
   * @description Bulk restores soft-deleted users and all their articles. Validates UUIDs using checkUuids utility.
   * Reports invalid and not-found IDs in response metadata. First bulk recovers users using UserService.recoverByIds
   * (sets deleted_at to null for all valid IDs), then for each recovered user, retrieves their article IDs
   * using ArticleService.getArticleIdsByUserId and recovers articles. Uses Promise.all for parallel processing.
   * Returns 400 if all IDs are invalid, 404 if operation fails, 200 with detailed results on success.
   * Response includes per-user breakdown of recovered articles and aggregate metadata.
   * Admin access only (enforced by route middleware)
   * @throws {Error} Passes errors to next middleware
   * @example
   * PATCH /api/users/recover
   * Body: { "ids": ["123e...", "456e...", "invalid-id"] }
   * Response: {
   *   success: true,
   *   data: [[
   *     {
   *       user: { id: "123e...", name: "...", deleted_at: null, ... },
   *       articles: { articles: [...], total: 3 }
   *     },
   *     {
   *       user: { id: "456e...", name: "...", deleted_at: null, ... },
   *       articles: { articles: [...], total: 5 }
   *     }
   *   ]],
   *   message: "Users and associated articles recovered successfully",
   *   meta: {
   *     totalUsersRequested: 3,
   *     totalUsersRecovered: 2,
   *     totalArticlesRecovered: 8,
   *     invalidUserIds: ["invalid-id"],
   *     notFoundUserIds: []
   *   }
   * }
   */
  private static async recoverByIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userIds = req.body.ids as string[];

      // Validate user IDs
      const {
        allFailed: allIdsWrong,
        invalidIds: userInvalidIds,
        validIds: userValidIds,
      } = checkUuids(userIds);

      // If full ids validation is failed
      if (allIdsWrong) {
        const response = ControllerResponse.badRequest(
          `All User IDs are invalid: ${JSON.stringify(userInvalidIds)}`,
        );
        res.status(response.status).json(response);
        return;
      }

      // Recover all users (service handles which ones are deleted)
      const {
        data: usersRecoveredData,
        message: usersRecoveredMessage,
        success: usersRecoveredSuccess,
        meta: usersRecoveredMeta,
      } = await UserService.recoverByIds(userValidIds, { limit: 0 });

      if (!usersRecoveredSuccess) {
        const response = ControllerResponse.notFound(usersRecoveredMessage);
        res.status(response.status).json(response);
        return;
      }

      const usersRecovered = usersRecoveredData.users;

      // Get all article IDs from recovered users as a plain flat array
      const articlesRecoveredData: object[] = await Promise.all(
        usersRecovered.map(async (user) => {
          const userId = user.id as string;
          const response = await ArticleService.getArticleIdsByUserId(userId);
          const articleIds = Array.isArray(response.data)
            ? response.data.flat()
            : [];
          const { data: articles } = await ArticleService.recoverByIds(
            articleIds,
            { limit: 0 },
          );
          return {
            user,
            articles: articles,
          };
          // Safely extract and flatten article IDs
        }),
      );

      // Success response
      const response = ControllerResponse.ok(
        [articlesRecoveredData],
        "Users and associated articles recovered successfully",
        {
          totalUsersRequested: userIds.length,
          totalUsersRecovered: usersRecovered.length,
          totalArticlesRecovered: articlesRecoveredData.length || 0,
          invalidUserIds: userInvalidIds,
          notFoundUserIds: (usersRecoveredMeta as any)?.notFoundIds || [],
        },
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
}
