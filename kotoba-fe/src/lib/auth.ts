// ponytail: auth giả. Cookie chứa email, không ký, nhận mọi mật khẩu. Khi kotoba-be có /auth
// thì thay thân các hàm này bằng gọi BE + token do BE cấp (chữ ký giữ nguyên). Không ship làm auth thật.
import { cookies } from "next/headers";
import { isEmail, parseProfile, type Goal, type Profile } from "./account";

const SESSION = "kotoba.session";
const PROFILE = "kotoba.profile"; // stands in for the user record the BE will hold
const DAY = 60 * 60 * 24;

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function currentUser(): Promise<{ email: string; profile: Profile | null } | null> {
  const jar = await cookies();
  const email = jar.get(SESSION)?.value;
  if (!isEmail(email)) return null;
  const profile = parseProfile(jar.get(PROFILE)?.value);
  return { email, profile: profile?.email === email ? profile : null };
}

// remember: 30-day cookie; otherwise a session cookie that dies with the browser.
export async function signIn(email: string, _password: string, remember: boolean) {
  const jar = await cookies();
  jar.set(SESSION, email, remember ? { ...base, maxAge: 30 * DAY } : base);
  const profile = parseProfile(jar.get(PROFILE)?.value);
  return { onboarded: profile?.email === email && profile.minutes !== undefined };
}

export async function signUp(email: string, _password: string, goal: Goal) {
  await saveProfile({ email, goal });
  (await cookies()).set(SESSION, email, base);
}

export async function saveProfile(profile: Profile) {
  (await cookies()).set(PROFILE, JSON.stringify(profile), { ...base, maxAge: 365 * DAY });
}

export async function signOut() {
  (await cookies()).delete(SESSION);
}
