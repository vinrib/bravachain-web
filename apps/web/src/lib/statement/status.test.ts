import { describe, it, expect } from "vitest";
import { statementStatusView } from "./status";

describe("statementStatusView — exact PR #56 enum", () => {
  it("COMPLETED → Histórico (final)", () => {
    const v = statementStatusView("COMPLETED");
    expect(v).toEqual({ label: "Concluído", tone: "success", final: true });
  });

  it("FAILED → Histórico (final)", () => {
    const v = statementStatusView("FAILED");
    expect(v).toEqual({ label: "Falhou", tone: "error", final: true });
  });

  it("PROCESSING → Em andamento", () => {
    const v = statementStatusView("PROCESSING");
    expect(v).toEqual({ label: "Em processamento", tone: "processing", final: false });
  });

  it("PENDING → Em andamento (Em análise)", () => {
    const v = statementStatusView("PENDING");
    expect(v).toEqual({ label: "Em análise", tone: "review", final: false });
  });
});

describe("statementStatusView — only PROCESSING/PENDING stay in andamento", () => {
  it("everything that is not PROCESSING/PENDING is final (Histórico)", () => {
    for (const s of ["COMPLETED", "FAILED", "", "WHATEVER"]) {
      expect(statementStatusView(s).final).toBe(true);
    }
    for (const s of ["PROCESSING", "PENDING"]) {
      expect(statementStatusView(s).final).toBe(false);
    }
  });
});

describe("statementStatusView — concluded never shows an empty status", () => {
  it("empty/unknown status falls back to the generic 'Concluído', never '—'", () => {
    expect(statementStatusView("").label).toBe("Concluído");
    expect(statementStatusView("").final).toBe(true);
    expect(statementStatusView("SOMETHING_NEW").label).toBe("Concluído");
    expect(statementStatusView("SOMETHING_NEW").label).not.toBe("—");
  });
});

describe("statementStatusView — backward compatible (pre-PR#56 strings)", () => {
  it("still classifies legacy substrings", () => {
    expect(statementStatusView("SETTLED").final).toBe(true);
    expect(statementStatusView("CANCELLED")).toEqual({
      label: "Falhou",
      tone: "error",
      final: true,
    });
    expect(statementStatusView("UNDER_REVIEW")).toEqual({
      label: "Em análise",
      tone: "review",
      final: false,
    });
    expect(statementStatusView("CONFIRMING")).toEqual({
      label: "Em processamento",
      tone: "processing",
      final: false,
    });
  });
});
