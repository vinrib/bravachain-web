// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const flags = vi.hoisted(() => ({ enviar: true }));
vi.mock("@/lib/feature-flags", () => ({ featureFlags: flags }));
vi.mock("./statement-view", () => ({ StatementView: () => <div>statement-stub</div> }));
vi.mock("./receipts-view", () => ({ ReceiptsView: () => <div>receipts-stub</div> }));
vi.mock("@/components/send/sends-view", () => ({ SendsView: () => <div>sends-stub</div> }));

import { ExtratoTabs } from "./extrato-tabs";

afterEach(cleanup);

describe("ExtratoTabs — Envios tab", () => {
  it("shows the 'Envios' tab and renders the sends view when the flag is on", () => {
    flags.enviar = true;
    render(<ExtratoTabs />);
    expect(screen.getByText("statement-stub")).toBeTruthy(); // default tab
    fireEvent.click(screen.getByText("Envios"));
    expect(screen.getByText("sends-stub")).toBeTruthy();
  });

  it("hides the 'Envios' tab when the flag is off", () => {
    flags.enviar = false;
    render(<ExtratoTabs />);
    expect(screen.queryByText("Envios")).toBeNull();
  });
});
