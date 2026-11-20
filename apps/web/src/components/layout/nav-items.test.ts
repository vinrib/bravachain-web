import { describe, it, expect, vi } from "vitest";

// featureFlags is read when nav-items evaluates its array; drive it per case
// and re-import with a fresh module registry.
let flags: Record<string, boolean>;
vi.mock("@/lib/feature-flags", () => ({
  get featureFlags() {
    return flags;
  },
}));

async function loadNavItems(f: Record<string, boolean>) {
  flags = f;
  vi.resetModules();
  const mod = await import("./nav-items");
  return mod.navItems;
}

describe("navItems — Enviar gating (NEXT_PUBLIC_FEATURE_ENVIAR)", () => {
  it("hides 'Enviar' when the flag is off", async () => {
    const items = await loadNavItems({});
    expect(items.some((i) => i.href === "/enviar")).toBe(false);
  });

  it("shows 'Enviar' below 'Instruções de recebimento' and above 'Saque PIX' when on", async () => {
    const items = await loadNavItems({ recebimentos: true, enviar: true });
    const hrefs = items.map((i) => i.href);
    const instr = hrefs.indexOf("/instrucoes-de-recebimento");
    const enviar = hrefs.indexOf("/enviar");
    const saque = hrefs.indexOf("/saque");
    expect(enviar).toBeGreaterThan(-1);
    expect(instr).toBeGreaterThan(-1);
    expect(instr).toBeLessThan(enviar);
    expect(enviar).toBeLessThan(saque);
    expect(items.find((i) => i.href === "/enviar")?.label).toBe("Enviar");
  });
});
