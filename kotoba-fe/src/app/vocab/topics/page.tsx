import type { Metadata } from "next";
import Link from "next/link";
import { TOPICS, type Topic } from "@/config/topics";
import { getVocab } from "@/lib/content";
import { libraryText } from "@/lib/library";
import { getLang } from "../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../SiteBar";
import s from "../vocab.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = libraryText[await getLang()].vocab;
  return { title: `${t.topics} · Kotoba`, description: t.topicsLede };
}

// Phase 40b: every topic with how many words carry it, across all levels.
export default async function TopicsPage() {
  const [lang, vocab] = await Promise.all([getLang(), getVocab()]);
  const t = libraryText[lang].vocab;
  const count = new Map<string, number>();
  for (const v of vocab) if (v.topic) count.set(v.topic, (count.get(v.topic) ?? 0) + 1);
  return (
    <>
      <SiteBar current="vocab" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.topics}</h1>
          <p>{t.topicsLede}</p>
        </header>
        <ul className={s.topics}>
          {(Object.keys(TOPICS) as Topic[]).map((key) => (
            <li key={key}>
              <Link href={`/vocab/topics/${key}`} className={s.topic}>
                <span className={s.title}>{TOPICS[key][lang]}</span>
                <span className={s.count}>{t.count(count.get(key) ?? 0)}</span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
