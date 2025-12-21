-- Trigger function
DROP FUNCTION IF EXISTS update_articles_with_details() CASCADE;

CREATE OR REPLACE FUNCTION update_articles_with_details()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_categories uuid[];
  v_new_categories uuid[];
  v_to_delete uuid[];
  v_to_add uuid[];
  v_category_id uuid;
BEGIN
  -- Update article fields
  UPDATE articles
  SET
    title = COALESCE(NEW.title, OLD.title),
    description = COALESCE(NEW.description, OLD.description),
    updated_at = NOW()
  WHERE id = OLD.id;

  -- Only process categories if they were explicitly provided AND different
  -- Check if NEW.categories is different from OLD.categories (not just NULL)
  IF NEW.categories::jsonb IS DISTINCT FROM OLD.categories::jsonb 
     AND jsonb_typeof(NEW.categories::jsonb) = 'array' THEN
    
    -- Get current categories
    SELECT ARRAY_AGG(category_id)
    INTO v_old_categories
    FROM articles_categories
    WHERE article_id = OLD.id;

    -- Parse new categories from JSON array
    SELECT ARRAY_AGG(value::text::uuid)
    INTO v_new_categories
    FROM jsonb_array_elements_text(NEW.categories::jsonb);

    -- Handle NULL cases
    v_old_categories := COALESCE(v_old_categories, ARRAY[]::uuid[]);
    v_new_categories := COALESCE(v_new_categories, ARRAY[]::uuid[]);

    -- Find categories to delete
    v_to_delete := ARRAY(
      SELECT unnest(v_old_categories)
      EXCEPT
      SELECT unnest(v_new_categories)
    );

    -- Find categories to add
    v_to_add := ARRAY(
      SELECT unnest(v_new_categories)
      EXCEPT
      SELECT unnest(v_old_categories)
    );

    -- Delete removed categories
    IF array_length(v_to_delete, 1) > 0 THEN
      DELETE FROM articles_categories
      WHERE article_id = OLD.id
        AND category_id = ANY(v_to_delete);
    END IF;

    -- Add new categories
    IF array_length(v_to_add, 1) > 0 THEN
      FOREACH v_category_id IN ARRAY v_to_add
      LOOP
        INSERT INTO articles_categories (article_id, category_id)
        VALUES (OLD.id, v_category_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  -- Return updated row with full category objects from the view
  RETURN (
    SELECT ROW(
      a.id,
      a.title,
      a.description,
      a.user_id,
      a.created_at,
      a.updated_at,
      a.deleted_at,
      u.name,
      COALESCE(u.avatar, '🫥'),
      u.email,
      COALESCE(
        (
          SELECT json_agg(cat.*)
          FROM articles_categories ac
          JOIN article_categories cat ON cat.id = ac.category_id
          WHERE ac.article_id = a.id
        ),
        '[]'::json
      )
    )::articles_with_details
    FROM articles a
    JOIN users u ON u.id = a.user_id
    WHERE a.id = OLD.id
  );
END;
$$;

CREATE TRIGGER instead_of_update_articles_with_details
INSTEAD OF UPDATE ON articles_with_details
FOR EACH ROW
EXECUTE FUNCTION update_articles_with_details();