// backend/src/services/userService.js
import { db } from "../config/database.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import { isValid } from "../utils/validator.ts";

export class UserService {
  static async create(userData) {
    try {
      const user = User.create(userData);
      if (!user.isValid()) {
        throw new Error("Invalid user data");
      }
      // generate password hash
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.setPassword(hashedPassword);

      const insertionData = user.toInsert();

      // Insert into users db table
      const { data: newUser, error: userError } = await db
        .from("users")
        .insert(insertionData)
        .select("*")
        .is("deleted_at", null)
        .single();

      if (userError) {
        return { error: { message: userError } };
      }

      return { error: false, data: User.fromDatabase(newUser) };
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

      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (!isValid(data?._id || data?.id)) {
        return {
          error: {
            message: "User not found",
          },
        };
      }

      if (error) throw error;

      return { error: false, data: User.fromDatabase(data) };
    } catch (error) {
      throw new Error(`Searching user by id error: ${error.message}`);
    }
  }

  // Obtener usuario por email con su descripción
  static async findByEmail(email) {
    try {
      const { data, error, count } = await db
        .from("users")
        .select("*", { count: "exact" })
        .eq("email", email);

      const firstUser = count === 0 ? {} : User.fromDatabase(data[0]);
      if (!isValid(firstUser)) {
        return {
          error: {
            message: "User not found",
          },
        };
      }

      if (error) throw error;

      return { error: false, data: User.fromDatabaseList(data), firstUser };
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
        error,
        count,
      } = await db
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)
        .is("deleted_at", null);

      if (error) {
        return { error: { message: error } };
      }

      return {
        error: false,
        data: {
          users: User.fromDatabaseList(usersData),
          total: count,
          page,
          pages: Math.ceil(count / limit),
        },
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

      // Actualizar usuario
      const { data, error } = await db
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .is("deleted_at", null)
        .single();

      if (!isValid(data?._id || data?.id)) {
        return {
          error: {
            message: "User not found",
          },
        };
      }

      if (error) throw error;

      return { error: false, data: User.fromDatabase(data) };
    } catch (error) {
      throw new Error(`Updating user error: ${error.message}`);
    }
  }

  // Eliminar usuario (CASCADE eliminará también userdescriptions, articles y comments)
  static async delete(id) {
    try {
      const { data, error } = await db
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (!isValid(data?._id || data?.id)) {
        return {
          error: {
            message: "User not found",
          },
        };
      }

      if (error) throw error;

      return { error: false, data: User.fromDatabase(data) };
    } catch (error) {
      throw new Error(`Deleting user error: ${error.message}`);
    }
  }

  static async deleteByEmail(email) {
    try {
      const { data, error } = await db
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .select("*")
        .eq("email", email)
        .is("deleted_at", null)
        .single();

      if (!isValid(data?.email)) {
        return {
          error: {
            message: "User not found",
          },
        };
      }

      if (error) throw error;

      return { error: false, data: User.fromDatabase(data) };
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
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .is("deleted_at", null);

      if (usersError) {
        return { error: { message: error } };
      }

      return { error: false, data: usersData };
    } catch (error) {
      throw new Error(`Searching user error: ${error.message}`);
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
