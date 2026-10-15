"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText, Sheet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dark "Exportar" button with an accessible popover (Esc + click-outside close)
 * offering CSV / PDF downloads. On mobile the button is icon-only. Shows a
 * loading state while a download is being prepared.
 */
export function ExportMenu({
  csvHref,
  pdfHref,
}: {
  csvHref: string;
  pdfHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"csv" | "pdf" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function download(kind: "csv" | "pdf", href: string) {
    setLoading(kind);
    setOpen(false);
    // The browser handles the actual download via the anchor; clear the spinner
    // shortly after so the control doesn't hang.
    const a = document.createElement("a");
    a.href = href;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setLoading(null), 1500);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Exportar"
        disabled={loading !== null}
        className="flex h-11 items-center gap-2 rounded-xl bg-[#011a0f] px-4 text-sm font-semibold text-white hover:bg-[#0b3b2e] disabled:opacity-60 dark:bg-primary dark:text-primary-foreground"
      >
        <Download className={cn("h-4 w-4", loading && "animate-pulse")} />
        <span className="hidden sm:inline">
          {loading ? "Gerando…" : "Exportar"}
        </span>
        <ChevronDown className="hidden h-4 w-4 sm:inline" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => download("csv", csvHref)}
            className="flex h-11 w-full items-center gap-2.5 px-3.5 text-sm text-foreground hover:bg-muted"
          >
            <Sheet className="h-4 w-4 text-muted-foreground" />
            Baixar CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => download("pdf", pdfHref)}
            className="flex h-11 w-full items-center gap-2.5 px-3.5 text-sm text-foreground hover:bg-muted"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Baixar PDF
          </button>
        </div>
      )}
    </div>
  );
}
