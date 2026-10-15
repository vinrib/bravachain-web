"use client";

import { useEffect, useState } from "react";
import { Bell, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AmountInput } from "@/components/ui/amount-input";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { cn } from "@/lib/utils";
import {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from "@/lib/rates/api";
import { formatRate4 } from "./rates-live-cards";
import {
  PAIRS,
  type AlertCondition,
  type RateAlert,
  type RatePair,
} from "@/lib/rates/types";

function parseRate(input: string): number | null {
  const n = Number(input.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const CONDITIONS: Array<{ value: AlertCondition; label: string }> = [
  { value: "ABOVE_OR_EQUAL", label: "Subir até ou acima de" },
  { value: "BELOW_OR_EQUAL", label: "Cair até ou abaixo de" },
];

export function RatesAlerts() {
  const [alerts, setAlerts] = useState<RateAlert[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  // New-alert form
  const [pair, setPair] = useState<RatePair>("USD_BRL");
  const [condition, setCondition] = useState<AlertCondition>("ABOVE_OR_EQUAL");
  const [target, setTarget] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);
    listAlerts()
      .then((a) => {
        if (active) setAlerts(a);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  function reload() {
    setNonce((n) => n + 1);
  }

  async function create() {
    setFormError(null);
    const targetRate = parseRate(target);
    if (targetRate === null) {
      setFormError("Informe uma taxa-alvo válida.");
      return;
    }
    setCreating(true);
    try {
      await createAlert({ pair, condition, targetRate, channels: ["EMAIL"] });
      setTarget("");
      reload();
    } catch {
      setFormError("Não foi possível criar o alerta. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  async function toggle(a: RateAlert) {
    try {
      await updateAlert(a.id, { status: a.status === "ACTIVE" ? "PAUSED" : "ACTIVE" });
      reload();
    } catch {
      /* keep current; user can retry */
    }
  }

  async function remove(a: RateAlert) {
    if (!window.confirm("Remover este alerta?")) return;
    try {
      await deleteAlert(a.id);
      reload();
    } catch {
      /* keep current */
    }
  }

  return (
    <div className="space-y-4">
      {/* New alert */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Novo alerta
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value as RatePair)}
              aria-label="Par de moedas"
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              {PAIRS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
              aria-label="Condição"
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Taxa-alvo (R$)</label>
            <AmountInput value={target} onChange={setTarget} placeholder="0,0000" className="mt-1" />
          </div>
          <p className="text-xs text-muted-foreground">Você será avisado por e-mail.</p>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="button" onClick={create} disabled={creating} className="gap-2">
            {creating ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
            Criar alerta
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {error ? (
        <ErrorState message="Não foi possível carregar os alertas." onRetry={reload} />
      ) : alerts === null ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="Nenhum alerta"
          description="Crie um alerta para ser avisado quando a taxa atingir o valor desejado."
          icon={Bell}
        />
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const pairLabel = PAIRS.find((p) => p.value === a.pair)?.label ?? a.pair;
            const condLabel =
              a.condition === "BELOW_OR_EQUAL" ? "≤" : "≥";
            return (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {pairLabel} {condLabel} R$ {formatRate4(a.targetRate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.status === "ACTIVE" ? "Ativo" : "Pausado"}
                      {a.distance !== null && ` · faltam R$ ${formatRate4(Math.abs(a.distance))}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => toggle(a)}
                      aria-label={a.status === "ACTIVE" ? "Pausar alerta" : "Reativar alerta"}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {a.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(a)}
                      aria-label="Remover alerta"
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10",
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
