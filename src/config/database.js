// backend/src/config/database.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Required credentials (using service_role key for full backend access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY. Please check your .env file.",
  );
}

// Main Supabase client configured with service_role key (ideal for backend with full privileges)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      // Optional: add custom headers if needed in the future
    },
  },
});

// Wrapper that maintains your current syntax: db.from('table')...
// But now exposes the full power of Supabase
export const db = {
  // Keeps the syntax you already use throughout the code
  from: (table) => supabase.from(table),

  // Direct access to RPC functions (Postgres stored functions)
  rpc: (functionName, params = {}) => supabase.rpc(functionName, params),

  // Full auth management
  auth: supabase.auth,

  // Storage (for uploading images, avatars, article files, etc.)
  storage: supabase.storage,

  // Direct access to the full client (for advanced use cases)
  client: supabase,

  // Helpful quick methods for backend
  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  getUser: () => supabase.auth.getUser(),
};

// Confirmation message
console.log("🔧 Supabase client (service_role) successfully configured");
console.log("   URL:", supabaseUrl);
console.log("   Full backend access enabled");
