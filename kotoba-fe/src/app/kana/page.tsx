import type { Metadata } from "next";
import { isGroup, isScript } from "@/lib/kana";
import { getKanaSet } from "@/lib/content";
import { SiteBar, SiteFooter } from "../SiteBar";
import { KanaApp } from "./KanaApp";
import { getLang } from "../LangSwitch";
import { dict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = dict(await getLang()).meta;
  return { title: t.kanaTitle, description: t.kanaDesc };
}

export default async function KanaPage(props: PageProps<"/kana">) {
  const q = await props.searchParams;
  const script = isScript(q.script) ? q.script : "hiragana";
  const mode = q.mode === "quiz" ? "quiz" : "chart";
  const group = isGroup(q.group) ? q.group : "basic";
  const set = await getKanaSet(script, group);
  const lang = await getLang();

  return (
    <>
      <SiteBar current="kana" />
      <KanaApp key={`${script}-${group}-${mode}`} set={set} mode={mode} lang={lang} />
      <SiteFooter />
    </>
  );
}
