import { PIX_RETURN_WARNING_SHORT } from "@/lib/pix-warning";

/**
 * Body of `POST /v1/withdraw/pix` since the backend's API PR #105. `status`
 * is absent on older backends (pre-#105) — callers fall back to the neutral
 * PROCESSING feedback in that case.
 */
export interface CreatePixWithdrawResponse {
  withdrawalId: string;
  status?: "PROCESSING" | "PENDING";
  message?: string;
}

export interface WithdrawSubmitFeedback {
  variant: "success" | "info";
  title: string;
  message: string;
}

/**
 * 202 PENDING means the provider outcome isn't known yet — it is not an
 * error and must not invite a retry (repeating the request could duplicate
 * the withdrawal). 201 PROCESSING, and any response without `status` (older
 * backend), get the same neutral "saque solicitado" feedback.
 */
export function withdrawSubmitFeedback(
  response: CreatePixWithdrawResponse | null | undefined,
): WithdrawSubmitFeedback {
  if (response?.status === "PENDING") {
    return {
      variant: "info",
      title: "Saque em processamento",
      message:
        "Estamos aguardando a confirmação do status da operação. Acompanhe no extrato. Não é necessário repetir a solicitação.",
    };
  }
  return {
    variant: "success",
    title: "Saque solicitado",
    message: `Acompanhe o status da operação no extrato. ${PIX_RETURN_WARNING_SHORT}`,
  };
}
