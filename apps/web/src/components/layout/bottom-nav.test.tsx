// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const handleLogout = vi.fn();
vi.mock("@/lib/hooks", () => ({
  useLogout: () => ({ signingOut: false, handleLogout }),
}));

import { BottomNav } from "./bottom-nav";

afterEach(() => {
  cleanup();
  handleLogout.mockClear();
});

describe("BottomNav", () => {
  it("offers 'Sair' inside the 'Mais' sheet on mobile, and triggers sign-out", () => {
    render(<BottomNav />);
    fireEvent.click(screen.getByRole("button", { name: "Mais" }));
    const sairButton = screen.getByRole("button", { name: "Sair" });
    fireEvent.click(sairButton);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
