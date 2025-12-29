# Clarity Blog API Documentation

Base Path: /api

Auth
- Scheme: Bearer JWT in the Authorization header
- Read endpoints are generally public; write operations require authentication. Some operations further require ownership or admin role as noted.

Health
- GET /health
  - 200 OK: { status, message, timestamp }

Models (response shapes)
- user
  - { _id, name, email, role, avatar, bio?, deleted_at?, createdAt, updatedAt }
- article
  - { id, title, content, userId, authorName, authorAvatar, authorEmail, categories: string[], deleted_at?, created_at, updated_at }
- comment
  - { id, content, userId, articleId, authorName?, authorAvatar?, created_at }
- category
  - { id, value, label, created_at, updated_at }

Common Response Envelope
- Success: { success: true, data, message?, pagination? }
- Error: { success: false, message }

Pagination Envelope (typical)
- pagination: { total, page, pages, limit, hasMore, nextPage, prevPage }

Auth
- POST /auth/register
  - Body: { name, email, password }
  - 201 Created: { success: true, token, user }
  - 409 Conflict: { success: false, message }
- POST /auth/login
  - Body: { email, password }
  - 200 OK: { success: true, token, user }
  - 400 Bad Request: { success: false, message }
- GET /auth/verify (auth)
  - 200 OK: { user }
  - 401 Unauthorized

Users
- GET /users (public)
  - Query: page=1, limit=10, q? (search term)
  - 200 OK: { success: true, data: [user], pagination }
- GET /users/:id (public)
  - 200 OK: { success: true, data: user }
  - 404 Not Found
- GET /users/email/:email (public)
  - 200 OK: { success: true, data: user }
  - 404 Not Found
- GET /users/profile (auth)
  - 200 OK: { success: true, data: user }
  - 401 Unauthorized
- GET /users/search (public)
  - Query: q (required), page=1, limit=10
  - 200 OK: { success: true, data: [user], pagination }
- POST /users (auth, admin)
  - Body: { name, email, password, role?, avatar?, bio? }
  - 201 Created: { success: true, data: user }
  - 401/403 Unauthorized/Forbidden
- PUT /users/:id (auth: owner or admin)
  - Body: { name?, email?, avatar?, role?, bio? }
  - 200 OK: { success: true, data: user }
  - 401/403/404
- DELETE /users/:id (auth, admin)
  - 200 OK: { success: true, message }
  - 401/403/404
- DELETE /users/email/:email (auth, admin)
  - 200 OK: { success: true, message }
  - 401/403/404

Articles
- GET /articles (public)
  - Query: page=1, limit=10, q? (search term handled by /articles/search), userId?, category? (varies by implementation)
  - 200 OK: {
      success: true,
      data: { articles: [article], total },
      pagination: { total, page, pages, limit, hasMore, nextPage, prevPage }
    }
- GET /articles/search (public)
  - Query: q (required), page=1, limit=10, userId? (admins may search all)
  - 200 OK: { success: true, data: { articles: [article], total }, pagination }
- GET /articles/:id (public)
  - 200 OK: { success: true, data: article }
  - 404 Not Found: { success: false, message: "Article not found" }
- GET /articles/user/:userId (public)
  - Query: page=1, limit=10
  - 200 OK: { success: true, data: { articles: [article], total, page, pages }, pagination }
- POST /articles (auth)
  - Body: { title, content, categories?: string[] }
  - Note: userId is taken from the authenticated user
  - 201 Created: { success: true, message, data: article }
  - 400/401
- PUT /articles/:id (auth: owner or admin)
  - Body: { title?, content?, categories? }
  - 200 OK: { success: true, message, data: article }
  - 403 Forbidden: not owner/admin
  - 404 Not Found
- DELETE /articles/:id (auth: owner or admin)
  - 200 OK: { success: true, message }
  - 403 Forbidden
  - 404 Not Found

Comments
- POST /comments/articleId/:articleId (auth)
  - Body: { content }
  - 201 Created: { success: true, message, data: comment }
  - 400/401/404
- GET /comments/articleId/:articleId (public)
  - Query: page=1, limit=10
  - 200 OK: { success: true, data: [comment], pagination }
  - 404 Not Found
- GET /comments/:commentId (public)
  - 200 OK: { success: true, data: comment }
  - 404 Not Found
- GET /comments/userId/:userId (public)
  - Query: page=1, limit=10
  - 200 OK: { success: true, data: [comment], pagination }
- PUT /comments/:commentId (auth: owner or admin)
  - Body: { content }
  - 200 OK: { success: true, data: comment }
  - 401/403/404
- DELETE /comments/:commentId (auth: owner or admin)
  - 200 OK: { success: true, message }
  - 401/403/404

Categories
- GET /categories (public)
  - Query: page=1, limit=10
  - 200 OK: { success: true, data: [ { id, value, label, created_at, updated_at } ], pagination }
