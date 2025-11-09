// backend/src/models/User.js

export class User {
    constructor(id, name, email, password, role, created_at, updated_at) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.created_at = created_at;
        this.updated_at = updated_at;
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

    // Método para validar si el usuario tiene datos completos
    isValid() {
        return this.name && this.email && this.password;
    }
}

