import type { Metadata } from "next";
import Link from "next/link";
import { getLessons, getTest, getTests } from "@/lib/content";
import { LEVELS, type Level } from "@/lib/library";
import { placementQuestions } from "@/lib/placement";
import { testText } from "@/lib/testText";
import type { Paper } from "@/lib/test";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import s from "../test/test.module.css";
import { PlacementQuiz, type Start } from "./PlacementQuiz";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${testText[await getLang()].placement.title} · Kotoba` };
}

// Phase 40h (AC-14): the first paper of each level gives a few questions; the result links the first lesson of the suggested level.
async function firstPaper(level: Level): Promise<{ level: Level; paper: Paper } | null> {
  const [first] = await getTests(level);
  const paper = first && (await getTest(first.id));
  return paper ? { level, paper } : null;
}

export default async function PlacementPage() {
  const [lang, papers, lessons] = await Promise.all([getLang(), Promise.all(LEVELS.map(firstPaper)), getLessons()]);
  const t = testText[lang].placement;
  const questions = placementQuestions(papers.filter((p) => p !== null));
  const starts: Start[] = LEVELS.flatMap((level) => {
    const l = lessons.filter((x) => x.level === level).sort((a, b) => a.lesson - b.lesson)[0];
    return l ? [{ level, lesson: l.lesson, title: l.title[lang] }] : [];
  });
  return (
    <>
      <SiteBar current="test" />
      <main className={s.app}>
        <h1 className={s.title}>{t.title}</h1>
        <p className={s.note}>{t.lede}</p>
        <p className={s.note}><Link href="/" className={s.textLink}>{t.skip}</Link></p>
        <PlacementQuiz questions={questions} starts={starts} lang={lang} />
      </main>
      <SiteFooter />
    </>
  );
}
