import type { Metadata } from "next";
import { currentUser, testHistory } from "@/lib/auth";
import { getGrammar, getKana, getKanji, getTests, getVocab } from "@/lib/content";
import { goalScope, LEVELS } from "@/lib/library";
import { itemLinks } from "@/lib/weak";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { Progress } from "./Progress";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${(await getLang()) === "vi" ? "Tiến độ" : "Progress"} · Kotoba` };
}

// Phase 41g (AC-15). Guests see this browser's numbers; an account adds its mock test scores and exam plan.
export default async function ProgressPage() {
  const [lang, user, kana, kanji, vocab, grammar, tests] = await Promise.all([getLang(), currentUser(), getKana(), getKanji(), getVocab(), getGrammar(), getTests()]);
  const scores = user ? await testHistory() : [];
  const goal = user?.profile?.goal;
  const ids = (items: { id: string }[]) => items.map((i) => i.id);
  const all = [...kana.map((k) => ({ id: k.id, level: 5 })), ...kanji, ...vocab, ...grammar];
  return (
    <>
      <SiteBar current="progress" />
      <Progress
        lang={lang}
        profile={user?.profile ?? null}
        tests={tests.map((p) => ({ id: p.id, title: p.title[lang] }))}
        scores={scores}
        fronts={itemLinks(kana, kanji, vocab)}
        words={ids(vocab)}
        kanji={ids(kanji)}
        grammar={ids(grammar)}
        scope={[...ids(kana), ...ids(goalScope(kanji, goal)), ...ids(goalScope(vocab, goal))]}
        levels={LEVELS.map((level) => ({ level, ids: ids(all.filter((i) => i.level === level)) })).filter((l) => l.ids.length > 0)}
      />
      <SiteFooter />
    </>
  );
}
