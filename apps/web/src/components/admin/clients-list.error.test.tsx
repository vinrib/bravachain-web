// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/admin/compliance", () => ({ listClients: vi.fn() }));

import { listClients } from "@/lib/admin/compliance";
import { ClientsList } from "./clients-list";

afterEach(cleanup);

describe("ClientsList error state", () => {
  it("shows the error state when the fetch fails", async () => {
    vi.mocked(listClients).mockRejectedValue(new Error("boom"));
    render(
      <NextIntlClientProvider locale="pt" messages={ptMessages}>
        <ClientsList />
      </NextIntlClientProvider>,
    );
    expect(
      await screen.findByText("Não foi possível carregar. Tente novamente."),
    ).toBeTruthy();
    await new Promise((r) => setTimeout(r, 0));
  });
});
