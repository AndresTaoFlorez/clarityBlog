// backend/src/services/ArticleService.js
import { db } from "../config/database.js";
import { ArticleController } from "../controllers/articleController.js";
import { Article } from "../models/Article.js";
import { User } from "../models/User.js";
import { equal, isValid, merge } from "../utils/validator.ts";
import { CategoryService } from "./categoryService.js";

export class ArticleService {
  // Crear artículo/nota
  static async create(rawArticle) {
    try {
      if (!isValid(rawArticle)) {
        throw new Error("Article data is invalid");
      }

      const article = Article.create(rawArticle);
      const { categories } = article;

      // Insertar en tabla 'articles' de Supabase
      const { data: articleData, error } = await db
        .from("articles")
        .insert([article.toInsert()])
        .select()
        .single();

      await (async () => {
        if (isValid(categories, { dataType: "array" })) {
          const categoryInserts = categories.map((category) => ({
            article_id: articleData.id,
            category_id: category.id || category,
          }));

          return await db.from("articles_categories").insert(categoryInserts);
        } else {
          return await db.from("articles_categories").insert({
            article_id: articleData.id,
            category_id: categories,
          });
        }
      })();

      if (error) throw error;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from("users")
        .select("name, avatar, email")
        .eq("id", article.userId)
        .single();

      const createdArticle = {
        ...articleData,
        ...userData,
        categories: [...categories],
      };

      return Article.fromDatabase(createdArticle);
    } catch (error) {
      throw new Error(`Create article failed: ${error.message}`);
    }
  }

  /**
   * Get all articles with user information using INNER JOIN
   * @returns {Promise<Array>} Array of articles with user data
   */
  static async findAll({ page = 1, limit = 5 } = {}) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await db
        .from("articles")
        .select(
          `
        *,
        users!inner (
          name,
          avatar,
          email
        ),
        articles_categories (
          article_categories!inner (
            *
          )
        )
      `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform the nested structure to match your SQL query format
      const transformedData = data.map((article) => {
        const categories =
          article.articles_categories?.map((ac) => ac.article_categories) || [];
        return {
          ...article,
          categories,
          user_name: article.users.name,
          user_avatar: article.users.avatar,
          user_email: article.users.email,
          users: undefined,
          articles_categories: undefined,
        };
      });

      const articlesWithAuthors = Article.fromDatabaseList(transformedData);

      return {
        articles: articlesWithAuthors,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(
        `Error fetching articles with user info: ${error.message}`,
      );
    }
  }

  /**
   * Get a single article with user information by ID
   * @param {string} articleId - UUID of the article
   * @returns {Promise<Object>} Article with user data
   */
  static async findById(articleId) {
    try {
      const { data, error } = await db
        .from("articles")
        .select(
          `
    id,
    title,
    description,
    created_at,
    updated_at,
    user_id,
    users!inner(
      userId:id,
      name,
      avatar,
      email
    ),
    articles_categories!inner(
      article_categories(
       * 
      )
    )
  `,
        )
        .eq("id", articleId)
        .single();

      if (error) {
        return { error: { message: error } };
      }

      const categories = data.articles_categories?.map(
        (ac) => ac.article_categories,
      );
      const user = data.users;

      const article = Article.fromDatabase(merge(user, data, { categories }));

      return { error: false, data: article };
    } catch (error) {
      console.error("Error fetching article by ID with user info:", error);
      throw error;
    }
  }

  /**
   * Get articles by user ID with user information
   * @param {string} userId - UUID of the user
   * @returns {Promise<Array>} Array of articles with user data
   */
  static async findByUserId(userId, { page = 1, limit = 5 }) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await db
        .from("articles")
        .select(
          `
        *,
        users!inner (
          name,
          avatar,
          email
        ),
        articles_categories (
          article_categories!inner (
           * 
          )
        )
      `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      const transformedData = data.map((article) => {
        const categories =
          article.articles_categories?.map((ac) => ac.article_categories) || [];
        return {
          ...article,
          categories,
          user_name: article.users.name,
          user_avatar: article.users.avatar,
          user_email: article.users.email,
          users: undefined,
          articles_categories: undefined,
        };
      });

      const articlesWithAuthors = Article.fromDatabaseList(transformedData);

      return {
        articles: articlesWithAuthors,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error("Error fetching article by user ID with user info:", error);
      throw error;
    }
  }

