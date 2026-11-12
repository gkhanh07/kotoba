import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKanji, getKanjiDetail } from "@/lib/content";
import { kanjiTitle, libraryText, vocabHref } from "@/lib/library";
import { getLang } from "../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../SiteBar";
import { Speak } from "../../Speak";
import { KanjiMemory } from "./KanjiMemory";
import s from "../kanji.module.css";

export async function generateMetadata(props: PageProps<"/kanji/[char]">): Promise<Metadata> {
  const [lang, k] = await Promise.all([getLang(), props.params.then((p) => getKanjiDetail(decodeURIComponent(p.char)))]);
  if (!k) return {};
  return { title: kanjiTitle(k), description: lang === "vi" ? k.vi : k.en.join(", ") };
}

export default async function KanjiDetailPage(props: PageProps<"/kanji/[char]">) {
  const { char } = await props.params;
  const [lang, k, all] = await Promise.all([getLang(), getKanjiDetail(decodeURIComponent(char)), getKanji()]);
  if (!k) notFound();
  const similar = (k.similar ?? []).flatMap((c) => all.filter((x) => x.char === c));
  const t = libraryText[lang].kanji;
  const meaning = lang === "en" ? k.en.join(", ") : k.vi;
  const rows: [string, React.ReactNode][] = [
    [t.on, <span lang="ja" key="on">{k.on.join(" · ")}</span>],
    [t.kun, <span lang="ja" key="kun">{k.kun.join(" · ")}</span>],
    [t.meaning, meaning || <em className={s.missing}>{t.noVi}</em>],
    [t.strokes, k.strokes],
    [t.lessonLabel, k.lesson],
  ];
  return (
    <>
      <SiteBar current="kanji" />
      <main className={s.app}>
        <div className={s.detailBar}>
          <Link href="/kanji" className={s.back}>
            <Arrow back />
            {t.back}
          </Link>
          <Speak text={k.char} label={t.speak} />
        </div>
        <div className={s.top}>
        <article className={s.detail}>
          <h1 lang="ja" className={s.specimen}>{k.char}</h1>
          <div>
            <p className={s.hvBig}>{k.hv.length > 0 ? <>{k.hv.join(" · ")}<span className="sr-only"> ({t.hv})</span></> : <em className={s.missing}>{t.noHv}</em>}</p>
            <dl className={s.facts}>
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
        <KanjiMemory id={k.id} lesson={k.lesson} lang={lang} />
        </div>
        {similar.length > 0 && (
          <section className={s.words} aria-labelledby="kanji-similar">
            <h2 id="kanji-similar">{t.similar}</h2>
            <ul className={s.similar}>
              {similar.map((x) => (
                <li key={x.id}>
                  <Link href={`/kanji/${encodeURIComponent(x.char)}`} className={s.tile}>
                    <span lang="ja" className={s.char}>{x.char}</span>
                    <span className={s.hv}>{x.hv.join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {k.words.length > 0 && (
          <section className={s.words} aria-labelledby="kanji-words">
            <h2 id="kanji-words">{t.words} <span lang="ja" className={s.inlineJa}>{k.char}</span></h2>
            <ul>
              {k.words.map((w) => (
                <li key={w.id}>
                  <Link href={vocabHref(w.word)} lang="ja" className={s.word}>{w.kanji ?? w.word}</Link>
                  <span lang="ja">{w.reading}</span>
                  <span>{w[lang]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
