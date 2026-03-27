import type { Currency, CurrencyInfo } from "./types";

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  BRL: { code: "BRL", name: "Real Brasileiro", symbol: "R$", flag: "🇧🇷", color: "#009c3b" },
  USDC: { code: "USDC", name: "USD Coin", symbol: "$", flag: "🇺🇸", color: "#2775ca" },
  EURC: { code: "EURC", name: "Euro Coin", symbol: "€", flag: "🇪🇺", color: "#003399" },
  BRZ: { code: "BRZ", name: "BRZ Token", symbol: "BRZ", flag: "🪙", color: "#f7931a" },
};

export const CURRENCY_LIST: Currency[] = ["BRL", "USDC", "EURC", "BRZ"];

export const SPREAD_RATE = 0.025; // 2.5%
export const FIXED_FEE_BRL = 3.5; // R$ 3,50

// Fallback rates (BRL as base)
export const FALLBACK_RATES: Record<string, number> = {
  "BRL/BRL": 1,
  "BRL/USDC": 0.195,
  "BRL/EURC": 0.178,
  "BRL/BRZ": 1.0,
  "USDC/BRL": 5.12,
  "USDC/USDC": 1,
  "USDC/EURC": 0.915,
  "USDC/BRZ": 5.12,
  "EURC/BRL": 5.62,
  "EURC/USDC": 1.092,
  "EURC/EURC": 1,
  "EURC/BRZ": 5.62,
  "BRZ/BRL": 1.0,
  "BRZ/USDC": 0.195,
  "BRZ/EURC": 0.178,
  "BRZ/BRZ": 1,
};

export const PIX_KEY = "pix@bravachain.com";

export const MOCK_WALLET_ADDRESS: Record<Currency, string> = {
  BRL: "",
  USDC: "0x742d35Cc6634C0532925a3b8D4C9C9B1E7e2Fac",
  EURC: "0x742d35Cc6634C0532925a3b8D4C9C9B1E7e2Fac",
  BRZ: "0x742d35Cc6634C0532925a3b8D4C9C9B1E7e2Fac",
};
