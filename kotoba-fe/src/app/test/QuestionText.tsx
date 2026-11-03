import type { Lang } from "@/lib/i18n";
import { segments } from "@/lib/test";
import { testText } from "@/lib/testText";
import s from "./test.module.css";

// The one renderer of a question: {…} becomes <u>, ★ becomes a labelled empty box. Used while taking, in review and in retry.
export function QuestionText({ text, lang }: { text: string; lang: Lang }) {
  return (
    <span lang="ja">
      {segments(text).map((seg, i) =>
        seg.kind === "underline" ? <u key={i}>{seg.text}</u>
          : seg.kind === "blank" ? <span key={i} role="img" lang={lang} aria-label={testText[lang].blank} className={s.blank} />
          : seg.text,
      )}
    </span>
  );
}
