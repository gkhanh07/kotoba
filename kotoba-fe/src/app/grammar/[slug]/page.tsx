import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGrammar } from "@/lib/content";
import { libraryText } from "@/lib/library";
import { getLang } from "../../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../../SiteBar";
import { Speak } from "../../Speak";
import s from "../grammar.module.css";

// The whole list is one cached request and gives prev/next for free, so detail reads from it.
async function find(slug: string) {
  const all = await getGrammar();
  const i = all.findIndex((g) => g.slug === slug);
  if (i < 0) return null;
  const g = all[i];
  return { g, prev: all[i - 1], next: all[i + 1], sameLesson: all.filter((x) => x.lesson === g.lesson && x.slug !== slug) };
}

export async function generateMetadata(props: PageProps<"/grammar/[slug]">): Promise<Metadata> {
  const [lang, hit] = await Promise.all([getLang(), props.params.then((p) => find(p.slug))]);
  if (!hit) notFound();
  return { title: `${hit.g.pattern} · Kotoba`, description: hit.g.explain[lang] };
}

export default async function GrammarDetailPage(props: PageProps<"/grammar/[slug]">) {
  const { slug } = await props.params;
  const [lang, hit] = await Promise.all([getLang(), find(slug)]);
  if (!hit) notFound();
  const { g, prev, next, sameLesson } = hit;
  const t = libraryText[lang].grammar;
  return (
    <>
      <SiteBar current="grammar" />
      <main className={`${s.app} ${s.detail}`}>
        <Link href="/grammar" className={s.back}><Arrow back />{t.back}</Link>
        <header className={s.heading}>
          <h1 lang="ja">{g.pattern}</h1>
          <p>{t.lesson(g.lesson)} · {g.title[lang]}</p>
        </header>
        <div className={s.columns}>
        <article className={s.body}>
        <section className={s.section} aria-labelledby="g-structure">
          <h2 id="g-structure">{t.structure}</h2>
          <p lang="ja" className={s.structure}>{g.structure}</p>
        </section>
        <section className={s.section} aria-labelledby="g-explain">
          <h2 id="g-explain">{t.explain}</h2>
          <p className={s.prose}>{g.explain[lang]}</p>
        </section>
        <section className={s.section} aria-labelledby="g-examples">
          <h2 id="g-examples">{t.examples}</h2>
          <ul className={s.examples}>
            {g.examples.map((ex) => (
              <li key={ex.ja} className="panel">
                <p className={s.ja}><span lang="ja">{ex.ja}</span><Speak text={ex.ja} label={t.speak} /></p>
                <p className={s.tr}>{ex[lang]}</p>
              </li>
            ))}
          </ul>
        </section>
        {g.note && (
          <section className={s.section} aria-labelledby="g-note">
            <h2 id="g-note">{t.note}</h2>
            <p className={s.prose}>{g.note[lang]}</p>
          </section>
        )}
        </article>
        <aside className={`panel ${s.side}`} aria-label={t.side}>
          {sameLesson.length > 0 && (
            <>
            <h2>{t.sameLesson(g.lesson)}</h2>
            <ul className={s.sameList}>
              {sameLesson.map((x) => (
                <li key={x.id}>
                  <Link href={`/grammar/${x.slug}`}><span lang="ja" className={s.pattern}>{x.pattern}</span><span className={s.meaning}>{x.title[lang]}</span></Link>
                </li>
              ))}
            </ul>
            </>
          )}
          <Link href={`/lessons/${g.lesson}`} className="btn">{t.study(g.lesson)} <Arrow /></Link>
        </aside>
        </div>
        <nav className={s.pager} aria-label={t.back}>
          {prev && <Link href={`/grammar/${prev.slug}`} rel="prev"><Arrow back /><span className="sr-only">{t.prev}: </span><span lang="ja">{prev.pattern}</span></Link>}
          {next && <Link href={`/grammar/${next.slug}`} rel="next"><span className="sr-only">{t.next}: </span><span lang="ja">{next.pattern}</span><Arrow /></Link>}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
