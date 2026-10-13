import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// The app's tsconfig uses `jsx: preserve` (Next.js convention); the React
// plugin transforms .tsx imports for the render tests. The `@/` alias mirrors
// tsconfig paths so components resolve their imports.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${resolve(process.cwd(), "src")}/` }],
  },
  test: {
    fileParallelism: false,
  },
});
