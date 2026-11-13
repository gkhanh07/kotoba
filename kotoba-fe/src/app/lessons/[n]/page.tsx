import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGrammar, getKana, getKanji, getLessons, getVocab } from "@/lib/content";
import { dict } from "@/lib/i18n";
import type { Kana } from "@/lib/kana";
import { libraryText, vocabHref } from "@/lib/library";
import { getLang } from "../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../SiteBar";
import { Speak } from "../../Speak";
import { LessonFooter } from "../LessonFooter";
import { LessonTiles } from "../LessonTiles";
import s from "../lessons.module.css";

async function find(n: string) {
  const lessons = await getLessons();
  const i = lessons.findIndex((l) => String(l.lesson) === n);
  return i < 0 ? null : { lesson: lessons[i], next: lessons[i + 1], total: lessons.length };
}

export async function generateMetadata(props: PageProps<"/lessons/[n]">): Promise<Metadata> {
  const [lang, hit] = await Promise.all([getLang(), props.params.then((p) => find(p.n))]);
  if (!hit) return {};
  return { title: `${hit.lesson.title[lang]} · Kotoba`, description: libraryText[lang].lessons.of(hit.lesson.lesson, hit.total) };
}

export default async function LessonPage(props: PageProps<"/lessons/[n]">) {
  const { n } = await props.params;
  const [lang, hit] = await Promise.all([getLang(), find(n)]);
  if (!hit) notFound();
  const { lesson, next, total } = hit;
  const num = lesson.lesson;
  const [kana, kanji, vocab, grammar] = await Promise.all([
    getKana(`?lesson=${num}`), getKanji().then((a) => a.filter((k) => k.lesson === num)),
    getVocab(`?lesson=${num}`), getGrammar().then((a) => a.filter((g) => g.lesson === num)),
  ]);
  const t = libraryText[lang].lessons;
  const groupName = dict(lang).kana.groups;

  // Kana lessons study one chart group at a time, in the order the BE lists them.
  const kanaGroups = new Map<string, Kana[]>();
  for (const k of kana) kanaGroups.set(`${k.script}/${k.group}`, [...(kanaGroups.get(`${k.script}/${k.group}`) ?? []), k]);
  const steps = kana.length
    ? [...kanaGroups.values()].map((g) => ({ href: `/kana?script=${g[0].script}&group=${g[0].group}&mode=quiz`, ids: g.map((k) => k.id) }))
    : [{ href: `/review?lesson=${num}`, ids: [...kanji, ...vocab].map((k) => k.id) }];
  const hasItems = steps.some((st) => st.ids.length);

  return (
    <>
      <SiteBar current="lessons" />
      <main className={`${s.app} ${s.lesson}`}>
        <Link href="/lessons" className={s.back}><Arrow back />{t.back}</Link>
        <header className={s.heading}>
          <h1>{lesson.title[lang]}</h1>
          <p>{[t.of(num, total), ...(Object.entries({ kana, kanji, vocab, grammar }) as [keyof typeof t.units, unknown[]][]).filter(([, a]) => a.length).map(([k, a]) => t.units[k](a.length))].join(" · ")}</p>
        </header>

        <div className={s.body}>
        <div className={s.content}>
        {[...kanaGroups.values()].map((g) => {
          const { script, group } = g[0];
          const id = `kana-${script}-${group}`;
          return (
            <section key={id} className={`${s.section} ${s.kana}`} aria-labelledby={id}>
              <h2 id={id}>
                <span>{script === "katakana" ? "Katakana" : "Hiragana"} · {groupName[group]} <small>({g.length})</small></span>
                <Link href={`/kana?script=${script}&group=${group}`}>{t.chart}</Link>
              </h2>
              <LessonTiles kind="kana" items={g} lang={lang} />
            </section>
          );
        })}

        {kanji.length > 0 && (
          <section className={s.section} aria-labelledby="l-kanji">
            <h2 id="l-kanji"><span>{t.kanji} <small>({kanji.length})</small></span></h2>
            <LessonTiles kind="kanji" items={kanji} lang={lang} />
          </section>
        )}

        {vocab.length > 0 && (
          <section className={s.section} aria-labelledby="l-vocab">
            <h2 id="l-vocab"><span>{t.vocab} <small>({vocab.length})</small></span></h2>
            <dl className={s.words}>
              {vocab.map((w) => (
                <div key={w.id}>
                  <dt lang="ja"><Link href={vocabHref(w.word)}>{w.word}</Link>{w.word !== w.reading && <span>{w.reading}</span>}</dt>
                  <dd>{w[lang]}</dd>
                  <dd><Speak text={w.reading} label={t.speak} /></dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {grammar.length > 0 && (
          <section className={s.section} aria-labelledby="l-grammar">
            <h2 id="l-grammar"><span>{t.grammar} <small>({grammar.length})</small></span></h2>
            <ul className={s.points}>
              {grammar.map((g) => (
                <li key={g.id}>
                  <Link href={`/grammar/${g.slug}`} className={s.point}>
                    <span lang="ja">{g.pattern}</span>
                    <span>{g.title[lang]}</span>
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        </div>
        {hasItems ? (
          <LessonFooter steps={steps} lang={lang} next={next && { href: `/lessons/${next.lesson}`, label: t.next(next.lesson, next.title[lang]) }} />
        ) : (
          <aside className={`panel ${s.side}`} data-raised="">
            <p className={s.scheduled}>{t.reviewBody}</p>
            <div className={s.actions}><Link href="/review?start=1" className="btn">{t.review} <Arrow /></Link></div>
          </aside>
        )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
