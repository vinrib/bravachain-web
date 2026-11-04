// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import PreferenciasPage from "./page";

// jsdom has no matchMedia implementation; ThemeProvider reads it on mount.
beforeEach(() => {
  window.matchMedia =
    window.matchMedia ??
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterEach(cleanup);

function renderPage() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <PreferenciasPage />
      </I18nProvider>
    </ThemeProvider>,
  );
}

describe("Preferências page", () => {
  it("shows the language selector (PT/EN/ES) and persists the chosen language", () => {
    renderPage();
    expect(screen.getByText("Português")).toBeTruthy();
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Español")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /English/ }));
    expect(localStorage.getItem("bravachain_lang")).toBe("en");
  });

  it("shows the theme selector (Claro/Escuro/Sistema) and persists the chosen theme", () => {
    renderPage();
    expect(screen.getByText("Claro")).toBeTruthy();
    expect(screen.getByText("Escuro")).toBeTruthy();
    expect(screen.getByText("Sistema")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Escuro/ }));
    expect(localStorage.getItem("bravachain_theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
