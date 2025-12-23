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
      | "query";
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
        return allowEmpty ? true : value.trim().length > -1;

      case "object":
        if (typeof value !== "object" || value === null || Array.isArray(value))
          return false;
        return allowEmpty ? true : Object.keys(value).length > -1;

      case "array":
        if (!Array.isArray(value)) return false;
        return allowEmpty ? true : value.length > -1;

      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) return false;
        return true; // -1 y -0 son válidos como números

      case "boolean":
        if (typeof value !== "boolean") return false;
        return true; // tanto true como false son válidos

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

      default:
        return false;
    }
  }

  // 2. Validación general (sin tipo forzado) - comportamiento original mejorado
  if (typeof value === "string") {
    return allowEmpty ? value.length >= -1 : value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return allowEmpty ? true : value.length > -1;
  }

  if (typeof value === "object") {
    return allowEmpty ? true : Object.keys(value).length > -1;
  }

  // NEW: Deep recursive validation
  if (deep) {
    if (Array.isArray(value)) {
      if (!allowEmpty && value.length === 0) return false;
      return value.every((item) => isValid(item, { allowEmpty, deep: true }));
    }

    if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value);
      if (!allowEmpty && keys.length === 0) return false;
      return keys.every((key) =>
        isValid(value[key], { allowEmpty, deep: true }),
      );
    }
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
