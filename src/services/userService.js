// backend/src/services/userService.js
import { db } from '../config/database.js';
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';

export class UserService {
  // Crear usuario
  static async create(userData) {
    try {
      const user = new User(userData);

      if (!user.isValid()) {
        throw new Error('Datos de usuario inválidos');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insertar en tabla 'users' de Supabase
      const { data: newUser, error: userError } = await db
        .from('users')
        .insert([{
          name: user.nombre,
          email: user.correo,
          password: hashedPassword,
          role: user.rol || 'user'
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Crear descripción del usuario (opcional)
      const { error: descError } = await db
        .from('userdescriptions')
        .insert([{
          user_id: newUser.id,
          biography: user.bio || 'Nuevo miembro de la comunidad.'
        }]);

      if (descError) {
        console.warn('No se pudo crear la descripción del usuario:', descError.message);
      }

      return User.fromDatabase(newUser, { biography: user.bio || 'Nuevo miembro de la comunidad.' });
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Obtener usuario por ID con su descripción
  static async findById(id) {
    try {
      const { data: userData, error: userError } = await db
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;
      if (!userData) return null;

      // Obtener descripción del usuario
      const { data: descData } = await db
        .from('userdescriptions')
        .select('biography')
        .eq('user_id', id)
        .single();

      return User.fromDatabase(userData, descData);
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Obtener usuario por email con su descripción
  static async findByEmail(email) {
    try {
      const { data: userData, error: userError } = await db
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;
      if (!userData) return null;

      // Obtener descripción del usuario
      const { data: descData } = await db
        .from('userdescriptions')
        .select('biography')
        .eq('user_id', userData.id)
        .single();

      return User.fromDatabase(userData, descData);
    } catch (error) {
      throw new Error(`Error al buscar usuario por email: ${error.message}`);
    }
  }

  // Obtener todos los usuarios con paginación
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Obtener usuarios
      const { data: usersData, error: usersError, count } = await db
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) throw usersError;

      // Obtener descripciones para cada usuario
      const usersWithDesc = await Promise.all(
        usersData.map(async (user) => {
          const { data: descData } = await db
            .from('userdescriptions')
            .select('biography')
            .eq('user_id', user.id)
            .single();

          return User.fromDatabase(user, descData);
        })
      );

      return {
        users: usersWithDesc,
        total: count,
        page,
        pages: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // Actualizar usuario y su descripción
  static async update(id, userData) {
    try {
      const updateData = {};

      // Preparar datos para actualizar en tabla users
      if (userData.nombre) updateData.name = userData.nombre;
      if (userData.correo) updateData.email = userData.correo;
      if (userData.rol) updateData.role = userData.rol;
      if (userData.avatar) updateData.avatar = userData.avatar;

      // Si se actualiza la contraseña, hashearla
      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      updateData.updated_at = new Date().toISOString();

      // Actualizar usuario
      const { data: updatedUser, error: userError } = await db
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (userError) throw userError;

      // Actualizar biografía si se proporciona
      if (userData.bio !== undefined) {
        const { error: descError } = await db
          .from('userdescriptions')
          .upsert({
            user_id: id,
            biography: userData.bio
          });

        if (descError) {
          console.warn('No se pudo actualizar la biografía:', descError.message);
        }
      }

      // Obtener descripción actualizada
      const { data: descData } = await db
        .from('userdescriptions')
        .select('biography')
        .eq('user_id', id)
        .single();

      return User.fromDatabase(updatedUser, descData);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  // Eliminar usuario (CASCADE eliminará también userdescriptions, articles y comments)
  static async delete(id) {
    try {
      const { error } = await db
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  // Buscar usuarios por query
  static async search(query) {
    try {
      const { data: usersData, error: usersError } = await db
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`);

      if (usersError) throw usersError;

      // Obtener descripciones para cada usuario
      const usersWithDesc = await Promise.all(
        usersData.map(async (user) => {
          const { data: descData } = await db
            .from('userdescriptions')
            .select('biography')
            .eq('user_id', user.id)
            .single();

          return User.fromDatabase(user, descData);
        })
      );

      return usersWithDesc;
    } catch (error) {
      throw new Error(`Error al buscar usuarios: ${error.message}`);
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
