import { describe, it, expect } from "vitest";
import {
  depositUiStatus,
  isFinalStatus,
  remainingSeconds,
  formatCountdown,
} from "./status";

describe("depositUiStatus", () => {
  it("maps paid/confirmed-like statuses to 'paid'", () => {
    for (const s of ["PAID", "CONFIRMED", "COMPLETED", "APPROVED", "LIQUIDADO", "RECEIVED"]) {
      expect(depositUiStatus(s)).toBe("paid");
    }
  });
  it("maps expired and failed families", () => {
    expect(depositUiStatus("EXPIRED")).toBe("expired");
    for (const s of ["FAILED", "ERROR", "REJECTED", "CANCELLED", "DENIED"]) {
      expect(depositUiStatus(s)).toBe("failed");
    }
  });
  it("keeps pending/unknown as 'waiting' (never a false final)", () => {
    for (const s of ["PENDING", "WAITING", "CREATED", "PROCESSING", "ACTIVE", "SOMETHING_NEW", ""]) {
      expect(depositUiStatus(s)).toBe("waiting");
    }
  });
  it("isFinalStatus is true only for terminal states", () => {
    expect(isFinalStatus("waiting")).toBe(false);
    expect(isFinalStatus("paid")).toBe(true);
    expect(isFinalStatus("expired")).toBe(true);
    expect(isFinalStatus("failed")).toBe(true);
  });
});

describe("remainingSeconds / formatCountdown", () => {
  it("computes clamped seconds until expiry", () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    expect(remainingSeconds(new Date(now + 90_000).toISOString(), now)).toBe(90);
    expect(remainingSeconds(new Date(now - 5_000).toISOString(), now)).toBe(0);
    expect(remainingSeconds(null, now)).toBe(0);
    expect(remainingSeconds("not-a-date", now)).toBe(0);
  });
  it("formats mm:ss", () => {
    expect(formatCountdown(90)).toBe("01:30");
    expect(formatCountdown(5)).toBe("00:05");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-3)).toBe("00:00");
    expect(formatCountdown(600)).toBe("10:00");
  });
});
