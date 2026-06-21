import type { SupportedStorage } from "@supabase/supabase-js";

const REMEMBER_KEY = "mvpcondos_remember_me";
const SUPABASE_AUTH_KEY_PREFIX = "sb-";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function activeStorage(): Storage | null {
  if (!isBrowser()) return null;
  return getRememberMe() ? window.localStorage : window.sessionStorage;
}

function collectSupabaseAuthKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key?.startsWith(SUPABASE_AUTH_KEY_PREFIX) && key.includes("-auth-token")) {
      keys.push(key);
    }
  }
  return keys;
}

export function getRememberMe(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(REMEMBER_KEY) === "1";
}

export function setRememberMe(enabled: boolean): void {
  if (!isBrowser()) return;
  if (enabled) window.localStorage.setItem(REMEMBER_KEY, "1");
  else window.localStorage.removeItem(REMEMBER_KEY);
}

export function clearRememberMePreference(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(REMEMBER_KEY);
}

export function clearSupabaseAuthStorage(): void {
  if (!isBrowser()) return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of collectSupabaseAuthKeys(storage)) {
      storage.removeItem(key);
    }
  }
}

export function migrateLegacyAuthStorage(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(REMEMBER_KEY);
  if (!getRememberMe()) {
    for (const key of collectSupabaseAuthKeys(window.localStorage)) {
      window.localStorage.removeItem(key);
    }
  }
}

export const supabaseAuthStorage: SupportedStorage = {
  getItem(key: string) {
    return activeStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    activeStorage()?.setItem(key, value);
  },
  removeItem(key: string) {
    if (!isBrowser()) return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};
