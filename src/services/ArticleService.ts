// src/services/ArticleService.ts
import type { UUID } from "crypto";
import { db } from "../config/database.ts";
import { Article } from "../models/Article.ts";
import { ServiceResponse } from "../utils/index.ts";
import { isValid } from "../utils/validator.ts";

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedArticles<T = Article[]> {
  articles: T;
  total: number;
  page: number;
  pages: number;
}

type AllowedInsertFields = Pick<
  Article,
  "title" | "content" | "userId" | "categories"
>;

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
        return ServiceResponse.error({} as Article, error.message);
      }

      const article = Article.fromDatabase(data);
      return ServiceResponse.ok(article);
    } catch (error) {
      return ServiceResponse.error(
        {} as Article,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating articles",
      );
    }
  }

  static async softDelete(
    articleId: string,
  ): Promise<ServiceResponse<Article>> {
    try {
      const { data, error } = await db
        .from("articles_with_details")
        .delete()
        .eq("id", articleId)
        .select("*")
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as Article,
          `Article to delete not found: ${error.message}`,
        );
      }

      const article = Article.fromDatabase(data);

      return ServiceResponse.ok(article, "Article deleted successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Article,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while deleting articles",
      );
    }
  }

  static async softManyDelete(
    articleIds: string[],
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedArticles<Article[]>>> {
    try {
      const noLimit = limit === 0;
      let query = db
        .from("articles_with_details")
        .delete()
        .in("id", articleIds)
        .select("*")
        .order("created_at", { ascending: false });

      // Apply pagination only if limit > 0
      let data, error, count;
      if (limit > 0) {
        const offset = (page - 1) * limit;
        const result = await query.range(offset, offset + limit - 1);
        data = result.data || [];
        error = result.error;
        count = (result.count as number) ?? data?.length;
      } else {
        // limit = 0 means fetch ALL articles (no range)
        const result = await query;
        data = result.data || [];
        error = result.error;
        count = (result.count as number) ?? data?.length;
      }

      if (error) {
        return ServiceResponse.error(
          {} as PaginatedArticles,
          `The article could not be deleted: ${error.message}`,
        );
      }

      const deletedArticles = Article.fromDatabaseList(data);
      const notFoundIds = articleIds.filter(
        (id) => !deletedArticles.some((article) => article.id === id),
      );

      const paginatedResult: PaginatedArticles = {
        articles: deletedArticles,
        total: count || 0,
        page,
        pages: noLimit ? 1 : Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Articles deleted successfully",
        {
          notFoundIds,
          totalRequested: articleIds.length,
          totalDeleted: deletedArticles.length,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting articles",
      );
    }
  }

  static async checkIfUserOwnsArticle(
    userId: UUID,
    articleIds: UUID[],
  ): Promise<ServiceResponse<UUID[]>> {
    try {
      const { data, error, count } = await db
        .from("articles")
        .select("id")
        .in("id", articleIds)
        .eq("user_id", userId)
        .is("deleted_at", null);

      const isData = data?.length === 0;

      if (error || isData) {
        return ServiceResponse.error(
          {} as UUID[],
          isData
            ? "You don't own any of the specified articles"
            : error?.message,
        );
      }

      // Step 1: Create the array using map (this is your foundIds as array)
      const foundIds: string[] = (data ?? []).map((row) => row.id);

      // Step 2: Convert the array to a Set for fast lookup
      const foundIdsSet = new Set(foundIds);

      // Now you can use the Set for checking ownership
      const notOwnedOrMissingIds = articleIds.filter(
        (id) => !foundIdsSet.has(id),
      );

      return ServiceResponse.ok<UUID[]>(
        foundIds as UUID[],
        "Articles that belong to the user",
        {
          notOwnedOrMissingIds,
          totalRequested: count || 0,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error ocurred while getting articles",
      );
    }
  }

  static async hardDeleteById(
    articleId: string,
  ): Promise<ServiceResponse<Article>> {
    try {
      const { data, error } = await db
        .rpc("hard_delete_article", {
          p_article_id: articleId,
        })
        .single();

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          {} as Article,
          "Article to delete not found",
        );
      }

      const deletedArticle = Article.fromDatabase(data);

      return ServiceResponse.ok(deletedArticle, "Article deleted successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Article,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while deleting articles",
      );
    }
  }
  static async hardDeleteByIds(
    articleIds: string[],
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedArticles>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await db
        .rpc("hard_delete_many_articles", {
          p_article_ids: articleIds,
        })
        .select("*", { count: "exact" })
        .range(from, to);

      if (error) {
        return ServiceResponse.error(
          {} as PaginatedArticles<Article[]>,
          `Hard delete failed: ${error.message}`,
        );
      }

      const deletedArticles = Article.fromDatabaseList(data ?? []);

      const notFoundIds = articleIds.filter(
        (id) => !deletedArticles.some((article) => article.id === id),
      );

      const paginatedResult: PaginatedArticles = {
        articles: deletedArticles,
        total: count ?? 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Articles deleted successfully",
        {
          notFoundIds,
          totalRequested: articleIds.length,
          totalDeleted: deletedArticles.length,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles<Article[]>,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while deleting articles",
      );
    }
  }
  static async findAll({
    page = 1,
    limit = 5,
    role = "user",
  }: Partial<PaginationParams> & { role?: string } = {}): Promise<
    ServiceResponse<PaginatedArticles<Article[]>>
  > {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const isAdmin = role === "admin";

      const { data, error, count } = await db
        .from(isAdmin ? "articles_all_with_details" : "articles_with_details")
        .select("*", { count: "exact" })
        .range(from, to);

      const isData = data?.length === 0;

      if (error || isData) {
        return ServiceResponse.error(
          {} as PaginatedArticles<Article[]>,
          isData
            ? "No articles found"
            : `Failed to fetch articles: ${error?.message}`,
        );
      }

      if (!data || data.length === 0) {
        return ServiceResponse.ok({
          articles: [],
          total: 0,
          page,
          pages: 0,
        });
      }

      const articlesWithAuthors = Article.fromDatabaseList(data);

      const paginatedResult: PaginatedArticles = {
        articles: articlesWithAuthors,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(paginatedResult, "Retrieve data successfull");
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles<Article[]>,

        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching articles",
      );
    }
  }

  static async findByArticleId(
    articleId: UUID,
  ): Promise<ServiceResponse<Article>> {
    try {
      const { data, error } = await db
        .from("articles_with_details")
        .select("*")
        .eq("id", articleId)
        .single();

      const isData = !isValid(data, { dataType: "object" });
      if (error || isData) {
        return ServiceResponse.error(
          {} as Article,
          isData ? "No articles found" : error?.message,
        );
      }

      const article = Article.fromDatabase(data);

      return ServiceResponse.ok(article);
    } catch (error) {
      return ServiceResponse.error(
        {} as Article,
        error instanceof Error
          ? error.message
          : "An unexpected error ocurred while fetching article",
      );
    }
  }

  static async findManyArticlesById(
    articleIds: string[],
    { page = 1, limit = 5 }: PaginationParams = {}, // increased default limit, optional
  ): Promise<ServiceResponse<PaginatedArticles<Article[]>>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await db
        .from("articles_with_details")
        .select("*", { count: "exact" }) // gets exact total matching IDs
        .in("id", articleIds) // ← THIS IS THE FIX
        .range(from, to); // pagination on the results

      if (error || data.length === 0) {
        return ServiceResponse.error(
          {} as PaginatedArticles,
          `Finding articles failed: ${error?.message || "No articles found"}`,
        );
      }

      const articles = Article.fromDatabaseList(data ?? []);

      // IDs that were requested but not found (e.g., deleted or non-existent)
      const foundIds = articles.map((a) => a.id);
      const notFoundIds = articleIds.filter((id) => !foundIds.includes(id));

      const paginatedResult: PaginatedArticles = {
        articles,
        total: count ?? 0,
        page,
        pages: Math.ceil((count ?? 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Articles retrieved successfully",
        {
          notFoundIds,
          totalRequested: articleIds.length,
          totalFound: articles.length,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching articles",
      );
    }
  }

  /**
   * Get all article IDs by user ID (includes deleted articles)
   * @param userId - The user's ID
   * @returns ServiceResponse with array of article IDs
   */
  static async getArticleIdsByUserId(
    userId: string,
  ): Promise<ServiceResponse<string[]>> {
    try {
      // Validate userId exists
      if (!userId) {
        return ServiceResponse.error({} as string[], "User ID is required");
      }

      // Query all articles (including deleted) from base table
      const { data, error } = await db
        .from("articles")
        .select("id")
        .eq("user_id", userId);

      // Handle database errors
      if (error) {
        return ServiceResponse.error(
          [],
          `Failed to fetch article IDs: ${error.message}`,
        );
      }

      // Handle no data found
      if (!data || data.length === 0) {
        return ServiceResponse.error(
          {} as string[],
          "No articles found for this user",
        );
      }

      // Extract IDs
      const articleIds: string[] = data.map((article) => article.id);

      return ServiceResponse.ok(
        articleIds,
        "Article IDs retrieved successfully",
        {
          totalArticles: articleIds.length,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        [],
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching article IDs",
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
    role: string = "user",
  ): Promise<ServiceResponse<PaginatedArticles<Article[]>>> {
    try {
      // Validate userId exists
      if (!userId) {
        return ServiceResponse.error(
          {} as PaginatedArticles,
          "User ID is required",
        );
      }

      let query = db
        .from(
          role === "admin"
            ? "articles_all_with_details"
            : "articles_with_details",
        )
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply pagination only if limit > 0
      let data, error, count;
      if (limit > 0) {
        const offset = (page - 1) * limit;
        const result = await query.range(offset, offset + limit - 1);
        data = result.data as [];
        error = result.error;
        count = result.count;
      } else {
        // limit = 0 means fetch ALL articles (no range)
        const result = await query;
        data = result.data as [];
        error = result.error;
        count = result.count;
      }

      const isData = !isValid(data, { dataType: "array", deep: true });

      // Handle database errors
      if (error || isData) {
        return ServiceResponse.error(
          {} as PaginatedArticles,
          isData
            ? "No articles found for this user"
            : `Failed to fetch articles: ${error?.message}`,
        );
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
        paginatedResult,
        "Articles retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles,
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
        return ServiceResponse.error({} as Article, error.message);
      }

      const articleWithAuthors = Article.fromDatabase(data);

      return ServiceResponse.ok(
        articleWithAuthors,
        "Article updated successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as Article,
        error instanceof Error
          ? error.message
          : "An unexpected error ocurred while fetching articles",
      );
    }
  }

  static async search(
    searchTerm: string,
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedArticles<Article[]>>> {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return ServiceResponse.error(
          {} as PaginatedArticles,
          "Search term is required",
        );
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
          {} as PaginatedArticles,
          `Failed to search articles: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        return ServiceResponse.ok({
          articles: [],
          total: 0,
          page,
          pages: 0,
        });
      }

      const articlesWithAuthors = Article.fromDatabaseList(data);

      const paginatedResult: PaginatedArticles = {
        articles: articlesWithAuthors,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Articles retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles,
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

  static async recoverById(
    articleId: string,
  ): Promise<ServiceResponse<Article>> {
    try {
      const { data, error } = await db
        .from("articles_all_with_details") // Use the ALL view
        .update({ deleted_at: null })
        .eq("id", articleId)
        .not("deleted_at", "is", null) // Only restore deleted ones
        .select("*")
        .single();

      if (error) {
        return ServiceResponse.error(
          {} as Article,
          `Failed to recover article: ${error.message}`,
        );
      }

      const article = Article.fromDatabase(data);
      return ServiceResponse.ok(article, "Article recovered successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Article,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while recovering article",
      );
    }
  }

  static async recoverByIds(
    articleIds: string[],
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedArticles<Article[]>>> {
    try {
      const noLimit = limit === 0;

      let query = db
        .from("articles_all_with_details")
        .update({ deleted_at: null })
        .select("*")
        .in("id", articleIds)
        .not("deleted_at", "is", null)
        .order("created_at", { ascending: false });

      // Apply pagination only if limit > 0
      let data, error, count;
      if (limit > 0) {
        const offset = (page - 1) * limit;
        const result = await query.range(offset, offset + limit - 1);
        data = result.data;
        error = result.error;
        count = (result.count as number) ?? data?.length;
      } else {
        // limit = 0 means fetch ALL articles (no range)
        const result = await query;
        data = result.data;
        error = result.error;
        count = (result.count as number) ?? data?.length;
      }

      if (error) {
        return ServiceResponse.error(
          {} as PaginatedArticles,
          `Error recovering articles: ${error.message}`,
        );
      }

      const recoveredArticles = Article.fromDatabaseList(data || []);

      const notFoundIds = articleIds.filter(
        (id) => !(data || []).some((article) => article.id === id),
      );

      const paginatedResult: PaginatedArticles = {
        articles: recoveredArticles,
        total: count || 0,
        page,
        pages: noLimit ? 1 : Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Articles recovered successfully",
        {
          notFoundIds,
          totalRequested: articleIds.length,
          count: count,
        },
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedArticles,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while recovering articles",
      );
    }
  }
}
