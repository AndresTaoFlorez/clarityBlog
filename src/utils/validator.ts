import type { UUID } from "crypto";

/**
 * Validates an email address format
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid.email') // false
 * validateEmail('') // false
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) return false;

  const [localPart, domain] = email.split("@");

  if (localPart.length > 64 || domain.length > 255) return false;
  if (email.length > 320) return false;

  return true;
}

/**
 * Robust validation function with optional type checking
 *
 * @param value - The value to validate
 * @param options - Optional configuration
 *   - dataType: 'string' | 'object' | 'array' | 'number' | 'boolean' | 'function' | 'date'
 *               Forces validation as if the value must be of that type
 *   - allowEmpty: boolean (default: false) - If true, allows empty strings/objects/arrays
 *
 * @returns boolean
 */
export const isValid = (
  value: any,
  options: {
    dataType?:
      | "string"
      | "object"
      | "array"
      | "number"
      | "boolean"
      | "function"
      | "date"
      | "uuid"
      | "query"
      | "email";
    allowEmpty?: boolean;
    deep?: boolean;
  } = {},
): boolean => {
  const { dataType, allowEmpty = false, deep = false } = options;

  // 0. Si el valor es falsy (null, undefined, false, 0, NaN, '') → inválido (excepto si es boolean false y no forzamos tipo)
  if (value === null || value === undefined) return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;

  // Si es false (boolean), es válido a menos que forcemos otro tipo
  if (value === false && dataType !== "boolean") return true;

  // 1. Validación específica por tipo forzado
  if (dataType) {
    switch (dataType) {
      case "string":
        if (typeof value !== "string") return false;
        return allowEmpty ? true : value.trim().length > 0;

      case "object":
        if (typeof value !== "object" || value === null || Array.isArray(value))
          return false;
        // Deep validation for objects
        if (deep) {
          const keys = Object.keys(value);
          if (!allowEmpty && keys.length === 0) return false;
          return keys.every((key) =>
            isValid(value[key], { allowEmpty, deep: true }),
          );
        }
        return allowEmpty ? true : Object.keys(value).length > 0;

      case "array":
        if (!Array.isArray(value)) return false;
        // Deep validation for arrays
        if (deep) {
          if (!allowEmpty && value.length === 0) return false;
          return value.every((item) =>
            isValid(item, { allowEmpty, deep: true }),
          );
        }
        return allowEmpty ? true : value.length > 0;

      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) return false;
        return true;

      case "boolean":
        if (typeof value !== "boolean") return false;
        return true;

      case "function":
        return typeof value === "function";

      case "date":
        return value instanceof Date && !Number.isNaN(value.getTime());

      case "uuid":
        return isValidUUID(value);

      case "query":
        if (typeof value !== "string") return false;
        if (!allowEmpty && value.trim().length === 0) return false;
        if (value.length > 100) return false;
        if (/[%;'"]/.test(value)) return false; // Reject SQL injection chars
        return true;

      case "email":
        if (typeof value !== "string") return false;
        return validateEmail(value);

      default:
        return false;
    }
  }

  // 2. Validación general (sin tipo forzado) - comportamiento original mejorado
  if (typeof value === "string") {
    return allowEmpty ? value.length >= 0 : value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return allowEmpty ? true : value.length > 0;
  }

  if (typeof value === "object") {
    return allowEmpty ? true : Object.keys(value).length > 0;
  }

  // Booleanos, funciones, Dates, símbolos, etc. son válidos si existen
  return true;
};

function isValidUUID(uuid: any): boolean {
  // Guard clauses: reject non-strings, null, undefined, empty
  if (!uuid || typeof uuid !== "string" || uuid.trim() === "") {
    return false;
  }

  // Regex for standard UUID v4 (case-insensitive)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid.trim());
}

/**
 * Validates an array of UUIDs with strong type checking
 * @param ids - Array of values to validate as UUIDs
 * @returns Object with success flags, valid UUIDs array, and invalid values array
 *
 * @example
 * const { success, allFailed, validIds, invalidIds } = checkUuids([
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   "invalid-uuid",
 *   null,
 *   123
 * ]);
 * // success: false (not all valid)
 * // allFailed: false (some are valid)
 * // validIds: ["123e4567-e89b-12d3-a456-426614174000"]
 * // invalidIds: ["invalid-uuid", null, 123]
 */
export const checkUuids = (
  ids: any[],
): {
  success: boolean;
  allFailed: boolean;
  validIds: UUID[];
  invalidIds: any[];
} => {
  // Guard: must be an array
  if (!Array.isArray(ids)) {
    return {
      success: false,
      allFailed: true,
      validIds: [],
      invalidIds: [ids], // Return the non-array value as invalid
    };
  }

  // Empty array is considered valid (no invalid items)
  if (ids.length === 0) {
    return {
      success: true,
      allFailed: false,
      validIds: [],
      invalidIds: [],
    };
  }

  const validIds: UUID[] = [];
  const invalidIds: any[] = [];

  // Validate each item
  for (const id of ids) {
    if (isValidUUID(id)) {
      validIds.push(id.trim()); // Trim whitespace from valid UUIDs
    } else {
      invalidIds.push(id); // Keep original invalid value for debugging
    }
  }

  return {
    success: invalidIds.length === 0, // True if ALL are valid
    allFailed: validIds.length === 0, // True if ALL are invalid
    validIds,
    invalidIds,
  };
};

// backend/src/utils/equal.ts

type DataType = "array" | "object" | "primitive" | "auto";

interface EqualOptions {
  dataType?: DataType;
  orderMatters?: boolean;
  deep?: boolean;
}

/**
 * Compare two values for equality
 * @param value1 - First value
 * @param value2 - Second value
 * @param options - Comparison options
 * @param options.dataType - Type of comparison: 'array', 'object', 'primitive', 'auto' (default: 'auto')
 * @param options.orderMatters - Whether order matters for arrays (default: false)
 * @param options.deep - Deep comparison for objects (default: true)
 * @returns True if values are equal
 */
export function equal<T>(
  value1: T,
  value2: T,
  options: EqualOptions = {},
): boolean {
  const { dataType = "auto", orderMatters = false, deep = true } = options;

  // Auto-detect type if not specified
  const type = dataType === "auto" ? detectType(value1) : dataType;

  switch (type) {
    case "array":
      return compareArrays(
        value1 as any[],
        value2 as any[],
        orderMatters,
        deep,
      );

    case "object":
      return compareObjects(value1 as object, value2 as object, deep);

    case "primitive":
    default:
      return value1 === value2;
  }
}

/**
 * Detect the type of a value
 */
function detectType(value: any): DataType {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "object";
  return "primitive";
}

/**
 * Compare two arrays
 */
function compareArrays(
  arr1: any[],
  arr2: any[],
  orderMatters: boolean,
  deep: boolean,
): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;

  if (orderMatters) {
    return arr1.every((val, i) => {
      if (deep && (Array.isArray(val) || typeof val === "object")) {
        return equal(val, arr2[i], { dataType: "auto", deep });
      }
      return val === arr2[i];
    });
  }

  // Sort and compare when order doesn't matter
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((val, i) => {
    if (deep && (Array.isArray(val) || typeof val === "object")) {
      return equal(val, sorted2[i], { dataType: "auto", deep });
    }
    return val === sorted2[i];
  });
}

