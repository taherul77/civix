"use client";

import { api } from "@/server/api";
import { getActor } from "@/lib/auth-context";
import type { Test } from "@/lib/mock-data";
import type { TestContext } from "@/components/test-form/context-bar";

interface SubmitArgs {
  /** Catalog code of the test template (e.g. "A4", "B3"). It is stored as the test code so
   *  the engine and the report can find the template again. */
  code: string;
  name: string;
  category: Test["category"];
  standard: string;
  ctx: TestContext;
  status: Test["status"];
  passFail: Test["passFail"];
  primaryResult?: { value: number; unit: string; label: string };
  /** The values entered on the form. Needed to edit a returned test and printed on the report. */
  inputData?: Record<string, unknown>;
  /** Engine results to store alongside the inputs. */
  calculatedResults?: Record<string, unknown>;
}

/**
 * Persist a test record from a generic / bespoke test form.
 *
 * Always creates the record as `draft` so the audit trail captures
 * `create -> submit` as two distinct events. If the form's status is
 * `submitted`, immediately calls `api.tests.submit()` for the second event.
 */
export async function submitTest(args: SubmitArgs): Promise<string> {
  const { projectId, sampleId } = args.ctx;
  if (!projectId || !sampleId) {
    throw new Error("Choose a project and a sample (of this test's type) before saving.");
  }

  const actor = getActor();
  const created = await api.tests.create({
    code: args.code,
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
    inputData: args.inputData,
    calculatedResults: args.calculatedResults,
  });

  if (args.status === "submitted" && actor) {
    await api.tests.submit(created.id);
  }
  return args.code;
}

/**
 * Save corrections to a returned (or draft) test and send it back for review.
 * The API refuses edits once a test is in review or approved.
 */
export async function resubmitTest(testId: string, args: {
  inputData: Record<string, unknown>;
  calculatedResults?: Record<string, unknown>;
  passFail: Test["passFail"];
  testDate?: string;
  note?: string;
}): Promise<void> {
  await api.tests.update(testId, {
    inputData: args.inputData,
    calculatedResults: args.calculatedResults,
    passFail: args.passFail,
    testDate: args.testDate,
  });
  await api.tests.submit(testId, { comment: args.note });
}
