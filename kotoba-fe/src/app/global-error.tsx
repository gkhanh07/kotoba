"use client";
import { clientLang, dict } from "@/lib/i18n";
import "./globals.css";

// Replaces the root layout when it throws, so it brings its own document (fonts fall back).
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const lang = clientLang();
  const t = dict(lang).down;
  return (
    <html lang={lang}>
      <body>
        <title>{t.title}</title>
        <main className="statusPage">
          <div role="alert">
            <h1>{t.title}</h1>
            <p>{t.body}</p>
          </div>
          <button type="button" className="btn" onClick={() => retry()}>{t.retry}</button>
        </main>
      </body>
    </html>
  );
}
