import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS, isTopic } from "@/config/topics";
import { getVocab } from "@/lib/content";
import { LEVELS, levelLabel, libraryText, vocabHref } from "@/lib/library";
import { getLang } from "../../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../../SiteBar";
import k from "../../../kanji/kanji.module.css";
import s from "../../vocab.module.css";

export async function generateMetadata(props: PageProps<"/vocab/topics/[topic]">): Promise<Metadata> {
  const [lang, { topic }] = await Promise.all([getLang(), props.params]);
  if (!isTopic(topic)) notFound();
  return { title: `${TOPICS[topic][lang]} · ${libraryText[lang].vocab.topics} · Kotoba` };
}

// Phase 40b: one topic's words, N5 first; a level with no such words is left out.
export default async function TopicPage(props: PageProps<"/vocab/topics/[topic]">) {
  const { topic } = await props.params;
  if (!isTopic(topic)) notFound();
  const [lang, vocab] = await Promise.all([getLang(), getVocab(`?topic=${topic}`)]);
  const t = libraryText[lang].vocab;
  return (
    <>
      <SiteBar current="vocab" />
      <main className={s.app}>
        <div className={k.detailBar}>
          <Link href="/vocab/topics" className={k.back}><Arrow back />{t.topics}</Link>
        </div>
        <header className={s.heading}>
          <h1>{TOPICS[topic][lang]}</h1>
          <p>{t.count(vocab.length)}</p>
        </header>
        {LEVELS.map((level) => {
          const words = vocab.filter((v) => v.level === level);
          if (!words.length) return null;
          return (
            <section key={level} className={k.words} aria-labelledby={`topic-n${level}`}>
              <h2 id={`topic-n${level}`}>{levelLabel(level)}</h2>
              <ul>
                {words.map((w) => (
                  <li key={w.id}>
                    <Link href={vocabHref(w.id)} lang="ja" className={k.word}>{w.word}</Link>
                    <span lang="ja">{w.reading}</span>
                    <span>{w[lang]}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </>
  );
}
