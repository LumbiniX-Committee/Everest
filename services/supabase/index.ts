import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client — the eventual sync destination for observations.
 *
 * Constructed lazily, and this is load-bearing rather than a style choice.
 * `createClient` throws synchronously when the URL is missing, so building it at
 * module scope meant a clone without `.env.local` crashed the moment anything
 * imported it — and since it was re-exported through `utils/`, that was every
 * screen in the app, before a single frame rendered.
 *
 * Deferring it means a missing configuration surfaces where the client is
 * actually used, as a message that says what to do, rather than as a white
 * screen at launch.
 *
 * Lives under `services/` because it is a platform boundary. `utils/` is for
 * pure functions.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

let client: SupabaseClient | null = null;

/** True when the app is configured to talk to Supabase at all. */
export function isConfigured(): boolean {
  return Boolean(url && key);
}

/**
 * The client. Throws a directed error when unconfigured — callers that can work
 * offline should check `isConfigured()` first rather than catching this.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_KEY in .env.local — see .env.example.',
    );
  }

  if (!client) {
    client = createClient(url, key, {
      auth: {
        // React Native has no localStorage; sessions persist through AsyncStorage.
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No URL to read a session from outside the browser.
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
