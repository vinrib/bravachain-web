import { formatMoney, formatDate, formatDateTime } from "@bravachain/shared";
import type { Transaction } from "@/lib/models";

export interface ExtratoExportOptions {
  transactions: Transaction[];
  /** Currency for the summary line; individual rows carry their own. */
  currency?: string;
  /** Cooperative / account label printed in the header. */
  accountLabel?: string;
}

/**
 * Generates and downloads a PDF account statement (extrato) for the
 * cooperative. Runs entirely client-side; jspdf is imported dynamically so it
 * stays out of the initial bundle.
 */
export async function downloadExtrato({
  transactions,
  currency = "BRL",
  accountLabel,
}: ExtratoExportOptions) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(0, 182, 122); // primary green
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("BRAVACHAIN", margin, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Extrato da conta", margin, 21);
  doc.text(`Gerado em ${formatDateTime(new Date())}`, pageW - margin, 15, {
    align: "right",
  });

  // ── Sub-header ──────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  let cursorY = 36;
  if (accountLabel) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(accountLabel, margin, cursorY);
    cursorY += 6;
  }

  const net = transactions.reduce(
    (acc, tx) => acc + (tx.direction === "in" ? tx.amount : -tx.amount),
    0,
  );
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${transactions.length} movimentação(ões)  •  Saldo do período: ${formatMoney(net, { currency })}`,
    margin,
    cursorY,
  );

  // ── Table ───────────────────────────────────────────────
  autoTable(doc, {
    startY: cursorY + 4,
    head: [["Data", "Descrição", "Valor"]],
    body: transactions.map((tx) => [
      formatDate(tx.createdAt),
      tx.description,
      `${tx.direction === "in" ? "+" : "-"} ${formatMoney(tx.amount, { currency: tx.currency })}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [0, 182, 122], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [40, 40, 40] },
    columnStyles: {
      2: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  // ── Footer ──────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Bravachain — Pagamentos cross-border para cooperativas",
    pageW / 2,
    footerY,
    { align: "center" },
  );

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`extrato-bravachain-${stamp}.pdf`);
}
