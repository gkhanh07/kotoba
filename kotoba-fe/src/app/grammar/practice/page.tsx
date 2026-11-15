import type { Metadata } from "next";
import { getGrammar } from "@/lib/content";
import { grammarQuestions } from "@/lib/grammarQuiz";
import { levelLabel, levelOf, libraryText } from "@/lib/library";
import { LevelTabs } from "../../LevelTabs";
import lv from "../../levels.module.css";
import { getLang } from "../../LangSwitch";
import { SiteBar, SiteFooter } from "../../SiteBar";
import s from "../grammar.module.css";
import { GrammarQuiz } from "./GrammarQuiz";

export async function generateMetadata(props: PageProps<"/grammar/practice">): Promise<Metadata> {
  const level = levelOf((await props.searchParams).level);
  const lang = await getLang();
  return { title: `${libraryText[lang].grammar.practiceTitle(levelLabel(level))} · Kotoba` };
}

export default async function GrammarPracticePage(props: PageProps<"/grammar/practice">) {
  const level = levelOf((await props.searchParams).level);
  const [lang, grammar] = await Promise.all([getLang(), getGrammar(level)]);
  const t = libraryText[lang].grammar;
  const questions = grammarQuestions(grammar);
  return (
    <>
      <SiteBar current="grammar" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.practiceTitle(levelLabel(level))}</h1>
          <p>{t.practiceLede(questions.length)}</p>
        </header>
        <LevelTabs path="/grammar/practice" level={level} lang={lang} />
        {questions.length === 0 ? <p className={lv.note}>{t.noQuestions}</p> : <GrammarQuiz key={level} questions={questions} lang={lang} />}
      </main>
      <SiteFooter />
    </>
  );
}
