import type { Metadata } from "next";
import Link from "next/link";
import { search } from "@/lib/content";
import { levelLabel, libraryText, vocabHref, type Hit } from "@/lib/library";
import { mark } from "@/lib/search";
import { getLang } from "../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../SiteBar";
import s from "./search.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = libraryText[await getLang()].search;
  return { title: `${t.title} · Kotoba`, description: t.lede };
}

const EXAMPLES = ["たべ", "taberu", "hoc", "日", "は"];
const ORDER = ["vocab", "kanji", "grammar", "kana", "lesson"] as const;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

type Part = { text: string; ja?: boolean };
type Row = { href: string; head: string; ja: boolean; parts: Part[]; lesson?: number; level: Hit["level"] };
const ja = (text: string): Part => ({ text, ja: true });

// GET form, rendered on the server: the query lives in the URL, so results can be shared and the back button works.
export default async function SearchPage(props: PageProps<"/search">) {
  const raw = (await props.searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 50); // the BE takes at most 50 characters
  const lang = await getLang();
  const t = libraryText[lang].search;
  const hits = q ? await search(q) : [];

  const row = (h: Hit): Row => ({ ...rowOf(h), level: h.level });
  const rowOf = (h: Hit): Omit<Row, "level"> => {
    switch (h.kind) {
      case "vocab": // h.kanji: the written form a kana-only word can match on (日曜日 for にちようび), shown so the hit makes sense.
        return { href: vocabHref(h.word), head: h.word, ja: true,
          parts: [ja(h.word === h.reading ? "" : h.reading), { text: h.romaji }, ja(h.kanji ?? ""), { text: cap(h[lang]) }], lesson: h.lesson };
      case "kanji":
        return { href: `/kanji/${encodeURIComponent(h.char)}`, head: h.char, ja: true, parts: [{ text: h.hv.join(" · ").toUpperCase() }, ja([...h.on, ...h.kun].join(" · ")), { text: cap(lang === "vi" && h.vi ? h.vi : h.en.join(", ")) }], lesson: h.lesson };
      case "grammar":
        return { href: `/grammar/${h.slug}`, head: h.pattern, ja: true, parts: [{ text: h.title[lang] }], lesson: h.lesson };
      case "kana":
        return { href: `/kana?script=${h.script}&group=${h.group}`, head: h.char, ja: true, parts: [{ text: h.romaji }, { text: h.script === "katakana" ? "Katakana" : "Hiragana" }] };
      case "lesson":
        return { href: `/lessons/${h.lesson}`, head: t.lesson(h.lesson), ja: false, parts: [{ text: h.title[lang] }] };
    }
  };
  const groups = ORDER.map((kind) => ({
    kind,
    rows: hits.filter((h) => h.kind === kind).map((h) => { const r = row(h); return { ...r, parts: r.parts.filter((p) => p.text) }; }),
  })).filter((g) => g.rows.length);

  const marked = (text: string) => {
    const [a, m, b] = mark(text, q);
    return m === undefined ? text : <>{a}<mark>{m}</mark>{b}</>;
  };

  return (
    <>
      <SiteBar current="search" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title}</h1>
          <p>{t.lede}</p>
        </header>
        <form role="search" action="/search" className={s.form}>
          <label htmlFor="q" className="sr-only">{t.label}</label>
          <input id="q" type="search" name="q" defaultValue={q} maxLength={50} autoFocus={!q} autoComplete="off" spellCheck={false} />
          <button type="submit" className="btn">{t.submit}</button>
        </form>

        {!q ? (
          <p className={s.examples}>
            {t.try}{" "}
            {EXAMPLES.map((x, i) => (
              <span key={x}>{i > 0 && " · "}<Link href={`/search?q=${encodeURIComponent(x)}`} lang={/[a-z]/.test(x) ? undefined : "ja"}>{x}</Link></span>
            ))}
          </p>
        ) : groups.length === 0 ? (
          <p className={s.none} role="status">{t.none(q)}</p>
        ) : (
          <>
            <p className="sr-only" role="status">{t.found(hits.length, q)}</p>
            {groups.map((g) => (
              <section key={g.kind} className={s.group} aria-labelledby={`g-${g.kind}`}>
                <h2 id={`g-${g.kind}`}>{t.kinds[g.kind]} <small>({g.rows.length})</small></h2>
                <ul className={s.list}>
                  {g.rows.map((r) => (
                    <li key={r.href + r.head}>
                      <Link href={r.href} className={s.row}>
                        <span lang={r.ja ? "ja" : undefined} className={r.ja ? s.head : s.headText}>{marked(r.head)}</span>
                        <span className={s.parts}>
                          {r.parts.map((p, i) => <span key={i} lang={p.ja ? "ja" : undefined} className={i === r.parts.length - 1 ? s.meaning : undefined}>{marked(p.text)}</span>)}
                        </span>
                        <span className={s.lesson}>
                          <span className={s.badge}>{levelLabel(r.level)}</span>
                          {r.lesson !== undefined && ` · ${t.lesson(r.lesson)}`}
                        </span>
                        <Arrow />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {groups.some((g) => g.rows.length >= 20) && <p className={s.more}>{t.more}</p>}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
