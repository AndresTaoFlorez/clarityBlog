# Backend Architecture

## Overview
Node.js/Express REST API with MVC pattern using Supabase as database and JWT authentication.

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Morgan logging

## Project Structure
```
backend/
├── server.js                  # Entry point
├── src/
│   ├── app.js                 # Express configuration
│   ├── config/
│   │   └── database.js        # Supabase client setup
│   ├── models/                # Data models with mapping
│   │   ├── User.js           # User entity
│   │   ├── Note.js           # Note/Article entity  
│   │   └── Comment.js        # Comment entity
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── noteController.js
│   │   └── commentController.js
│   ├── services/             # Data access layer
│   │   ├── authService.js
│   │   ├── userService
│   │   ├── noteService.js
│   │   └── commentService.js
│   ├── middlewares/          # Request interceptors
│   │   ├── authMiddleware.js # JWT validation
│   │   └── errorHandler.js   # Global error handling
│   └── routes/               # API endpoints
│       ├── authRoutes.js     # /api/auth/*
│       ├── userRoutes.js     # /api/usuarios/*
│       ├── noteRoutes.js     # /api/notas/*
│       └── commentRoutes.js  # /api/comentarios/*
```

## API Endpoints
- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`
- **Users**: `GET /api/usuarios`, `PUT /api/usuarios/:id`
- **Notes**: `GET|POST|PUT|DELETE /api/notas`
- **Comments**: `GET|POST|PUT|DELETE /api/comentarios`
- **Health**: `GET /api/health`

## Data Models
Each model handles mapping between:
- **Frontend format**: Spanish fields (`nombre`, `correo`, `contenido`)
- **Database format**: English fields (`name`, `email`, `description`)

### User Model
- Maps `users` table (name, email, password, role)
- Handles password hashing and validation

### Note Model  
- Maps `articles` table (title, description, user_id)
- Links to user for author information

### Comment Model
- Maps `comments` table (comment, user_id, article_id)
- Links to both user and article

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- Role-based access control (admin/user)
- CORS protection with origin whitelist
- Helmet security headers
- Request logging with Morgan

## Database Integration
- Supabase client with service role key
- Automatic timestamp handling
- Error handling for connection issues
- Schema: `public.users`, `public.articles`, `public.comments`