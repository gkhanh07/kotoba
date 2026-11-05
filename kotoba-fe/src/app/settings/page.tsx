import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteBar, SiteFooter } from "../SiteBar";
import { getLang } from "../LangSwitch";
import { accountText, jlptSessions } from "@/lib/account";
import { currentUser } from "@/lib/auth";
import { SettingsForms } from "./SettingsForms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].settings.title + " · Kotoba" };
}

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/settings");
  const [lang, p] = [await getLang(), user.profile];
  const sessions = jlptSessions(new Date(), 4);
  // A sitting already past stays selectable, so saving the name doesn't silently move the exam.
  if (p.exam && p.exam !== "unknown" && !sessions.some((x) => x.value === p.exam))
    sessions.unshift({ value: p.exam, label: `${p.exam.slice(5)}/${p.exam.slice(0, 4)}` });
  return (
    <>
      <SiteBar />
      <SettingsForms
        lang={lang}
        email={user.email}
        sessions={sessions}
        initial={{ name: p.name, goal: p.goal, exam: p.exam, minutes: p.minutes === undefined ? undefined : String(p.minutes) }}
      />
      <SiteFooter />
    </>
  );
}
