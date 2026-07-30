"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { getCurrentAdminAccess } from "@/lib/auth/getCurrentAdminAccess";
import { typography } from "@/lib/typography";

export default function CommonHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuthState() {
      try {
        const { user, isAdmin: hasAdminAccess } =
          await getCurrentAdminAccess();

        setUserEmail(user?.email ?? null);
        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error("Failed to load authentication state", error);
        setUserEmail(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        void loadAuthState();
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert("로그아웃에 실패했습니다.");
      return;
    }

    window.location.href = "/";
  }

  return (
  <header className="bg-surface text-ink">
    <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between border-b border-line px-4 sm:px-6">
      <Link
        href="/"
        className={`${typography.brand} flex items-center gap-2.5`}
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-festival-coral">
          <span className="inline-block text-xl leading-none text-white animate-[note-bounce_6s_ease-in-out_infinite]">
            ♪
          </span>
        </span>

        <span>Festival Calendar</span>
      </Link>

      <div className={`${typography.meta} flex items-center gap-3`}>
        {isLoading ? (
          <span className="text-ink-muted">
            로그인 확인 중
          </span>
        ) : userEmail ? (
          <>
            <span className="hidden text-ink-tertiary sm:inline">
              {isAdmin ? "관리자" : "회원"} · {userEmail}
            </span>

            {isAdmin && (
              <Link
                href="/admin"
                className={`${typography.metaStrong} rounded-full border border-line px-4 py-1.5 text-ink-secondary hover:bg-surface-muted`}
              >
                관리자
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`${typography.metaStrong} rounded-full border border-line px-4 py-1.5 text-ink-secondary hover:bg-surface-muted`}
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            href="/admin/login"
            className={`${typography.metaStrong} rounded-full border border-line px-4 py-1.5 text-ink-secondary hover:bg-surface-muted`}
          >
            로그인
          </Link>
        )}
      </div>
    </div>
  </header>
);
}