/**
 * Compare two objects
 */
function compareObjects(obj1: object, obj2: object, deep: boolean): boolean {
  if (obj1 === null || obj2 === null) return obj1 === obj2;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => {
    const val1 = (obj1 as any)[key];
    const val2 = (obj2 as any)[key];

    if (deep && (Array.isArray(val1) || typeof val1 === "object")) {
      return equal(val1, val2, { dataType: "auto", deep });
    }

    return val1 === val2;
  });
}

interface MergeOptions {
  dataType?: "object" | "array" | "auto";
  deep?: boolean;
  allowEmpty?: boolean;
}

/**
 * Merge multiple values into a single result
 * @param values - Values to merge
 * @param options - Merge options
 * @param options.dataType - Type of merge: 'object', 'array', 'auto' (default: 'auto')
 * @param options.deep - Deep merge for nested structures (default: true)
 * @param options.allowEmpty - Allow empty values in result (default: false)
 * @returns Merged result
 */
export function merge<T = any>(...args: any[]): T {
  // Extract options if last argument is an options object
  const lastArg = args[args.length - 1];
  const hasOptions =
    lastArg &&
    typeof lastArg === "object" &&
    !Array.isArray(lastArg) &&
    ("dataType" in lastArg || "deep" in lastArg || "allowEmpty" in lastArg);

  const options: MergeOptions = hasOptions ? args.pop() : {};
  const values = args;

  const { dataType = "auto", deep = true, allowEmpty = false } = options;

  if (values.length === 0) return (dataType === "array" ? [] : {}) as T;
  if (values.length === 1) return values[0];

  // Auto-detect type
  const type = dataType === "auto" ? detectType(values[0]) : dataType;

  if (type === "array") {
    return mergeArrays(values, allowEmpty) as T;
  }

  return mergeObjects(values, deep, allowEmpty) as T;
}

