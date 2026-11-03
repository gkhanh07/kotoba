import type { Metadata } from "next";
import { getLessons, getVocab } from "@/lib/content";
import { notFound } from "next/navigation";
import { DECKS_PER_PAGE } from "@/config/library";
import { levelLabel, levelOf, libraryText, pageOf } from "@/lib/library";
import { LevelTabs } from "../LevelTabs";
import { Pager } from "../Pager";
import lv from "../levels.module.css";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { Decks } from "./Decks";
import s from "./vocab.module.css";

export async function generateMetadata(props: PageProps<"/vocab">): Promise<Metadata> {
  const t = libraryText[await getLang()].vocab;
  return { title: `${t.title(levelLabel(levelOf((await props.searchParams).level)))} · Kotoba`, description: t.lede };
}

export default async function VocabPage(props: PageProps<"/vocab">) {
  const q = await props.searchParams;
  const level = levelOf(q.level);
  const page = pageOf(q.page);
  const [lang, vocab, lessons] = await Promise.all([getLang(), getVocab(`?level=${level}`), getLessons(level)]);
  const t = libraryText[lang].vocab;
  const decks = lessons
    .map((l) => ({ lesson: l.lesson, title: l.title[lang], ids: vocab.filter((v) => v.lesson === l.lesson).map((v) => v.id) }))
    .filter((d) => d.ids.length);
  const pages = Math.max(1, Math.ceil(decks.length / DECKS_PER_PAGE));
  if (page > pages) notFound();
  return (
    <>
      <SiteBar current="vocab" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title(levelLabel(level))}</h1>
          <p>{t.lede}</p>
        </header>
        <LevelTabs path="/vocab" level={level} lang={lang} />
        {decks.length === 0 ? <p className={lv.note}>{libraryText[lang].levels.empty(levelLabel(level))}</p> : (
          <>
            <Decks decks={decks} from={(page - 1) * DECKS_PER_PAGE} to={page * DECKS_PER_PAGE} lang={lang} />
            <Pager path="/vocab" params={{ level }} page={page} pages={pages} lang={lang} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
