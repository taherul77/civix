"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Printer, ShieldCheck, FileCheck } from "lucide-react";
import { testById, sampleById, projectById } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = testById(id);
  if (!test) notFound();
  const sample = sampleById(test.sampleId);
  const project = projectById(test.projectId);

  const reportNum = `RPT-2026-${test.code.split("-").pop()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/tests/${test.id}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn btn-outline">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white text-slate-900 mx-auto max-w-4xl p-10 shadow-sm border border-slate-200 rounded-lg print:shadow-none print:border-0 print:rounded-none print:p-0">
        {/* Header */}
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

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">{test.name}</h1>
          <div className="text-sm text-slate-600 mt-1">
            Standard: <span className="font-medium">{test.standard}</span>
          </div>
        </div>

        {/* Project + Sample grid */}
        <section className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
              Project information
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <Row label="Project name">{project?.name}</Row>
                <Row label="Project code"><span className="font-mono text-xs">{project?.code}</span></Row>
                <Row label="Client">{project?.client}</Row>
                <Row label="Location">{project?.city}</Row>
                <Row label="Engineer">{project?.engineer}</Row>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
              Sample information
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <Row label="Sample code"><span className="font-mono text-xs">{sample?.code}</span></Row>
                <Row label="Type"><span className="capitalize">{sample?.type}</span></Row>
                <Row label="Location">{sample?.location}</Row>
                <Row label="Sampled by">{sample?.sampledBy}</Row>
                <Row label="Sample date">{sample?.date}</Row>
              </tbody>
            </table>
          </div>
        </section>

        {/* Test method */}
        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Test method
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Test code"><span className="font-mono text-xs">{test.code}</span></Row>
              <Row label="Standard">{test.standard}</Row>
              <Row label="Test date">{test.testDate}</Row>
              <Row label="Technician">{test.technician}</Row>
              <Row label="Equipment">Forney VFD F-505 • S/N FV-9921 (cal. due 2026-09-12)</Row>
              <Row label="Conditions">23 °C / 96% RH / 1013 hPa</Row>
            </tbody>
          </table>
        </section>

        {/* Results */}
        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Results
          </h2>
          {test.primaryResult ? (
            <div className="rounded-lg border-2 border-brand-700 p-5 bg-brand-50">
              <div className="text-[10px] uppercase tracking-wider text-brand-700 font-bold">
                {test.primaryResult.label}
              </div>
              <div className="text-4xl font-bold text-brand-900 mt-1">
                {test.primaryResult.value} <span className="text-xl text-brand-700">{test.primaryResult.unit}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">Results pending — test in progress.</div>
          )}
        </section>

        {/* Pass/Fail */}
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

        {/* Remarks */}
        <section className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Remarks
          </h2>
          <p className="text-sm">
            All test procedures were performed in accordance with the referenced standard. Equipment
            calibration verified prior to test. Specimen condition and curing complied with SBC 304.
          </p>
        </section>

        {/* Signatures */}
        <section className="grid grid-cols-3 gap-4 mb-6 mt-10">
          {["Tested by", "Reviewed by", "Approved by"].map((role, i) => (
            <div key={role} className="text-center">
              <div className="h-14 border-b border-slate-300 mb-2 italic text-slate-600 flex items-end justify-center pb-1 text-xs">
                {i === 0 ? test.technician : i === 1 ? "Eng. M. Hamzah" : "Dr. A. Al-Rashid"}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{role}</div>
              <div className="text-xs mt-1 text-slate-600">{test.testDate}</div>
            </div>
          ))}
        </section>

        {/* Footer */}
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

      <style jsx global>{`
        @media print {
          body { background: white; }
          aside, header.h-16 { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
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
