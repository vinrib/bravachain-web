import { test, expect, type Page } from "@playwright/test";

/**
 * Web 14 — the Início mobile redesign must never scroll horizontally (the v2
 * defect cut off transaction values on the right). This drives the real page
 * in a mobile viewport and fails if any horizontal overflow appears. Every
 * backend call is mocked at the browser, so no real API/backend is required.
 */

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

const fixtures = {
  me: { id: "u1", email: "marcia@empresa.com.br", name: "Marcia Alves", kycStatus: "APPROVED" },
  kyc: { ready: true, localKycStatus: "APPROVED" },
  wallet: { userId: "u1", accounts: [{ id: "a1", currency: "BRL", balance: 43804.25 }] },
  accounts: {
    accounts: [
      { currency: "USD", accountNumber: "3123456789", bankName: "Example Bank" },
      { currency: "EUR", iban: "DE89370400440532013000", bankName: "Example Bank EU" },
    ],
    pendingCurrencies: [],
  },
  statement: {
    summary: { totalInbound: 1549346, totalWithdrawn: 0 },
    transactions: [
      { id: "t1", type: "INBOUND", status: "PROCESSING", description: "", amountBrl: 96420, amountForeign: 18000, foreignCurrency: "USD", counterparty: "Nordic Coffee AB", createdAt: now.toISOString() },
      { id: "t2", type: "INBOUND", status: "COMPLETED", description: "", amountBrl: 172510, amountForeign: 34000, foreignCurrency: "USD", counterparty: "Amazon Botanicals", createdAt: daysAgo(1) },
      // Deliberately long name + large value — the worst case for overflow.
      { id: "t3", type: "INBOUND", status: "COMPLETED", description: "", amountBrl: 1280416, amountForeign: 240000, foreignCurrency: "USD", counterparty: "Scandinavian Specialty Coffee Importers AB", createdAt: daysAgo(2) },
    ],
    pagination: { page: 1, limit: 5, total: 3 },
  },
};

async function mockBackend(page: Page) {
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ json: { isAdmin: false, userId: "u1" } }),
  );
  await page.route("**/api/backend/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/backend", "");
    if (path === "/auth/me") return route.fulfill({ json: fixtures.me });
    if (path === "/kyc/status") return route.fulfill({ json: fixtures.kyc });
    if (path === "/v1/wallet") return route.fulfill({ json: fixtures.wallet });
    if (path === "/v1/receive/accounts") return route.fulfill({ json: fixtures.accounts });
    if (path.startsWith("/v1/statement")) return route.fulfill({ json: fixtures.statement });
    if (path === "/v1/receive/pix-key") return route.fulfill({ json: { pixKey: null } });
    return route.fulfill({ json: {} });
  });
}

test.beforeEach(async ({ context }) => {
  // Session cookies the BFF would set; the middleware gates on their presence.
  await context.addCookies([
    { name: "bc_at", value: "mock-access-token", domain: "localhost", path: "/" },
    { name: "bc_rt", value: "mock-refresh-token", domain: "localhost", path: "/" },
  ]);
});

const probe = () => {
  const de = document.documentElement;
  const main = document.querySelector("main");
  const innerW = window.innerWidth;
  const clipsX = (cs: CSSStyleDeclaration) =>
    ["hidden", "auto", "scroll", "clip"].includes(cs.overflowX);

  // Any element that actually scrolls horizontally, other than the intended
  // accounts carousel.
  const badScrollers: string[] = [];
  for (const el of Array.from(document.querySelectorAll("main, main *"))) {
    const ox = getComputedStyle(el as Element).overflowX;
    if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 0.5) {
      const cls = el.getAttribute("class") || "";
      if (!cls.includes("snap-x")) badScrollers.push(cls.slice(0, 60));
    }
  }

  // Any element whose box exceeds the viewport and is NOT contained by a
  // clipping/scrolling ancestor — i.e. something that pushes the page wider.
  const offenders: string[] = [];
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right <= innerW + 0.5) continue;
    let contained = false;
    for (let p = el.parentElement; p && p !== de; p = p.parentElement) {
      if (clipsX(getComputedStyle(p))) {
        contained = true;
        break;
      }
    }
    if (!contained) offenders.push((el.getAttribute("class") || "").slice(0, 60));
  }

  return {
    docNoScroll: de.scrollWidth <= de.clientWidth,
    mainNoScroll: main ? main.scrollWidth <= main.clientWidth : true,
    badScrollers,
    offenders,
  };
};

for (const width of [360, 390, 430]) {
  test(`Início mobile has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockBackend(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const r = await page.evaluate(probe);
    expect(r.docNoScroll, "document must not scroll horizontally").toBe(true);
    expect(r.mainNoScroll, "<main> must not scroll horizontally").toBe(true);
    expect(r.badScrollers, "no horizontal scroller other than the accounts carousel").toEqual([]);
    expect(r.offenders, "no element may exceed the viewport outside a clipping ancestor").toEqual([]);
  });
}
