// @vitest-environment jsdom
import { createElement } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { formatMoney } from "@bravachain/shared";
import { WithdrawBreakdown } from "./withdraw-breakdown";

describe("WithdrawBreakdown", () => {
  it("shows bruto/tarifa/líquido when fee and net exist", () => {
    const { container } = render(
      createElement(WithdrawBreakdown, { gross: 1.5, fee: 0.1, net: 1.4 }),
    );
    const text = container.textContent ?? "";
    expect(text).toContain(formatMoney(1.5));
    expect(text).toContain(formatMoney(0.1));
    expect(text).toContain(formatMoney(1.4));
    expect(text).not.toContain("—");
  });

  it("shows — for fee/net when either is absent", () => {
    const { container } = render(
      createElement(WithdrawBreakdown, { gross: 1.5, fee: null, net: null }),
    );
    const text = container.textContent ?? "";
    expect(text).toContain(formatMoney(1.5));
    expect(text).toContain("—");
  });
});
