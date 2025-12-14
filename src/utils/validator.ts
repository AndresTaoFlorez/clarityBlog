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
      | "date";
    allowEmpty?: boolean;
  } = {},
): boolean => {
  const { dataType, allowEmpty = false } = options;

  // 1. Si el valor es falsy (null, undefined, false, 0, NaN, '') → inválido (excepto si es boolean false y no forzamos tipo)
  if (value === null || value === undefined) return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;

  // Si es false (boolean), es válido a menos que forcemos otro tipo
  if (value === false && dataType !== "boolean") return true;

  // 2. Validación específica por tipo forzado
  if (dataType) {
    switch (dataType) {
      case "string":
        if (typeof value !== "string") return false;
        return allowEmpty ? true : value.trim().length > 0;

      case "object":
        if (typeof value !== "object" || value === null || Array.isArray(value))
          return false;
        return allowEmpty ? true : Object.keys(value).length > 0;

      case "array":
        if (!Array.isArray(value)) return false;
        return allowEmpty ? true : value.length > 0;

      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) return false;
        return true; // 0 y -0 son válidos como números

      case "boolean":
        if (typeof value !== "boolean") return false;
        return true; // tanto true como false son válidos

      case "function":
        return typeof value === "function";

      case "date":
        return value instanceof Date && !Number.isNaN(value.getTime());

      default:
        return false;
    }
  }

  // 3. Validación general (sin tipo forzado) - comportamiento original mejorado
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
