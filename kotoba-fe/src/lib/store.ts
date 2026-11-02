// The SRS deck in localStorage, shared by every page through one external store.
import { useSyncExternalStore } from "react";
import { ACTIVITY_KEY, dayKey, type Activity } from "./activity";
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
      // ponytail: old keys stay as a fallback; clearLocal removes them too or this would re-import them.
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

// Signed-in sync bookkeeping. owner: the account this browser's data belongs to (its email).
// lastSync: when the last applied push started; cards changed after it are what the next push sends.
// forget: resets not yet sent, so the account drops those cards too.
const SYNC_KEY = "kotoba.sync.v1";
export type SyncState = { owner?: string; lastSync: number; forget: { prefix: string; at: number }[] };
export type Progress = { cards: Srs; activity: Activity };

export function syncState(): SyncState {
  try {
    const o = JSON.parse(localStorage.getItem(SYNC_KEY) ?? "null") as SyncState | null;
    if (o && typeof o.lastSync === "number" && Array.isArray(o.forget)) return o;
  } catch {}
  return { lastSync: 0, forget: [] };
}

// What a push compares against to tell whether the user studied while it was in flight.
export function snapshot() {
  try {
    return `${localStorage.getItem(SRS_KEY)}\n${localStorage.getItem(ACTIVITY_KEY)}`;
  } catch {
    return "";
  }
}

// Tells every useDeck / useSyncExternalStore reader in this tab to re-read storage.
const announce = () => window.dispatchEvent(new StorageEvent("storage"));

export function resetDeck(prefix: string) {
  const st = syncState();
  // Guest data that never synced has nothing on an account to forget.
  if (st.owner) {
    try {
      localStorage.setItem(SYNC_KEY, JSON.stringify({ ...st, forget: [...st.forget, { prefix, at: Date.now() }] }));
    } catch {}
  }
  write(forget(read().srs, prefix));
}

export function applyRemote(p: Progress, owner: string, lastSync: number) {
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(p.cards));
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(p.activity));
    localStorage.setItem(SYNC_KEY, JSON.stringify({ owner, lastSync, forget: [] }));
  } catch {}
  announce();
}

// Sign-out: nothing of this account stays in the browser. The pre-SRS keys go too, or read() re-imports them.
export function clearLocal() {
  try {
    for (const k of [SRS_KEY, ACTIVITY_KEY, SYNC_KEY, OLD_PROGRESS_KEY, OLD_FLASHCARDS_KEY]) localStorage.removeItem(k);
  } catch {}
  announce();
}
