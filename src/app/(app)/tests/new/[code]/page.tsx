import { Suspense } from "react";
import { DynamicTestForm } from "./_components/dynamic-form";

export default async function GenericTestFormPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // useSearchParams (edit mode) needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="card p-10 text-center text-sm text-[rgb(var(--muted))]">Loading…</div>}>
      <DynamicTestForm code={code} />
    </Suspense>
  );
}
