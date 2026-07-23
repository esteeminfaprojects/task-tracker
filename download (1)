// Supabase client (optional).
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, the app runs
// exactly as before (localStorage only). When they ARE set, data becomes
// shared across all users/devices via Supabase.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isRemoteEnabled = !!supabase;
