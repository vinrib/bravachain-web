"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { CURRENCIES, CURRENCY_LIST, PIX_KEY, MOCK_WALLET_ADDRESS } from "@/lib/constants";
import type { Currency } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      {copied ? (
        <><Check className="h-3.5 w-3.5 text-green-600" /> Copiado!</>
      ) : (
        <><Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copiar</>
      )}
    </button>
  );
}

// Fake QR code using SVG pattern
function FakeQrCode({ data }: { data: string }) {
  const seed = data.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const grid = Array.from({ length: 25 }, (_, r) =>
    Array.from({ length: 25 }, (_, c) => {
      // Border always black, inner random based on seed
      if (r < 3 || r > 21 || c < 3 || c > 21) return 1;
      if ((r < 9 && c < 9) || (r < 9 && c > 15) || (r > 15 && c < 9)) return 1; // finder patterns
      return ((seed * (r + 1) * (c + 3)) % 3 === 0) ? 1 : 0;
    })
  );

  return (
    <svg viewBox="0 0 125 125" className="w-40 h-40 rounded-xl border border-border p-2 bg-white">
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c * 5} y={r * 5} width={5} height={5} fill="#1a1a2e" />
          ) : null
        )
      )}
    </svg>
  );
}

type Tab = "pix" | "crypto";

export default function DepositPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pix");
  const [cryptoCurrency, setCryptoCurrency] = useState<Currency>("USDC");

  const cryptoCurrencies: Currency[] = ["USDC", "EURC", "BRZ"];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adicionar dinheiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposite via PIX ou transfira cripto
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
        {(["pix", "crypto"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "pix" ? "PIX" : "Cripto"}
          </button>
        ))}
      </div>

      {/* PIX Tab */}
      {activeTab === "pix" && (
        <Card>
          <CardHeader>
            <CardTitle>Depósito via PIX</CardTitle>
            <p className="text-sm text-muted-foreground">
              Transferências chegam em segundos, 24h por dia
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 py-2">
              <FakeQrCode data={PIX_KEY} />
              <p className="text-xs text-muted-foreground text-center">
                Escaneie o QR code com seu app de pagamento
              </p>
            </div>

            {/* PIX Key */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Chave PIX
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-mono font-medium text-foreground break-all">
                  {PIX_KEY}
                </p>
                <CopyButton text={PIX_KEY} />
              </div>
            </div>

            {/* Info */}
            <div className="rounded-xl bg-blue-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-800">Como funciona</p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Abra seu banco e faça um PIX para a chave acima</li>
                <li>O saldo aparece em sua conta em segundos</li>
                <li>Disponível 24 horas, 7 dias por semana</li>
                <li>Sem limite máximo de depósito</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crypto Tab */}
      {activeTab === "crypto" && (
        <Card>
          <CardHeader>
            <CardTitle>Depósito em Cripto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Envie tokens diretamente para sua carteira
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Currency selector */}
            <div className="flex gap-2">
              {cryptoCurrencies.map((c) => {
                const info = CURRENCIES[c];
                return (
                  <button
                    key={c}
                    onClick={() => setCryptoCurrency(c)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors",
                      cryptoCurrency === c
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    )}
                  >
                    <span className="text-lg">{info.flag}</span>
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Address */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Endereço {cryptoCurrency}
                </p>
                <Badge variant="info">ERC-20</Badge>
              </div>
              <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                {MOCK_WALLET_ADDRESS[cryptoCurrency]}
              </p>
              <CopyButton text={MOCK_WALLET_ADDRESS[cryptoCurrency]} />
            </div>

            {/* Warning */}
            <div className="rounded-xl bg-amber-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-800">⚠️ Atenção</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Envie apenas {cryptoCurrency} para este endereço</li>
                <li>Enviar outra moeda resultará em perda dos fundos</li>
                <li>Mínimo de 10 confirmações na rede</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
