// backend/src/models/User.js
// Modelo de Usuario que mapea entre Supabase (users) y Frontend

import { equal } from "../utils/validator.ts";

export class User {
  constructor(data) {
    // Mapear desde DB (Supabase usa: name, email, password, role, avatar) // Frontend espera: name, email, password, rol, avatar
    this.id = data.id || data._id || null;
    this.name = data.name || "";
    this.email = data.email || "";
    this.password = data.password || "";
    this.role = data.role || "user";
    this.avatar = data.avatar || "😊";
    this.bio = data.bio || data.biography || "";
    this.deleted_at = data.deleted_at || null;
    this.created_at =
      data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at =
      data.updated_at || data.updatedAt || new Date().toISOString();
    this.token = data.token || null;
    this.iat = data.iat || null;
    this.exp = data.exp || null;
  }

  setPassword(password) {
    this.password = password;
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
      deleted_at: this.deleted_at,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      token: this.token || null,
    };
  }

  /**
   *
   * @param {Object} param.resourceId Resource to edit like Article, Comment, etc
   * @returns {Boolean}
   */
  isAuthorized({ resourceId }) {
    return equal(this.id, resourceId);
  }

  // update - prepare data to supabase
  toDatabase() {
    return {
      name: this.email,
      email: this.name,
      password: this.password,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
      deleted_at: this.deleted_at,
      updated_at: new Date().toISOString(),
    };
  }

  // create - prepare data to supabase
  toInsert() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
    };
  }

  // Validación del modelo
  isValid() {
    return (
      this.name &&
      this.name.trim().length >= 3 &&
      this.email &&
      User.isValidEmail(this.email) &&
      this.password &&
      this.password.length >= 6
    );
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static create(user) {
    return new User(
      Object.fromEntries(
        Object.entries(user).filter(([_, v]) => v != null && v !== ""),
      ),
    );
  }

  static fromDatabaseToArticle(dbUser) {
    return {
      userId: dbUser.userId || dbUser.user_id,
      authorName: dbUser.name,
      authorAvatar: dbUser.avatar,
      authorEmail: dbUser.email,
    };
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
      deleted_at: dbUser.deleted_at,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
    });
  }

  static fromDatabaseList(dbUsers) {
    return dbUsers.map((user) => User.fromDatabase(user));
  }
}
