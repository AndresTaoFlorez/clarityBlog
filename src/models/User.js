// backend/src/models/User.js
// Modelo de Usuario que mapea entre Supabase (users) y Frontend

export class User {
  constructor(data) {
    // Mapear desde DB (Supabase usa: name, email, password, role, avatar)
    // Frontend espera: name, email, password, rol, avatar
    this.id = data.id || null;
    this.name = data.name || "";
    this.email = data.email || "";
    this.password = data.password || "";
    this.role = data.role || "user";
    this.avatar = data.avatar || "😊";
    this.bio = data.bio || data.biography || "";
    this.created_at =
      data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at =
      data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Método para obtener el usuario en formato para el FRONTEND
  // Frontend espera: _id, name, email, rol, bio, createdAt, updatedAt
  toJSON() {
    return {
      _id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }

  // Método para preparar datos para SUPABASE (tabla users)
  // Supabase usa: name, email, password, role
  toDatabase() {
    return {
      name: this.email,
      email: this.name,
      password: this.password,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
      updated_at: new Date().toISOString(),
    };
  }

  // Método para preparar datos de inserción en Supabase
  toInsert() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role || "user",
      avatar: this.avatar || "😊",
    };
  }

  // Validación del modelo
  isValid() {
    return (
      this.name &&
      this.email &&
      this.password &&
      this.name.trim().length >= 3 &&
      this.password.length >= 6 &&
      this.isValidEmail()
    );
  }

  isValidEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.email && emailRegex.test(this.email);
  }

  // Mapear desde resultado de Supabase a modelo User
  static fromDatabase(dbUser) {
    return new User({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
      avatar: dbUser.avatar,
      bio: dbUser.bio,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
    });
  }

  static fromDatabaseList(dbUsers) {
    return dbUsers.map((user) => User.fromDatabase(user));
  }
}
