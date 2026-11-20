"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { createBeneficiary } from "@/lib/send/api";
import {
  FORMS,
  FORM_TITLE_KEY,
  MASKS,
  validateForm,
  type FieldDef,
} from "@/lib/send/beneficiary-forms";
import type {
  BeneficiaryFormKind,
  BeneficiarySummary,
  BrlKind,
  SendCurrency,
} from "@/lib/send/types";

const TK_LABEL: Record<string, string> = {
  "CPF/CNPJ": "form.keyCpfCnpj",
  "E-mail": "form.keyEmail",
  Telefone: "form.keyPhone",
  Aleatória: "form.keyRandom",
};
const TK_PLACEHOLDER: Record<string, string> = {
  "CPF/CNPJ": "form.pixKeyPhCpf",
  "E-mail": "form.pixKeyPhEmail",
  Telefone: "form.pixKeyPhPhone",
  Aleatória: "form.pixKeyPhRandom",
};
const TC_LABEL: Record<string, string> = {
  Corrente: "form.accCorrente",
  Poupança: "form.accPoupanca",
  Pagamento: "form.accPagamento",
};

/** Default values so chips/selects are always set (matches the prototype). */
function initialValues(kind: BeneficiaryFormKind): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of FORMS[kind]) {
    if (!f.id) continue;
    if (f.type === "chips") values[f.id] = f.options?.[0] ?? "";
    else if (f.type === "select") values[f.id] = f.options?.[0] ?? "";
  }
  return values;
}

/**
 * Step 1b: register a beneficiary. BRL offers a Pix/Conta tab; USD is Wire and
 * EUR is SEPA. Masks and inline validation only check field shape — no "our"
 * limit. On success the parent receives only the masked summary.
 */
