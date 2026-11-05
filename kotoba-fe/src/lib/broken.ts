// What cannot be read is copied before anything replaces it (ADR 008, BUG-013).
export const brokenKey = (key: string) => `${key}.broken`;

// The first copy stays: it is the closest to what was lost. A failed copy throws, so the caller does not overwrite.
export function keepBroken(key: string, raw: string): void {
  const copy = brokenKey(key);
  if (localStorage.getItem(copy) !== null) return;
  localStorage.setItem(copy, raw);
  console.error(`${key} could not be read: kept as ${copy}`);
}
