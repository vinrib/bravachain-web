// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { SendResult, SendStatus } from "@/lib/send/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const statusMock = vi.hoisted(() => ({
  current: { status: "processando" as SendStatus, reason: null as string | null },
}));
vi.mock("@/lib/send/use-send-status", () => ({ useSendStatus: () => statusMock.current }));

import { StatusStep } from "./status-step";

const onRetry = vi.fn();
function renderStatus(status: SendStatus, reason: string | null = null) {
  statusMock.current = { status, reason };
  const send: SendResult = { id: "snd_1", status, reason };
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <StatusStep currency="USD" send={send} onRetry={onRetry} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  push.mockClear();
  onRetry.mockClear();
});

describe("StatusStep", () => {
  it("processando: shows the Avenia timeline and 'Ver no extrato'", () => {
    renderStatus("processando");
    expect(screen.getByText("Em processamento pela Avenia")).toBeTruthy();
    expect(screen.getByText("Pedido recebido")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver no extrato" }));
    expect(push).toHaveBeenCalledWith("/extrato");
  });

  it("concluido: offers 'Baixar comprovante' and 'Novo envio'", () => {
    renderStatus("concluido");
    expect(screen.getByText("Envio concluído")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Baixar comprovante/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Novo envio" }));
    expect(push).toHaveBeenCalledWith("/enviar");
  });

  it("recusado: shows Avenia's reason and retries from the amount step", () => {
    renderStatus("recusado", "os dados do beneficiário não conferem com o banco de destino.");
    // "Recusado pela Avenia" appears as title/badge/timeline — assert the unique reason.
    expect(
      screen.getByText(/Motivo informado pela Avenia: os dados do beneficiário não conferem/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/ }));
    expect(onRetry).toHaveBeenCalledWith("valor");
  });

  it("falha: retries from the review step", () => {
    renderStatus("falha");
    expect(
      screen.getByText("O pedido não chegou à Avenia. Confira o extrato e tente enviar novamente."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/ }));
    expect(onRetry).toHaveBeenCalledWith("revisao");
  });
});
