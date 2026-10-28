import { useEffect, useState, useSyncExternalStore } from "react";

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** One-time migration: tasks saved under "general|<date>" become the day's own list "day|<date>". */
export function migrateDayTasks() {
  try {
    const raw = localStorage.getItem("todo.tasks");
    if (!raw) return;
    const all = JSON.parse(raw) as Record<string, unknown>;
    if (!Object.keys(all).some((k) => k.startsWith("general|"))) return;
    const migrated = Object.fromEntries(
      Object.entries(all).map(([k, v]) => [k.startsWith("general|") ? `day|${k.slice(8)}` : k, v]),
    );
    localStorage.setItem("todo.tasks", JSON.stringify(migrated));
  } catch {}
}

export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, loaded]);
  return [value, setValue] as const;
}

export type Profile = { name: string; photo: string | null };
export const DEFAULT_NAME = "Åsa";
const PROFILE_KEY = "todo.profile";

let profile: Profile = { name: DEFAULT_NAME, photo: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** Read the saved profile once on mount; only ever written back by saveProfile. */
function hydrateProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as Partial<Profile>;
    profile = { name: p.name?.trim() || DEFAULT_NAME, photo: p.photo ?? null };
    emit();
  } catch {}
}

export function saveProfile(next: Partial<Profile>) {
  const merged: Profile = {
    name: next.name?.trim() || DEFAULT_NAME,
    photo: next.photo === undefined ? profile.photo : next.photo,
  };
  profile = merged;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
  } catch {}
  emit();
}

export function useProfile() {
  const value = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => profile,
    () => profile,
  );
  useEffect(hydrateProfile, []);
  return [value, saveProfile] as const;
}
