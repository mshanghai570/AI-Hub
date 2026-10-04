import { useEffect, useState } from 'react';

// localStorage has a ~5MB quota; writing throws QuotaExceededError once full.
// Never let a persistence failure break the running app.
export const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`localStorage write failed for ${key}`, err);
  }
};

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`localStorage read failed for ${key}`, err);
    return null;
  }
};

interface PersistOptions<T> {
  // Return undefined to fall back to the default value (e.g. invalid data).
  parse?: (raw: string) => T | undefined;
  stringify?: (value: T) => string;
}

const jsonParse = <T>(raw: string): T | undefined => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

// Keys stored as raw strings (legacy format), not JSON-quoted.
export const rawString = (raw: string): string => raw;
export const rawStringify = (value: string): string => value;

// Accept only a non-empty JSON array; anything else falls back to the default.
export const nonEmptyArray = <T,>(raw: string): T[] | undefined => {
  const parsed = jsonParse<unknown>(raw);
  return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : undefined;
};

// useState mirrored into localStorage. Values are JSON by default; pass
// `parse`/`stringify` for raw string keys or custom serialization.
export function usePersistentState<T>(
  key: string,
  defaultValue: T | (() => T),
  options: PersistOptions<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { parse = jsonParse, stringify = JSON.stringify } = options;

  const [value, setValue] = useState<T>(() => {
    const raw = safeGetItem(key);
    if (raw !== null) {
      const parsed = parse(raw);
      if (parsed !== undefined) return parsed;
    }
    return typeof defaultValue === 'function'
      ? (defaultValue as () => T)()
      : defaultValue;
  });

  useEffect(() => {
    safeSetItem(key, stringify(value));
  }, [key, value, stringify]);

  return [value, setValue];
}
