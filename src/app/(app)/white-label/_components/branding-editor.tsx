"use client";

import { useState } from "react";
import { Palette, FlaskConical } from "lucide-react";

const presets = [
  { name: "Aramco Blue",   primary: "#0033A0", accent: "#00B5E2" },
  { name: "NEOM Green",    primary: "#0E7C66", accent: "#9CD7C4" },
  { name: "Red Sea Coral", primary: "#C0392B", accent: "#F4A199" },
  { name: "Diriyah Sand",  primary: "#8B6F2A", accent: "#D9B266" },
];

export function BrandingEditor() {
  const [primary, setPrimary] = useState("#2563eb");
  const [accent, setAccent] = useState("#0ea5e9");
  const [labName, setLabName] = useState("Saudi Aramco Materials Lab");
  const [tagline, setTagline] = useState("ISO 17025 :: SAAC Accredited :: Riyadh");
  const [headerEn, setHeaderEn] = useState("Test Report");
  const [headerAr, setHeaderAr] = useState("تقرير اختبار");
  const [disclaimer, setDisclaimer] = useState(
    "This report shall not be reproduced except in full without written approval. Results relate only to the items tested."
  );
  const [showQR, setShowQR] = useState(true);
  const [showLogo, setShowLogo] = useState(true);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Editor */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-4 inline-flex items-center gap-2"><Palette className="w-4 h-4" /> Color palette</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ColorRow label="Primary" value={primary} onChange={setPrimary} />
            <ColorRow label="Accent" value={accent} onChange={setAccent} />
          </div>
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-2">Presets</div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => { setPrimary(p.primary); setAccent(p.accent); }}
                className="text-left rounded-lg border border-[rgb(var(--border))] p-3 hover:border-brand-500 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded" style={{ background: p.primary }} />
                  <div className="w-5 h-5 rounded" style={{ background: p.accent }} />
                </div>
                <div className="text-sm font-medium">{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="font-semibold mb-2">Identity</h3>
          <Field label="Laboratory name"><input className="input" value={labName} onChange={(e) => setLabName(e.target.value)} /></Field>
          <Field label="Tagline / accreditation line"><input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Report title (EN)"><input className="input" value={headerEn} onChange={(e) => setHeaderEn(e.target.value)} /></Field>
            <Field label="Report title (AR)"><input className="input text-right" dir="rtl" value={headerAr} onChange={(e) => setHeaderAr(e.target.value)} /></Field>
          </div>
          <Field label="Disclaimer">
            <textarea className="input" rows={3} value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} />
          </Field>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Report features</h3>
          <ToggleRow label="Show laboratory logo" value={showLogo} onChange={setShowLogo} />
          <ToggleRow label="Show verification QR code" value={showQR} onChange={setShowQR} />
          <ToggleRow label="Bilingual (EN + AR) reports" value={true} onChange={() => {}} />
          <ToggleRow label="Digital signature block" value={true} onChange={() => {}} />
        </div>
      </div>

      {/* Live preview */}
      <div className="card p-4">
        <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-2 font-semibold">Live preview</div>
        <div className="bg-white text-slate-900 rounded-lg shadow-sm border border-slate-200 p-6 text-sm" style={{ borderTop: `4px solid ${primary}` }}>
          <header className="flex items-start justify-between pb-3 border-b" style={{ borderColor: primary + "33" }}>
            <div className="flex items-center gap-2">
              {showLogo && (
                <div className="w-10 h-10 rounded grid place-items-center text-white text-sm font-bold" style={{ background: primary }}>
                  <FlaskConical className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="font-bold" style={{ color: primary }}>{labName}</div>
                <div className="text-[10px] text-slate-500">{tagline}</div>
              </div>
            </div>
            <div className="text-right text-[10px]">
              <div className="font-bold text-base" style={{ color: primary }}>{headerEn}</div>
              <div className="font-mono text-[10px]">RPT-2026-3201</div>
            </div>
          </header>

          <h2 className="font-bold mt-4 mb-2" style={{ color: primary }}>Compressive Strength of Concrete</h2>
          <div className="text-[10px] text-slate-500 mb-3">Standard: SASO GSO ASTM C39 / C94</div>

          <div className="rounded p-3 mb-3" style={{ background: accent + "20", border: `1px solid ${accent}` }}>
            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: primary }}>f&apos;c @ 28 days</div>
            <div className="text-2xl font-bold" style={{ color: primary }}>38.7 <span className="text-sm">MPa</span></div>
          </div>

          <div className="rounded border-l-4 p-2 text-xs" style={{ borderColor: "#10b981", background: "#10b98115" }}>
            <span className="font-bold text-emerald-700">CONFORMS</span>
            <span className="text-slate-600 ml-2">— Evaluated against SBC 304</span>
          </div>

          <footer className="mt-6 pt-3 border-t border-slate-200 grid grid-cols-3 gap-3 items-end">
            <div className="col-span-2 text-[9px] text-slate-500 leading-snug">{disclaimer}</div>
            {showQR && (
              <div className="ml-auto w-16 h-16 grid grid-cols-6 grid-rows-6 gap-px bg-slate-100 p-1 rounded">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className={Math.random() > 0.5 ? "bg-slate-900" : ""} />
                ))}
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-12 rounded-lg cursor-pointer border border-[rgb(var(--border))]"
      />
      <div className="flex-1">
        <div className="text-xs text-[rgb(var(--muted))]">{label}</div>
        <input className="input font-mono text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border))] last:border-0">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-brand-600" : "bg-[rgb(var(--border))]"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
