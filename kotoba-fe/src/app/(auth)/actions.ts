"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { changePassword, currentUser, deleteAccount, pushProgress, requestReset, resetPassword, saveProfile, signIn, signOut, signUp } from "@/lib/auth";
import { isLang, LANG_COOKIE } from "@/lib/i18n";
import { isEmail, isExam, isGoal, isMinutes, isName, PASSWORD_MIN, safePath, type FormState } from "@/lib/account";

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

// Native input attributes catch most mistakes first; these re-check on the server, and the BE checks again.
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const remember = form.get("remember") === "on";
  const values = { email, remember };
  if (!isEmail(email)) return { error: "email", values };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  const r = await signIn(email, password, remember);
  if ("error" in r) return { error: r.error, values };
  redirect(r.onboarded ? safePath(text(form, "next")) : "/onboarding");
}

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const goal = text(form, "goal");
  const values = { email, goal };
  if (!isEmail(email)) return { error: "email", values };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  if (!isGoal(goal)) return { error: "goal", values };
  const { error } = await signUp(email, password, goal);
  if (error) return { error, values };
  redirect("/onboarding");
}

export async function forgot(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  if (!isEmail(email)) return { error: "email", values: { email } };
  await requestReset(email);
  return { sent: true, values: { email } };
}

export async function reset(_prev: FormState, form: FormData): Promise<FormState> {
  const token = text(form, "token");
  const password = text(form, "password");
  const values = { token };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  const { error } = await resetPassword(token, password);
  if (error) return { error, values };
  return { sent: true, values: {} };
}

// Validates and saves the profile fields; null when saved.
async function profileFrom(form: FormData): Promise<FormState | null> {
  const name = text(form, "name").trim();
  const goal = text(form, "goal");
  const exam = text(form, "exam");
  const minutes = Number(text(form, "minutes"));
  const values = { name, goal, exam, minutes: text(form, "minutes") };
  if (name && !isName(name)) return { error: "name", values };
  if (!isGoal(goal)) return { error: "goal", values };
  if (!isExam(exam)) return { error: "exam", values };
  if (!isMinutes(minutes)) return { error: "minutes", values };
  await saveProfile({ name: name || null, goal, exam, minutes });
  return null;
}

export async function saveOnboarding(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await currentUser())) redirect("/login");
  const r = await profileFrom(form);
  if (r) return r;
  redirect("/");
}

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await currentUser())) redirect("/login?next=/settings");
  const r = await profileFrom(form);
  if (r) return r;
  revalidatePath("/", "layout");
  const values = { name: text(form, "name").trim(), goal: text(form, "goal"), exam: text(form, "exam"), minutes: text(form, "minutes") };
  return { sent: true, at: Date.now(), values };
}

export async function newPassword(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await currentUser())) redirect("/login?next=/settings");
  const current = text(form, "current");
  const password = text(form, "password");
  if (!current || current.length > 200) return { error: "current", values: {} };
  if (password.length < PASSWORD_MIN || password.length > 200) return { error: "password", values: {} };
  const { error } = await changePassword(current, password);
  if (error) return { error: "current", values: {} };
  return { sent: true, at: Date.now(), values: {} };
}

// No redirect: the client wipes local progress first, then leaves (SettingsForms Remove).
export async function removeAccount(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await currentUser())) redirect("/login?next=/settings");
  const password = text(form, "password");
  if (!password || password.length > 200) return { error: "current", values: {} };
  const { error } = await deleteAccount(password);
  if (error) return { error: "current", values: {} };
  return { sent: true, values: {} };
}

export async function setLang(form: FormData) {
  const v = form.get("lang");
  (await cookies()).set(LANG_COOKIE, isLang(v) ? v : "vi", { path: "/", maxAge: 31536000, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function logout() {
  await signOut();
  redirect("/");
}

// Called by Sync.tsx; the BE validates the push. A failed push (kotoba-be down) comes back as { failed: true }
// instead of a thrown error, so the browser gets a normal response, not a 500, and Sync shows "Lỗi đồng bộ".
export async function syncProgress(push: Parameters<typeof pushProgress>[0]) {
  try {
    return { failed: false as const, remote: await pushProgress(push) };
  } catch (e) {
    console.error("sync push failed", e);
    return { failed: true as const };
  }
}
