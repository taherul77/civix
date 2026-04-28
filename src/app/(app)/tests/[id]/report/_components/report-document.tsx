"use client";

import { notFound } from "next/navigation";
import { ShieldCheck, FileCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTestQuery, useSampleQuery, useProjectQuery } from "@/server/queries";
import { useLoc } from "@/lib/i18n-data";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

export function ReportDocument({ id }: { id: string }) {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: test } = useTestQuery(id);
  const { data: sample } = useSampleQuery(test?.sampleId);
  const { data: project } = useProjectQuery(test?.projectId);

  if (!test) notFound();
  const reportNum = `RPT-2026-${test.code.split("-").pop()}`;

  return (
    <>
      <div className="bg-white text-slate-900 mx-auto max-w-4xl p-10 shadow-sm border border-slate-200 rounded-lg print:shadow-none print:border-0 print:rounded-none print:p-0">
        <header className="border-b-2 border-brand-700 pb-4 mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-brand-700 text-white grid place-items-center font-bold text-xl">
              CX
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-900">CiviXLab</div>
              <div className="text-xs text-slate-500">ISO 17025:2017 • SAAC-Accredited</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-base text-slate-900">TEST REPORT</div>
            <div className="font-mono mt-1">{reportNum}</div>
            <div className="text-slate-500 mt-1">Issue: {test.testDate} • Rev. 0</div>
          </div>
        </header>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">{loc(test.name)}</h1>
          <div className="text-sm text-slate-600 mt-1">
            {tt("Standard")}: <span className="font-medium">{test.standard}</span>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
              {tt("Project information")}
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <Row label={tt("Project name")}>{loc(project?.name)}</Row>
                <Row label={tt("Project code")}><span className="font-mono text-xs">{fmtAny(project?.code ?? "", lang)}</span></Row>
                <Row label={tt("Client")}>{loc(project?.client)}</Row>
                <Row label={tt("Location")}>{loc(project?.city)}</Row>
                <Row label={tt("Engineer")}>{loc(project?.engineer)}</Row>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
              {tt("Sample information")}
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <Row label={tt("Sample code")}><span className="font-mono text-xs">{fmtAny(sample?.code ?? "", lang)}</span></Row>
                <Row label={tt("Type")}><span className="capitalize">{sample ? tt(sample.type.charAt(0).toUpperCase() + sample.type.slice(1)) : "—"}</span></Row>
                <Row label={tt("Location")}>{loc(sample?.location)}</Row>
                <Row label={tt("Sampled by")}>{loc(sample?.sampledBy)}</Row>
                <Row label={tt("Sample date")}>{fmtAny(sample?.date ?? "", lang)}</Row>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            {tt("Test method")}
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <Row label={tt("Test code")}><span className="font-mono text-xs">{fmtAny(test.code, lang)}</span></Row>
              <Row label={tt("Standard")}>{test.standard}</Row>
              <Row label={tt("Test date")}>{fmtAny(test.testDate, lang)}</Row>
              <Row label={tt("Technician")}>{loc(test.technician)}</Row>
              <Row label={tt("Equipment")}>Forney VFD F-505 • S/N FV-9921 (cal. due 2026-09-12)</Row>
              <Row label={tt("Conditions")}>23 °C / 96% RH / 1013 hPa</Row>
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            {tt("Results")}
          </h2>
          {test.primaryResult ? (
            <div className="rounded-lg border-2 border-brand-700 p-5 bg-brand-50">
              <div className="text-[10px] uppercase tracking-wider text-brand-700 font-bold">
                {loc(test.primaryResult.label)}
              </div>
              <div className="text-4xl font-bold text-brand-900 mt-1">
                {fmtAny(test.primaryResult.value, lang)} <span className="text-xl text-brand-700">{test.primaryResult.unit}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">{tt("Results pending — test in progress.")}</div>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Conformity assessment
          </h2>
          <div
            className={`rounded-lg p-4 border-2 ${
              test.passFail === "pass"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : test.passFail === "fail"
                ? "border-rose-600 bg-rose-50 text-rose-900"
                : "border-slate-300 bg-slate-50 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold uppercase tracking-wider text-sm">
                  {test.passFail === "pass" ? "Conforms" : test.passFail === "fail" ? "Does not conform" : "Pending"}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  Evaluated against {test.standard}
                </div>
              </div>
              <FileCheck className="w-10 h-10 opacity-60" />
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Remarks
          </h2>
          <p className="text-sm">
            All test procedures were performed in accordance with the referenced standard. Equipment
            calibration verified prior to test. Specimen condition and curing complied with SBC 304.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-4 mb-6 mt-10">
          {["Tested by", "Reviewed by", "Approved by"].map((role, i) => (
            <div key={role} className="text-center">
              <div className="h-14 border-b border-slate-300 mb-2 italic text-slate-600 flex items-end justify-center pb-1 text-xs">
                {i === 0 ? loc(test.technician) : i === 1 ? tt("Eng. M. Hamzah") : tt("Dr. A. Al-Rashid")}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{tt(role)}</div>
              <div className="text-xs mt-1 text-slate-600">{fmtAny(test.testDate, lang)}</div>
            </div>
          ))}
        </section>

        <footer className="mt-10 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
          <div className="col-span-2 text-[10px] text-slate-500 leading-relaxed">
            This report shall not be reproduced except in full without written approval from the
            laboratory. Results relate only to the items tested. Statement of conformity per
            ISO 17025 §7.8.6 with simple acceptance rule (w = 0).
            <div className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700">
              <ShieldCheck className="w-3 h-3" /> Digitally signed • Verifiable at civixlab.sa/verify/{reportNum}
            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-24 h-24 grid grid-cols-7 grid-rows-7 gap-px bg-slate-100 p-1.5 rounded">
              {Array.from({ length: 49 }).map((_, i) => (
                <div key={i} className={Math.random() > 0.5 ? "bg-slate-900" : "bg-transparent"} />
              ))}
            </div>
          </div>
        </footer>
      </div>

      <div className="text-center text-xs text-[rgb(var(--muted))] print:hidden">
        Page 1 of 1 • <StatusBadge value={test.status} /> <StatusBadge value={test.passFail} />
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1.5 pr-4 text-slate-500 text-xs w-2/5">{label}</td>
      <td className="py-1.5 font-medium">{children}</td>
    </tr>
  );
}