- GET /categories/search (public)
  - Query: q (required), page=1, limit=10
  - 200 OK: { success: true, data: [category], pagination }
- GET /categories/articleId/:articleId (public)
  - 200 OK: { success: true, data: [category] }
- POST /categories (auth)
  - Body: { value, label }
  - 201 Created: { success: true, data: category }
  - 401/403/409
- PUT /categories/:categoryId (auth)
  - Body: { value?, label? }
  - 200 OK: { success: true, data: category }
  - 401/403/404
- DELETE /categories/:categoryId (auth)
  - 200 OK: { success: true, message }
  - 401/403/404

Common Error Responses
- 400 Bad Request: { success: false, message }
- 401 Unauthorized: { success: false, message }
- 403 Forbidden: { success: false, message }
- 404 Not Found: { success: false, message }
- 409 Conflict: { success: false, message }
- 500 Internal Server Error: { success: false, message }

Notes
- Some controller messages are bilingual during migration; keys follow the English contract in responses.


Base URL: http://localhost:5000/api

Auth
- Scheme: Bearer JWT in Authorization header
- Most read endpoints are public; write operations require authentication

Health
- GET /health
  - 200 OK: { status, message, timestamp }

Models (response shapes)
- user
  - { id, name, email, role, avatar, bio?, createdAt, updatedAt }
- article
  - { id, title, content, category, userId, author, avatar, createdAt, updatedAt, comments? }
- comment
  - { id, content, userId, articleId, createdAt }

Auth
- POST /auth/register
  - Body: { name, email, password }
  - 201 Created: { success: true, token, data: user }
- POST /auth/login
  - Body: { email, password }
  - 200 OK: { success: true, token, data: user }
- GET /auth/verify
  - 200 OK: { success: true, data: user }
- POST /auth/logout
  - 204 No Content (or 200 OK)

Users
- GET /users
  - 200 OK: { success: true, data: [user] }
- GET /users/:id
  - 200 OK: { success: true, data: user }
- PUT /users/:id (auth: owner or admin)
  - Body: { name?, email?, avatar?, role?, bio? }
  - 200 OK: { success: true, data: user }
- DELETE /users/:id (auth: owner or admin)
  - 200 OK: { success: true }

Articles
- GET /articles
  - Query: page (number, default 1), limit (number, default 5), userId (uuid), category (string)
  - 200 OK: {
      success: true,
      data: [article],
      pagination: { total, page, pages, limit, hasMore, nextPage, prevPage }
    }
- GET /articles/:id
  - 200 OK: { success: true, data: article }
  - 404 Not Found: { success: false, message: "Article not found" }
- POST /articles (auth)
  - Body: { title, content, category? = 'general' }
  - Note: userId is taken from the authenticated token
  - 201 Created: { success: true, message: "Article created successfully", data: article }
- PUT /articles/:id (auth: owner or admin)
  - Body: { title?, content?, category? }
  - 200 OK: { success: true, message: "Article updated successfully", data: article }
  - 403 Forbidden: { success: false, message: "You do not have permission to update this article" }
  - 404 Not Found: { success: false, message: "Article not found" }
- DELETE /articles/:id (auth: owner or admin)
  - 200 OK: { success: true, message: "Article deleted successfully" }
  - 403 Forbidden: { success: false, message: "You do not have permission to delete this article" }
  - 404 Not Found: { success: false, message: "Article not found" }

Article Comments
- GET /articles/:articleId/comments
  - Query: limit (default 5, max 50), before (ISO), after (ISO)
  - 200 OK: {
      success: true,
      data: [comment],
      pagination: { limit, hasMore, total, nextCursor, previousCursor }
    }
- POST /articles/:articleId/comments (auth)
  - Body: { content }
  - 201 Created: { success: true, message: "Comentario creado exitosamente" | "Comment created successfully", data: comment }

Comments
- GET /comments/:id
  - 200 OK: { success: true, data: comment }
- PUT /comments/:id (auth: owner or admin)
  - Body: { content }
  - 200 OK: { success: true, data: comment }
- DELETE /comments/:id (auth: owner or admin)
  - 200 OK: { success: true }

Categories
- GET /categories
  - 200 OK: { success: true, data: [ { id, slug, name, created_at } ] }
- GET /categories/:slug/articles
  - Query: page, limit
  - 200 OK: { success: true, data: [article], pagination }

Common Error Responses
- 400 Bad Request: { success: false, message }
- 401 Unauthorized: { success: false, message }
- 403 Forbidden: { success: false, message }
- 404 Not Found: { success: false, message }
- 500 Internal Server Error: { success: false, message }

Notes
- During migration, responses may temporarily include legacy Spanish keys on article and comment objects for compatibility (e.g., titulo, contenido, categoria, usuario; notaId). These will be removed after the frontend is fully migrated to the English contract.


## REDIS & JWT
https://upstash.com/