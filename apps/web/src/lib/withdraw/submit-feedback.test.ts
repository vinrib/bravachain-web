import { describe, it, expect } from "vitest";
import { withdrawSubmitFeedback } from "./submit-feedback";

const FORBIDDEN_TERMS = [
  "spread",
  "câmbio",
  "cambio",
  "taxa de conversão",
  "taxa de conversao",
  "em tempo real",
  "instantâneo",
  "instantaneo",
  "instantânea",
  "em minutos",
  "segundos",
];

describe("withdrawSubmitFeedback", () => {
  it("201 PROCESSING -> neutral 'saque solicitado' success message", () => {
    const view = withdrawSubmitFeedback({ withdrawalId: "w1", status: "PROCESSING" });
    expect(view.variant).toBe("success");
    expect(view.title).toBe("Saque solicitado");
    expect(view.message).toContain("Acompanhe o status da operação no extrato.");
  });

  it("202 PENDING -> informative message, no 'erro' and no 'tente novamente'", () => {
    const view = withdrawSubmitFeedback({
      withdrawalId: "w1",
      status: "PENDING",
      message: "aguardando confirmação do provedor",
    });
    expect(view.variant).toBe("info");
    expect(view.title).toBe("Saque em processamento");
    expect(view.message.toLowerCase()).not.toContain("erro");
    expect(view.message.toLowerCase()).not.toContain("tente novamente");
    expect(view.message).toContain("Não é necessário repetir a solicitação.");
  });

  it("falls back to the neutral PROCESSING message when the body has no status (pre-#105 API)", () => {
    const view = withdrawSubmitFeedback({ withdrawalId: "w1" });
    expect(view.variant).toBe("success");
    expect(view.title).toBe("Saque solicitado");
  });

  it("falls back to the neutral PROCESSING message for a null/undefined body", () => {
    expect(withdrawSubmitFeedback(null).title).toBe("Saque solicitado");
    expect(withdrawSubmitFeedback(undefined).title).toBe("Saque solicitado");
  });

  it("never promises a timeframe or names the spread/FX mechanics, in either outcome", () => {
    for (const status of ["PROCESSING", "PENDING"] as const) {
      const view = withdrawSubmitFeedback({ withdrawalId: "w1", status });
      const text = `${view.title} ${view.message}`.toLowerCase();
      for (const term of FORBIDDEN_TERMS) {
        expect(text).not.toContain(term);
      }
    }
  });
});
