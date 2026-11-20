import { Suspense } from "react";
import { A4Form } from "./_components/form";

// useSearchParams (edit mode) needs a Suspense boundary.
export default function A4Page() {
  return (
    <Suspense fallback={<div className="card p-10 text-center text-sm text-[rgb(var(--muted))]">Loading…</div>}>
      <A4Form />
    </Suspense>
  );
}
