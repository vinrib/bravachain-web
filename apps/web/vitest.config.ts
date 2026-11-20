import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// tsconfigPaths resolves the `@/*` alias from tsconfig; the React plugin
// transforms .tsx imports for the render tests. Pure .ts tests are unaffected.
// `e2e/**` holds Playwright specs (run via `pnpm test:e2e`, not vitest).
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    fileParallelism: false,
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
