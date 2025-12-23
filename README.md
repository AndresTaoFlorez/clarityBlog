# Clarity Blog

Learning backend API project to serve data to blog application, users, articles and comments.

## Features
- API Rest
- Custom utilities to validate and merge data correctly
- MVC for project structure

## Tech Stack
- TypeSript & JavaScript
- JWT to authentication

## Routes

### Auth
Route for login, register or verify sesion and generate an authentication JWT.

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/verify`

### Users
Route for consume user's info (items limit by page = 5).

- `/api/users`: Get all users with pagination.
- `/api/search`: Search user by email or name.
- `/api/userId/:userId`: Searc user by user ID.

### Articles
Route for consume and interact with articles (CRUD). Take in account user admind and user author.

- `/api/articles`: Get all articles with pagination (items limit by page = 5).
- `/api/articles` POST: Create post - session is required.
- `/api/articles/:articleId`: Get article from article ID.
- `/api/articles/:articleId` PUT: Partial article update route by article ID.
- `/api/articles/search`: Ex. `/search?=<search-term>&page=1&limit=5`. Search by title or description.
- `/api/articles/userId/:userId`: Get all articles with pagination by user ID.
- `/api/articles/:articleId` DELETE: Article soft delete, apply soft delete from articles_categories foreign key also.
- `/api/articles/hard/:articleId` DELETE: Hard Article soft delete, apply hard delete from articles_categories foreign key also.

### Comments
As articles working, take in account permissions and user role to interact. Items limit by page = 5.

- `/api/comments/articleId/:articleId`: Get all comments of article by article.
- ... working on it

### Categories
`/api/categories`
- ... working on it
