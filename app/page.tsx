import { Suspense } from "react";

import Calendar from "@/components/Calendar";

export default function HomePage() {
  return (
    <main className="bg-white px-3 pt-1 pb-6 sm:px-6 sm:pt-1 sm:pb-10">
      <Suspense
        fallback={
          <div className="mx-auto min-h-[640px] w-full max-w-[1500px] animate-pulse bg-slate-50" />
        }
      >
        <Calendar />
      </Suspense>
    </main>
  );
}
