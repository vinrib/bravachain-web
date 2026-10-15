import { describe, it, expect, vi } from "vitest";
import {
  depositUiStatus,
  isFinalStatus,
  isExpired,
  remainingSeconds,
  formatCountdown,
} from "./status";

describe("depositUiStatus (real backend enum)", () => {
  it("maps the four real statuses", () => {
    expect(depositUiStatus("PENDING")).toBe("waiting");
    expect(depositUiStatus("COMPLETED")).toBe("paid");
    expect(depositUiStatus("FAILED")).toBe("failed");
    expect(depositUiStatus("CANCELLED")).toBe("failed");
  });
  it("treats any other value as waiting and warns in dev", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(depositUiStatus("SOMETHING_NEW")).toBe("waiting");
    expect(depositUiStatus("")).toBe("waiting");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it("isFinalStatus is true only for paid/failed (expired is client-side)", () => {
    expect(isFinalStatus("waiting")).toBe(false);
    expect(isFinalStatus("paid")).toBe(true);
    expect(isFinalStatus("failed")).toBe(true);
    expect(isFinalStatus("expired")).toBe(false);
  });
});

describe("isExpired (client-side)", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);
  it("is true only when PENDING, expiresAt present and past", () => {
    expect(isExpired(new Date(now - 1000).toISOString(), "waiting", now)).toBe(true);
    expect(isExpired(new Date(now + 1000).toISOString(), "waiting", now)).toBe(false);
  });
  it("never expires a non-waiting deposit", () => {
    expect(isExpired(new Date(now - 1000).toISOString(), "paid", now)).toBe(false);
    expect(isExpired(new Date(now - 1000).toISOString(), "failed", now)).toBe(false);
  });
  it("never expires when expiresAt is empty or invalid", () => {
    expect(isExpired("", "waiting", now)).toBe(false);
    expect(isExpired(null, "waiting", now)).toBe(false);
    expect(isExpired("not-a-date", "waiting", now)).toBe(false);
  });
});

describe("remainingSeconds / formatCountdown", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);
  it("returns seconds, clamped, or null when absent/invalid", () => {
    expect(remainingSeconds(new Date(now + 90_000).toISOString(), now)).toBe(90);
    expect(remainingSeconds(new Date(now - 5_000).toISOString(), now)).toBe(0);
    expect(remainingSeconds("", now)).toBeNull();
    expect(remainingSeconds(null, now)).toBeNull();
    expect(remainingSeconds("not-a-date", now)).toBeNull();
  });
  it("formats mm:ss", () => {
    expect(formatCountdown(90)).toBe("01:30");
    expect(formatCountdown(5)).toBe("00:05");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-3)).toBe("00:00");
    expect(formatCountdown(600)).toBe("10:00");
  });
});
