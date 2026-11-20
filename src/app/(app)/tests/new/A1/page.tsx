import { Suspense } from "react";
import { A1Form } from "./_components/form";

// useSearchParams (edit mode) needs a Suspense boundary.
export default function A1Page() {
  return (
    <Suspense fallback={<div className="card p-10 text-center text-sm text-[rgb(var(--muted))]">Loading…</div>}>
      <A1Form />
    </Suspense>
  );
}
