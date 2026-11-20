// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Enviar flag on, Receber off → the balance card shows an "Enviar" button
// linking to /enviar, next to the other balance actions.
vi.mock("@/lib/feature-flags", () => ({
  featureFlags: { recebimentos: false, enviar: true },
}));

vi.mock("@/lib/hooks", () => ({
  useBalance: () => ({
    data: { available: 1000, currency: "BRL" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useMe: () => ({
    data: { name: "ACME LTDA", email: "acme@empresa.com" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

import { WelcomeBalanceCard } from "./welcome-balance-card";

afterEach(cleanup);

describe("WelcomeBalanceCard — Enviar button", () => {
  it("shows 'Enviar' linking to /enviar when the flag is on", () => {
    render(<WelcomeBalanceCard />);
    const enviar = screen.getByRole("link", { name: "Enviar" });
    expect(enviar.getAttribute("href")).toBe("/enviar");
  });

  it("does not show 'Receber' when that flag is off", () => {
    render(<WelcomeBalanceCard />);
    expect(screen.queryByRole("link", { name: "Receber" })).toBeNull();
  });
});
