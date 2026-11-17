"use client";

import { useEffect, useState } from "react";
import { prompt, type Prompt, type PromptSource } from "@/lib/library";

// The direction is picked in an effect, once per shown card (`key`), so the server render and the
// first client render both show the default word-meaning and never call Math.random.
export function useCardPrompt(key: string, src: PromptSource | undefined): Prompt | undefined {
  const [picked, setPicked] = useState<{ key: string; value: Prompt } | null>(null);
  const kind = src?.kind, word = src?.word, reading = src?.reading, meaning = src?.meaning;
  useEffect(() => {
    if (kind === undefined || word === undefined || meaning === undefined) return;
    // Randomness must stay out of render (SSR match, purity), so the pick can only happen here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicked({ key, value: prompt({ kind, word, reading, meaning }, Math.random) });
  }, [key, kind, word, reading, meaning]);
  if (!src) return undefined;
  return picked?.key === key ? picked.value : prompt(src, () => 0);
}
