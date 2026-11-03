"use client";
import Link from "next/link";
import { dueCount } from "@/lib/srs";
import { today, useDeck } from "@/lib/store";

// The nav's review item. The due count needs the browser deck, so it appears after hydration and only when above 0.
export function ReviewLink({ label, due, current }: { label: string; due: string; current?: "page" }) {
  const deck = useDeck();
  const n = deck ? dueCount(deck.srs, today()) : 0;
  return (
    <Link href="/review" aria-current={current}>
      {label}
      {n > 0 && <><span className="dueCount" aria-hidden="true">{n}</span><span className="sr-only">, {n} {due}</span></>}
    </Link>
  );
}
