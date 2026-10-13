"use client";

import { useState } from "react";
import { InstructionsView } from "./instructions-view";
import { DICT, type Lang } from "@/lib/receive/i18n";
import type { PublicInstructionsResult } from "@/lib/receive/server";

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border text-xs font-medium">
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={
            l === lang
              ? "bg-primary px-3 py-1.5 text-primary-foreground"
              : "px-3 py-1.5 text-muted-foreground hover:bg-muted"
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function PublicPay({
  result,
  shareToken,
}: {
  result: PublicInstructionsResult;
  shareToken: string;
}) {
  const [lang, setLang] = useState<Lang>("pt");
  const dict = DICT[lang];

  let title: string | null = null;
  let body: string | null = null;
  if (result.kind === "expired") {
    title = dict.expiredTitle;
    body = dict.expiredBody;
  } else if (result.kind === "not_found") {
    title = dict.notFoundTitle;
    body = dict.notFoundBody;
  } else if (result.kind === "error") {
    title = dict.errorTitle;
    body = dict.errorBody;
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-sm font-bold text-primary-foreground">B</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Bravachain</span>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {result.kind === "ok" ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            {result.data.exporter.logoUrl?.startsWith("https://") ? (
              // Raw <img> on purpose: the logo host is not allow-listed for
              // next/image until the backend returns signed URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.data.exporter.logoUrl}
                alt={result.data.exporter.displayName}
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : null}
            <div>
              <p className="text-xs text-muted-foreground">{dict.from}</p>
              <p className="text-base font-semibold text-foreground">
                {result.data.exporter.displayName}
                {result.data.exporter.country ? ` · ${result.data.exporter.country}` : ""}
              </p>
            </div>
          </div>

          <InstructionsView
            data={result.data}
            dict={dict}
            pdfHref={`/api/receive/pay/${shareToken}/pdf`}
          />
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      )}
    </main>
  );
}
