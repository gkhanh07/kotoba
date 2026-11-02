// The guest's SRS deck in localStorage, shared by every page through one external store.
import { useSyncExternalStore } from "react";
import { dayKey } from "./activity";
import { OLD_FLASHCARDS_KEY, OLD_PROGRESS_KEY, SRS_KEY, apply, forget, migrate, parseSrs, type Srs } from "./srs";

export type Deck = { srs: Srs; ok: boolean }; // ok = false: storage blocked or unreadable, changes live in memory only

let raw: string | null = null;
let deck: Deck | undefined;
const listeners = new Set<() => void>();

export const today = () => dayKey(new Date());

function read(): Deck {
  try {
    let r = localStorage.getItem(SRS_KEY);
    if (r === null) {
      // ponytail: old keys stay as a fallback; clearing local data must remove them too or this re-imports them.
      r = JSON.stringify(migrate(localStorage.getItem(OLD_PROGRESS_KEY), localStorage.getItem(OLD_FLASHCARDS_KEY), today(), Date.now()));
      localStorage.setItem(SRS_KEY, r);
    }
    if (r !== raw || !deck) {
      const srs = parseSrs(r);
      raw = r;
      deck = { srs: srs ?? {}, ok: srs !== null };
    }
  } catch {
    deck ??= { srs: {}, ok: false };
  }
  return deck;
}

function write(srs: Srs) {
  const json = JSON.stringify(srs);
  let ok = true;
  try {
    localStorage.setItem(SRS_KEY, json);
    raw = json;
  } catch {
    ok = false;
  }
  deck = { srs, ok };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => (e.key === SRS_KEY || e.key === null) && cb();
  listeners.add(cb);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// null until hydrated: the server has no deck.
export const useDeck = () => useSyncExternalStore(subscribe, read, () => null);

export function review(id: string, correct: boolean): Srs {
  const before = read().srs;
  const after = apply(before, id, correct, today(), Date.now());
  if (after !== before) write(after);
  return after;
}

export const resetDeck = (prefix: string) => write(forget(read().srs, prefix));
