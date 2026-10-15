import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/client-api";
import { mapCreateError } from "./errors";

describe("mapCreateError", () => {
  it("maps 503 to the unavailable message (never raw text)", () => {
    expect(mapCreateError(new ApiError(503, "deposit provider down"))).toBe(
      "Depósito por PIX indisponível no momento.",
    );
  });
  it("maps 400 to 'Valor inválido.'", () => {
    expect(mapCreateError(new ApiError(400, "valor must be positive"))).toBe("Valor inválido.");
  });
  it("maps 412 sub-account/verification case", () => {
    expect(mapCreateError(new ApiError(412, "Subconta não encontrada"))).toBe(
      "Conclua a verificação da conta para depositar.",
    );
  });
  it("maps 412 wallet case to the support message", () => {
    expect(mapCreateError(new ApiError(412, "wallet not provisioned"))).toBe(
      "Não foi possível preparar seu depósito. Fale com o suporte.",
    );
  });
  it("maps 429 and 5xx to short messages", () => {
    expect(mapCreateError(new ApiError(429, "x"))).toBe("Muitas tentativas. Aguarde um momento.");
    expect(mapCreateError(new ApiError(500, "x"))).toBe("Erro no servidor. Tente novamente.");
  });
  it("falls back for non-ApiError", () => {
    expect(mapCreateError(new Error("network"))).toBe("Não foi possível gerar o PIX. Tente novamente.");
  });
});
