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

// Direction contract, emitted as an HTML comment so it survives into the build.
const CONTRACT = `<!--
seed 6ba472bc · form: light-shadow-caustics-rain-night-cityscape
THESIS: Learn to read the city — kana glowing on Tokyo shop signs in the rain, read in Vietnamese.
OWN-WORLD: blue-hour street, neon sign lettering, wet-asphalt reflections, train-line light; amber is the one action colour.
STORY: see a sign, tap it, read it; then learn the kana behind every sign and drill until they are truly remembered.
FIRST VIEWPORT: rain over a skyline; real signs (ラーメン, カラオケ…) mirrored in the street; tapping one breaks it into kana with Vietnamese meaning; one framed amber action.
FORM: phones unroll skyline, street and reflection into bands; answered quiz cards lock like a triggered trace; each reading keeps its ticket.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export async function generateMetadata(): Promise<Metadata> {
  const t = dict(await getLang()).meta;
  return { title: t.rootTitle, description: t.rootDesc };
}

export const viewport: Viewport = { themeColor: "#050608", colorScheme: "dark" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();
  return (
    <html lang={await getLang()} className={`${sign.variable} ${title.variable} ${body.variable} ${kana.variable}`}>
      <body>
        <template dangerouslySetInnerHTML={{ __html: CONTRACT }} />
        {children}
        <Sync uid={user?.email ?? null} />
      </body>
    </html>
  );
}
