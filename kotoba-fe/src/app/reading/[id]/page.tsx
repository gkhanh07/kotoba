import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReading } from "@/lib/content";
import { levelLabel } from "@/lib/library";
import { testText } from "@/lib/testText";
import { getLang } from "../../LangSwitch";
import { SiteBar, SiteFooter } from "../../SiteBar";
import { Passage } from "../../test/QuestionText";
import s from "../../test/test.module.css";
import { ReadingQuiz } from "./ReadingQuiz";

export async function generateMetadata(props: PageProps<"/reading/[id]">): Promise<Metadata> {
  const [lang, { id }] = await Promise.all([getLang(), props.params]);
  const r = await getReading(id);
  if (!r) notFound();
  return { title: `${r.title[lang]} · ${testText[lang].reading.title} · Kotoba` };
}

export default async function ReadingPage(props: PageProps<"/reading/[id]">) {
  const [lang, { id }] = await Promise.all([getLang(), props.params]);
  const r = await getReading(id);
  if (!r) notFound();
  const t = testText[lang].reading;
  return (
    <>
      <SiteBar current="test" />
      <main className={s.app}>
        <Link href={`/reading?level=${r.level}`} className={s.back}>← {t.back}</Link>
        <h1 className={s.title}>{r.title[lang]}</h1>
        <p className={s.note}>
          {levelLabel(r.level)} · {r.paper ? <Link href={`/test/${r.paper}`} className={s.textLink}>{t.openPaper}</Link> : t.practice}
        </p>
        <section className={s.card} aria-label={testText[lang].passage}>
          <Passage text={r.passage} />
        </section>
        <ReadingQuiz key={r.id} questions={r.questions} lang={lang} />
      </main>
      <SiteFooter />
    </>
  );
}
