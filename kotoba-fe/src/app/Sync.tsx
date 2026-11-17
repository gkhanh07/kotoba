"use client";

import { useEffect } from "react";
import { logout, syncProgress } from "./(auth)/actions";
import { parseActivity } from "@/lib/activity";
import { dict, type Lang } from "@/lib/i18n";
import { applyRemote, clearLocal, pendingCount, setSyncPhase, snapshot, syncState, useDeck, useSyncPhase } from "@/lib/store";
import { parseSrs } from "@/lib/srs";
import { scoresOf } from "@/lib/test";
import { readResults } from "@/lib/testStore";

let uid: string | null = null;
let chain = Promise.resolve(true);

// One push at a time. pull: sync even with nothing to send, to bring in other devices' progress.
// Resolves false when the push failed (BE down) or the answer could not be stored; local data is left as it was.
const flush = (pull = false) => (chain = chain.then(() => {
  setSyncPhase("syncing");
  return push(pull);
}).then((ok) => {
  setSyncPhase(ok ? "idle" : "failed");
  return ok;
}));

async function push(pull: boolean): Promise<boolean> {
  const owner = uid;
  if (!owner) return true;
  // Before anything is read: a change made after this moment is newer than the lastSync this push sets.
  const sentAt = Date.now();
  const st = syncState();
  const before = snapshot();
  const [srsRaw, activityRaw] = before.split("\n");
  const srs = parseSrs(srsRaw) ?? {};
  // Someone else's data in this browser (their session ran out without a sign-out): take this account's, send nothing.
  const foreign = st.owner !== undefined && st.owner !== owner;
  // First sync of this browser's data to this account sends all of it: that is the guest merge.
  const cards = foreign ? {} : st.owner === undefined ? srs
    : Object.fromEntries(Object.entries(srs).filter(([, c]) => c.at > st.lastSync));
  // Test scores all go every time (the server skips what it has), so one saved before 40g or missed by a race
  // still arrives; a score saved since the last sync is what makes a push due.
  const tests = foreign ? [] : scoresOf(readResults());
  const newTest = tests.some((t) => t.at >= st.lastSync);
  if (!pull && st.owner === owner && !Object.keys(cards).length && !st.forget.length && !newTest) return true;
  try {
    const res = await syncProgress({
      cards,
      activity: foreign ? null : parseActivity(activityRaw === "null" ? null : activityRaw),
      forget: foreign ? [] : st.forget,
      tests,
    });
    if (res.failed) return false;
    // Studied while the push was in flight: keep the local copy; that change schedules the next push.
    if (res.remote && (foreign || snapshot() === before) && !applyRemote(res.remote, owner, sentAt)) return false;
    return true;
  } catch {
    return false;
  }
}

// After a mock test is saved, so the dashboard's history has it without waiting for the tab to hide.
export const syncSoon = () => void flush();

// Mounted once in the root layout. uid: the signed-in email, null for guests (no network at all).
// ponytail: a push started on visibilitychange can die with the tab; the next visit resends it (lastSync never moved).
export function Sync({ uid: current }: { uid: string | null }) {
  const deck = useDeck();
  useEffect(() => {
    uid = current;
    if (!current) return;
    flush(true);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [current]);
  useEffect(() => {
    if (!current || !deck) return;
    const t = setTimeout(flush, 3000);
    return () => clearTimeout(t);
  }, [current, deck]);
  return null;
}

// Pushes what is left, then wipes this account's data from the browser. If the push fails the data stays,
// still marked with its owner: signing back in resumes it, another account's sign-in replaces it.
export function LogoutButton({ label }: { label: string }) {
  return (
    <form action={async () => {
      if (await flush()) clearLocal();
      await logout();
    }}>
      <button type="submit" className="logout">{label}</button>
    </form>
  );
}

// SiteBar status line for a signed-in user (phase 20). Nothing until the deck loads.
export function SyncStatus({ uid: owner, lang }: { uid: string; lang: Lang }) {
  const labels = dict(lang).nav.sync;
  const deck = useDeck();
  const phase = useSyncPhase();
  const n = deck ? pendingCount(deck.srs, syncState(), owner) : 0;
  // While a push is in flight the retry button is gone, so it cannot queue a second one.
  return (
    <span className="syncStatus" aria-live="polite">
      {!deck ? null : phase === "failed" ? (
        <>{labels.failed} · <button type="button" className="syncRetry" onClick={() => flush(true)}>{labels.retry}</button></>
      ) : n > 0 ? labels.pending(n) : phase === "syncing" ? labels.saving : labels.saved}
    </span>
  );
}
