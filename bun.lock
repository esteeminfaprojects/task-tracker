// Shared-persistence layer backed by Supabase.
//
// Each of the app's six collections is stored as a single JSON document in the
// `app_state` table: one row per collection (key -> data). This mirrors the
// existing localStorage model 1:1, so none of the panel components had to change.
//
// If Supabase is not configured, every function is a no-op and the app keeps
// using localStorage only.
import { supabase } from "./supabaseClient";

export type CollectionKey =
  | "roles"
  | "departments"
  | "projects"
  | "users"
  | "tasks"
  | "timeLogs";

// Load every collection that exists in the database.
export async function loadAllRemote(): Promise<Partial<Record<CollectionKey, unknown>>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("app_state").select("key,data");
  if (error) {
    console.error("[remoteStore] load error:", error.message);
    return {};
  }
  const out: Partial<Record<CollectionKey, unknown>> = {};
  (data || []).forEach((row: { key: string; data: unknown }) => {
    out[row.key as CollectionKey] = row.data;
  });
  return out;
}

// Upsert a single collection back to the database.
export async function saveRemote(key: CollectionKey, data: unknown): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("app_state")
    .upsert(
      { key, data, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) console.error(`[remoteStore] save error (${key}):`, error.message);
}
