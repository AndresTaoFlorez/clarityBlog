// backend/src/config/database.ts
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
  },
);

// Use generated types (run: npx supabase gen types typescript --project-id <id> > src/types/database.types.ts)
import type { Database } from "../types/database.types";

export type TableName =
  | keyof Database["public"]["Tables"]
  | keyof Database["public"]["Views"];

export type FunctionName = keyof Database["public"]["Functions"];
// Extract function arguments type safely
export type FunctionParams<FnName extends FunctionName> =
  Database["public"]["Functions"][FnName]["Args"];

export const db = {
  from: <T extends TableName>(table: T) => supabase.from(table),
  rpc: <FnName extends FunctionName>(
    fn: FnName,
    params?: FunctionParams<FnName>,
  ) => supabase.rpc(fn, params) as any,
  auth: supabase.auth,
  storage: supabase.storage,
  client: supabase,
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),
};

// Optional: re-export commonly used types
export type {
  UserRow,
  UserInsert,
  UserUpdate,
  ArticleRow,
  ArticleInsert,
  ArticleUpdate,
} from "../types/database.types";

console.log("✅ Supabase client initialized (service_role)");
