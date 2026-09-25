import { supabase } from '../lib/supabase';

export type CloudStateKey = string;

const CACHE_PREFIX = 'atendly:';

function cacheKey(key: string) {
  return `${CACHE_PREFIX}${key}`;
}

export function cacheState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to cache state:', key, error);
  }
}

export function readCachedState<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function loadCloudState<T>(key: CloudStateKey, fallback: T): Promise<T> {
  const userId = await getCurrentUserId();
  if (!userId) return fallback;

  const { data, error } = await supabase
    .from('app_state')
    .select('state')
    .eq('user_id', userId)
    .eq('state_key', key)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load ${key} from Supabase:`, error.message);
    return fallback;
  }

  if (!data) {
    // First login: seed the user's cloud state from the current app state.
    await saveCloudState(key, fallback);
    return fallback;
  }

  const value = data.state as T;
  cacheState(key, value);
  return value;
}

export async function saveCloudState<T>(key: CloudStateKey, value: T): Promise<void> {
  cacheState(key, value);

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from('app_state').upsert(
    {
      user_id: userId,
      state_key: key,
      state: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,state_key' }
  );

  if (error) {
    console.warn(`Could not save ${key} to Supabase:`, error.message);
  }
}

export async function hydrateAppState(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data, error } = await supabase
    .from('app_state')
    .select('state_key,state')
    .eq('user_id', userId);

  if (error) {
    console.warn('Could not hydrate app state:', error.message);
    return;
  }

  for (const row of data ?? []) {
    cacheState(row.state_key, row.state);
  }
}
