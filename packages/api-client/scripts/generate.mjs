// Generates the typed OpenAPI schema for @bravachain/api-client.
//
// Usage:
//   OPENAPI_URL=https://.../openapi.json pnpm --filter @bravachain/api-client generate
//   # or from the repo root:
//   OPENAPI_URL=https://.../openapi.json pnpm generate:api
//
// The URL can also be set in packages/api-client/.env (OPENAPI_URL=...).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

// Allow a local .env override so the URL doesn't have to live in the shell.
const envPath = resolve(pkgRoot, ".env");
if (!process.env.OPENAPI_URL && existsSync(envPath)) {
  const match = readFileSync(envPath, "utf8").match(/^OPENAPI_URL=(.+)$/m);
  if (match) process.env.OPENAPI_URL = match[1].trim();
}

// Swagger is disabled in production, so the default source is the committed
// local spec (regenerated from the backend via its scripts/generate-openapi.ts).
// Override with OPENAPI_URL to point at a live doc or a different file.
const localSpec = resolve(pkgRoot, "openapi.json");
const source =
  process.env.OPENAPI_URL ?? (existsSync(localSpec) ? localSpec : undefined);
if (!source) {
  console.error(
    "\n[api-client] No OpenAPI source found.\n" +
      "Provide OPENAPI_URL, or place the spec at packages/api-client/openapi.json.\n" +
      "Regenerate the spec from the backend with:\n" +
      "  (in bravachain-api) npx ts-node -r tsconfig-paths/register scripts/generate-openapi.ts\n",
  );
  process.exit(1);
}

const out = resolve(pkgRoot, "src/generated/schema.ts");
console.log(`[api-client] Generating types from ${source} -> ${out}`);

execFileSync(
  process.execPath,
  [
    resolve(pkgRoot, "node_modules/openapi-typescript/bin/cli.js"),
    source,
    "--output",
    out,
    "--root-types",
  ],
  { stdio: "inherit", cwd: pkgRoot },
);

console.log("[api-client] Done. Review the diff and commit src/generated/schema.ts.");
