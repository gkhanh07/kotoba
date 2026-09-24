// Browser-side progress until kotoba-be has accounts. Pure functions + a tiny storage wrapper.

export const MASTERED_AT = 3;
const KEY = "kotoba.progress.v1";

export type Progress = Record<string, { streak: number; seen: number }>;

export const streakOf = (p: Progress, id: string) => p[id]?.streak ?? 0;
export const isMastered = (p: Progress, id: string) => streakOf(p, id) >= MASTERED_AT;

export function applyAnswer(p: Progress, id: string, correct: boolean): Progress {
  const prev = p[id] ?? { streak: 0, seen: 0 };
  return { ...p, [id]: { streak: correct ? prev.streak + 1 : 0, seen: prev.seen + 1 } };
}

export function resetScript(p: Progress, script: string): Progress {
  return Object.fromEntries(Object.entries(p).filter(([id]) => !id.startsWith(script + ":")));
}

// Next question: any unmastered item except the one just asked; null when all are mastered.
export function pickNext<T extends { id: string }>(items: T[], p: Progress, lastId: string | null, rand = Math.random): T | null {
  const pool = items.filter((k) => !isMastered(p, k.id));
  if (!pool.length) return null;
  const fresh = pool.length > 1 ? pool.filter((k) => k.id !== lastId) : pool;
  return fresh[Math.floor(rand() * fresh.length)];
}

// Four choices: the answer plus three distinct distractors, shuffled.
export function choicesFor<T extends { id: string }>(answer: T, items: T[], rand = Math.random): T[] {
  const others = items.filter((k) => k.id !== answer.id);
  const picked: T[] = [];
  while (picked.length < 3 && others.length) picked.push(others.splice(Math.floor(rand() * others.length), 1)[0]);
  const all = [...picked, answer];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export function load(): Progress | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Progress;
  } catch {
    return null; // storage blocked or corrupt
  }
}

export function save(p: Progress): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
