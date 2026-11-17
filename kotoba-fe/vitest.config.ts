import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves the "@/*" alias from tsconfig.json itself.
  // "server-only" ships inside Next only; the empty build lets unit tests import server modules.
  resolve: { tsconfigPaths: true, alias: { "server-only": "next/dist/compiled/server-only/empty.js" } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["src/lib/**/*.test.{ts,tsx}"],
      reporter: ["text", "text-summary"],
      // Hard gate (AGENTS.md §10): never lower these.
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
