# Database Documentation

## Overview
Backend MVC application database schema for a blog/article management system with user authentication, articles, categories, and comments.

---

## Tables

### 1. **users**
Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User unique identifier |
| `name` | VARCHAR | NOT NULL | User's display name |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's email address |
| `password` | VARCHAR | NOT NULL | Hashed password (bcrypt) |
| `role` | VARCHAR | NOT NULL, DEFAULT 'user' | User role: 'admin', 'user', 'basic' |
| `avatar` | TEXT | NULLABLE | Avatar URL or emoji |
| `bio` | TEXT | NULLABLE | User biography |
| `token_version` | INTEGER | DEFAULT 0 | Token invalidation version |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `users_email_idx` on `email`
- `users_role_idx` on `role`

---

### 2. **articles**
Stores blog articles/posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Article unique identifier |
| `title` | VARCHAR(255) | NOT NULL | Article title |
| `description` | TEXT | NOT NULL | Article content/body |
| `user_id` | UUID | FOREIGN KEY → users(id) | Author reference |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `articles_user_id_idx` on `user_id`
- `articles_deleted_at_idx` on `deleted_at`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

---

### 3. **article_categories**
Catalog of available article categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Category unique identifier |
| `value` | VARCHAR(100) | UNIQUE, NOT NULL | Category slug/value |
| `label` | VARCHAR(100) | NOT NULL | Category display name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `article_categories_value_idx` on `value`

---

### 4. **articles_categories**
Junction table for many-to-many relationship between articles and categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Relationship unique identifier |
| `article_id` | UUID | FOREIGN KEY → articles(id) | Article reference |
| `category_id` | UUID | FOREIGN KEY → article_categories(id) | Category reference |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `articles_categories_article_id_idx` on `article_id`
- `articles_categories_category_id_idx` on `category_id`
- UNIQUE constraint on `(article_id, category_id)`

**Foreign Keys:**
- `article_id` REFERENCES `articles(id)` ON DELETE CASCADE
- `category_id` REFERENCES `article_categories(id)` ON DELETE CASCADE

---

### 5. **comments**
Stores user comments on articles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Comment unique identifier |
| `comment` | TEXT | NOT NULL | Comment content |
| `user_id` | UUID | FOREIGN KEY → users(id) | Commenter reference |
| `article_id` | UUID | FOREIGN KEY → articles(id) | Article reference |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `comments_article_id_idx` on `article_id`
- `comments_user_id_idx` on `user_id`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- `article_id` REFERENCES `articles(id)` ON DELETE CASCADE

---

## Views

### 1. **articles_with_details**
Displays active (non-deleted) articles with author information and categories.

**Columns:**
- All columns from `articles`
- `author_name` - Author's name
- `author_avatar` - Author's avatar (default: '🫥')
- `author_email` - Author's email
- `categories` - JSON array of category objects

**Filters:**
- Only articles where `deleted_at IS NULL`

**SQL:**
```sql
SELECT 
  a.id, a.title, a.description, a.user_id, 
  a.created_at, a.updated_at, a.deleted_at,
  u.name AS author_name,
  COALESCE(u.avatar, '🫥') AS author_avatar,
  u.email AS author_email,
  COALESCE(
    (SELECT json_agg(cat.*) 
     FROM articles_categories ac
     JOIN article_categories cat ON cat.id = ac.category_id
     WHERE ac.article_id = a.id AND ac.deleted_at IS NULL),
    '[]'
  ) AS categories
FROM articles a
JOIN users u ON u.id = a.user_id
WHERE a.deleted_at IS NULL;
```

---

### 2. **articles_all_with_details**
Same as `articles_with_details` but includes soft-deleted articles (admin view).

**Columns:** Same as `articles_with_details`

**Filters:** None (includes deleted articles)

