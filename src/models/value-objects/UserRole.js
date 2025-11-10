
export class UserRole {

    static VALID_ROLES = {
        ADMIN: "admin",
        BASIC: "basic"
    }

    constructor(role) {
        if (!UserRole.isValid(role)) {
            throw new Error(`The value ${role} is invalid. Valid: ${Object.values(UserRole.VALID_ROLES).join(', ')}`)
        }

        this.role = role
    }
    // para validar los string
    static isValid(value) {
        if (!value || typeof value !== "string") {
            return false
        }
        return Object.values(UserRole.VALID_ROLES).includes(value)
    }
}
// prueba de que la clase quedó correcta
// const role1 = "admin"
//  let newUserRole = UserRole.isValid(role1) ? new UserRole(role1) : ""

// console.log(newUserRole)