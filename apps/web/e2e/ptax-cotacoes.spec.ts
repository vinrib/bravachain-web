import * as fs from "node:fs";
import * as path from "node:path";
import { test, expect, type Page } from "@playwright/test";

/**
 * E2E rendering matrix for `/cotacoes` (Etapa 3 — PTAX):
 * - Intercepts `/api/backend/v1/ptax/**` with `page.route` returning REAL captured API fixtures.
 * - Uses the existing session cookie pattern (`bc_at`/`bc_rt`) — zero auth bypass in app code.
 * - Verifies 5 periods x 2 currencies x 2 viewports (390 & 1280) = 20 combinations render
 *   a visible Recharts SVG `<path>` with non-empty `d` and bounding-box area > 0.
 * - Verifies calculator, 404 `feature_disabled` auto-hide, and empty / error / 1-point states.
 */

const FIXTURES_DIR = path.join(__dirname, "../src/lib/ptax/__fixtures__");

function loadFixture<T = Record<string, unknown>>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(FIXTURES_DIR, filename), "utf8"),
  ) as T;
}

const fixtures = {
  me: {
    id: "u1",
    email: "marcia@empresa.com.br",
    name: "Marcia Alves",
    kycStatus: "APPROVED",
  },
  kyc: { ready: true, localKycStatus: "APPROVED" },
  latest: loadFixture("latest.json"),
  history: {
    USD: {
      "1D": loadFixture("history-USD-1D.json"),
      "1W": loadFixture("history-USD-1W.json"),
      "1M": loadFixture("history-USD-1M.json"),
      "3M": loadFixture("history-USD-3M.json"),
      "1Y": loadFixture("history-USD-1Y.json"),
    },
    EUR: {
      "1D": loadFixture("history-EUR-1D.json"),
      "1W": loadFixture("history-EUR-1W.json"),
      "1M": loadFixture("history-EUR-1M.json"),
      "3M": loadFixture("history-EUR-3M.json"),
      "1Y": loadFixture("history-EUR-1Y.json"),
    },
  },
  monthly: {
    USD: loadFixture("monthly-average-USD.json"),
    EUR: loadFixture("monthly-average-EUR.json"),
  },
  convertUsdBrl: loadFixture("convert-USD-BRL-1000.json"),
  convertUsdEur: loadFixture("convert-USD-EUR-1000.json"),
};

type PtaxRouteOverrides = {
  latestStatus?: number;
  latestBody?: unknown;
  historyStatus?: number;
  historyBody?: unknown;
  convertStatus?: number;
  convertBody?: unknown;
};

async function mockPtaxBackend(page: Page, overrides: PtaxRouteOverrides = {}) {
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ json: { isAdmin: false, userId: "u1" } }),
  );
  await page.route("**/api/backend/**", (route) => {
    const reqUrl = new URL(route.request().url());
    const apiPath = reqUrl.pathname.replace("/api/backend", "");

    if (apiPath === "/auth/me") return route.fulfill({ json: fixtures.me });
    if (apiPath === "/kyc/status") return route.fulfill({ json: fixtures.kyc });

    if (apiPath === "/v1/ptax/latest") {
      if (overrides.latestStatus && overrides.latestStatus >= 400) {
        return route.fulfill({
          status: overrides.latestStatus,
          json: overrides.latestBody ?? { message: "error" },
        });
      }
      return route.fulfill({ json: overrides.latestBody ?? fixtures.latest });
    }

    if (apiPath === "/v1/ptax/history") {
      if (overrides.historyStatus && overrides.historyStatus >= 400) {
        return route.fulfill({
          status: overrides.historyStatus,
          json: overrides.historyBody ?? { message: "error" },
        });
      }
      if (overrides.historyBody !== undefined) {
        return route.fulfill({ json: overrides.historyBody });
      }
      const currency = (reqUrl.searchParams.get("currency") ?? "USD") as
        | "USD"
        | "EUR";
      const period = (reqUrl.searchParams.get("period") ?? "1M") as
        | "1D"
        | "1W"
        | "1M"
        | "3M"
        | "1Y";
      return route.fulfill({ json: fixtures.history[currency][period] });
    }

    if (apiPath === "/v1/ptax/monthly-average") {
      const currency = (reqUrl.searchParams.get("currency") ?? "USD") as
        | "USD"
        | "EUR";
      return route.fulfill({ json: fixtures.monthly[currency] });
    }

    if (apiPath === "/v1/ptax/convert") {
      if (overrides.convertStatus && overrides.convertStatus >= 400) {
        return route.fulfill({
          status: overrides.convertStatus,
          json: overrides.convertBody ?? { code: "feature_disabled" },
        });
      }
      const to = reqUrl.searchParams.get("to");
      return route.fulfill({
        json:
          overrides.convertBody ??
          (to === "EUR" ? fixtures.convertUsdEur : fixtures.convertUsdBrl),
      });
    }

    return route.fulfill({ json: {} });
  });
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "bc_at", value: "mock-access-token", domain: "localhost", path: "/" },
    { name: "bc_rt", value: "mock-refresh-token", domain: "localhost", path: "/" },
  ]);
});