**SQL:**
```sql
SELECT 
  a.id, a.title, a.description, a.user_id, 
  a.created_at, a.updated_at, a.deleted_at,
  u.name AS author_name,
  COALESCE(u.avatar, '😊') AS author_avatar,
  u.email AS author_email,
  COALESCE(
    (SELECT json_agg(json_build_object('id', cat.id, 'value', cat.value, 'label', cat.label))
     FROM articles_categories ac
     JOIN article_categories cat ON cat.id = ac.category_id
     WHERE ac.article_id = a.id AND ac.deleted_at IS NULL),
    '[]'
  ) AS categories
FROM articles a
JOIN users u ON u.id = a.user_id;
```

---

### 3. **users_active**
Displays only active (non-deleted) users.

**Columns:** All columns from `users`

**Filters:**
- Only users where `deleted_at IS NULL`

**SQL:**
```sql
SELECT id, name, email, password, role, avatar, bio, 
       token_version, created_at, updated_at
FROM users
WHERE deleted_at IS NULL;
```

---

## Functions

### 1. **create_article_with_categories**
Creates an article and associates it with multiple categories in a single transaction.

**Parameters:**
- `p_title` (TEXT) - Article title
- `p_description` (TEXT) - Article content
- `p_user_id` (UUID) - Author ID
- `p_category_ids` (UUID[]) - Array of category IDs

**Returns:** Article record with author and category details

**Usage:**
```sql
SELECT * FROM create_article_with_categories(
  'My Article',
  'Article content...',
  'user-uuid-here',
  ARRAY['cat-uuid-1', 'cat-uuid-2']::UUID[]
);
```

---

### 2. **hard_delete_article**
Permanently deletes an article and all related data.

**Parameters:**
- `p_article_id` (UUID) - Article ID to delete

**Returns:** Deleted article record

**Usage:**
```sql
SELECT * FROM hard_delete_article('article-uuid-here');
```

---

### 3. **hard_delete_many_articles**
Permanently deletes multiple articles in bulk.

**Parameters:**
- `p_article_ids` (UUID[]) - Array of article IDs

**Returns:** Array of deleted article records

**Usage:**
```sql
SELECT * FROM hard_delete_many_articles(
  ARRAY['uuid-1', 'uuid-2', 'uuid-3']::UUID[]
);
```

---

### 4. **truncate_table**
Admin utility to truncate a table (⚠️ Use with caution).

**Parameters:**
- `table_name` (TEXT) - Name of table to truncate

**Returns:** VOID

**Security:** SECURITY DEFINER

**Usage:**
```sql
SELECT truncate_table('comments');
```

---

## Relationships
```
users (1) ──< (N) articles
users (1) ──< (N) comments
articles (1) ──< (N) comments
articles (N) ──< (N) article_categories [via articles_categories]
```

---

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System administrator | Full access: CRUD all resources, manage users |
| `user` | Regular user | CRUD own articles/comments, read all public content |
| `basic` | Limited user | Read-only access to public content |

---

## Soft Delete Pattern

All main tables implement soft deletes via `deleted_at` timestamp:
- `NULL` = Active record
- `TIMESTAMP` = Soft deleted (recoverable)

**Hard delete** functions permanently remove records and are restricted to admin operations.

---

## Pagination

All list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 5, 0 = all)

Response format:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pages": 20
}
```

---

## Indexes Strategy

- **Primary Keys:** All tables use UUID for distributed systems compatibility
- **Foreign Keys:** Indexed for JOIN performance
- **Soft Deletes:** `deleted_at` indexed for filtering active records
- **Email/Role:** Indexed for authentication and authorization queries

---

## Security Notes

1. **Passwords:** Hashed using bcrypt (cost factor 10+)
2. **JWT Tokens:** Version-based invalidation via `token_version`
3. **RLS (Row Level Security):** Not currently implemented - handled in application layer
4. **Function Security:** `truncate_table` uses `SECURITY DEFINER` - restrict grants carefully

---

## Conventions

- **Naming:** snake_case for database, camelCase for application
- **Timestamps:** All in UTC
- **UUIDs:** Version 4 (random)
- **Soft Deletes:** Consistent `deleted_at` pattern across all tables