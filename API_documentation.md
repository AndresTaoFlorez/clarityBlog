# API Documentation

Base URL: http://localhost:5000/api

Authentication
- Scheme: Bearer JWT in Authorization header
- Most read endpoints are public; write operations require authentication

Health
- GET /health
  - 200 OK: { status, message, timestamp }

Auth
- POST /auth/register
  - Body: { name, email, password }
  - 201 Created: { success, data: user }
- POST /auth/login
  - Body: { email, password }
  - 200 OK: { success, token, data: user }
- POST /auth/logout
  - 204 No Content (or 200 OK)
- GET /auth/verify
  - 200 OK: { success, data: user }

Users
- GET /users
  - 200 OK: { success, data: [user] }
- GET /users/:id
  - 200 OK: { success, data: user }
- PUT /users/:id (auth: owner or admin)
  - Body: { name?, email?, avatar?, role? }
  - 200 OK: { success, data: user }
- DELETE /users/:id (auth: owner or admin)
  - 200 OK: { success }

Articles
- GET /articles
  - Query: page (number, default 1), limit (number, default 5), userId (uuid?), category (slug?)
  - 200 OK: { success, data: [article], pagination: { total, page, pages, limit, hasMore, nextPage, prevPage } }
- GET /articles/:id
  - 200 OK: { success, data: article }
- POST /articles (auth)
  - Body: { title, description?, category?='general' }
  - 201 Created: { success, data: article }
- PUT /articles/:id (auth: owner or admin)
  - Body: { title?, description?, category? }
  - 200 OK: { success, data: article }
- DELETE /articles/:id (auth: owner or admin)
  - 200 OK: { success }

Article Comments
- GET /articles/:articleId/comments
  - Query: limit (default 5), before (ISO), after (ISO)
  - 200 OK: { success, data: [comment], pagination: { limit, hasMore, total, nextCursor, previousCursor } }
- POST /articles/:articleId/comments (auth)
  - Body: { contenido }
  - 201 Created: { success, data: comment }

Comments
- GET /comments/:id
  - 200 OK: { success, data: comment }
- PUT /comments/:id (auth: owner or admin)
  - Body: { contenido }
  - 200 OK: { success, data: comment }
- DELETE /comments/:id (auth: owner or admin)
  - 200 OK: { success }

Categories
- GET /categories
  - 200 OK: { success, data: [ { id, slug, name, created_at } ] }
- GET /categories/:slug/articles
  - Query: page, limit
  - 200 OK: { success, data: [article], pagination }

Common Error Responses
- 400 Bad Request: { success: false, message }
- 401 Unauthorized: { success: false, message }
- 403 Forbidden: { success: false, message }
- 404 Not Found: { success: false, message }
- 500 Internal Server Error: { success: false, message }
