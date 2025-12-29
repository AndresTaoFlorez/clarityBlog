// Define the role type
export type UserRole = "admin" | "basic" | "user";

// Create a utility class for role operations
export class UserRoles {
  static readonly ADMIN: UserRole = "admin";
  static readonly BASIC: UserRole = "basic";
  static readonly USER: UserRole = "user";

  // Role hierarchy (higher number = more permissions)
  private static readonly hierarchy: Record<UserRole, number> = {
    admin: 3,
    user: 2,
    basic: 1,
  };

  /**
   * Check if a string is a valid user role
   */
  static isValid(role: string): role is UserRole {
    return ["admin", "basic", "user"].includes(role);
  }

  /**
   * Check if userRole has at least the required permission level
   * @param userRole - The user's current role
   * @param requiredRole - The minimum required role
   * @returns true if user has sufficient permissions
   */
  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.hierarchy[userRole] >= this.hierarchy[requiredRole];
  }

  /**
   * Get all roles with equal or higher permission than given role
   */
  static getRolesWithMinimumPermission(minRole: UserRole): UserRole[] {
    const minLevel = this.hierarchy[minRole];
    return Object.entries(this.hierarchy)
      .filter(([_, level]) => level >= minLevel)
      .map(([role]) => role as UserRole);
  }
}
