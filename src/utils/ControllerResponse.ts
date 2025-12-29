// src/utils/ControllerResponse.ts
import { type ApiResponse } from "../types/api.ts";

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ControllerResponseType<T = unknown> = ApiResponse<T> & {
  status: HttpStatus;
};

/**
 * Standard controller response class for API endpoints
 * @template T - The type of data being returned
 */
export class ControllerResponse<T = unknown> implements ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  status: HttpStatus;
  meta: object;

  constructor(
    success: boolean,
    message: string,
    data: T,
    status: HttpStatus,
    meta: object = {},
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.status = status;
    this.meta = meta;
  }

  // Success responses

  /**
   * Create a successful response with HTTP 200 OK status
   *
   * Use this when:
   * - Retrieving data successfully (GET requests)
   * - Updating resources successfully (PUT/PATCH requests)
   * - Any successful operation that returns data
   *
   * @template T - The type of data being returned
   * @param {T} data - Data object to return (default: empty object)
   * @param {string} message - Success message (default: "Success")
   * @returns {ControllerResponseType<T>} Response object with 200 status
   * @example
   * // Getting a user profile
   * return ControllerResponse.ok(user, "User retrieved successfully");
   * @example
   * // Listing articles with pagination
   * return ControllerResponse.ok(paginatedArticles, "Articles fetched");
   */
  static ok<T>(
    data: T = {} as T,
    message = "Success",
    meta: object = {},
  ): ControllerResponseType<T> {
    return new ControllerResponse(true, message, data, HttpStatus.OK, meta);
  }

  /**
   * Create a successful response with HTTP 201 CREATED status
   *
   * Use this when:
   * - Creating new resources (POST requests)
   * - Successfully registering a new user
   * - Adding a new article, comment, or any entity to the database
   * - The operation results in a new resource being created
   *
   * @template T - The type of data being returned
   * @param {T} data - Created resource object (default: empty object)
   * @param {string} message - Success message (default: "Created")
   * @returns {ControllerResponseType<T>} Response object with 201 status
   * @example
   * // User registration
   * return ControllerResponse.created(newUser, "User created successfully");
   * @example
   * // Creating a new article
   * return ControllerResponse.created(article, "Article published");
   */
  static created<T>(
    data: T = {} as T,
    message = "Created",
  ): ControllerResponseType<T> {
    return new ControllerResponse(true, message, data, HttpStatus.CREATED);
  }

  /**
   * Create a successful response with HTTP 204 NO CONTENT status
   *
   * Use this when:
   * - Deleting resources successfully (DELETE requests)
   * - Updating resources where no data needs to be returned
   * - The operation succeeded but there's no response body to send
   * - Bulk operations that don't need to return the modified data
   *
   * @template T - The type of data (typically never used)
   * @returns {ControllerResponseType<T>} Response object with 204 status and no data
   * @example
   * // Deleting a user account
   * return ControllerResponse.noContent();
   * @example
   * // Updating user preferences without returning data
   * return ControllerResponse.noContent();
   */
  static noContent<T>(): ControllerResponseType<T> {
    return new ControllerResponse(
      true,
      "No content",
      {} as T,
      HttpStatus.NO_CONTENT,
    );
  }

  // Error responses

  /**
   * Create an error response with HTTP 400 BAD REQUEST status
   *
   * Use this when:
   * - The client sends invalid or malformed data
   * - Validation fails (invalid email, missing required fields)
   * - The request cannot be processed due to client error
   * - Query parameters are incorrect or out of range
   * - JSON parsing fails or request body is malformed
   *
   * @template T - The type of data (default: never)
   * @param {string} message - Error message (default: "Bad request")
   * @returns {ControllerResponseType<T>} Response object with 400 status
   * @example
   * // Invalid email format
   * return ControllerResponse.badRequest("Invalid email format");
   * @example
   * // Missing required fields
   * return ControllerResponse.badRequest("Password is required");
   */
  static badRequest<T = never>(
    message = "Bad request",
  ): ControllerResponseType<T> {
    return new ControllerResponse(
      false,
      message,
      {} as T,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Create an error response with HTTP 401 UNAUTHORIZED status
   *
   * Use this when:
   * - User is not logged in or session expired
   * - JWT token is missing, invalid, or expired
   * - Authentication credentials are incorrect (wrong password)
   * - User needs to authenticate before accessing the resource
   * - Login attempt fails
   *
   * @template T - The type of data (default: never)
   * @param {string} message - Error message (default: "Unauthorized")
   * @returns {ControllerResponseType<T>} Response object with 401 status
   * @example
   * // Invalid login credentials
   * return ControllerResponse.unauthorized("Invalid email or password");
   * @example
   * // Missing or expired token
   * return ControllerResponse.unauthorized("Token expired, please login again");
   */
  static unauthorized<T = never>(
    message = "Unauthorized",
  ): ControllerResponseType<T> {
    return new ControllerResponse(
      false,
      message,
      {} as T,
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Create an error response with HTTP 403 FORBIDDEN status
   *
   * Use this when:
   * - User is authenticated but doesn't have permission to access the resource
   * - Role-based access control denies the operation (user vs admin)
   * - Trying to modify someone else's data (edit another user's profile)
   * - Accessing a premium feature without subscription
   * - The operation is not allowed for the current user's role or status
   *
   * @template T - The type of data (default: never)
   * @param {string} message - Error message (default: "Forbidden")
   * @returns {ControllerResponseType<T>} Response object with 403 status
   * @example
   * // User trying to access admin panel
   * return ControllerResponse.forbidden("Admin access required");
   * @example
   * // Editing another user's article
   * return ControllerResponse.forbidden("You can only edit your own articles");
   */
  static forbidden<T = never>(
    message = "Forbidden",
  ): ControllerResponseType<T> {
    return new ControllerResponse(
      false,
      message,
      {} as T,
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Create an error response with HTTP 404 NOT FOUND status
   *
   * Use this when:
   * - The requested resource doesn't exist in the database
   * - User ID, article ID, or any entity ID is not found
   * - The endpoint URL is valid but the specific resource is missing
   * - Search query returns no results
   * - Trying to access a deleted or non-existent record
   *
   * @template T - The type of data (default: never)
   * @param {string} message - Error message (default: "Not found")
   * @returns {ControllerResponseType<T>} Response object with 404 status
   * @example
   * // User not found by ID
   * return ControllerResponse.notFound("User not found");
   * @example
   * // Article doesn't exist
   * return ControllerResponse.notFound("Article with ID 123 does not exist");
   */
  static notFound<T = never>(
    message = "Not found",
    meta = {},
  ): ControllerResponseType<T> {
    return new ControllerResponse(
      false,
      message,
      {} as T,
      HttpStatus.NOT_FOUND,
      meta,
    );
  }

  /**
   * Create an error response with HTTP 409 CONFLICT status
   *
   * Use this when:
   * - Trying to create a resource that already exists (duplicate email)
   * - Unique constraint violations in the database
   * - Concurrent modification conflicts (optimistic locking)
   * - Resource state conflicts (trying to publish an already published article)
   * - Username or email already taken during registration
   *
   * @template T - The type of data (default: never)
   * @param {string} message - Error message (default: "Conflict")
   * @returns {ControllerResponseType<T>} Response object with 409 status
   * @example
   * // Duplicate email during registration
   * return ControllerResponse.conflict("Email already exists");
   * @example
   * // Username already taken
   * return ControllerResponse.conflict("Username 'john_doe' is already in use");
   */
  static conflict<T = never>(message = "Conflict"): ControllerResponseType<T> {
    return new ControllerResponse(false, message, {} as T, HttpStatus.CONFLICT);
  }

  /**
   * Create an error response with HTTP 500 INTERNAL SERVER ERROR status
   *
   * Use this when:
   * - Unexpected server errors occur (uncaught exceptions)
   * - Database connection failures
   * - Third-party service failures (payment gateway, email service)
   * - File system errors
   * - Any error that is not the client's fault
   * - General catch-all for unexpected server-side problems
   *
   * @template T - The type of data (default: never)
   * @param {string} message - Error message (default: "Internal server error")
   * @returns {ControllerResponseType<T>} Response object with 500 status
   * @example
   * // Database connection error
   * return ControllerResponse.serverError("Database connection failed");
   * @example
   * // Unexpected error in try-catch
   * return ControllerResponse.serverError("An unexpected error occurred");
   */
  static serverError<T = never>(
    message = "Internal server error",
  ): ControllerResponseType<T> {
    return new ControllerResponse(
      false,
      message,
      {} as T,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
