// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { ClientListResponse } from "@/lib/admin/types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/admin/compliance", () => ({ listClients: vi.fn() }));

import { listClients } from "@/lib/admin/compliance";
import { ClientsList } from "./clients-list";

const RESPONSE: ClientListResponse = {
  page: 1,
  pageSize: 20,
  total: 1,
  items: [
    {
      userId: "c1",
      companyName: "Exemplo Comércio Exterior Ltda",
      companyCnpj: "00000000000100",
      kybStatus: "APPROVED",
      reviewStatus: "NOT_STARTED",
      riskLevel: null,
      isPep: false,
      complianceGrandfathered: false,
      approvals: { approved: 0, required: null },
      updatedAt: "2026-10-27T12:12:00Z",
    },
  ],
};

function renderList() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <ClientsList />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => vi.mocked(listClients).mockReset());
afterEach(cleanup);

describe("ClientsList", () => {
  it("renders rows, with '—' approvals and 'Não iniciada' when risk is undefined", async () => {
    vi.mocked(listClients).mockResolvedValue(RESPONSE);
    renderList();
    // Desktop table + mobile cards both render in jsdom → match all.
    expect((await screen.findAllByText("Exemplo Comércio Exterior Ltda")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("00.000.000/0001-00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Não iniciada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the empty state", async () => {
    vi.mocked(listClients).mockResolvedValue({ ...RESPONSE, items: [], total: 0 });
    renderList();
    expect(await screen.findByText("Nenhum cliente em revisão")).toBeTruthy();
  });

  // The error state lives in clients-list.error.test.tsx — isolated there because
  // a rejected fetch interacts badly with the resolved fetches in this file.

  it("passes the PEP filter to the API", async () => {
    vi.mocked(listClients).mockResolvedValue(RESPONSE);
    renderList();
    await screen.findAllByText("Exemplo Comércio Exterior Ltda");
    fireEvent.click(screen.getByLabelText("Somente PEP"));
    await waitFor(() =>
      expect(
        vi.mocked(listClients).mock.calls.some(([p]) => p.pep === true),
      ).toBe(true),
    );
  });
});
