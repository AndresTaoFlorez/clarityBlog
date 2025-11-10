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
}