const PERIOD_ARIA: Record<string, string> = {
  "1D": "1 dia",
  "1W": "1 semana",
  "1M": "1 mês",
  "3M": "3 meses",
  "1Y": "1 ano",
};

for (const width of [390, 1280] as const) {
  for (const currency of ["USD", "EUR"] as const) {
    for (const period of ["1D", "1W", "1M", "3M", "1Y"] as const) {
      test(`renders valid non-empty SVG path for ${currency} ${period} at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await mockPtaxBackend(page);
        await page.goto("/cotacoes", { waitUntil: "networkidle" });

        const headerVal = page.getByTestId("ptax-header-value");
        await expect(headerVal).toBeVisible();

        if (currency !== "USD") {
          await page
            .getByRole("tab", { name: new RegExp(`^${currency}`) })
            .click();
        }

        if (period !== "1M") {
          await page
            .getByRole("tab", { name: PERIOD_ARIA[period], exact: true })
            .click();
        }

        const container = page.getByTestId("ptax-chart-container");
        await expect(container).toBeVisible();

        // Confirm SVG path has non-empty `d` and bounding box area > 0
        await expect
          .poll(async () => {
            return container.evaluate((el) => {
              const paths = Array.from(
                el.querySelectorAll("svg path.recharts-curve"),
              );
              return paths.some((p) => {
                const d = p.getAttribute("d") ?? "";
                const rect = p.getBoundingClientRect();
                return d.trim().length > 0 && rect.width > 0 && rect.height > 0;
              });
            });
          })
          .toBe(true);
      });
    }
  }
}

test("hides calculator automatically on 404 feature_disabled and renders explicit empty, error, and 1-point states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  // 1) 404 feature_disabled hides calculator
  await mockPtaxBackend(page, {
    convertStatus: 404,
    convertBody: { code: "feature_disabled" },
  });
  await page.goto("/cotacoes", { waitUntil: "networkidle" });
  await expect(page.getByTestId("ptax-header-value")).toBeVisible();
  await expect(page.getByTestId("ptax-calculator")).toHaveCount(0);

  // 2) Empty state
  await page.unrouteAll();
  await mockPtaxBackend(page, {
    latestBody: {
      side: "sell",
      source: "Banco Central do Brasil — PTAX",
      asOf: null,
      isStale: true,
      rates: { USD: null, EUR: null },
    },
    historyBody: {
      currency: "USD",
      pair: "USD_BRL",
      period: "1M",
      side: "sell",
      source: "Banco Central do Brasil — PTAX",
      asOf: null,
      isStale: true,
      points: [],
      stats: {
        min: null,
        max: null,
        avg: null,
        open: null,
        close: null,
        periodChange: null,
        periodChangePct: null,
      },
      count: 0,
    },
  });
  await page.goto("/cotacoes", { waitUntil: "networkidle" });
  await expect(page.getByTestId("ptax-chart-empty")).toBeVisible();

  // 3) 500 error state with "Tentar de novo"
  await page.unrouteAll();
  await mockPtaxBackend(page, {
    historyStatus: 503,
    historyBody: { message: "unavailable" },
  });
  await page.goto("/cotacoes", { waitUntil: "networkidle" });
  await expect(page.getByTestId("ptax-chart-error")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tentar de novo" }),
  ).toBeVisible();

  // 4) Single-point 1D state (early day, provisional marker, no crash)
  const usd1D = fixtures.history.USD["1D"] as {
    points: Array<Record<string, unknown>>;
    stats: Record<string, unknown>;
  };
  const singlePoint = {
    ...usd1D,
    points: [{ ...usd1D.points[0], provisional: true }],
    count: 1,
  };
  await page.unrouteAll();
  await mockPtaxBackend(page, { historyBody: singlePoint });
  await page.goto("/cotacoes", { waitUntil: "networkidle" });
  await expect(page.getByTestId("ptax-single-point-notice")).toBeVisible();
  await expect(page.getByTestId("ptax-point-provisional")).toBeVisible();
});
