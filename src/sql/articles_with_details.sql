-- ============================================================================
-- COMPLETE SETUP: View + Triggers for articles_with_details
-- ============================================================================

-- 1. Drop existing objects
DROP TRIGGER IF EXISTS instead_of_update_articles_with_details ON articles_with_details;
DROP TRIGGER IF EXISTS instead_of_delete_articles_with_details ON articles_with_details;
DROP FUNCTION IF EXISTS update_articles_with_details();
DROP FUNCTION IF EXISTS delete_articles_with_details();
DROP VIEW IF EXISTS articles_with_details CASCADE;

-- 2. Create the view
CREATE OR REPLACE VIEW articles_with_details AS
SELECT
  a.id,
  a.title,
  a.description,
  a.user_id,
  a.created_at,
  a.updated_at,
  a.deleted_at,
  u.name AS author_name,
  COALESCE(u.avatar, '🫥') AS author_avatar,
  u.email AS author_email,
  COALESCE(
    (
      SELECT json_agg(cat.*)
      FROM articles_categories ac
      JOIN article_categories cat ON cat.id = ac.category_id
      WHERE ac.article_id = a.id
    ),
    '[]'::json
  ) AS categories
FROM articles a
JOIN users u ON u.id = a.user_id
WHERE a.deleted_at IS NULL;

