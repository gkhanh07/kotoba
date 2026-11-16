import type { Metadata } from "next";
import Link from "next/link";
import { getGrammar, getKana, getKanji, getVocab } from "@/lib/content";
import { FILTERS, levelOf, libraryText, listHref, type Filter } from "@/lib/library";
import { itemLinks } from "@/lib/weak";
import { LevelTabs } from "../LevelTabs";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { LibraryList, type LibraryRow } from "./LibraryList";
import s from "./library.module.css";
import { KINDS, libraryPageText, type LibraryKind } from "./text";

export async function generateMetadata(): Promise<Metadata> {
  const t = libraryPageText[await getLang()];
  return { title: `${t.title} · Kotoba`, description: t.lede };
}

// Phase 41h (AC-16): every kind on one screen. The old /kana, /kanji, /vocab and /grammar pages stay where they are.
// ponytail: whole level in one list (N5 ≈ 800 words), add paging if a level outgrows that.
export default async function LibraryPage(props: PageProps<"/library">) {
  const q = await props.searchParams;
  const kind: LibraryKind = KINDS.find((k) => k === q.kind) ?? "kanji";
  const filter: Filter = FILTERS.find((f) => f === q.filter) ?? "all";
  const level = levelOf(q.level);
  const [lang, kana, kanji, vocab, grammar] = await Promise.all([getLang(), getKana(), getKanji(), getVocab(), getGrammar()]);
  const t = libraryPageText[lang];
  const f = libraryText[lang].kanji;
  const links = itemLinks(kana, kanji, vocab);
  const at = <T extends { level: number }>(items: T[]) => items.filter((i) => i.level === level);
  const rows: LibraryRow[] =
    kind === "kana" ? kana.map((k) => ({ id: k.id, ...links[k.id], sub: k.romaji }))
    : kind === "kanji" ? at(kanji).map((k) => ({ id: k.id, ...links[k.id], sub: [k.hv.join(", "), lang === "en" ? k.en.join(", ") : k.vi].filter(Boolean).join(" · ") }))
    : kind === "vocab" ? at(vocab).map((w) => ({ id: w.id, ...links[w.id], sub: `${w.reading} · ${lang === "en" ? w.en : w.vi}` }))
    : at(grammar).map((g) => ({ id: g.id, front: g.pattern, href: `/grammar/${g.slug}`, sub: g.title[lang] }));
  const keep = { kind, filter: filter === "all" ? undefined : filter };
  return (
    <>
      <SiteBar current="library" />
      <main className={s.app}>
        <h1>{t.title}</h1>
        <p className={s.lede}>{t.lede}</p>
        <nav className={`seg ${s.kinds}`} aria-label={t.kindNav}>
          {KINDS.map((k) => (
            <Link key={k} href={listHref("/library", { kind: k, level: k === "kana" ? undefined : level, filter: keep.filter })} aria-current={k === kind ? "page" : undefined}>
              {t.kinds[k]}
            </Link>
          ))}
        </nav>
        {kind === "kana" ? <p className={s.note}>{t.kanaNote}</p> : <LevelTabs path="/library" level={level} lang={lang} keep={keep} />}
        <nav className={s.filters} aria-label={f.filter}>
          <span>{f.filter}</span>
          <div className="seg">
            {FILTERS.map((x) => (
              <Link key={x} href={listHref("/library", { kind, level: kind === "kana" ? undefined : level, filter: x === "all" ? undefined : x })} aria-current={x === filter ? "page" : undefined}>
                {f.filters[x]}
              </Link>
            ))}
          </div>
        </nav>
        <LibraryList rows={rows} filter={filter} lang={lang} />
      </main>
      <SiteFooter />
    </>
  );
}
