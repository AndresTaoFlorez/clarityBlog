// src/services/ArticleService.ts
import { db } from "../config/database.ts";
import { Article } from "../models/Article.ts";
import type { ArticleWithDetailsRow } from "../types/database.types.ts";
import { ServiceResponse } from "../utils/index.ts";
import { merge } from "../utils/validator.ts";

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedArticles {
  articles: Article[] | [];
  total: number;
  page: number;
  pages: number;
}

type AllowedInsertFields = Pick<
  Article,
  "title" | "content" | "userId" | "categories"
>;

type GetArticlesResponse = {
  data: ArticleWithDetailsRow[] | null;
  error: any;
  count: number | null;
};

export class ArticleService {
  static async create(
    articleData: AllowedInsertFields,
  ): Promise<ServiceResponse<Article>> {
    try {
      const sanitizeArticle = ArticleService.sanitizeArticleInput(articleData);

      const { data, error } = await db.rpc("create_article_with_categories", {
        p_category_ids: sanitizeArticle.categories,
        p_description: sanitizeArticle.content,
        p_title: sanitizeArticle.title,
        p_user_id: sanitizeArticle.userId,
      });

      if (error) {
        return ServiceResponse.error([], error.message);
      }

      const article = Article.fromDatabase(data);
      return ServiceResponse.ok([article]);
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating articles",
      );
    }
  }

  static async delete(articleId: string): Promise<ServiceResponse<Article>> {
    try {
      const { data, error } = await db
        .from("articles_with_details")
        .delete()
        .eq("id", articleId)
        .select("*")
        .single();

      if (error) {
        return ServiceResponse.error(
          [],
          `Article to delete not found: ${error.message}`,
        );
      }

      const article = Article.fromDatabase(data);

      return ServiceResponse.ok([article], "Article deleted successfully");
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while deleting articles",
      );
    }
  }

  static async hardDelete(
    articleId: string,
  ): Promise<ServiceResponse<Article>> {
    try {
      const { error } = await db.rpc("hard_delete_article", {
        p_article_id: articleId,
      });

      if (error) {
        return ServiceResponse.error([], "Article to delete not found");
      }

      return ServiceResponse.ok([], "Article deleted successfully");
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while deleting articles",
      );
    }
  }

  static async findAll({ page = 1, limit = 5 }: PaginationParams = {}): Promise<
    ServiceResponse<PaginatedArticles>
  > {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("articles_with_details")
        .select("*", { count: "exact" })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Data base error fetching articles:", error);
        return ServiceResponse.error(
          [],
          `Failed to fetch articles: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        return ServiceResponse.ok([
          {
            articles: [],
            total: 0,
            page,
            pages: 0,
          },
        ]);
      }

      const articlesWithAuthors = Article.fromDatabaseList(data);

      const paginatedResult: PaginatedArticles = {
        articles: articlesWithAuthors,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok([paginatedResult], "Retrieve data successfull");
    } catch (error) {
      console.error("Database error fetching articles:", error);

      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching articles",
      );
    }
  }

  static async findByArticleId(
    articleId: string,
  ): Promise<ServiceResponse<Article>> {
    try {
      const { data, error } = (await db
        .from("articles_with_details")
        .select("*")
        .eq("id", articleId)) as GetArticlesResponse;
      if (error) {
        return ServiceResponse.error([], error.message);
      }

      if (!data || data.length === 0) {
        return ServiceResponse.error([], "Article not found");
      }

      const article = Article.fromDatabase(data![0]);

      return ServiceResponse.ok([article]);
    } catch (error) {
      console.error("Database error fetching article by id:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error ocurred while fetching article",
      );
    }
  }

  /**
   * Find articles by user ID with pagination
   * @param userId - The user's ID
   * @param params - Pagination parameters
   * @returns ServiceResponse with paginated articles
   */
  static async findByUserId(
    userId: string,
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedArticles>> {
    try {
      // Validate userId exists
      if (!userId) {
        return ServiceResponse.error([], "User ID is required");
      }

      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("articles_with_details")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Handle database errors
      if (error) {
        console.error("Database error fetching articles:", error);
        return ServiceResponse.error(
          [],
          `Failed to fetch articles: ${error.message}`,
        );
      }

      // Handle no data found
      if (!data || data.length === 0) {
        return ServiceResponse.error([], "No articles found for this user");
      }

      // Convert to domain models
      const articlesWithAuthors = Article.fromDatabaseList(data);

      // Build paginated response
      const paginatedResult: PaginatedArticles = {
        articles: articlesWithAuthors,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        [paginatedResult],
        "Articles retrieved successfully",
      );
    } catch (error) {
      console.error("Error in ArticleService.findByUserId:", error);
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching articles",
      );
    }
  }

  static async update(
    articleId: string,
    articleData: object,
  ): Promise<ServiceResponse<Article>> {
    try {
      const sanitizeArticle =
        ArticleService.sanitizeArticleToInsert(articleData);

      const { data, error } = await db
        .from("articles_with_details")
        .update(sanitizeArticle)
        .select("*")
        .eq("id", articleId)
        .single();

      if (error) {
        return ServiceResponse.error([], error.message);
      }

      const articleWithAuthors = Article.fromDatabase(data);

      return ServiceResponse.ok(
        [articleWithAuthors],
        "Article updated successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error ocurred while fetching articles",
      );
    }
  }

  static async search(
    searchTerm: string,
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedArticles>> {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return ServiceResponse.error([], "Search term is required");
      }

      const offset = (page - 1) * limit;

      const { data, error } = await db
        .rpc("search_articles", {
          p_search_term: searchTerm.trim(),
        })
        .range(offset, offset + limit - 1);

      const { data: allResults } = await db.rpc("search_articles", {
        p_search_term: searchTerm.trim(),
      });

      const count = allResults?.length || 0;

      if (error) {
        return ServiceResponse.error(
          [],
          `Failed to search articles: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        return ServiceResponse.ok([
          {
            articles: [],
            total: 0,
            page,
            pages: 0,
          },
        ]);
      }

      const articlesWithAuthors = Article.fromDatabaseList(data);

      const paginatedResult: PaginatedArticles = {
        articles: articlesWithAuthors,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };

      return ServiceResponse.ok(
        [paginatedResult],
        "Articles retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while searching articles",
      );
    }
  }
  private static sanitizeArticleInput(input: any): AllowedInsertFields {
    // Changed from Partial<AllowedInsertFields>
    return {
      title: String(input.title || "").trim(),
      content: String(input.content || "").trim(),
      userId: String(input.userId || "").trim(),
      categories: Array.isArray(input.categories)
        ? input.categories.filter(
            (id: string) => typeof id === "string" && id.trim(),
          )
        : [],
    };
  }

  private static sanitizeArticleToInsert(input: any) {
    const sanitized: Partial<AllowedInsertFields> = {}; // Add type annotation

    if (input.title !== undefined) {
      sanitized.title = String(input.title).trim();
    }

    if (input.content !== undefined) {
      sanitized.content = String(input.content).trim();
    }

    if (Array.isArray(input.categories)) {
      sanitized.categories = input.categories.filter(
        (id: string) => typeof id === "string" && id.trim(),
      );
    }

    // Map 'content' to 'description' for database insert
    const { content, ...rest } = sanitized;

    return {
      ...rest,
      description: content || "", // Changed from null to ""
    };
  }
}
