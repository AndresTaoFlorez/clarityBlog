// backend/src/models/User.js
import { formatDateToBogota } from "../shared/utils/formatdate.js"
import { UserRole } from "./value-objects/UserRole.js";

class User {
    /**
     * 
     * @param {Object} args - de la clase
     */
    constructor({ name, email, password, role }) {
        this.id = User.#generateId();
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = new UserRole(role)
        this.created_at = new Date();
        this.updated_at = new Date;
        this.formate_created_at = formatDateToBogota(this.created_at);
        this.formate_update_at = formatDateToBogota(this.updated_at);
    }

    // Método para obtener el usuario sin el password
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    updateName(name) {
        if (!(typeof name === "string")) {
            throw new Error('Must be string')
        }
        if (!(name.length <= 10000 && name.length >= 1)) {
            throw new Error('Most be between 1 and 15 characters')
        }
        this.name = name;

    }

    /**
     * 
     * @param {string|UserRole} role 
     * @returns 
     */
    updateRole(role) {
        if (!UserRole.isValid(role)) {
            return null
        }
        this.role = new UserRole(role)
    }

    static #generateId() {
        const id = Math.floor(Math.random() * (110 - 2 + 1)) + 1;
        return id;
    }
}



// 1. Definicion del objecto que vamos a usar para crear la instancia de la clase User
const user1 = {
    name: "pablo",
    email: "pablo@gmail.com",
    password: "password123",
    role: "basic"
}

// 2. Creamos nueva instancia de la clase User
const newUser1 = new User(user1)

// 3. Mostrar el resultado de la instancia en pantalla
console.log(newUser1)


const newRole = UserRole.isValid("admin") ? "admin" : ""

newUser1.updateRole(newRole)

console.log(newUser1)
