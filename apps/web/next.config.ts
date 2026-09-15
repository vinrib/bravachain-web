import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the workspace root to this monorepo. Without it, Next can misdetect the
// root when unrelated lockfiles exist higher up the filesystem.
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Workspace packages ship TypeScript source; Next transpiles them here.
  transpilePackages: ["@bravachain/shared", "@bravachain/api-client"],
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