export function BeneficiaryForm({
  currency,
  onSaved,
}: {
  currency: SendCurrency;
  onSaved: (b: BeneficiarySummary) => void;
}) {
  const t = useTranslations("enviar");
  const [brlKind, setBrlKind] = useState<BrlKind>("pix");
  const kind: BeneficiaryFormKind = currency === "BRL" ? brlKind : currency;

  const [values, setValues] = useState<Record<string, string>>(() => initialValues(kind));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  // Save-time error relayed from the API/Avenia (field-shape errors are inline).
  const [aveniaError, setAveniaError] = useState<string | null>(null);

  const fields = FORMS[kind];
  const errors = useMemo(() => validateForm(kind, values), [kind, values]);
  const hasErrors = Object.keys(errors).length > 0;

  function switchBrlKind(next: BrlKind) {
    setBrlKind(next);
    setValues(initialValues(next));
    setTouched({});
    setSubmitted(false);
  }

  function setValue(field: FieldDef, raw: string) {
    const value = field.mask ? MASKS[field.mask](raw) : raw;
    setValues((v) => ({ ...v, [field.id as string]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setAveniaError(null);
    if (hasErrors) {
      const all: Record<string, boolean> = {};
      for (const f of fields) if (f.id) all[f.id] = true;
      setTouched(all);
      return;
    }
    setSaving(true);
    try {
      const summary = await createBeneficiary({ kind, currency, values });
      onSaved(summary);
    } catch (err) {
      // Relay Avenia's message verbatim — Bravachain does not judge the data.
      const message = err instanceof Error ? err.message : String(err);
      setAveniaError(message);
    } finally {
      setSaving(false);
    }
  }

  const showError = (id: string) => (touched[id] || submitted) && errors[id];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div>
        <h2 className="font-serif text-[19px] font-bold text-foreground">{t(FORM_TITLE_KEY[kind])}</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">{t("form.subtitle")}</p>
      </div>

      {currency === "BRL" && (
        <div role="tablist" aria-label={t("form.pixKeyType")} className="inline-flex gap-1 self-start rounded-xl bg-muted p-1">
          {(["pix", "conta"] as const).map((k) => {
            const on = brlKind === k;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => switchBrlKind(k)}
                className={[
                  "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
                  on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                ].join(" ")}
              >
                {t(k === "pix" ? "form.tabPix" : "form.tabConta")}
              </button>
            );
          })}
        </div>
      )}

      {submitted && hasErrors && (
        <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[13.5px] font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("form.errSummary")}
        </div>
      )}

      {aveniaError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[13.5px] text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{t("form.aveniaError", { message: aveniaError })}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field, i) => {
          if (field.section) {
            return (
              <div key={`sec-${i}`} className="sm:col-span-2 border-t border-border pt-3 text-[13px] font-bold text-foreground">
                {t(field.section)}
              </div>
            );
          }
          const id = field.id as string;
          const err = showError(id);
          const mono = field.mono ? "font-mono" : "";
          const colSpan = field.fullWidth ? "sm:col-span-2" : "";
          const inputId = `bf_${kind}_${id}`;
          const describedBy = err ? `${inputId}_err` : field.hintKey ? `${inputId}_hint` : undefined;

          return (
            <div key={id} className={`flex min-w-0 flex-col gap-1.5 ${colSpan}`}>
              {field.type !== "chips" ? (
                <label htmlFor={inputId} className="flex items-baseline gap-1.5 text-[13.5px] font-semibold text-foreground/80">
                  {t(field.labelKey as string)}
                  {field.optionalKey && (
                    <span className="text-[12.5px] font-normal text-muted-foreground">{t(field.optionalKey)}</span>
                  )}
                </label>
              ) : (
                <span className="text-[13.5px] font-semibold text-foreground/80">{t(field.labelKey as string)}</span>
              )}

              {field.type === "select" ? (
                <select
                  id={inputId}
                  value={values[id] ?? ""}
                  onChange={(e) => setValue(field, e.target.value)}
                  className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {id === "bc" && <option value="">{t("form.selectBank")}</option>}
                  {(field.options ?? []).map((opt, oi) => (
                    <option key={opt} value={opt}>
                      {field.optionLabelKeys ? t(field.optionLabelKeys[oi]!) : opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "chips" ? (
                <div role="radiogroup" aria-label={t(field.labelKey as string)} className="flex flex-wrap gap-2">
                  {(field.options ?? []).map((opt) => {
                    const on = values[id] === opt;
                    const label = id === "tk" ? t(TK_LABEL[opt]!) : id === "tc" ? t(TC_LABEL[opt]!) : opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setValues((v) => ({ ...v, [id]: opt }))}
                        className={[
                          "h-10 rounded-full border px-4 text-[13.5px] font-semibold transition-colors",
                          on ? "border-foreground bg-foreground text-background" : "border-input bg-card text-foreground",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  id={inputId}
                  value={values[id] ?? ""}
                  onChange={(e) => setValue(field, e.target.value)}
                  onBlur={() => setTouched((tc) => ({ ...tc, [id]: true }))}
                  placeholder={
                    id === "ch"
                      ? t(TK_PLACEHOLDER[values.tk || "CPF/CNPJ"]!)
                      : field.placeholderKey
                        ? t(field.placeholderKey)
                        : undefined
                  }
                  inputMode={field.inputMode ?? "text"}
                  aria-invalid={Boolean(err)}
                  aria-describedby={describedBy}
                  className={[
                    "h-11 w-full rounded-xl border bg-card px-3.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    mono,
                    err ? "border-destructive" : "border-input focus-visible:border-foreground",
                  ].join(" ")}
                />
              )}

              {err ? (
                <p id={`${inputId}_err`} className="flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {t(err)}
                </p>
              ) : (
                field.hintKey && (
                  <p id={`${inputId}_hint`} className="text-[12.5px] text-muted-foreground">
                    {t(field.hintKey)}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
        >
          {saving ? <Spinner size="sm" /> : t("form.save")}
        </button>
      </div>
    </form>
  );
}
