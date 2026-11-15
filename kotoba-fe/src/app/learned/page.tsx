import type { Metadata } from "next";
import { getGrammar, getKana, getKanji, getVocab } from "@/lib/content";
import { itemLinks } from "@/lib/weak";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { LearnedApp, type Row } from "./LearnedApp";
import { learnedText } from "./text";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${learnedText[await getLang()].title} · Kotoba` };
}

// Phase 40i (AC-15): what this browser has studied, by stage, with a reset per item or per deck.
// The cards live in the browser, so the server only sends each item's front and link.
export default async function LearnedPage() {
  const [lang, kana, kanji, vocab, grammar] = await Promise.all([getLang(), getKana(), getKanji(), getVocab(), getGrammar()]);
  // Meanings tell homophones apart (はし 箸 and はし 橋), on screen and in each reset button's name.
  const links: Record<string, Row> = itemLinks(kana, kanji, vocab);
  for (const w of vocab) links[w.id] = { ...links[w.id], sub: w[lang] };
  for (const g of grammar) links[g.id] = { front: g.pattern, href: `/grammar/${g.slug}`, sub: g.title[lang] };
  return (
    <>
      <SiteBar current="review" />
      <LearnedApp links={links} lang={lang} />
      <SiteFooter />
    </>
  );
}
