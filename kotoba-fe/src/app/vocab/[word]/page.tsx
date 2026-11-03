import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKanji, getVocabItem } from "@/lib/content";
import { kanjiIn, libraryText } from "@/lib/library";
import { getLang } from "../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../SiteBar";
import { Speak } from "../../Speak";
import k from "../../kanji/kanji.module.css";
import s from "../vocab.module.css";
import { VocabSchedule } from "./VocabSchedule";

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export async function generateMetadata(props: PageProps<"/vocab/[word]">): Promise<Metadata> {
  const [lang, w] = await Promise.all([getLang(), props.params.then((p) => getVocabItem(decodeURIComponent(p.word)))]);
  if (!w) return {};
  return { title: `${w.word} · ${w[lang]} · Kotoba`, description: `${w.reading} (${w.romaji}): ${w[lang]}` };
}

export default async function VocabPage(props: PageProps<"/vocab/[word]">) {
  const { word } = await props.params;
  const [lang, w, kanji] = await Promise.all([getLang(), getVocabItem(decodeURIComponent(word)), getKanji()]);
  if (!w) notFound();
  const t = libraryText[lang].vocab;
  const byChar = new Map(kanji.map((x) => [x.char, x]));
  const chars = kanjiIn(w.word, new Set(byChar.keys())).flatMap((c) => byChar.get(c) ?? []);
  const rows: [string, React.ReactNode][] = [
    [t.reading, <span lang="ja" key="reading">{w.reading}</span>],
    [t.romaji, w.romaji],
    [t.meaning, cap(w[lang])],
    ...(w.kanji ? [[t.kanjiForm, <span lang="ja" key="kanji">{w.kanji}</span>] as [string, React.ReactNode]] : []),
    [t.lessonLabel, w.lesson],
    [t.schedule, <VocabSchedule id={w.id} lang={lang} key="schedule" />],
  ];
  return (
    <>
      <SiteBar current="vocab" />
      <main className={k.app}>
        <div className={k.detailBar}>
          <Link href="/vocab" className={k.back}><Arrow back />{t.back}</Link>
          <Speak text={w.reading} label={t.speak} />
        </div>
        <article className={s.detail}>
          <h1 lang="ja" className={s.term}>{w.word}</h1>
          <dl className={k.facts}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <section className={k.words} aria-labelledby="vocab-example">
          <h2 id="vocab-example">{t.example}</h2>
          <div className={s.example}>
            <p lang="ja" className={s.exampleJa}>{w.example.ja}</p>
            <Speak text={w.example.ja} label={t.speak} />
          </div>
          <p>{w.example[lang]}</p>
          {w.notes && <p className={s.note}><strong>{t.notes}:</strong> {w.notes[lang]}</p>}
        </section>

        {chars.length > 0 && (
          <section className={k.words} aria-labelledby="vocab-kanji">
            <h2 id="vocab-kanji">{t.kanji}</h2>
            <ul className={k.similar}>
              {chars.map((x) => (
                <li key={x.id}>
                  <Link href={`/kanji/${encodeURIComponent(x.char)}`} className={k.tile}>
                    <span lang="ja" className={k.char}>{x.char}</span>
                    <span className={k.hv}>{x.hv.join(" · ")}</span>
                    <span className="sr-only">{lang === "vi" && x.vi ? x.vi : x.en.join(", ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link href={`/lessons/${w.lesson}`} className={`btn ${k.study}`}>{t.study(w.lesson)} <Arrow /></Link>
      </main>
      <SiteFooter />
    </>
  );
}
