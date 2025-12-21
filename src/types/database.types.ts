/**
 * Complete database schema based on the Supabase structure
 * Auto-generated types ensure full type safety across the application
 */
export interface Database {
  public: {
    Tables: {
      // ─────────────────────────────────────────────────────────
      // USERS TABLE
      // ─────────────────────────────────────────────────────────
      users: {
        Row: {
          // Read
          id: string; // uuid, NOT NULL, default: gen_random_uuid()
          name: string; // varchar, NOT NULL
          email: string; // varchar, NOT NULL
          password: string; // varchar, NOT NULL
          role: string | null; // varchar, NULLABLE
          avatar: string | null; // text, NULLABLE, default: '😊'
          bio: string | null; // text, NULLABLE
          created_at: string | null; // timestamp with time zone, default: now()
          updated_at: string | null; // timestamp with time zone, default: now()
          deleted_at: string | null; // timestamp with time zone, NULLABLE (soft delete)
        };
        Insert: {
          id?: string; // Optional (auto-generated)
          name: string; // Required
          email: string; // Required
          password: string; // Required
          role?: string | null; // Optional
          avatar?: string | null; // Optional (has default)
          bio?: string | null; // Optional
          created_at?: string | null; // Optional (auto-generated)
          updated_at?: string | null; // Optional (auto-generated)
          deleted_at?: string | null; // Optional
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          role?: string | null;
          avatar?: string | null;
          bio?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };

      // ─────────────────────────────────────────────────────────
      // ARTICLES TABLE
      // ─────────────────────────────────────────────────────────
      articles: {
        Row: {
          id: string; // uuid, NOT NULL, default: gen_random_uuid()
          title: string; // varchar, NOT NULL
          description: string | null; // text, NULLABLE
          user_id: string; // uuid, NOT NULL (foreign key to users)
          created_at: string | null; // timestamp with time zone, default: now()
          updated_at: string | null; // timestamp with time zone, default: now()
          deleted_at: string | null; // timestamp with time zone, NULLABLE (soft delete)
        };
        Insert: {
          id?: string; // Optional (auto-generated)
          title: string; // Required
          description?: string | null; // Optional
          user_id: string; // Required
          created_at?: string | null; // Optional (auto-generated)
          updated_at?: string | null; // Optional (auto-generated)
          deleted_at?: string | null; // Optional
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          user_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };

      // ─────────────────────────────────────────────────────────
      // ARTICLE_CATEGORIES TABLE (Category definitions)
      // ─────────────────────────────────────────────────────────
      article_categories: {
        Row: {
          id: string; // uuid, NOT NULL, default: gen_random_uuid()
          value: string; // text, NOT NULL (e.g., "technology", "sports")
          label: string; // text, NOT NULL, default: '' (e.g., "Technology", "Sports")
          created_at: string; // timestamp with time zone, NOT NULL, default: now()
          updated_at: string; // timestamp with time zone, NOT NULL, default: now()
        };
        Insert: {
          id?: string; // Optional (auto-generated)
          value: string; // Required
          label?: string; // Optional (has default '')
          created_at?: string; // Optional (auto-generated)
          updated_at?: string; // Optional (auto-generated)
        };
        Update: {
          id?: string;
          value?: string;
          label?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ─────────────────────────────────────────────────────────
      // ARTICLES_CATEGORIES TABLE (Junction table - many-to-many)
      // ─────────────────────────────────────────────────────────
      articles_categories: {
        Row: {
          article_id: string; // uuid, NOT NULL (foreign key to articles)
          category_id: string; // uuid, NOT NULL (foreign key to article_categories)
          created_at: string | null; // timestamp with time zone, default: now()
        };
        Insert: {
          article_id: string; // Required
          category_id: string; // Required
          created_at?: string | null; // Optional (auto-generated)
        };
        Update: {
          article_id?: string;
          category_id?: string;
          created_at?: string | null;
        };
      };

      // ─────────────────────────────────────────────────────────
      // COMMENTS TABLE
      // ─────────────────────────────────────────────────────────
      comments: {
        Row: {
          id: string; // uuid, NOT NULL, default: gen_random_uuid()
          comment: string; // text, NOT NULL
          user_id: string; // uuid, NOT NULL (foreign key to users)
          article_id: string; // uuid, NOT NULL (foreign key to articles)
          created_at: string | null; // timestamp with time zone, default: now()
          updated_at: string | null; // timestamp with time zone, default: now()
        };
        Insert: {
          id?: string; // Optional (auto-generated)
          comment: string; // Required
          user_id: string; // Required
          article_id: string; // Required
          created_at?: string | null; // Optional (auto-generated)
          updated_at?: string | null; // Optional (auto-generated)
        };
        Update: {
          id?: string;
          comment?: string;
          user_id?: string;
          article_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };

    Views: {
      articles_with_details: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          user_id: string;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
          author_name: string;
          author_avatar: string;
          author_email: string;
          categories: any; // JSON array
        };
        Insert: {
          title: string;
          description?: string | null;
          user_id: string;
          categories?: any; // JSON array of category IDs
        };
        Update: {
          title?: string;
          description?: string | null;
          categories?: any; // JSON array of category IDs
        };
      };
    };
    Functions: {
      create_article_with_categories: {
        Args: {
          p_title: string | null;
          p_description: string | null;
          p_user_id: string | null;
          p_category_ids?: string[] | null;
        };
        Returns: {
          id: string;
          title: string;
          description: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          user: {
            name: string;
            avatar: string;
            email: string;
          };
          categories: Array<{
            id: string;
            value: string;
            label: string;
          }>;
        };
      };
    };

    Enums: {
      // Add enums if you create any in your database
      // Example:
      // user_role: 'admin' | 'editor' | 'user';
      // article_status: 'draft' | 'published' | 'archived';
    };
  };
}

// ── Users table types ─────────────────────────────────────────
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
// ── Articles table types ──────────────────────────────────────
export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
// Correct type for get_articles RPC (returns array directly)
export type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
// ── Articles with details view type ───────────────────────────
export type ArticleWithDetailsRow =
  Database["public"]["Views"]["articles_with_details"]["Row"];
// ── Article Categories table types ────────────────────────────
export type ArticleCategoryRow =
  Database["public"]["Tables"]["article_categories"]["Row"];
export type ArticleCategoryInsert =
  Database["public"]["Tables"]["article_categories"]["Insert"];
export type ArticleCategoryUpdate =
  Database["public"]["Tables"]["article_categories"]["Update"];
// ── Articles-Categories junction table types ──────────────────
export type ArticlesCategoriesRow =
  Database["public"]["Tables"]["articles_categories"]["Row"];
export type ArticlesCategoriesInsert =
  Database["public"]["Tables"]["articles_categories"]["Insert"];
export type ArticlesCategoriesUpdate =
  Database["public"]["Tables"]["articles_categories"]["Update"];
// ── Comments table types ──────────────────────────────────────
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];
