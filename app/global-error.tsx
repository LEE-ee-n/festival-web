"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold">페이지를 불러오지 못했습니다</h1>
          <p className="text-sm text-slate-600">
            잠시 후 다시 시도해 주세요. 오류는 자동으로 확인됩니다.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
