"use client";

import { useState } from "react";
import { Camera, MapPin, ScanLine, WifiOff, Wifi, Save, ChevronRight, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function FieldPage() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(3);
  const [step, setStep] = useState(1);
  const [type, setType] = useState("concrete");
  const tt = useT();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field sampling (mobile)"
        description="Field-tech preview — capture sample with GPS, barcode and photo. Works offline."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Phone mock */}
        <div className="mx-auto">
          <div className="w-[380px] h-[760px] rounded-[42px] bg-slate-900 p-3 shadow-2xl">
            <div className="w-full h-full rounded-[34px] bg-[rgb(var(--bg))] overflow-hidden flex flex-col relative">
              {/* notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-10" />

              {/* status bar */}
              <div className="h-10 px-6 flex items-center justify-between text-xs font-semibold pt-4">
                <span>9:42</span>
                <span className="flex items-center gap-1">
                  {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
                  {!online && <span className="text-[10px] text-rose-500">Offline</span>}
                </span>
              </div>

              {/* header */}
              <div className="px-5 py-3 border-b border-[rgb(var(--border))] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[rgb(var(--muted))]">{tt("Step")} {step} {tt("of")} 4</div>
                  <h2 className="text-lg font-bold">{tt("New sample")}</h2>
                </div>
                <button onClick={() => setOnline(!online)} className="text-[10px] underline">
                  toggle net
                </button>
              </div>

              {/* progress */}
              <div className="px-5 py-2 flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={cn("h-1 flex-1 rounded-full", n <= step ? "bg-brand-600" : "bg-[rgb(var(--border))]")} />
                ))}
              </div>

              {/* body */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-[rgb(var(--muted))] uppercase tracking-wider mb-2">Type</div>
                      <div className="grid grid-cols-2 gap-2">
                        {["concrete","soil","aggregate","water","steel","cement"].map((t) => (
                          <button
                            key={t}
                            onClick={() => setType(t)}
                            className={cn(
                              "p-3 rounded-xl border text-sm font-medium capitalize transition-colors",
                              type === t ? "bg-brand-600 text-white border-brand-600" : "border-[rgb(var(--border))]"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[rgb(var(--muted))] uppercase tracking-wider mb-2">Project</div>
                      <select className="input">
                        <option>NEOM The Line — Module 4</option>
                        <option>Red Sea Coral Bloom</option>
                        <option>Qiddiya Speed Park</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30 p-6 text-center">
                      <ScanLine className="w-10 h-10 mx-auto text-brand-600 mb-2" />
                      <div className="font-semibold">Scan sample barcode</div>
                      <div className="text-xs text-[rgb(var(--muted))] mt-1">Or enter manually below</div>
                    </div>
                    <input className="input text-center font-mono" placeholder="S-26-04-XXXX" defaultValue="S-26-04-1051" />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <MapPin className="w-4 h-4" /><span className="font-semibold text-sm">GPS locked</span>
                      </div>
                      <div className="font-mono text-xs mt-2 text-emerald-700/80 dark:text-emerald-400/80">
                        24.71234° N, 46.67542° E
                      </div>
                      <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                        Accuracy: ±3.4 m · Speed: 0 km/h
                      </div>
                    </div>
                    <input className="input" placeholder="Location description" defaultValue="Pile cap PC-22, level B2" />
                    <textarea className="input" rows={3} placeholder="Notes" defaultValue="Pour started 09:15 — ambient 36°C" />
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-200 dark:bg-slate-800 aspect-[4/3] grid place-items-center">
                      <div className="text-center">
                        <Camera className="w-12 h-12 mx-auto text-slate-500 mb-2" />
                        <div className="text-xs text-[rgb(var(--muted))]">Tap to capture</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3].map((n) => (
                        <div key={n} className="aspect-square rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 grid place-items-center text-[10px] font-semibold">
                          IMG_{n.toString().padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="border-t border-[rgb(var(--border))] p-3 space-y-2">
                {step < 4 ? (
                  <button onClick={() => setStep(step + 1)} className="btn btn-primary w-full">
                    {tt("Continue")} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => { setStep(1); setPending(pending + 1); }} className="btn btn-primary w-full">
                    <Save className="w-4 h-4" /> {online ? tt("Submit") : tt("Save offline")}
                  </button>
                )}
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className="btn btn-ghost w-full">{tt("Back")}</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold mb-3">{tt("Field-tech features")}</h3>
            <ul className="space-y-3 text-sm">
              <Feature label="Offline-first SQLite cache" />
              <Feature label="GPS coordinates with accuracy band (Expo Location)" />
              <Feature label="Barcode / QR sample scanning (Expo Camera)" />
              <Feature label="Photo capture, geotagged + timestamped" />
              <Feature label="Background sync when network returns" />
              <Feature label="Saudi Council of Engineers ID verification" />
              <Feature label="Chain-of-custody signature on tablet" />
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{tt("Pending sync")}</h3>
              <span className="badge badge-warn">{pending} {tt("samples")}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">
              Samples captured offline will sync automatically when the device reconnects.
              Each sample retains its original GPS, timestamp and signatures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      <span>{label}</span>
    </li>
  );
}
