import { describe, it, expect, afterEach, vi } from "vitest";

// `env.ts` imports `server-only`, which throws outside a React Server
// environment (as in vitest/node). Neutralize it so the module can be loaded.
vi.mock("server-only", () => ({}));

async function loadServerEnv() {
  vi.resetModules();
  return (await import("./env")).serverEnv;
}

describe("serverEnv.backendApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses BACKEND_API_URL when set, stripping trailing slashes", async () => {
    vi.stubEnv("BACKEND_API_URL", "https://api.example.com///");
    const env = await loadServerEnv();
    expect(env.backendApiUrl).toBe("https://api.example.com");
  });

  it("falls back to http://localhost:3000 outside production when unset", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BACKEND_API_URL", undefined);
    const env = await loadServerEnv();
    expect(env.backendApiUrl).toBe("http://localhost:3000");
  });

  it("throws in production when BACKEND_API_URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_API_URL", undefined);
    await expect(loadServerEnv()).rejects.toThrow(/BACKEND_API_URL/);
  });

  it("throws in production when BACKEND_API_URL is blank", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_API_URL", "   ");
    await expect(loadServerEnv()).rejects.toThrow(/BACKEND_API_URL/);
  });
});