  /**
   * Search articles by title or description with pagination
   * @param {string} query - Search term
   * @param {string|null} userId - Optional user ID to filter results
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 5)
   * @returns {Promise<Object>} Paginated articles with total count
   */
  static async search(query, userId = null, { page = 1, limit = 5 } = {}) {
    try {
      const offset = (page - 1) * limit;

      let dbQuery = db
        .from("articles")
        .select(
          `
        *,
        users!inner (
          name,
          avatar,
          email
        ),
        articles_categories (
          article_categories!inner (
            id,
            label,
            value
          )
        )
      `,
          { count: "exact" },
        )
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        dbQuery = dbQuery.eq("user_id", userId);
      }

      const { data, error, count } = await dbQuery;

      if (error) throw error;

      const transformedData = data.map((article) => {
        const categories =
          article.articles_categories?.map((ac) => ac.article_categories) || [];
        return {
          ...article,
          categories,
          user_name: article.users.name,
          user_avatar: article.users.avatar,
          user_email: article.users.email,
          users: undefined,
          articles_categories: undefined,
        };
      });

      const articlesWithAuthors = Article.fromDatabaseList(transformedData);

      return {
        articles: articlesWithAuthors,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(`Error searching articles: ${error.message}`);
    }
  }
  // Actualizar artículo/nota
  static async update(articleId, incomingArticle) {
    try {
      const newArticle = Article.create(incomingArticle);
      const { data: dbArticle } = await db
        .from("articles")
        .select("*")
        .eq("id", articleId)
        .single();

      const { data: rawOldCategories } = await db
        .from("articles_categories")
        .select("*")
        .eq("article_id", articleId);

      const oldCategories = rawOldCategories.map((cat) => cat.category_id);
      const newCategories = isValid(newArticle.categories, {
        dataType: "array",
      })
        ? newArticle.categories
        : oldCategories;

      // update categories
      if (!equal(oldCategories, newCategories, { dataType: "array" })) {
        // Find categories to delete (in old but not in new)
        const toDelete = oldCategories.filter(
          (oldCat) => !newCategories.some((newCat) => newCat === oldCat),
        );

        // Find categories to add (in new but not in old)
        const toAdd = newCategories.filter(
          (newCat) => !oldCategories.some((oldCat) => oldCat === newCat),
        );

        // Delete removed categories
        if (toDelete.length > 0) {
          await db
            .from("articles_categories")
            .delete()
            .eq("article_id", articleId)
            .in("category_id", toDelete);
        }

        // Add new categories
        if (toAdd.length > 0) {
          const categoryInserts = toAdd.map((categoryId) => ({
            article_id: articleId,
            category_id: categoryId,
          }));

          await db.from("articles_categories").insert(categoryInserts);
        }
      }

      const { data: articleData, error } = await db
        .from("articles")
        .update(newArticle.toDatabase())
        .eq("id", articleId)
        .select("*")
        .single();

      if (error) throw error;

      // find author data
      const { data: userData } = await db
        .from("users")
        .select("name, avatar, email")
        .eq("id", dbArticle.user_id)
        .single();

      const categories = await CategoryService.findByArticleId(articleId);
      console.log(`User categories db: ${JSON.stringify(categories, null, 2)}`);

      const user = User.fromDatabaseToArticle(userData);

      const article = { ...articleData, categories, ...user };
      return Article.fromDatabase(article);
    } catch (error) {
      throw new Error(`Updating article error: ${error.message}`);
    }
  }

  // Eliminar artículo/nota (CASCADE eliminará comments relacionados)
  static async delete(id) {
    try {
      const { error } = await db.from("articles").delete().eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar nota: ${error.message}`);
    }
  }
}
