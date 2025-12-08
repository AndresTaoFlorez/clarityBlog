<<<<<<< HEAD
import { formatDateToBogota } from "../shared/utils/formatdate.js"

class Note {
	constructor({ title, description, user_id }) {
		this.id = Note.#generateId();
		this.title = title;
		this.description = description;
		this.user_id = user_id;
		this.creted_at = new Date();
		this.updated_at = new Date();
		this.formate_created_at = formatDateToBogota(this.creted_at);
		this.formate_update_at = formatDateToBogota(this.updated_at);
	};

	updateTitle(newTitle) {
		if (!(typeof title === "string")) {
			throw new Error('Must be string')
		}
		if (!(title.length <= 100 && title.length >= 1)) {
			throw new Error('Most be between 1 and 100 characters')
		}
		this.title = newTitle;

	};

	updateDescription(description) {

		if (!(typeof description === "string")) {
			throw new Error('Must be string')
		}
		if (!(description.length <= 10000 && description.length >= 1)) {
			throw new Error('Most be between 1 and 10000 characters')
		}
		this.description = description;

	};

	static #generateId() {
		const id = Math.floor(Math.random() * (110 - 2 + 1)) + 1;
		return id;
	}
=======
// backend/src/models/Note.js
// Modelo de Nota/Artículo que mapea entre Supabase (articles) y Frontend

export class Note {
  constructor(data) {
    // Mapear desde DB (Supabase usa: title, description, user_id)
    // Frontend espera: titulo, contenido, usuario, categoria
    this.id = data.id || null;
    this.titulo = data.titulo || data.title || '';
    this.contenido = data.contenido || data.description || '';
    this.categoria = data.categoria || 'personal';
    this.usuario = data.usuario || data.user_id || null;
    this.autor = data.autor || data.author_name || '';
    this.created_at = data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Método para obtener la nota en formato para el FRONTEND
  // Frontend espera: _id, titulo, contenido, categoria, usuario, autor, createdAt, updatedAt
  toJSON() {
    return {
      _id: this.id,
      titulo: this.titulo,
      contenido: this.contenido,
      categoria: this.categoria,
      usuario: this.usuario,
      autor: this.autor,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }

  // Método para preparar datos para SUPABASE (tabla articles)
  // Supabase usa: title, description, user_id
  toDatabase() {
    return {
      title: this.titulo,
      description: this.contenido,
      user_id: this.usuario,
      updated_at: new Date().toISOString()
    };
  }

  // Método para preparar datos de inserción en Supabase
  toInsert() {
    return {
      title: this.titulo,
      description: this.contenido,
      user_id: this.usuario
    };
  }

  // Validación del modelo
  isValid() {
    return this.titulo &&
           this.contenido &&
           this.usuario &&
           this.titulo.trim().length >= 5 &&
           this.contenido.trim().length >= 10;
  }

  // Mapear desde resultado de Supabase a modelo Note
  static fromDatabase(dbArticle, authorName = '') {
    return new Note({
      id: dbArticle.id,
      title: dbArticle.title,
      description: dbArticle.description,
      user_id: dbArticle.user_id,
      author_name: authorName,
      created_at: dbArticle.created_at,
      updated_at: dbArticle.updated_at
    });
  }
>>>>>>> bbbea50 (Nuevos cambios sobre el backend)
}
