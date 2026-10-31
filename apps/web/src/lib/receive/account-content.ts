import type { DedicatedAccount } from "./types";

/**
 * Fixed, product-approved copy for the "Dados de conta" screen. Everything here
 * was explicitly approved — nothing is inferred or invented. Values the backend
 * does not provide (fees, availability, bank address, account type, balance)
 * are intentionally absent.
 */

export const ACCOUNT_SECURITY_NOTICE =
  "Use estes dados apenas para receber pagamentos em nome da sua empresa. Confira o nome do beneficiário e inclua sempre o memo/referência. A Bravachain nunca pede senha nem altera dados bancários por e-mail ou mensagem.";

export const ACCOUNT_FEE_NOTE =
  "Taxas e câmbio são exibidos na estimativa de cada recebimento.";

export const ACCOUNT_MIN_RECOMMENDATION =
  "Recomendamos pagamentos de pelo menos US$ 200: a tarifa fixa de transferência internacional pesa mais em valores pequenos.";

export function pendingAccountText(currency: string): string {
  return `Sua conta em ${currency} está sendo ativada. Os dados bancários aparecem aqui assim que ficarem prontos.`;
}

/**
 * Same-business-day cutoff for a USD wire credit, as a wall clock in New York.
 * Fixed and product-approved: 16:45 ET.
 */
const ET_CUTOFF_TZ = "America/New_York";
const ET_CUTOFF_HOUR = 16;
const ET_CUTOFF_MINUTE = 45;
const ET_CUTOFF_LABEL = "16:45";

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Wall-clock parts of an instant in a time zone, as numbers. */
function wallClockPartsInTz(instant: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const hour = get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // en-US with hour12:false can report midnight as "24".
    hour: hour === 24 ? 0 : hour,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Time zone offset (ms) at a given instant: positive means ahead of UTC. */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const m = wallClockPartsInTz(instant, timeZone);
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second);
  return asUTC - instant.getTime();
}

/** The UTC instant of a given wall-clock time in a time zone (DST-aware). */
function zonedWallTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes converge even across a DST transition.
  let instant = guess - tzOffsetMs(new Date(guess), timeZone);
  instant = guess - tzOffsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

/**
 * The 16:45 ET same-day cutoff expressed in the viewer's own time zone, computed
 * at runtime so US daylight saving (which ends 2026-11-01) is handled on its own.
 * In Rio Branco (UTC-5): "15:45" until 2026-11-01, "16:45" after.
 */
export function sameDayCutoffLocalLabel(
  now: Date = new Date(),
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  const ny = wallClockPartsInTz(now, ET_CUTOFF_TZ);
  const instant = zonedWallTimeToInstant(
    ny.year,
    ny.month,
    ny.day,
    ET_CUTOFF_HOUR,
    ET_CUTOFF_MINUTE,
    ET_CUTOFF_TZ,
  );
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instant);
}

export interface SettlementDisplay {
  lines: Array<{ method: string; time: string }>;
  /** Extra caveats shown below the per-method lines, muted. */
  note?: string;
}

/**
 * Settlement times the backend affirms, per currency (approved text). USD wire
 * carries a runtime cutoff: same-day credit if received by 16:45 ET.
 */
export function settlementFor(
  currency: string,
  now: Date = new Date(),
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): SettlementDisplay | null {
  if (currency === "USD") {
    const local = sameDayCutoffLocalLabel(now, timeZone);
    const localPart = local === ET_CUTOFF_LABEL ? "" : ` (${local} no seu fuso)`;
    return {
      lines: [
        {
          method: "Wire",
          time: `crédito no mesmo dia útil nos EUA se recebido até ${ET_CUTOFF_LABEL} em Nova York (ET)${localPart}; depois de recebido, o crédito leva até 2h`,
        },
        { method: "ACH", time: "1 a 3 dias úteis" },
      ],
      note: "Recebemos apenas em dias úteis nos EUA. Wires fora desse horário ou em feriados dos EUA podem ser creditados só no próximo dia útil.",
    };
  }
  if (currency === "EUR") {
    return { lines: [{ method: "SEPA", time: "1 a 2 dias úteis" }] };
  }
  return null;
}

export function currencyTitle(currency: string): string {
  if (currency === "USD") return "Conta em dólar (USD)";
  if (currency === "EUR") return "Conta em euro (EUR)";
  return `Conta em ${currency}`;
}

const LABELS: Record<string, string> = {
  beneficiaryName: "Titular",
  bankName: "Banco",
  accountNumber: "Número da conta",
  routingNumber: "Routing (ABA)",
  iban: "IBAN",
  swift: "SWIFT/BIC",
  reference: "Referência",
};

/** Labels/values for the fields added alongside `accountType`/`bankAddress`/etc. Sourced from next-intl ("receiveAccount") so they're translated. */
export interface NewAccountFieldLabels {
  accountType: string;
  bankAddress: string;
  paymentRail: string;
  beneficiaryAddress: string;
  accountTypeChecking: string;
  accountTypeSavings: string;
}

const ORDER = [
  "beneficiaryName",
  "beneficiaryAddress",
  "bankName",
  "bankAddress",
  "accountNumber",
  "routingNumber",
  "accountType",
  "paymentRail",
  "iban",
  "swift",
  "reference",
] as const;

/** Fields that wrap onto multiple lines instead of truncating (long free-text addresses). */
export const WRAPPING_FIELD_KEYS = ["bankAddress", "beneficiaryAddress"] as const;

function accountTypeValue(raw: string, labels: NewAccountFieldLabels): string {
  if (raw === "CHECKING") return labels.accountTypeChecking;
  if (raw === "SAVINGS") return labels.accountTypeSavings;
  return raw;
}

/** Present (non-empty) fields, in display order. `labels` supplies translated text for the backend-driven fields (accountType/bankAddress/paymentRail/beneficiaryAddress). */
export function accountFields(
  account: DedicatedAccount,
  labels: NewAccountFieldLabels,
): AccountField[] {
  const fields: AccountField[] = [];
  for (const key of ORDER) {
    const raw = account[key];
    if (typeof raw !== "string" || raw.trim().length === 0) continue;
    switch (key) {
      case "accountType":
        fields.push({ key, label: labels.accountType, value: accountTypeValue(raw, labels) });
        break;
      case "bankAddress":
        fields.push({ key, label: labels.bankAddress, value: raw });
        break;
      case "paymentRail":
        fields.push({ key, label: labels.paymentRail, value: raw });
        break;
      case "beneficiaryAddress":
        fields.push({ key, label: labels.beneficiaryAddress, value: raw });
        break;
      default:
        fields.push({ key, label: LABELS[key] ?? key, value: raw });
    }
  }
  return fields;
}

export interface AccountField {
  key: string;
  label: string;
  value: string;
}

/** "Copiar todos" text — only available fields; never pending placeholders. */
export function copyAllText(fields: AccountField[]): string {
  return fields.map((f) => `${f.label}: ${f.value}`).join("\n");
}
