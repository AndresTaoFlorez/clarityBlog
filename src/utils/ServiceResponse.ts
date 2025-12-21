import { type ApiResponse } from "../types/api.ts";

/**
 * A generic response class for service-layer operations.
 * Represents the result of an internal service call with success status, message, and data.
 *
 * @template T - The type of items in the data array (defaults to unknown)
 * @implements {ApiResponse<T>}
 */
export class ServiceResponse<T = unknown> implements ApiResponse<T> {
  /** Indicates whether the operation was successful */
  success: boolean;

  /** Human-readable message describing the result */
  message: string;

  /** Array of data returned by the operation */
  data: T[];

  /**
   * Creates a new ServiceResponse instance.
   *
   * @param success - Whether the operation succeeded (default: false)
   * @param message - Descriptive message (default: "")
   * @param data - Response data array (default: [])
   */
  constructor(success: boolean = false, message: string = "", data: T[] = []) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  /**
   * Creates a successful response.
   *
   * @template T - Type of the data items
   * @param data - The successful result data
   * @param message - Optional success message (default: "Success")
   * @returns A new ServiceResponse with success = true
   */
  static ok<T>(data: T[], message = "Success") {
    return new ServiceResponse(true, message, data);
  }

  /**
   * Creates an error response.
   *
   * @template T - Type of the data items (usually empty on errors)
   * @param data - Optional data (default: empty array)
   * @param message - Error message (default: "Error")
   * @returns A new ServiceResponse with success = false
   */
  static error<T>(data: T[] = [], message = "Error") {
    return new ServiceResponse(false, message, data);
  }
}
