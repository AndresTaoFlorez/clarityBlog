# Clarity Blog API Documentation (English Contract)

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
