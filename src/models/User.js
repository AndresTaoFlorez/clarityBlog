// backend/src/models/User.js
// Modelo de Usuario que mapea entre Supabase (users) y Frontend

export class User {
  constructor(data) {
    // Mapear desde DB (Supabase usa: name, email, password, role, avatar)
    // Frontend espera: nombre, correo, password, rol, avatar
    this.id = data.id || null;
    this.nombre = data.nombre || data.name || '';
    this.correo = data.correo || data.email || '';
    this.password = data.password || '';
    this.rol = data.rol || data.role || 'user';
    this.avatar = data.avatar || '😊';
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
      avatar: this.avatar,
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
      avatar: this.avatar,
      updated_at: new Date().toISOString()
    };
  }

  // Método para preparar datos de inserción en Supabase
  toInsert() {
    return {
      name: this.nombre,
      email: this.correo,
      password: this.password,
      role: this.rol || 'user',
      avatar: this.avatar || '😊'
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
      avatar: dbUser.avatar,
      biography: dbDescription?.biography || '',
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    });
  }
}
