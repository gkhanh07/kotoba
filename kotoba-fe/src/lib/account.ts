// Account types, validation and UI text. Plain module, no next/headers: server actions
// (trust boundary) and client forms both import it, like flashcards.ts.
import type { Lang } from "./i18n";

export const GOALS = ["N5", "N4", "N3", "N2", "N1"] as const;
export const MINUTES = [10, 15, 30, 60] as const;
export const PASSWORD_MIN = 8;

export type Goal = (typeof GOALS)[number];
export type Minutes = (typeof MINUTES)[number];
export type Profile = { email: string; name?: string; goal?: Goal; exam?: string; minutes?: Minutes };

// Field problems caught here, plus refusals only the BE can give.
export type ErrorCode = "email" | "password" | "name" | "goal" | "exam" | "minutes" | "credentials" | "rate" | "taken" | "token";
// What an action hands back to its form. Never carries the password.
export type FormState = {
  error?: ErrorCode;
  sent?: boolean;
  values: { email?: string; remember?: boolean; token?: string; name?: string; goal?: string; exam?: string; minutes?: string };
};

export const isEmail = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isGoal = (v: unknown): v is Goal => (GOALS as readonly unknown[]).includes(v);
export const isMinutes = (v: unknown): v is Minutes => (MINUTES as readonly unknown[]).includes(v);
// "2027-07" (a July/December sitting) or "unknown".
export const isExam = (v: unknown): v is string =>
  v === "unknown" || (typeof v === "string" && /^\d{4}-(07|12)$/.test(v));
// Display name: trimmed, 1–40 chars. React escapes it on render.
export const isName = (v: unknown): v is string =>
  typeof v === "string" && v.length >= 1 && v.length <= 40 && v.trim() === v;

// The next n JLPT sittings. JLPT runs on a Sunday in the first week of July and December;
// the 7th is the latest that Sunday can fall on.
// ponytail: cut-off at the 7th, not the real Sunday. Swap in the official dates if a sitting must flip on the exact day.
export function jlptSessions(now: Date, n: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let y = now.getFullYear(); out.length < n; y++) {
    for (const m of [7, 12]) {
      if (out.length < n && new Date(y, m - 1, 7) >= now) {
        const mm = String(m).padStart(2, "0");
        out.push({ value: `${y}-${mm}`, label: `${mm}/${y}` });
      }
    }
  }
  return out;
}

// Exam day for an isExam value: the first Sunday of that month; null for "unknown".
// ponytail: first-Sunday rule, not the official calendar. Swap in published dates if they ever differ.
export function examDate(exam: string): Date | null {
  const m = /^(\d{4})-(07|12)$/.exec(exam);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  d.setDate(1 + ((7 - d.getDay()) % 7));
  return d;
}

const vi = {
  email: "Email",
  password: "Mật khẩu",
  pending: "Đang xử lý…",
  google: "Google · sắp có",
  errors: {
    email: "Email chưa đúng định dạng.",
    password: `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`,
    name: "Tên dài 1–40 ký tự.",
    goal: "Hãy chọn một mục tiêu.",
    exam: "Kỳ thi chưa hợp lệ.",
    minutes: "Hãy chọn số phút mỗi ngày.",
    credentials: "Email hoặc mật khẩu chưa đúng.",
    rate: "Thử quá nhiều lần. Hãy đợi một lúc rồi thử lại.",
    taken: "Email này đã có tài khoản. Hãy đăng nhập.",
    token: "Link đã hết hạn hoặc đã được dùng. Hãy gửi link mới.",
  } satisfies Record<ErrorCode, string>,
  login: {
    title: "Đăng nhập",
    lede: "Không bắt buộc. Bạn vẫn luyện tập được mà không cần tài khoản.",
    remember: "Ghi nhớ đăng nhập",
    submit: "Đăng nhập",
    forgot: "Quên mật khẩu?",
    register: "Tạo tài khoản",
  },
  register: {
    title: "Tạo tài khoản",
    lede: "Chọn mục tiêu để Kotoba biết bạn đang hướng tới đâu.",
    goal: "Mục tiêu JLPT",
    submit: "Tạo tài khoản",
    login: "Đã có tài khoản?",
  },
  forgot: {
    title: "Quên mật khẩu",
    lede: "Nhập email, chúng tôi sẽ gửi link đặt lại mật khẩu.",
    submit: "Gửi link",
    sent: "Nếu email này có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.",
    sentNote: "Link có hạn 30 phút. Bản chạy thử chưa gửi email: link được in ra log của máy chủ.",
    back: "Về đăng nhập",
  },
  reset: {
    title: "Đặt mật khẩu mới",
    lede: "Mật khẩu mới thay mật khẩu cũ và đăng xuất mọi thiết bị.",
    password: "Mật khẩu mới",
    submit: "Lưu mật khẩu",
    done: "Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.",
    login: "Đăng nhập",
    again: "Gửi link mới",
  },
  onboarding: {
    title: "Vài câu hỏi nhanh",
    lede: "Để gợi ý nhịp học vừa sức. Đổi lại được sau.",
    name: "Tên của bạn (không bắt buộc)",
    goal: "Mục tiêu của bạn?",
    exam: "Ngày thi dự kiến?",
    examUnknown: "Chưa biết",
    minutes: "Bạn muốn học bao nhiêu phút mỗi ngày?",
    minutesUnit: (n: number) => `${n} phút`,
    submit: "Lưu",
    skip: "Để sau",
  },
};

const en: typeof vi = {
  email: "Email",
  password: "Password",
  pending: "Working…",
  google: "Google · coming soon",
  errors: {
    email: "That email doesn't look right.",
    password: `Password needs at least ${PASSWORD_MIN} characters.`,
    name: "Name must be 1–40 characters.",
    goal: "Pick a goal.",
    exam: "That exam date isn't valid.",
    minutes: "Pick how many minutes a day.",
    credentials: "Wrong email or password.",
    rate: "Too many attempts. Wait a while and try again.",
    taken: "This email already has an account. Log in instead.",
    token: "This link has expired or was already used. Send a new one.",
  },
  login: {
    title: "Log in",
    lede: "Optional. You can practise without an account.",
    remember: "Remember me",
    submit: "Log in",
    forgot: "Forgot password?",
    register: "Create an account",
  },
  register: {
    title: "Create an account",
    lede: "Pick a goal so Kotoba knows where you're heading.",
    goal: "JLPT goal",
    submit: "Create account",
    login: "Already have an account?",
  },
  forgot: {
    title: "Forgot password",
    lede: "Enter your email and we'll send a reset link.",
    submit: "Send link",
    sent: "If this email has an account, we've sent a reset link.",
    sentNote: "The link lasts 30 minutes. This test build sends no email: the link is printed to the server log.",
    back: "Back to log in",
  },
  reset: {
    title: "Set a new password",
    lede: "The new password replaces the old one and logs out every device.",
    password: "New password",
    submit: "Save password",
    done: "Password changed. Log in again with the new one.",
    login: "Log in",
    again: "Send a new link",
  },
  onboarding: {
    title: "A few quick questions",
    lede: "So we can suggest a pace that fits. You can change it later.",
    name: "Your name (optional)",
    goal: "Your goal?",
    exam: "Planned exam date?",
    examUnknown: "Not sure yet",
    minutes: "How many minutes a day do you want to study?",
    minutesUnit: (n: number) => `${n} min`,
    submit: "Save",
    skip: "Later",
  },
};

export const accountText: Record<Lang, typeof vi> = { vi, en };
