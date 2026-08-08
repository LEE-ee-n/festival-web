"use client";

import Link from "next/link";
import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Google 로그인을 시작하지 못했습니다.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-surface px-4 pt-20">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-sm">
        <Link href="/" className="text-sm text-ink-secondary hover:text-ink">
          ← 홈으로 돌아가기
        </Link>
        <p className="mt-8 text-sm font-semibold text-ink-secondary">Festibom</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">로그인</h1>
        <p className="mt-2 text-sm text-ink-muted">
          좋아하는 아티스트와 관람할 공연을 저장해 보세요.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white px-5 py-3 font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4L15.4 17c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5l3.3-2.6Z" />
            <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.7 9.4 6 12 6Z" />
          </svg>
          {isSubmitting ? "Google로 이동 중..." : "Google로 계속하기"}
        </button>

        {errorMessage && <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p>}
      </div>
    </main>
  );
}
