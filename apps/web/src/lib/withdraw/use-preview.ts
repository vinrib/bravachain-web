"use client";

import { useEffect, useState } from "react";
import {
  getWithdrawPreview,
  type WithdrawPreview,
  type BackendPixKeyType,
} from "./preview";

export interface PreviewState {
  data: WithdrawPreview | null;
  loading: boolean;
  /** True quando a prévia falhou — a confirmação do saque NÃO é bloqueada. */
  error: boolean;
}

const DEBOUNCE_MS = 450;

/**
 * Busca a prévia de tarifa/líquido conforme o usuário digita o valor. Debounce
 * para não disparar a cada tecla, e cancela requisições obsoletas. Valores <= 0
 * ou inválidos limpam a prévia sem chamar o backend. Um erro nunca trava o
 * fluxo: o componente apenas mostra um aviso e deixa seguir.
 */
export function useWithdrawPreview(
  amountBrla: number | null,
  pixKeyType?: BackendPixKeyType,
): PreviewState {
  const [state, setState] = useState<PreviewState>({
    data: null,
    loading: false,
    error: false,
  });

  const valid = amountBrla !== null && amountBrla > 0;

  useEffect(() => {
    if (!valid || amountBrla === null) {
      // Clear any stale preview when the amount becomes invalid/empty.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: null, loading: false, error: false });
      return;
    }

    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: false }));

    const timer = setTimeout(() => {
      getWithdrawPreview(amountBrla, pixKeyType, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setState({ data, loading: false, error: false });
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setState({ data: null, loading: false, error: true });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [valid, amountBrla, pixKeyType]);

  return state;
}
