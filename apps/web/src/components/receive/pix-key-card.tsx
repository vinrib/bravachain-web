"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/toast-provider";
import { ApiError } from "@/lib/client-api";
import { getPixKey, savePixKey, deletePixKey } from "@/lib/receive/api";
import { maskPixKey } from "@/lib/receive/mask";

/**
 * Manages the standing PIX key used to deliver the converted BRL. Notifies the
 * parent when the key changes so the create form knows whether a default exists.
 */
export function PixKeyCard({
  onChange,
  label = "Chave PIX de recebimento",
}: {
  onChange?: (pixKey: string | null) => void;
  label?: string;
}) {
  const { success } = useToast();
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  function apply(key: string | null) {
    setPixKey(key);
    onChange?.(key);
  }

  useEffect(() => {
    let active = true;
    getPixKey()
      .then((r) => {
        if (active) apply(r.pixKey ?? null);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar a chave PIX.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const key = draft.trim();
    if (!key) {
      setError("Informe uma chave PIX.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await savePixKey(key);
      apply(r.pixKey ?? key);
      setEditing(false);
      setDraft("");
      success("Chave PIX salva.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError(null);
    try {
      await deletePixKey();
      apply(null);
      success("Chave PIX removida.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{label}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        ) : editing || !pixKey ? (
          <div className="space-y-3">
            <Input
              label={pixKey ? "Nova chave PIX" : "Chave PIX"}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={save} disabled={saving}>
                {saving ? <Spinner size="sm" /> : "Salvar"}
              </Button>
              {pixKey && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setDraft("");
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {revealed ? pixKey : maskPixKey(pixKey)}
              </p>
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                aria-label={revealed ? "Ocultar chave PIX" : "Mostrar chave PIX"}
                aria-pressed={revealed}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(true);
                  setDraft(pixKey);
                  setRevealed(false);
                }}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Remover a chave PIX de recebimento?")) void remove();
                }}
                disabled={saving}
                className="gap-1.5 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
