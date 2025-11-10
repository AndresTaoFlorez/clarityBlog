// backend/src/models/User.js

import { UserRole } from "./value-objects/UserRole";
export class User {
    constructor(id, name, email, password, role, created_at, updated_at) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = new UserRole(role);
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

    updateName(name) {
        if (!(typeof name === "string")) {
            throw new Error('Must be string')
        }
        if (!(name.length <= 10000 && name.length >= 1)) {
            throw new Error('Most be between 1 and 15 characters')
        }
        this.name = name;

    }

    updaterole(role){
        	
    }
}


