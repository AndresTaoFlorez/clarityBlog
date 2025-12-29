// backend/src/routes/userroutes.ts
import { type Router } from "express";
import express from "express";
import { UserController } from "@/controllers/UserController";
import { authenticate, authorizeAdmin } from "@/middlewares/authMiddleware";

const router: Router = express.Router();

/**
 * @route   get /api/users/search
 * @desc    search users by query term (name, email, etc.)
 * @access  public
 * @params  q (query string, required), page (number, optional, default: 1), limit (number, optional, default: 10)
 * @example get /api/users/search?q=john&page=1&limit=5
 * @returns {
 *   success: boolean,
 *   data: user[],
 *   message: string,
 *   meta: { total: number, page: number, limit: number }
 * }
 */
router.get("/search", UserController.search);

/**
 * @route   get /api/users
 * @route   get /api/users (with body.ids array)
 * @desc    get all users with pagination
 * @access  public (Regular users see only active users)
 * @params  page (number, optional, default: 1), limit (number, optional, default: 10)
 * @example get /api/users?page=1&limit=10
 * @example get /api/users
 *          Body: { "ids": ["123e...", "456e...", "789e..."] }
 * @returns {
 *   success: boolean,
 *   data: user[],
 *   message: string,
 *   meta: { total: number, page: number, limit: number }
 * }
 */
router.get("/", UserController.getAll);

/**
 * @route   get /api/users
 * @route   get /api/users (with body.ids array)
 * @desc    get all users with pagination
 * @access  private (Admin see all users including soft-deleted)
 * @params  page (number, optional, default: 1), limit (number, optional, default: 10)
 * @example get /api/users?page=1&limit=10
 * @example get /api/users
 *          Body: { "ids": ["123e...", "456e...", "789e..."] }
 * @returns {
 *   success: boolean,
 *   data: user[],
 *   message: string,
 *   meta: { total: number, page: number, limit: number }
 * }
 */
router.get("/a/", authenticate, authorizeAdmin, UserController.getAll);

/**
 * @route   get /api/users/:userid
 * @desc    get a single user by id
 * @access  public (admins can see deleted users, regular users only see active users)
 * @params  userid (uuid, required)
 * @example get /api/users/123e4567-e89b-12d3-a456-426614174000
 * @returns {
 *   success: boolean,
 *   data: [user],
 *   message: string
 * }
 */
router.get("/:userId", UserController.getById);

/**
 * @route   get /api/users/email/:email
 * @desc    get a single user by email address
 * @access  public (admins can see deleted users, regular users only see active users)
 * @params  email (string, required, must be valid email format)
 * @example get /api/users/email/john@example.com
 * @returns {
 *   success: boolean,
 *   data: [user],
 *   message: string
 * }
 */
router.get("/email/:email", UserController.getByEmail);

/**
 * @route   put /api/users/:userid
 * @desc    update user information
 * @access  private (authenticated users can update their own account, admins can update any account)
 * @auth    Bearer token required
 * @params  userId (UUID, required)
 * @body    {
 *   name?: string,
 *   email?: string,
 *   password?: string (must meet security requirements),
 *   avatar?: string,
 *   bio?: string,
 *   role?: string (admin only)
 * }
 * @example PUT /api/users/123e4567-e89b-12d3-a456-426614174000
 * @returns {
 *   success: boolean,
 *   data: [User],
 *   message: string
 * }
 */
router.put("/:userId", authenticate, UserController.update);

/**
 * @route   DELETE /api/users/:userId
 * @route   DELETE /api/users (with body.ids array)
 * @desc    Soft delete user(s) and all associated articles
 * @access  Private (admin only)
 * @auth    Bearer token required + admin role
 * @params  userId (UUID, optional) - for single user deletion via URL param
 * @body    { ids: string[] } (optional) - for bulk deletion via request body
 * @note    Provide either userId in URL param OR ids array in body, not both
 * @example DELETE /api/users/123e4567-e89b-12d3-a456-426614174000
 * @example DELETE /api/users
 *          Body: { "ids": ["123e...", "456e...", "789e..."] }
 * @returns {
 *   success: boolean,
 *   data: [{
 *     user: User,
 *     deletedArticles: Article[]
 *   }] | [Array<{ user: User, articles: { articles: Article[], total: number } }>],
 *   message: string,
 *   meta: {
 *     totalUsersRequested?: number,
 *     totalUsersDeleted?: number,
 *     totalArticlesDeleted: number,
 *     invalidUserIds?: string[],
 *     notFoundUserIds?: string[]
 *   }
 * }
 */
router.delete("/:userId?", authenticate, authorizeAdmin, UserController.delete);

/**
 * @route   PATCH /api/users/recover/:userId
 * @route   PATCH /api/users/recover (with body.ids array)
 * @desc    Recover soft-deleted user(s) and all associated articles
 * @access  Private (admin only)
 * @auth    Bearer token required + admin role
 * @params  userId (UUID, optional) - for single user recovery via URL param
 * @body    { ids: string[] } (optional) - for bulk recovery via request body
 * @note    Provide either userId in URL param OR ids array in body, not both
 * @example PATCH /api/users/recover/123e4567-e89b-12d3-a456-426614174000
 * @example PATCH /api/users/recover
 *          Body: { "ids": ["123e...", "456e...", "789e..."] }
 * @returns {
 *   success: boolean,
 *   data: [{
 *     user: User,
 *     recoveredArticles: Article[]
 *   }] | [Array<{ user: User, articles: { articles: Article[], total: number } }>],
 *   message: string,
 *   meta: {
 *     totalUsersRequested?: number,
 *     totalUsersRecovered?: number,
 *     totalArticlesRecovered: number,
 *     invalidUserIds?: string[],
 *     notFoundUserIds?: string[]
 *   }
 * }
 */
router.patch(
  "/recover/:userId?",
  authenticate,
  authorizeAdmin,
  UserController.recover,
);

export default router;
