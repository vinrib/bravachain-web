// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Navbar } from "./navbar";

afterEach(cleanup);

describe("Navbar", () => {
  it("renders only the brand mark — no language/theme selector and no 'Sair'", () => {
    render(<Navbar />);
    expect(screen.getByText("Bravachain")).toBeTruthy();
    expect(screen.queryByLabelText(/alternar idioma/i)).toBeNull();
    expect(screen.queryByLabelText(/modo claro|modo escuro/i)).toBeNull();
    expect(screen.queryByText("Sair")).toBeNull();
  });
});