/**
 * Merge multiple arrays
 */
function mergeArrays(arrays: any[][], allowEmpty: boolean): any[] {
  const result: any[] = [];

  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;

    for (const item of arr) {
      if (!allowEmpty && (item === null || item === undefined || item === "")) {
        continue;
      }
      result.push(item);
    }
  }

  return result;
}

/**
 * Merge multiple objects
 */
function mergeObjects(objects: any[], deep: boolean, allowEmpty: boolean): any {
  const result: any = {};

  for (const obj of objects) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) continue;

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      const value = obj[key];

      // Skip empty values if not allowed
      if (
        !allowEmpty &&
        (value === null || value === undefined || value === "")
      ) {
        continue;
      }

      // Deep merge for nested objects
      if (deep && value && typeof value === "object" && !Array.isArray(value)) {
        if (
          result[key] &&
          typeof result[key] === "object" &&
          !Array.isArray(result[key])
        ) {
          result[key] = mergeObjects([result[key], value], deep, allowEmpty);
        } else {
          result[key] = mergeObjects([value], deep, allowEmpty);
        }
      }
      // Deep merge for arrays
      else if (deep && Array.isArray(value)) {
        if (Array.isArray(result[key])) {
          result[key] = mergeArrays([result[key], value], allowEmpty);
        } else {
          result[key] = [...value];
        }
      }
      // Simple assignment
      else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Validates if a password meets security requirements
 *
 * @param password - The password string to validate
 * @param options - Configuration options for password validation
 * @param options.minLength - Minimum password length (default: 8)
 * @param options.maxLength - Maximum password length (default: 128)
 * @param options.requireUppercase - Require at least one uppercase letter (default: true)
 * @param options.requireLowercase - Require at least one lowercase letter (default: true)
 * @param options.requireNumbers - Require at least one number (default: true)
 * @param options.requireSpecialChars - Require at least one special character (default: true)
 * @param options.specialChars - Custom special characters to allow (default: @$!%*?&#^()_+=\-[\]{};:'"<>.,/\\|`~)
 * @param options.preventCommon - Reject common/weak passwords (default: true)
 *
 * @returns Object with `isValid` boolean and `errors` array of error messages
 *
 * @example
 * ```typescript
 * const result = isSecurePassword("MyP@ssw0rd!");
 * if (!result.isValid) {
 *   console.log(result.errors); // ["Password is too common"]
 * }
 * ```
 */
export const isSecurePassword = (
  password: string | undefined,
  options: {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    specialChars?: string;
    preventCommon?: boolean;
  } = {},
): { isValid: boolean; errors: string[] } => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    specialChars = "@$!%*?&#^()_+=\\-[\\]{};:'\"<>.,/\\\\|`~",
    preventCommon = true,
  } = options;

  const errors: string[] = [];

  // Basic checks
  if (!password || typeof password !== "string") {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  // Length validation
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    errors.push(`Password must not exceed ${maxLength} characters`);
  }

  // Uppercase validation
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase validation
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number validation
  if (requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character validation
  if (requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${specialChars}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  // Common password check
  if (preventCommon) {
    const commonPasswords = [
      "password",
      "123456",
      "12345678",
      "qwerty",
      "abc123",
      "monkey",
      "letmein",
      "trustno1",
      "dragon",
      "baseball",
      "iloveyou",
      "master",
      "sunshine",
      "ashley",
      "bailey",
      "passw0rd",
      "shadow",
      "123123",
      "654321",
      "superman",
      "password1",
      "password123",
      "admin",
      "welcome",
      "login",
    ];

    const lowerPassword = password.toLowerCase();
    if (commonPasswords.some((common) => lowerPassword.includes(common))) {
      errors.push("Password is too common or easily guessable");
    }
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      "Password should not contain repeated characters (e.g., 'aaa', '111')",
    );
  }

  // Sequential patterns check
  const sequences = [
    "abc",
    "bcd",
    "cde",
    "def",
    "123",
    "234",
    "345",
    "456",
    "567",
    "678",
    "789",
  ];
  const lowerPassword = password.toLowerCase();
  if (sequences.some((seq) => lowerPassword.includes(seq))) {
    errors.push(
      "Password should not contain sequential patterns (e.g., 'abc', '123')",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const parseIntSafely = (value: any, defaultValue: number): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
};
