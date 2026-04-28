"use client";

import { useData } from "@/store/data-store";
import type { Test } from "@/lib/mock-data";
import type { TestContext } from "@/components/test-form/context-bar";

interface SubmitArgs {
  code: string;
  name: string;
  category: Test["category"];
  standard: string;
  ctx: TestContext;
  status: Test["status"];
  passFail: Test["passFail"];
  primaryResult?: { value: number; unit: string; label: string };
}

const yymm = () => {
  const d = new Date();
  return `${String(d.getFullYear()).slice(2)}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function nextTestCode() {
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `T-${yymm()}-${n}`;
}

export function submitTest(args: SubmitArgs): string {
  const projects = useData.getState().projects;
  const samples = useData.getState().samples;
  const projectId = args.ctx.projectId || projects[0]?.id || "";
  const sampleId = args.ctx.sampleId
    || samples.find((s) => s.projectId === projectId)?.id
    || samples[0]?.id
    || "";

  const newCode = nextTestCode();
  useData.getState().addTest({
    code: newCode,
    name: args.name,
    category: args.category,
    standard: args.standard,
    sampleId,
    projectId,
    testDate: args.ctx.testDate,
    technician: args.ctx.technician || "—",
    status: args.status,
    passFail: args.passFail,
    primaryResult: args.primaryResult,
  });
  return newCode;
}
