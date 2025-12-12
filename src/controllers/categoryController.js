// backend/src/controllers/categoryController.js
import { db } from '../config/database.js'
import { ArticleService } from '../services/ArticleService.js'

export class CategoryController {
  static async list(req, res, next) {
    try {
      const { data, error } = await db
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  static async articlesByCategory(req, res, next) {
    try {
      const { slug } = req.params
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 5

      const result = await ArticleService.findAll({ page, limit, category: slug })

      res.status(200).json({
        success: true,
        data: result.articles.map(a => a.toJSON()),
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit,
          hasMore: result.page < result.pages,
          nextPage: result.page < result.pages ? result.page + 1 : null,
          prevPage: result.page > 1 ? result.page - 1 : null,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}
