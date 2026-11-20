// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { PurposeCategory } from "@/lib/send/types";
import { PurposePicker } from "./purpose-picker";

const CATS: PurposeCategory[] = [
  {
    name: "Comércio exterior",
    items: [
      { code: "12995", name: "Compra ou venda de mercadoria", category: "Comércio exterior" },
      { code: "12010", name: "Exportação de mercadorias", category: "Comércio exterior" },
    ],
  },
  {
    name: "Serviços diversos",
    items: [{ code: "47555", name: "Serviços de consultoria", category: "Serviços diversos" }],
  },
];

const onChange = vi.fn();
function renderPicker(value: string | null = null) {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <PurposePicker categories={CATS} value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  onChange.mockClear();
});

describe("PurposePicker", () => {
  it("opens to the category level", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /Selecione a finalidade/ }));
    expect(screen.getByText("Comércio exterior")).toBeTruthy();
    expect(screen.getByText("Serviços diversos")).toBeTruthy();
  });

  it("drills into a category to its codes", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /Selecione a finalidade/ }));
    fireEvent.click(screen.getByText("Comércio exterior"));
    expect(screen.getByText("Compra ou venda de mercadoria")).toBeTruthy();
    expect(screen.getByText("Exportação de mercadorias")).toBeTruthy();
  });

  it("searches across all categories", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /Selecione a finalidade/ }));
    fireEvent.change(screen.getByLabelText("Buscar por categoria, código ou finalidade"), {
      target: { value: "consultoria" },
    });
    expect(screen.getByText("Serviços de consultoria")).toBeTruthy();
    expect(screen.queryByText("Compra ou venda de mercadoria")).toBeNull();
  });

  it("selects a code and reports it", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /Selecione a finalidade/ }));
    fireEvent.click(screen.getByText("Comércio exterior"));
    fireEvent.click(screen.getByText("Compra ou venda de mercadoria"));
    expect(onChange).toHaveBeenCalledWith("12995");
  });

  it("shows an empty state when nothing matches", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /Selecione a finalidade/ }));
    fireEvent.change(screen.getByLabelText("Buscar por categoria, código ou finalidade"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("Nenhuma finalidade encontrada.")).toBeTruthy();
  });
});
