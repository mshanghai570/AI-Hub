// Date.now() collides on rapid clicks (double ⌘N), producing duplicate keys.
export const newId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}_${crypto.randomUUID()}`
    : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
