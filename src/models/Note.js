

class Note {
  constructor(title, description, user_id) {
    this.id = Note.#generateId();
    this.title = title;
    this.description = description;
    this.user_id = user_id;
    this.creted_at = new Date();
    this.updated_at = new Date();
  };

  updateTitle(newTitle) {
    this.title = newTitle;

  };

  updateDescription(description) {
    this.description = description;

  };
  static #generateId() {
    const id = Math.floor(Math.random() * (110 - 2 + 1)) + 1;
    return id;
  }
}



const note1 = new Note(
  "",
  "",
  1231
);
console.log(note1);

note1.updateTitle("kkkk");
console.log(note1);

note1.updateDescription("day");
console.log(note1);