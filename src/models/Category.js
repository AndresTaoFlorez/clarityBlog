/**
 * Category model for article categorization
 */
export class Category {
  /**
   * Creates a Category instance
   * @param {Object} data - Category data
   * @param {string} [data.id] - Category UUID
   * @param {string} data.value - Category value (slug)
   * @param {string} data.label - Category display name
   * @param {string} [data.created_at] - Creation timestamp
   * @param {string} [data.updated_at] - Last update timestamp
   */
  constructor(data) {
    this.id = data.id || data._id || null;
    this.value = data.value;
    this.label = data.label;
    this.created_at =
      data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at =
      data.updated_at || data.updatedAt || new Date().toISOString();
  }

  /**
   * Convert to API JSON response
   * @returns {Object} Category object for API response
   */
  toJSON() {
    return {
      id: this.id,
      value: this.value,
      label: this.label,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Prepare data for database update
   * @returns {Object} Update payload for database
   */
  toDatabase() {
    return {
      value: this.value,
      label: this.label,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Prepare data for database insert
   * @returns {Object} Insert payload for database
   */
  toInsert() {
    return {
      value: this.value,
      label: this.label,
    };
  }

  /**
   * Validate category has required fields
   * @returns {boolean} True if valid
   */
  isValid() {
    return this.value && this.label && this.id;
  }

  /**
   * Create category instance with clean data (removes null/empty values)
   * @param {Object} category - Raw category data
   * @param {String} category.value - Raw category data
   * @param {String} category.label - Raw category data
   * @returns {Category} New Category instance
   */
  static create(category) {
    return new Category(
      Object.fromEntries(
        Object.entries(category).filter(([_, v]) => v != null && v !== ""),
      ),
    );
  }

  /**
   * Map database record to Category instance
   * @param {Object} dbCategory - Database record
   * @returns {Category} Category instance
   */
  static fromDatabase(dbCategory) {
    return new Category({
      id: dbCategory.id || dbCategory._id,
      value: dbCategory.value,
      label: dbCategory.label,
      created_at: dbCategory.created_at,
      updated_at: dbCategory.updated_at,
    });
  }

  /**
   * Map array of database records to Category instances
   * @param {Array<Object>} dbCategories - Array of database records
   * @returns {Array<Category>} Array of Category instances
   */
  static fromDatabaseList(dbCategories) {
    return dbCategories.map((category) => Category.fromDatabase(category));
  }
}
