// backend/src/models/User.js
<<<<<<< HEAD
import { formatDateToBogota } from "../shared/utils/formatdate.js"
import { UserRole } from "./value-objects/UserRole.js";

export class User {
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



// // 1. Definicion del objecto que vamos a usar para crear la instancia de la clase User
// const user1 = {
//     name: "pablo",
//     email: "pablo@gmail.com",
//     password: "password123",
//     role: "basic"
// }

// // 2. Creamos nueva instancia de la clase User
// const newUser1 = new User(user1)

// // 3. Mostrar el resultado de la instancia en pantalla
// console.log(newUser1)

// 3. Validar role antes de actualizar 
// const newRole = UserRole.isValid("admin") ? "admin" : ""

// newUser1.updateRole(newRole)

// console.log(newUser1)
=======
// Modelo de Usuario que mapea entre Supabase (users) y Frontend

export class User {
  constructor(data) {
    // Mapear desde DB (Supabase usa: name, email, password, role)
    // Frontend espera: nombre, correo, password, rol
    this.id = data.id || null;
    this.nombre = data.nombre || data.name || '';
    this.correo = data.correo || data.email || '';
    this.password = data.password || '';
    this.rol = data.rol || data.role || 'user';
    this.bio = data.bio || data.biography || '';
    this.created_at = data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Método para obtener el usuario en formato para el FRONTEND
  // Frontend espera: _id, nombre, correo, rol, bio, createdAt, updatedAt
  toJSON() {
    return {
      _id: this.id,
      nombre: this.nombre,
      correo: this.correo,
      rol: this.rol,
      bio: this.bio,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }

  // Método para preparar datos para SUPABASE (tabla users)
  // Supabase usa: name, email, password, role
  toDatabase() {
    return {
      name: this.nombre,
      email: this.correo,
      password: this.password,
      role: this.rol,
      updated_at: new Date().toISOString()
    };
  }

  // Método para preparar datos de inserción en Supabase
  toInsert() {
    return {
      name: this.nombre,
      email: this.correo,
      password: this.password,
      role: this.rol || 'user'
    };
  }

  // Validación del modelo
  isValid() {
    return this.nombre &&
           this.correo &&
           this.password &&
           this.nombre.trim().length >= 3 &&
           this.password.length >= 6 &&
           this.isValidEmail();
  }

  isValidEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.correo && emailRegex.test(this.correo);
  }

  // Mapear desde resultado de Supabase a modelo User
  static fromDatabase(dbUser, dbDescription = null) {
    return new User({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
      biography: dbDescription?.biography || '',
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    });
  }
}
>>>>>>> bbbea50 (Nuevos cambios sobre el backend)
