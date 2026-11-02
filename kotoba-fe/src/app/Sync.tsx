"use client";

import { useEffect } from "react";
import { logout, syncProgress } from "./(auth)/actions";
import { parseActivity } from "@/lib/activity";
import { applyRemote, clearLocal, snapshot, syncState, useDeck } from "@/lib/store";
import { parseSrs } from "@/lib/srs";

let uid: string | null = null;
let chain = Promise.resolve(true);

// One push at a time. pull: sync even with nothing to send, to bring in other devices' progress.
// Resolves false when the push failed (BE down); local data is left as it was.
const flush = (pull = false) => (chain = chain.then(() => push(pull)));

async function push(pull: boolean): Promise<boolean> {
  const owner = uid;
  if (!owner) return true;
  const st = syncState();
  const before = snapshot();
  const [srsRaw, activityRaw] = before.split("\n");
  const srs = parseSrs(srsRaw) ?? {};
  // Someone else's data in this browser (their session ran out without a sign-out): take this account's, send nothing.
  const foreign = st.owner !== undefined && st.owner !== owner;
  // First sync of this browser's data to this account sends all of it: that is the guest merge.
  const cards = foreign ? {} : st.owner === undefined ? srs
    : Object.fromEntries(Object.entries(srs).filter(([, c]) => c.at > st.lastSync));
  if (!pull && st.owner === owner && !Object.keys(cards).length && !st.forget.length) return true;
  const sentAt = Date.now();
  try {
    const remote = await syncProgress({
      cards,
      activity: foreign ? null : parseActivity(activityRaw === "null" ? null : activityRaw),
      forget: foreign ? [] : st.forget,
    });
    // Studied while the push was in flight: keep the local copy; that change schedules the next push.
    if (remote && (foreign || snapshot() === before)) applyRemote(remote, owner, sentAt);
    return true;
  } catch {
    return false;
  }
}

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
