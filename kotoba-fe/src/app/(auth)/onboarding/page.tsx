import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "../../LangSwitch";
import { accountText, jlptSessions } from "@/lib/account";
import { currentUser } from "@/lib/auth";
import { OnboardingForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].onboarding.title + " · Kotoba" };
}

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const p = user.profile;
  return (
    <OnboardingForm
      lang={await getLang()}
      sessions={jlptSessions(new Date(), 4)}
      initial={{ name: p?.name, goal: p?.goal, exam: p?.exam, minutes: p?.minutes === undefined ? undefined : String(p.minutes) }}
    />
  );
}
