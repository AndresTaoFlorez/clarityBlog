// backend/src/models/Note.js

export class Note {
  constructor(id, title, description, user_id, created_at, updated_at) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.user_id = user_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Método para obtener la nota en formato JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      user_id: this.user_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Método para validar si la nota tiene datos completos
  isValid() {
    return this.title && this.user_id;
  }
}