import { ApiError } from "@/lib/client-api";

/**
 * Maps a create-deposit error to a short pt-BR message (never the backend's raw
 * text). 412 has two cases with no `code` yet (missing sub-account → verification;
 * missing wallet → support), distinguished by the message text as a fallback.
 * Leave a `code` switch point for when the backend sends one.
 */
export function mapCreateError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Não foi possível gerar o PIX. Tente novamente.";
  }
  if (err.status === 400) return "Valor inválido.";
  if (err.status === 503) return "Depósito por PIX indisponível no momento.";
  if (err.status === 429) return "Muitas tentativas. Aguarde um momento.";
  if (err.status === 412) {
    const m = (err.message || "").toLowerCase();
    // TODO: switch on err.code once the backend sends one.
    if (/subconta|verific|conta/.test(m)) {
      return "Conclua a verificação da conta para depositar.";
    }
    return "Não foi possível preparar seu depósito. Fale com o suporte.";
  }
  if (err.status >= 500) return "Erro no servidor. Tente novamente.";
  return "Não foi possível gerar o PIX. Tente novamente.";
}
