import type { Metadata, Viewport } from "next";
import { getLang } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import { Sync } from "./Sync";
import { Be_Vietnam_Pro, Dela_Gothic_One, Saira_Condensed, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// Neon sign lettering: carries Japanese + Vietnamese glyphs.
const sign = Dela_Gothic_One({ weight: "400", subsets: ["latin", "vietnamese"], variable: "--font-sign" });
// Tall condensed titles.
const title = Saira_Condensed({ weight: ["600", "700"], subsets: ["latin", "vietnamese"], variable: "--font-title" });
const body = Be_Vietnam_Pro({ weight: ["400", "500", "600"], subsets: ["latin", "vietnamese"], variable: "--font-body" });
// Study-legible kana; Japanese slices load by unicode-range, so no preload.
const kana = Zen_Kaku_Gothic_New({ weight: ["500", "700"], subsets: ["latin"], preload: false, variable: "--font-kana" });

export async function generateMetadata(): Promise<Metadata> {
  const t = dict(await getLang()).meta;
  return { title: t.rootTitle, description: t.rootDesc };
}

export const viewport: Viewport = { themeColor: "#050608", colorScheme: "dark" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // BE down: render the shell without Sync; the page's own call throws to app/error.tsx.
  const user = await currentUser().catch(() => undefined);
  return (
    <html lang={await getLang()} className={`${sign.variable} ${title.variable} ${body.variable} ${kana.variable}`}>
      <body>
        {children}
        {user !== undefined && <Sync uid={user?.email ?? null} />}
      </body>
    </html>
  );
}
