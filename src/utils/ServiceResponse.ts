import { type ApiResponse } from "../types/api.ts";

/**
 * A generic response class for service-layer operations.
 * Represents the result of an internal service call with success status, message, and data.
 *
 * @template T - The type of the data object (defaults to unknown)
 * @implements {ApiResponse<T>}
 */
export class ServiceResponse<T = unknown> implements ApiResponse<T> {
  /** Indicates whether the operation was successful */
  success: boolean;
  /** Human-readable message describing the result */
  message: string;
  /** Data returned by the operation (now an object) */
  data: T;
  /** Optional metadata related to the response */
  meta?: object;

  /**
   * Creates a new ServiceResponse instance.
   *
   * @param success - Whether the operation succeeded
   * @param message - Descriptive message
   * @param data - Response data object
   * @param meta - Optional metadata
   */
  constructor(
    success: boolean = false,
    message: string = "",
    data: T = {} as T,
    meta: object = {},
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  /**
   * Creates a successful response.
   *
   * @template T - Type of the data object
   * @param data - The successful result data (object)
   * @param message - Optional success message
   * @param meta - Optional metadata
   * @returns A new ServiceResponse with success = true
   */
  static ok<T>(
    data: T = {} as T,
    message = "Success",
    meta: object = {},
  ): ServiceResponse<T> {
    return new ServiceResponse(true, message, data, meta);
  }

  /**
   * Creates an error response.
   *
   * @template T - Type of the data object (usually empty on errors)
   * @param data - Optional data object (default: empty object)
   * @param message - Error message
   * @param meta - Optional metadata
   * @returns A new ServiceResponse with success = false
   */
  static error<T>(
    data: T = {} as T,
    message = "Error",
    meta: object = {},
  ): ServiceResponse<T> {
    return new ServiceResponse(false, message, data, meta);
  }
}
