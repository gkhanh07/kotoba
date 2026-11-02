import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKanjiDetail } from "@/lib/content";
import { libraryText } from "@/lib/library";
import { getLang } from "../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../SiteBar";
import { Speak } from "../../Speak";
import s from "../kanji.module.css";

export async function generateMetadata(props: PageProps<"/kanji/[char]">): Promise<Metadata> {
  const [lang, k] = await Promise.all([getLang(), props.params.then((p) => getKanjiDetail(decodeURIComponent(p.char)))]);
  if (!k) return {};
  return { title: `${k.char} · ${k.hv.join(", ")} · Kotoba`, description: lang === "vi" ? k.vi : k.en.join(", ") };
}

export default async function KanjiDetailPage(props: PageProps<"/kanji/[char]">) {
  const { char } = await props.params;
  const [lang, k] = await Promise.all([getLang(), getKanjiDetail(decodeURIComponent(char))]);
  if (!k) notFound();
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M15 9H4M8.5 4.5 4 9l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
            </svg>
            {t.back}
          </Link>
          <Speak text={k.char} label={t.speak} />
        </div>
        <article className={s.detail}>
          <h1 lang="ja" className={s.specimen}>{k.char}</h1>
          <div>
            <p className={s.hvBig}>{k.hv.join(" · ")}<span className="sr-only"> ({t.hv})</span></p>
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
        {k.words.length > 0 && (
          <section className={s.words} aria-labelledby="kanji-words">
            <h2 id="kanji-words">{t.words} <span lang="ja" className={s.inlineJa}>{k.char}</span></h2>
            <ul>
              {k.words.map((w) => (
                <li key={w.id}>
                  <span lang="ja" className={s.word}>{w.kanji ?? w.word}</span>
                  <span lang="ja">{w.reading}</span>
                  <span>{w[lang]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Link href={`/lessons/${k.lesson}`} className={`btn ${s.study}`}>{t.study(k.lesson)} <Arrow /></Link>
      </main>
      <SiteFooter />
    </>
  );
}
