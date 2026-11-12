import Link from "next/link";
import { WEAK_LIST_SIZE } from "@/config/srs";
import type { Lang } from "@/lib/i18n";
import { weakText } from "@/lib/library";
import s from "./WeakList.module.css";

export type WeakItem = { id: string; front: string; lapses: number; href: string };

export function WeakList({ items, lang }: { items: WeakItem[]; lang: Lang }) {
  if (!items.length) return null;
  const t = weakText[lang];
  return (
    <section className={s.weak} aria-labelledby="dash-weak">
      <h2 id="dash-weak">{t.title}</h2>
      <ul className={s.list}>
        {items.slice(0, WEAK_LIST_SIZE).map((w) => (
          <li key={w.id}>
            <Link href={w.href} lang="ja" className={s.front}>{w.front}</Link>
            <span>{t.times(w.lapses)}</span>
          </li>
        ))}
      </ul>
      <Link href="/review?weak=1" className="btn btnGhost">{t.review}</Link>
    </section>
  );
}
