"use client";

import { useState } from "react";
import { MessageSquare, RotateCcw, CheckCircle2, Send, ClipboardCheck, ShieldCheck } from "lucide-react";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { useTestCommentsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TestComment } from "@/server/contracts";

const KIND: Record<TestComment["kind"], { label: string; icon: typeof MessageSquare; tone: string }> = {
  comment: { label: "Comment",               icon: MessageSquare,  tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  submit:  { label: "Submitted for review",  icon: Send,           tone: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  review:  { label: "Reviewed",              icon: ClipboardCheck, tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
  approve: { label: "Approved",              icon: CheckCircle2,   tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  return:  { label: "Returned for correction", icon: RotateCcw,    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  sign:    { label: "Signed",                icon: ShieldCheck,    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
};

const when = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;

/** Discussion and decisions on a test, oldest first. */
export function CommentThread({ testId }: { testId: string }) {
  const tt = useT();
  const { data: items = [], isLoading } = useTestCommentsQuery(testId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      const ok = await mutate(() => api.tests.addComment(testId, body), "Comment added");
      if (ok) setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4" /> {tt("Review thread")}
      </h3>

      {isLoading && items.length === 0 && <div className="text-sm text-[rgb(var(--muted))]">{tt("Loading…")}</div>}
      {!isLoading && items.length === 0 && (
        <div className="text-sm text-[rgb(var(--muted))] mb-3">{tt("No comments yet. Decisions and notes appear here.")}</div>
      )}

      <ol className="space-y-3 mb-4">
        {items.map((c) => {
          const k = KIND[c.kind] ?? KIND.comment;
          return (
            <li key={c.id} className="flex gap-3">
              <span className={cn("w-8 h-8 rounded-lg grid place-items-center shrink-0", k.tone)}>
                <k.icon className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-[rgb(var(--muted))]">
                  <span className="font-semibold text-[rgb(var(--fg))]">{c.authorName || c.authorEmail}</span>
                  {c.kind !== "comment" && <span>{tt(k.label)}</span>}
                  <span>{when(c.createdAt)}</span>
                </div>
                <div className={cn("text-sm mt-0.5 whitespace-pre-wrap break-words", c.kind === "return" && "font-medium")}>{c.body}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2">
        <textarea
          className="input min-h-[72px]"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          placeholder={tt("Write a comment…")}
        />
        <div className="flex justify-end">
          <button className="btn btn-outline" onClick={add} disabled={busy || !text.trim()}>
            {tt("Add comment")}
          </button>
        </div>
      </div>
    </div>
  );
}
