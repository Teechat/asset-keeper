import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (used in LIFF/browser — limited by RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client (used in API routes — bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
