import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Test files share one physical Postgres test DB (see tests/test-db.ts) and each
    // wipes all tables in beforeEach, so files must not run concurrently against it.
    fileParallelism: false,
    // Component tests opt into the DOM via a `@vitest-environment jsdom` docblock;
    // this setup file only extends `expect` and is harmless under the default node env.
    setupFiles: ["./tests/setup-dom.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
