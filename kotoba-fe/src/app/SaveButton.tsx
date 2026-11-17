"use client";

import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { toggleSaved, useDeck } from "@/lib/store";

// Star a word or kanji (phase 40a). A toggle button: the name stays "Save" and aria-pressed carries the state.
// Saving an item never studied puts it in today's reviews as a new card; unsaving keeps its schedule.
export function SaveButton({ id, lang }: { id: string; lang: Lang }) {
  const deck = useDeck();
  const on = !!deck?.srs[id]?.saved;
  return (
    <button type="button" className="btn btnGhost" aria-pressed={on} disabled={!deck} onClick={() => toggleSaved(id)}>
      <svg width="16" height="16" viewBox="0 0 20 20" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.5 8l5.2-.8z" />
      </svg>
      {libraryText[lang].kanji.save}
    </button>
  );
}
