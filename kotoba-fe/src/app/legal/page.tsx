import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getLang } from "../LangSwitch";
import type { Lang } from "@/lib/i18n";
import { SiteBar, SiteFooter } from "../SiteBar";
import s from "./legal.module.css";

const EDRDG = "https://www.edrdg.org/edrdg/licence.html";
const CC = "https://creativecommons.org/licenses/by-sa/4.0/";
const ext = (href: string, label: string) => <a href={href} rel="noopener">{label}</a>;

// Page-only copy, so it lives here rather than in lib/i18n.ts.
const TEXT: Record<Lang, { title: string; updated: string; sections: { id: string; title: string; body: ReactNode }[] }> = {
  vi: {
    title: "Điều khoản và quyền riêng tư",
    updated: "Cập nhật lần cuối: 11/2026",
    sections: [
      {
        id: "privacy",
        title: "Quyền riêng tư",
        body: (
          <>
            <p>Bạn không cần tài khoản để học. Khi chưa đăng nhập, tiến độ chỉ nằm trong trình duyệt của bạn (localStorage) và không gửi đi đâu.</p>
            <p>Nếu bạn tạo tài khoản, Kotoba lưu:</p>
            <ul>
              <li>email, dùng để đăng nhập và gửi link đặt lại mật khẩu;</li>
              <li>mật khẩu đã băm bằng scrypt, không bao giờ lưu bản gốc;</li>
              <li>hồ sơ bạn tự điền: tên, cấp độ mục tiêu, kỳ thi, số phút mỗi ngày;</li>
              <li>tiến độ học: thẻ nào ở hộp nào, đến hạn ôn ngày nào, và những ngày bạn có học.</li>
            </ul>
            <p>Có hai cookie: một cookie phiên đăng nhập (httpOnly, trang không đọc được bằng script) và một cookie nhớ ngôn ngữ. Không có quảng cáo, không có công cụ theo dõi của bên thứ ba.</p>
            <p>Bạn có thể tải toàn bộ dữ liệu học của tài khoản (hồ sơ, lịch ôn, nhật ký học) dưới dạng tệp JSON ở mục Dữ liệu trong Cài đặt. Tệp không chứa mật khẩu hay phiên đăng nhập.</p>
            <p>Xoá tài khoản trong Cài đặt sẽ xoá email, hồ sơ và toàn bộ tiến độ trên máy chủ, và xoá tiến độ trên thiết bị đang dùng.</p>
          </>
        ),
      },
      {
        id: "terms",
        title: "Điều khoản sử dụng",
        body: (
          <>
            <p>Kotoba là công cụ tự học miễn phí. Bạn dùng nó như hiện có, không kèm bảo đảm nào về kết quả thi.</p>
            <p>Phần lớn nghĩa tiếng Việt, câu ví dụ, bài ngữ pháp và đề thi thử do Kotoba tự soạn và chưa được người rà soát hết, nên có thể còn sai. Đề thi thử không có phần nghe và không phải đề JLPT chính thức.</p>
            <p>Mỗi người một tài khoản. Đừng dùng Kotoba để làm quá tải hay phá hoại hệ thống.</p>
          </>
        ),
      },
      {
        id: "sources",
        title: "Nguồn dữ liệu",
        body: (
          <>
            <p>Dữ liệu kanji (âm on, âm kun, âm Hán Việt, số nét) lấy từ KANJIDIC2. Âm đọc từ vựng được đối chiếu với JMdict. Cả hai thuộc Electronic Dictionary Research and Development Group (EDRDG), dùng theo {ext(EDRDG, "giấy phép của EDRDG")}.</p>
            <p>Danh sách kanji theo cấp N5 và N4 lấy từ trường JLPT của KANJIDIC2 (cùng giấy phép EDRDG ở trên). Danh sách N3 và N2 sẽ được ghi nguồn tại đây khi được thêm vào.</p>
            <p>Phần dữ liệu dẫn xuất từ hai nguồn này được chia sẻ lại theo cùng giấy phép {ext(CC, "Creative Commons BY-SA 4.0")}.</p>
          </>
        ),
      },
    ],
  },
  en: {
    title: "Terms and privacy",
    updated: "Last updated: November 2026",
    sections: [
      {
        id: "privacy",
        title: "Privacy",
        body: (
          <>
            <p>You don’t need an account to study. Signed out, your progress stays in your browser (localStorage) and is never sent anywhere.</p>
            <p>If you create an account, Kotoba stores:</p>
            <ul>
              <li>your email, used to sign in and to send password reset links;</li>
              <li>your password, hashed with scrypt; the original is never stored;</li>
              <li>the profile you fill in: name, goal level, exam sitting, minutes a day;</li>
              <li>your study progress: which box each card is in, when it’s due, and the days you studied.</li>
            </ul>
            <p>There are two cookies: a sign-in session cookie (httpOnly, so page scripts can’t read it) and one that remembers your language. No ads, no third-party trackers.</p>
            <p>You can download all of your account’s study data (profile, review schedule, study log) as a JSON file under Your data in Settings. The file holds no password or session.</p>
            <p>Deleting your account in Settings removes your email, profile and all progress from the server, and clears progress on the device you’re using.</p>
          </>
        ),
      },
      {
        id: "terms",
        title: "Terms of use",
        body: (
          <>
            <p>Kotoba is a free self-study tool, provided as is, with no promise about exam results.</p>
            <p>Most Vietnamese meanings, example sentences, grammar notes and practice tests were written for Kotoba and haven’t all been checked by a person yet, so some may be wrong. The practice test has no listening section and isn’t an official JLPT paper.</p>
            <p>One account per person. Don’t use Kotoba to overload or attack the service.</p>
          </>
        ),
      },
      {
        id: "sources",
        title: "Data sources",
        body: (
          <>
            <p>Kanji data (on and kun readings, Sino-Vietnamese readings, stroke counts) comes from KANJIDIC2. Vocabulary readings are checked against JMdict. Both belong to the Electronic Dictionary Research and Development Group (EDRDG) and are used under {ext(EDRDG, "the EDRDG licence")}.</p>
            <p>The N5 and N4 kanji lists come from the JLPT field of KANJIDIC2 (same EDRDG licence as above). The N3 and N2 lists will be credited here when they are added.</p>
            <p>Data derived from them is shared under the same {ext(CC, "Creative Commons BY-SA 4.0")} licence.</p>
          </>
        ),
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: TEXT[await getLang()].title + " · Kotoba" };
}

export default async function LegalPage() {
  const t = TEXT[await getLang()];
  return (
    <>
      <SiteBar />
      <main className={s.legal}>
        <h1>{t.title}</h1>
        <p className={s.updated}>{t.updated}</p>
        <nav aria-label={t.title}>
          <ul className={s.toc}>
            {t.sections.map((x) => (
              <li key={x.id}><a href={`#${x.id}`}>{x.title}</a></li>
            ))}
          </ul>
        </nav>
        {t.sections.map((x) => (
          <section key={x.id} id={x.id} aria-labelledby={`${x.id}-h`}>
            <h2 id={`${x.id}-h`}>{x.title}</h2>
            {x.body}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
