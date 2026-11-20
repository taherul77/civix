"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useTestQuery, useTestCommentsQuery } from "@/server/queries";

/**
 * Edit mode for test forms: /tests/new/<code>?edit=<test id> reopens a draft or returned test.
 * The caller prefills its own state from `test.inputData` once, then calls `markPrefilled()`.
 */
export function useEditTest(code: string) {
  const id = useSearchParams().get("edit");
  const { data: test, isLoading } = useTestQuery(id ?? undefined);
  const [prefilled, setPrefilled] = useState(false);
  const problem =
    !id ? null
    : isLoading ? null
    : !test ? "That test could not be found."
    : test.code !== code ? `That test was created with form ${test.code}, not ${code}.`
    : test.status !== "returned" && test.status !== "draft" ? "This test is in review or approved and can no longer be edited."
    : null;
  return {
    id,
    test: test ?? null,
    problem,
    prefilled,
    markPrefilled: () => setPrefilled(true),
    /** Ready for the user to edit and submit. */
    ready: !!id && !problem && prefilled,
  };
}

/** Shows why the reviewer returned the test while the technician edits it. */
export function ReturnReason({ testId }: { testId: string }) {
  const { data: thread = [] } = useTestCommentsQuery(testId);
  const last = [...thread].reverse().find((c) => c.kind === "return");
  if (!last) return null;
  return (
    <div className="rounded-lg border-2 border-amber-400/70 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="font-semibold text-amber-800 dark:text-amber-200">Returned for correction</div>
        <div className="text-sm mt-1 whitespace-pre-wrap break-words">
          <span className="text-[rgb(var(--muted))]">{last.authorName || last.authorEmail}: </span>{last.body}
        </div>
      </div>
    </div>
  );
}

/** Banner shown when the requested test cannot be edited. */
export function EditProblem({ problem, testId }: { problem: string; testId?: string | null }) {
  return (
    <div className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-700 dark:text-rose-300">
      {problem} <Link href={testId ? `/tests/${testId}` : "/tests"} className="underline">Back to the test</Link>
    </div>
  );
}
