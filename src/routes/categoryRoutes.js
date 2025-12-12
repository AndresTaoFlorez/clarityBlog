// backend/src/routes/categoryRoutes.js
import express from 'express'
import { CategoryController } from '../controllers/categoryController.js'

const router = express.Router()

// GET /api/categories
router.get('/', CategoryController.list)

// GET /api/categories/:slug/articles
router.get('/:slug/articles', CategoryController.articlesByCategory)

export default router
