import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE, dict, isLang, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "vi"; // no Accept-Language sniffing: Vietnamese is the default
}

export async function LangSwitch({ lang }: { lang: Lang }) {
  async function set(form: FormData) {
    "use server";
    const v = form.get("lang");
    (await cookies()).set(LANG_COOKIE, isLang(v) ? v : "vi", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    revalidatePath("/", "layout");
  }

  // A plain form, so the switch still works with JS off.
  return (
    <form action={set} className="langSwitch" role="group" aria-label={dict(lang).nav.lang}>
      {(["vi", "en"] as const).map((v) => (
        <button key={v} type="submit" name="lang" value={v} aria-pressed={lang === v}>
          {v.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
