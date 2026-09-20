import type { Metadata } from "next";
import { getKanaSet, isScript } from "@/lib/kana";
import { SiteBar } from "../SiteBar";
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
  const set = await getKanaSet(script);
  const lang = await getLang();

  return (
    <>
      <SiteBar current={mode} />
      <KanaApp key={`${script}-${mode}`} set={set} mode={mode} lang={lang} />
    </>
  );
}
