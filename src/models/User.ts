// backend/src/models/User.ts
// Modelo de Usuario que mapea entre Supabase (users) y Frontend

import { equal } from "../utils/validator.ts";

/**
 * Raw input data for User constructor
 */
export interface UserInput {
  id?: string | number | null;
  _id?: string | number | null;

  name?: string;
  email?: string;
  password?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  biography?: string;

  deleted_at?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;

  token?: string | null;
  token_version?: number;
  tokenVersion?: number;
  iat?: number | null;
  exp?: number | null;
}

/**
 * Shape expected by frontend
 */
export interface UserFrontend {
  _id: string | number | null;
  name: string;
  email: string;
  role: string;
  avatar: string;
  bio: string;
  deleted_at: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape expected by Supabase (insert)
 */
export interface UserInsert {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: string;
  bio: string;
}

/**
 * Shape expected by Supabase (update)
 */
export interface UserDatabaseUpdate extends UserInsert {
  deleted_at: string | null;
  updated_at: string;
}

export class User {
  public id: string | number | null;
  public name: string;
  public email: string;
  public password: string;
  public role: string;
  public avatar: string;
  public bio: string;
  public deleted_at: string | null;
  public created_at: string;
  public updated_at: string;
  public token: string | null;
  public tokenVersion: number;

  public iat: number | null;
  public exp: number | null;

  constructor(data: UserInput) {
    this.id = data.id ?? data._id ?? null;
    this.name = data.name ?? "";
    this.email = data.email ?? "";
    this.password = data.password ?? "";
    this.role = data.role ?? "user";
    this.avatar = data.avatar ?? "😊";
    this.bio = data.bio ?? data.biography ?? "";
    this.deleted_at = data.deleted_at ?? null;
    this.created_at =
      data.created_at ?? data.createdAt ?? new Date().toISOString();
    this.updated_at =
      data.updated_at ?? data.updatedAt ?? new Date().toISOString();
    this.token = data.token ?? null;
    this.tokenVersion = data.tokenVersion ?? data.token_version ?? 0;
    this.iat = data.iat ?? null;
    this.exp = data.exp ?? null;
  }

  setPassword(password: string): void {
    this.password = password;
  }

  /**
   * Frontend format
   */
  toJSON(): UserFrontend {
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
    };
  }

  /**
   * Authorization check
   */
  isAuthorized({ resourceId }: { resourceId: string | number }): boolean {
    return equal(this.id, resourceId);
  }

  /**
   * Update – prepare data for Supabase
   */
  toDatabase(): UserDatabaseUpdate {
    return {
      name: this.email, // ⚠️ preserved from original logic
      email: this.name, // ⚠️ preserved from original logic
      password: this.password,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
      deleted_at: this.deleted_at,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Create – prepare data for Supabase
   */
  toInsert(): UserInsert {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
    };
  }

  /**
   * Model validation
   */
  isValid(): boolean {
    return (
      this.name.trim().length >= 3 &&
      User.isValidEmail(this.email) &&
      this.password.length >= 6
    );
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static create(user: UserInput): User {
    const filtered = Object.fromEntries(
      Object.entries(user).filter(([_, v]) => v !== null && v !== ""),
    );

    return new User(filtered);
  }

  /**
   * Map Supabase row → User model
   */
  static fromDatabase(dbUser: any): User {
    return new User({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
      avatar: dbUser.avatar,
      bio: dbUser.bio,
      tokenVersion: dbUser.token_version,
      deleted_at: dbUser.deleted_at,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
    });
  }

  static fromDatabaseList(dbUsers: any[]): User[] {
    return dbUsers.map(User.fromDatabase);
  }
}
