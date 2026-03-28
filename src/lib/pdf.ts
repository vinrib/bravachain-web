import type { Currency } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";

export interface ReceiptData {
  id: string;
  date: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientKey: string;
  amountSent: number;
  fromCurrency: Currency;
  amountReceived: number;
  toCurrency: Currency;
  fee: number;
  spread: number;
  exchangeRate: number;
  status: string;
  estimatedArrival?: string;
}

function formatCurrency(value: number, currency: Currency): string {
  const info = CURRENCIES[currency];
  if (currency === "BRL") {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${info.symbol} ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

export async function downloadReceipt(data: ReceiptData) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(0, 182, 122); // primary green
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BRAVACHAIN", margin, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Transferências internacionais", margin, 23);

  // Transaction ID (right side of header)
  doc.setFontSize(8);
  doc.text(`ID: #${data.id}`, pageW - margin, 14, { align: "right" });
  doc.text(
    new Date(data.date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    pageW - margin,
    20,
    { align: "right" }
  );

  // ── Title ───────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROVANTE DE TRANSFERÊNCIA", pageW / 2, 40, { align: "center" });

  // ── Parties table ───────────────────────────────────────
  autoTable(doc, {
    startY: 48,
    head: [],
    body: [
      ["REMETENTE", "DESTINATÁRIO"],
      [data.senderName || "Usuário Bravachain", data.recipientName],
      [data.senderEmail || "—", data.recipientKey],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: (pageW - margin * 2) / 2 },
      1: { cellWidth: (pageW - margin * 2) / 2 },
    },
    margin: { left: margin, right: margin },
    didParseCell(hookData) {
      if (hookData.row.index === 0) {
        hookData.cell.styles.fontSize = 7;
        hookData.cell.styles.textColor = [120, 120, 120];
        hookData.cell.styles.fontStyle = "normal";
      }
    },
  });

  // ── Transaction details ─────────────────────────────────
  const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 6;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, afterTable, pageW - margin, afterTable);

  autoTable(doc, {
    startY: afterTable + 4,
    head: [["DETALHAMENTO DA TRANSFERÊNCIA", ""]],
    body: [
      ["Valor enviado", formatCurrency(data.amountSent, data.fromCurrency)],
      [
        `Spread Bravachain (${((data.spread / data.amountSent) * 100).toFixed(1)}%)`,
        `- ${formatCurrency(data.spread, data.fromCurrency)}`,
      ],
      [
        "Taxa de rede",
        `- ${formatCurrency(data.fee, data.fromCurrency)}`,
      ],
      ["Destinatário recebe", formatCurrency(data.amountReceived, data.toCurrency)],
    ],
    theme: "plain",
    headStyles: {
      fontSize: 8,
      textColor: [120, 120, 120],
      fontStyle: "normal",
      fillColor: false,
    },
    styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 } },
    columnStyles: {
      0: { textColor: [80, 80, 80], cellWidth: (pageW - margin * 2) * 0.65 },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 30, 30] },
    },
    margin: { left: margin, right: margin },
    didParseCell(hookData) {
      // Highlight "Destinatário recebe" row
      if (hookData.row.index === 3 && hookData.section === "body") {
        hookData.cell.styles.textColor = [0, 182, 122];
        hookData.cell.styles.fontSize = 10;
      }
    },
  });

  // ── Exchange info ───────────────────────────────────────
  const afterDetails = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 4;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, afterDetails, pageW - margin, afterDetails);

  autoTable(doc, {
    startY: afterDetails + 4,
    head: [],
    body: [
      [
        "Taxa de câmbio",
        `1 ${data.fromCurrency} = ${data.exchangeRate.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })} ${data.toCurrency}`,
      ],
      ["Tempo estimado", "~2 minutos"],
      ["Status", data.status === "completed" ? "Concluído" : data.status === "pending" ? "Pendente" : data.status],
      ["Prazo", data.estimatedArrival || "Até 1 dia útil"],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 } },
    columnStyles: {
      0: { textColor: [100, 100, 100], cellWidth: (pageW - margin * 2) * 0.55 },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 30, 30] },
    },
    margin: { left: margin, right: margin },
  });

  // ── Footer ──────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 16;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Bravachain — Transferências internacionais",
    pageW / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageW / 2,
    footerY + 5,
    { align: "center" }
  );

  doc.save(`comprovante-${data.id}.pdf`);
}
