// backend/src/services/userService.js
import { db } from "../config/database.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import { isValid } from "../utils/validator.ts";

export class UserService {
  // Crear usuario
  static async create(userData) {
    try {
      const user = new User(userData);

      if (!user.isValid()) {
        throw new Error("Invalid user data");
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insertar en tabla 'users' de Supabase
      const { data: newUser, error: userError } = await db
        .from("users")
        .insert([
          {
            name: user.nombre,
            email: user.correo,
            password: hashedPassword,
            avatar: user.avatar,
            role: user.role || "user",
            bio: user.bio,
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      return User.fromDatabase(newUser);
    } catch (error) {
      throw new Error(
        `Error while trying to create the user: ${error.message}`,
      );
    }
  }

  // Obtener usuario por ID con su descripción
  static async findById(id) {
    try {
      if (!isValid(id)) {
        throw new Error(`Id is required or invalid ${id.toString()}`);
      }

      const { data: userData, error: userError } = await db
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (userError) throw userError;

      return User.fromDatabase(userData);
    } catch (error) {
      throw new Error(`Searching user by id error: ${error.message}`);
    }
  }

  // Obtener usuario por email con su descripción
  static async findByEmail(email) {
    try {
      const { data: userData, error: userError } = await db
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (userError && userError.code !== "PGRST116") throw userError;
      if (!userData) return null;

      return User.fromDatabase(userData);
    } catch (error) {
      throw new Error(`Searching user by email error: ${error.message}`);
    }
  }

  // Obtener todos los usuarios con paginación
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Obtener usuarios
      const {
        data: usersData,
        error: usersError,
        count,
      } = await db
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) throw usersError;

      return {
        users: User.fromDatabaseList(usersData),
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(`Retrieving users error: ${error.message}`);
    }
  }

  // Actualizar usuario y su descripción
  static async update(id, userData = {}) {
    const updateData = { ...userData };
    try {
      if (userData.password) {
        // Si se actualiza la contraseña, hashearla
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      updateData.updated_at = new Date().toISOString();

      console.log(updateData);

      // Actualizar usuario
      const { data: updatedUser, error: userError } = await db
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (userError) throw userError;

      return User.fromDatabase(updatedUser);
    } catch (error) {
      throw new Error(`Updating user error: ${error.message}`);
    }
  }

  // Eliminar usuario (CASCADE eliminará también userdescriptions, articles y comments)
  static async delete(id) {
    try {
      const { error } = await db.from("users").delete().eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Deleting user error: ${error.message}`);
    }
  }

  // Buscar usuarios por query
  static async search(query) {
    try {
      const { data: usersData, error: usersError } = await db
        .from("users")
        .select("*")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`);

      if (usersError) throw usersError;

      return usersData;
    } catch (error) {
      throw new Error(`Searching user error: ${error.message}`);
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
