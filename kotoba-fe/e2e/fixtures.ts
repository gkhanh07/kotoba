// Shared E2E fixture (AGENTS.md §7.4): every test fails on console.error or an uncaught page error,
// and `axe` fails on serious/critical violations.
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";

type Fixtures = { pageErrors: string[]; axe: (page?: Page) => Promise<void> };

export const test = base.extend<Fixtures>({
  pageErrors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
      });
      page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
      await provide(errors);
      expect(errors, "console errors / page errors").toEqual([]);
    },
    { auto: true },
  ],
  axe: async ({ page }, provide) => {
    await provide(async (target = page) => {
      const { violations } = await new AxeBuilder({ page: target }).analyze();
      const blocking = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
      expect(blocking, "axe serious/critical violations").toEqual([]);
    });
  },
});

export { expect };
