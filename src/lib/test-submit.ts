"use client";

import { useData } from "@/store/data-store";
import { getActor } from "@/lib/auth-context";
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
  const actor = getActor() ?? undefined;
  // Always create as draft so the audit log records create→submit as two steps.
  const id = useData.getState().addTest({
    code: newCode,
    name: args.name,
    category: args.category,
    standard: args.standard,
    sampleId,
    projectId,
    testDate: args.ctx.testDate,
    technician: args.ctx.technician || actor?.name || "—",
    status: "draft",
    passFail: args.passFail,
    primaryResult: args.primaryResult,
  }, actor);

  if (args.status === "submitted" && actor) {
    useData.getState().submitTestForReview({ testId: id, actor });
  }
  return newCode;
}
