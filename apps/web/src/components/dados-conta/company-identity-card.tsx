"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Pencil, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast-provider";
import { ApiError } from "@/lib/client-api";
import {
  getBranding,
  updateBranding,
  validateLogo,
  LOGO_ACCEPT,
  NAME_MAX,
  type Branding,
} from "@/lib/profile/branding";

export function CompanyIdentityCard() {
  const { success } = useToast();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getBranding()
      .then((b) => {
        if (active) setBranding(b);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  function startEdit() {
    setName(branding?.companyDisplayName ?? "");
    setLogo(null);
    setLogoError(null);
    setSaveError(null);
    setEditing(true);
  }

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSaveError(null);
    if (!file) {
      setLogo(null);
      setLogoError(null);
      return;
    }
    const err = validateLogo(file);
    setLogoError(err);
    setLogo(err ? null : file);
  }

  async function save() {
    setSaveError(null);
    if (logoError) return;
    const trimmed = name.trim();
    if (trimmed.length > NAME_MAX) {
      setSaveError(`O nome pode ter até ${NAME_MAX} caracteres.`);
      return;
    }
    if (!trimmed && !logo) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateBranding({
        companyDisplayName: trimmed || undefined,
        logo: logo ?? undefined,
      });
      setBranding(updated);
      setEditing(false);
      success("Identidade atualizada.");
    } catch (err) {
      setSaveError(
        err instanceof ApiError && err.status === 413
          ? "Arquivo muito grande. O limite é 2 MB."
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  const logoUrl = branding?.companyLogoUrl;
  const showLogo = typeof logoUrl === "string" && logoUrl.startsWith("https://");

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Identidade da empresa
          </p>
          {!loading && !error && !editing && (
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={startEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : error ? (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a identidade.
            </p>
            <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => setNonce((n) => n + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : editing ? (
          <div className="space-y-3">
            <Input
              label="Nome público da empresa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="Como sua empresa aparece para o importador"
            />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept={LOGO_ACCEPT}
                onChange={onPickLogo}
                className="hidden"
              />
              <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {logo ? logo.name : "Enviar logo"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP ou SVG, até 2 MB.</p>
              {logoError && <p className="mt-1 text-sm text-destructive">{logoError}</p>}
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={save} disabled={saving}>
                {saving ? <Spinner size="sm" /> : "Salvar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {showLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={branding?.companyDisplayName ?? "Logo da empresa"}
                className="h-12 w-12 rounded-xl object-contain"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </span>
            )}
            <p className="text-base font-medium text-foreground">
              {branding?.companyDisplayName ?? "Nome não definido"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
