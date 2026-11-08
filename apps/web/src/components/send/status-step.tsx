"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Clock, Download, RotateCcw, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useSendStatus } from "@/lib/send/use-send-status";
import type { SendCurrency, SendResult, SendStatus } from "@/lib/send/types";

type NodeState = "done" | "active" | "error" | "todo";
interface TimelineNode {
  label: string;
  sub?: string;
  state: NodeState;
}

/**
 * Step 5: live status. Polls until terminal and shows the Avenia timeline
 * (Pedido recebido → Em processamento pela Avenia → Concluído). No deadlines;
 * refusals carry Avenia's reason. Terminal actions per outcome.
 */
export function StatusStep({
  currency,
  send,
  onRetry,
}: {
  currency: SendCurrency;
  send: SendResult;
  onRetry: (target: "valor" | "revisao") => void;
}) {
  const t = useTranslations("enviar");
  const router = useRouter();
  const { status, reason } = useSendStatus(send.id, send);

  const header = headerFor(status, reason, t);
  const nodes = timelineFor(status, reason, t);

  return (
    <div className="space-y-5">
      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3.5">
          <span className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full ${header.iconBg}`}>
            <header.Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-[200px] flex-1">
            <div className="font-serif text-xl font-bold text-foreground">{header.title}</div>
            <div className="mt-0.5 text-sm leading-snug text-muted-foreground">{header.subtitle}</div>
          </div>
          <span role="status" className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${header.badgeClass}`}>
            {header.badge}
          </span>
        </div>

        <ol className="m-0 flex list-none flex-col p-0" aria-label={header.title}>
          {nodes.map((node, i) => (
            <li key={node.label} className="flex gap-3.5">
              <div className="flex w-[22px] shrink-0 flex-col items-center">
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${nodeRing(node.state)}`}>
                  {node.state === "done" && <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />}
                  {node.state === "error" && <X className="h-3 w-3 text-primary-foreground" aria-hidden="true" />}
                  {node.state === "active" && <Spinner size="sm" />}
                </span>
                {i < nodes.length - 1 && (
                  <span className={`w-0.5 flex-1 ${node.state === "done" ? "bg-primary" : "bg-border"}`} style={{ minHeight: 26 }} />
                )}
              </div>
              <div className="min-w-0 pb-4">
                <div className={`text-[14.5px] font-semibold ${node.state === "todo" ? "text-muted-foreground" : "text-foreground"}`}>
                  {node.label}
                </div>
                {node.sub && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{node.sub}</div>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap justify-end gap-2.5">
        {status === "concluido" && (
          <button
            type="button"
            onClick={() => router.push("/enviar")}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-input bg-card px-5 text-sm font-semibold hover:border-foreground"
          >
            {t("status.newSend")}
          </button>
        )}
        {(status === "recusado" || status === "falha") && (
          <button
            type="button"
            onClick={() => router.push("/extrato")}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-input bg-card px-5 text-sm font-semibold hover:border-foreground"
          >
            {t("status.viewStatement")}
          </button>
        )}
        <PrimaryAction status={status} t={t} router={router} onRetry={onRetry} currency={currency} />
      </div>
    </div>
  );
}

function PrimaryAction({
  status,
  t,
  router,
  onRetry,
}: {
  status: SendStatus;
  t: ReturnType<typeof useTranslations>;
  router: ReturnType<typeof useRouter>;
  onRetry: (target: "valor" | "revisao") => void;
  currency: SendCurrency;
}) {
  const base =
    "inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90";
  if (status === "processando")
    return (
      <button type="button" onClick={() => router.push("/extrato")} className={base}>
        {t("status.viewStatement")}
      </button>
    );
  if (status === "concluido")
    // Receipt lives in the Extrato "Envios" detail (Fatia 8); land the user there.
    return (
      <button type="button" onClick={() => router.push("/extrato")} className={base}>
        <Download className="h-4 w-4" aria-hidden="true" />
        {t("status.downloadReceipt")}
      </button>
    );
  return (
    <button
      type="button"
      onClick={() => onRetry(status === "recusado" ? "valor" : "revisao")}
      className={base}
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {t("status.retry")}
    </button>
  );
}

function headerFor(status: SendStatus, reason: string | null, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "concluido":
      return {
        Icon: Check,
        iconBg: "bg-primary/10 text-primary",
        badgeClass: "bg-primary/10 text-primary",
        badge: t("status.badgeDone"),
        title: t("status.titleDone"),
        subtitle: t("status.subDone"),
      };
    case "recusado":
      return {
        Icon: X,
        iconBg: "bg-destructive/10 text-destructive",
        badgeClass: "bg-destructive/10 text-destructive",
        badge: t("status.badgeRefused"),
        title: t("status.titleRefused"),
        subtitle: t("status.subRefused", { reason: reason ?? t("status.refusedDefaultReason") }),
      };
    case "falha":
      return {
        Icon: AlertTriangle,
        iconBg: "bg-warning/10 text-warning",
        badgeClass: "bg-warning/10 text-warning",
        badge: t("status.badgeFailed"),
        title: t("status.titleFailed"),
        subtitle: t("status.subFailed"),
      };
    default:
      return {
        Icon: Clock,
        iconBg: "bg-muted text-foreground/80",
        badgeClass: "bg-muted text-foreground/80",
        badge: t("status.badgeProcessing"),
        title: t("status.titleProcessing"),
        subtitle: t("status.subProcessing"),
      };
  }
}

function timelineFor(
  status: SendStatus,
  reason: string | null,
  t: ReturnType<typeof useTranslations>,
): TimelineNode[] {
  const received = t("status.tlReceived");
  const processing = t("status.tlProcessing");
  if (status === "concluido")
    return [
      { label: received, state: "done" },
      { label: processing, state: "done" },
      { label: t("status.tlDone"), sub: t("status.tlDoneSub"), state: "done" },
    ];
  if (status === "recusado")
    return [
      { label: received, state: "done" },
      { label: processing, state: "done" },
      { label: t("status.tlRefused"), sub: reason ?? t("status.refusedDefaultReason"), state: "error" },
    ];
  if (status === "falha")
    return [
      { label: received, sub: t("status.tlFailedSub"), state: "error" },
      { label: processing, state: "todo" },
      { label: t("status.tlDone"), state: "todo" },
    ];
  return [
    { label: received, state: "done" },
    { label: processing, sub: t("status.tlProcessingSub"), state: "active" },
    { label: t("status.tlDone"), state: "todo" },
  ];
}

function nodeRing(state: NodeState): string {
  if (state === "done") return "border-primary bg-primary";
  if (state === "error") return "border-destructive bg-destructive";
  if (state === "active") return "border-primary bg-transparent";
  return "border-input bg-transparent";
}
