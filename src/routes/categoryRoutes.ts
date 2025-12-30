// backend/src/routes/categoryRoutes.js
import express from "express";
import type { Router } from "express";
import { CategoryController } from "../controllers/CategoryController";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware";

const router: Router = express.Router();

/**
 * @route   GET /api/categories/search
 * @desc    Search categories by value or label
 * @query   {string} q - Search term (required)
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=10] - Items per page
 * @access  public
 */
router.get("/search", CategoryController.searchCategories);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=10] - Items per page
 * @access  public
 */
router.get("/", CategoryController.getAllCategories);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=10] - Items per page
 * @access  public
 */
router.get(
  "/articleId/:articleId",
  CategoryController.getAllCategoriesByArticleId,
);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @body    {string} value - Category value (slug)
 * @body    {string} label - Category display name
 * @access  private (Admin only)
 */
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  CategoryController.createCategory,
);

/**
 * @route   PUT /api/categories/:categoryId
 * @desc    Update an existing category
 * @param   {string} categoryId - Category UUID
 * @body    {string} [value] - New category value
 * @body    {string} [label] - New category label
 * @access  private (Admin only)
 */
router.put("/:categoryId", authenticate, CategoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:categoryId
 * @desc    Delete a category
 * @param   {string} categoryId - Category UUID
 * @access  private (Admin only)
 */
router.delete("/:categoryId", authenticate, CategoryController.deleteCategory);

export default router;
