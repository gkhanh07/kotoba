import { cookies } from "next/headers";
import { LANG_COOKIE, ROMAJI_COOKIE, dict, isLang, type Lang } from "@/lib/i18n";
import { setLang, setRomaji } from "./(auth)/actions";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "vi"; // no Accept-Language sniffing: Vietnamese is the default
}

export async function getRomaji(): Promise<boolean> {
  return (await cookies()).get(ROMAJI_COOKIE)?.value !== "off";
}

// Phase 40c: one toggle button; the name stays "Romaji" and aria-pressed carries the state (as the Save button).
export function RomajiSwitch({ on, className = "btn btnGhost" }: { on: boolean; className?: string }) {
  return (
    <form action={setRomaji}>
      <button type="submit" name="romaji" value={on ? "off" : "on"} aria-pressed={on} className={className}>Romaji</button>
    </form>
  );
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
