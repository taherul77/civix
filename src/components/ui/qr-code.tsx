"use client";

import { useMemo } from "react";
import qrcodeGen from "qrcode-generator";

interface Props {
  value: string;
  size?: number;          // pixels (square)
  className?: string;
}

/**
 * Pure-SVG QR code. Uses `qrcode-generator` to compute the module matrix and
 * renders one `<rect>` per dark module — no canvas, no images, scales sharply.
 */
export function QrCode({ value, size = 192, className }: Props) {
  const { matrix, modules } = useMemo(() => {
    const qr = qrcodeGen(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const m: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
      m.push(row);
    }
    return { matrix: m, modules: n };
  }, [value]);

  const cellSize = 1; // viewBox uses module coordinates; size scales via outer SVG

  return (
    <svg
      role="img"
      aria-label="QR code"
      viewBox={`0 0 ${modules} ${modules}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={modules} height={modules} fill="white" />
      {matrix.map((row, r) =>
        row.map((isDark, c) =>
          isDark ? <rect key={`${r}-${c}`} x={c} y={r} width={cellSize} height={cellSize} fill="black" /> : null
        )
      )}
    </svg>
  );
}
