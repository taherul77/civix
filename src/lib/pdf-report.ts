"use client";

/**
 * Client-side PDF report generator.
 *
 * Uses `html2canvas-pro` to rasterise the report DOM at print resolution and
 * `jspdf` to wrap it as a multi-page A4 PDF with PDF metadata. This is the
 * Puppeteer pipeline from spec §7 implemented in the browser — when the
 * server-side renderer lands, this helper swaps to `fetch('/api/reports/<id>/pdf')`
 * but the call signature stays the same.
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export interface ReportPdfMeta {
  reportNumber: string;
  testName: string;
  testCode: string;
  standard: string;
  tenant: string;
  signedBy?: string;
  signatureSerial?: string;
}

export async function downloadReportPdf(
  rootEl: HTMLElement,
  meta: ReportPdfMeta
): Promise<void> {
  // Render at 2x for crisp text on A4. Background white because the on-screen
  // report has its own white surface.
  const canvas = await html2canvas(rootEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });

  // PDF page geometry
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentW = pageW - margin * 2;
  const ratio = canvas.height / canvas.width;
  const imgW = contentW;
  const imgH = imgW * ratio;

  // PDF metadata (PDF/A-friendly subset).
  pdf.setProperties({
    title: `${meta.reportNumber} — ${meta.testName}`,
    subject: `${meta.testCode} · ${meta.standard}`,
    author: meta.tenant,
    keywords: [
      "CiviXLab",
      "ISO 17025",
      meta.testCode,
      meta.standard,
      meta.signedBy ? `Signed-by:${meta.signedBy}` : "Unsigned",
    ].join(", "),
    creator: "CiviXLab Web (frontend renderer)",
  });

  // Fit the rendered report on a single A4 page, preserving aspect ratio.
  // Slicing across pages (the previous approach) can cut through the QR's
  // modules and produce a distorted artifact on page 2 — undesirable for a
  // verification document, so we scale the image down to fit instead.
  const maxH = pageH - margin * 2;
  const finalH = Math.min(imgH, maxH);
  const finalW = (finalH / imgH) * imgW;
  const offsetX = margin + (contentW - finalW) / 2;
  pdf.addImage(imgData, "PNG", offsetX, margin, finalW, finalH, undefined, "FAST");

  // Footer on every page.
  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    pdf.setFontSize(7);
    pdf.setTextColor(120);
    pdf.text(
      `${meta.reportNumber} · ${meta.tenant} · Page ${p} of ${pageCount}`,
      margin,
      pageH - 5
    );
    pdf.text(
      meta.signatureSerial
        ? `Digitally signed · cert SN ${meta.signatureSerial}`
        : "Unsigned draft",
      pageW - margin,
      pageH - 5,
      { align: "right" }
    );
  }

  pdf.save(`${meta.reportNumber}.pdf`);
}
