"use client";

import type { Lang } from "@/lib/i18n";
import { useMounted } from "@/lib/mounted";
import { headline } from "@/lib/test";
import { readResults } from "@/lib/testStore";
import { testText } from "@/lib/testText";
import s from "./test.module.css";

// The saved score of one paper, or nothing. A result for a different question count belongs to an older paper, so it is hidden.
export function Last({ id, total, lang }: { id: string; total: number; lang: Lang }) {
  const mounted = useMounted();
  const result = mounted ? readResults()[id] : undefined;
  if (!result || result.total !== total) return null;
  return (
    <span className={s.last}>
      <span>{testText[lang].last}</span> <strong>{headline(result.right, result.total)}</strong>
    </span>
  );
}
