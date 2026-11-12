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
export type ErrorCode = "email" | "password" | "name" | "goal" | "exam" | "minutes" | "current" | "credentials" | "rate" | "taken" | "token";
// What an action hands back to its form. Never carries the password.
export type FormState = {
  error?: ErrorCode;
  sent?: boolean;
  at?: number; // when it saved: keys the fading "Saved" line
  values: { email?: string; remember?: boolean; token?: string; name?: string; goal?: string; exam?: string; minutes?: string };
};

// The text inputs an error points at, by form field name, so the form can mark them aria-invalid.
// Radio groups (goal, minutes) and refusals that are no one field's fault (rate, token) mark nothing.
const ERROR_FIELDS: Record<ErrorCode, readonly string[]> = {
  email: ["email"], password: ["password"], name: ["name"], exam: ["exam"], current: ["current"],
  credentials: ["email", "password"], taken: ["email"], goal: [], minutes: [], rate: [], token: [],
};
export const isInvalidField = (error: ErrorCode | undefined, field: string): boolean =>
  error !== undefined && ERROR_FIELDS[error].includes(field);

// Only same-site paths: "//evil.com" and "/\evil.com" would leave the site.
export const safePath = (v: unknown) => (typeof v === "string" && /^\/(?![/\\])/.test(v) ? v : "/");

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

// The exam's calendar day as a day key, so days left can be counted against today() (study days).
export function examDay(exam: string): string | null {
  const d = examDate(exam);
  return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    current: "Mật khẩu hiện tại chưa đúng.",
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
  settings: {
    title: "Cài đặt",
    lede: (email: string) => `Tài khoản ${email}. Mỗi mục lưu riêng.`,
    profile: "Hồ sơ",
    name: "Tên hiển thị",
    save: "Lưu thay đổi",
    saved: "Đã lưu.",
    lang: "Ngôn ngữ",
    langNote: "Đổi ngay khi chọn.",
    password: "Mật khẩu",
    current: "Mật khẩu hiện tại",
    next: "Mật khẩu mới",
    change: "Đổi mật khẩu",
    changed: "Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.",
    data: "Dữ liệu",
    dataBody: "Tải về hồ sơ, lịch ôn của từng mục và nhật ký học của tài khoản này, dạng JSON. Tệp không chứa mật khẩu.",
    download: "Tải dữ liệu học (JSON)",
    remove: "Xóa tài khoản",
    removeBody: "Xóa vĩnh viễn tài khoản và tiến độ đã đồng bộ. Không hoàn tác được.",
    removeOpen: "Xóa tài khoản…",
    removeTitle: "Xóa tài khoản này?",
    removeAsk: "Nhập mật khẩu để xác nhận. Tiến độ trên máy này cũng bị xóa.",
    removeConfirm: "Xóa vĩnh viễn",
    cancel: "Hủy",
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
    current: "Your current password is wrong.",
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
  settings: {
    title: "Settings",
    lede: (email: string) => `Account ${email}. Each section saves on its own.`,
    profile: "Profile",
    name: "Display name",
    save: "Save changes",
    saved: "Saved.",
    lang: "Language",
    langNote: "Switches as soon as you pick.",
    password: "Password",
    current: "Current password",
    next: "New password",
    change: "Change password",
    changed: "Password changed. Other devices were logged out.",
    data: "Your data",
    dataBody: "Download this account's profile, the review schedule of every item and the study log, as JSON. The file holds no password.",
    download: "Download study data (JSON)",
    remove: "Delete account",
    removeBody: "Permanently deletes your account and synced progress. This can't be undone.",
    removeOpen: "Delete account…",
    removeTitle: "Delete this account?",
    removeAsk: "Enter your password to confirm. Progress on this device is deleted too.",
    removeConfirm: "Delete permanently",
    cancel: "Cancel",
  },
};

export const accountText: Record<Lang, typeof vi> = { vi, en };
