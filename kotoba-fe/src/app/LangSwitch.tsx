import { cookies } from "next/headers";
import { LANG_COOKIE, dict, isLang, type Lang } from "@/lib/i18n";
import { setLang } from "./(auth)/actions";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "vi"; // no Accept-Language sniffing: Vietnamese is the default
}

export async function LangSwitch({ lang }: { lang: Lang }) {
  // A plain form, so the switch still works with JS off.
  return (
    <form action={setLang} className="langSwitch" role="group" aria-label={dict(lang).nav.lang}>
      {(["vi", "en"] as const).map((v) => (
        <button key={v} type="submit" name="lang" value={v} aria-pressed={lang === v}>
          {v.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
