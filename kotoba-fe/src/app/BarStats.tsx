"use client";
import Link from "next/link";
import { ACTIVITY_KEY, parseActivity, summarize } from "@/lib/activity";
import { dict, type Lang } from "@/lib/i18n";
import { useDeck, useStored } from "@/lib/store";
import { levelOf, xpOf } from "@/lib/xp";

// Phase 41i (AC-17): streak, level and XP in the bar, from this browser's deck and activity. Hidden until the deck is read.
export function BarStats({ lang }: { lang: Lang }) {
  const deck = useDeck();
  const raw = useStored(ACTIVITY_KEY);
  if (!deck || raw === undefined) return null;
  const activity = parseActivity(raw === "!unavailable" ? null : raw);
  const xp = xpOf(deck.srs);
  const t = dict(lang).nav;
  return (
    <Link href="/progress" className="barStats" title={t.progress}>
      {t.stats(activity ? summarize(activity, new Date()).streak : 0, levelOf(xp).level, xp)}
    </Link>
  );
}
