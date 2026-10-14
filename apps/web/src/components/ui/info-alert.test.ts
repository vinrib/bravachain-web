// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InfoAlert } from "./info-alert";

describe("InfoAlert", () => {
  it("renders its message", () => {
    render(createElement(InfoAlert, null, "Aviso de teste"));
    expect(screen.getByText("Aviso de teste")).toBeTruthy();
  });

  it("is marked as a note for assistive tech", () => {
    const { container } = render(createElement(InfoAlert, null, "x"));
    expect(container.querySelector('[role="note"]')).not.toBeNull();
  });
});
