// __tests__/setup.ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Use the SERVICE_ROLE_KEY for tests — it bypasses RLS and allows TRUNCATE
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of tables to fully clean before each test
const TABLES_TO_TRUNCATE = [
  "comments",
  "articles_categories",
  "articles",
  "users",
  // Add any other tables your app uses (e.g. article_categories if needed)
] as const;

beforeAll(async () => {
  // Optional: verify connection
  const { error } = await supabase.from("users").select("id").limit(0);
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
  console.log("Supabase test client connected");
});

afterAll(async () => {
  // Nothing needed usually — connection closes automatically
});

afterEach(async () => {
  // Truncate all tables in parallel for speed
  const truncatePromises = TABLES_TO_TRUNCATE.map((table) =>
    supabase.rpc("truncate_table", { table_name: table }),
  );

  const results = await Promise.all(truncatePromises);

  // Optional: check for errors
  results.forEach((result, i) => {
    if (result.error) {
      console.warn(
        `Failed to truncate ${TABLES_TO_TRUNCATE[i]}:`,
        result.error.message,
      );
    }
  });
});
