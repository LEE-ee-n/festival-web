"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { getCurrentAdminAccess } from "@/lib/auth/getCurrentAdminAccess";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
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

        if (user) {
          const returnPath = normalizeAuthReturnPath(
            window.sessionStorage.getItem(AUTH_RETURN_PATH_KEY),
          );

          window.sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);

          if (
            returnPath &&
            returnPath !== `${window.location.pathname}${window.location.search}`
          ) {
            window.location.replace(returnPath);
            return;
          }
        }
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
  <header className="bg-surface px-3 text-ink sm:px-6">
    <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between border-b border-line px-4 sm:h-[68px] sm:px-6">
      <Link
        href="/"
        className={`${typography.brand} flex items-center`}
      >
        <Image
          src="/images/brand/festibom-logo.png"
          alt="Festibom"
          width={1200}
          height={240}
          className="h-5 w-auto max-w-[105px] object-contain sm:max-w-[126px]"
          priority
        />
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

            <Link
              href="/mypage"
              className={`${typography.metaStrong} rounded-full border border-line px-4 py-1.5 text-ink-secondary hover:bg-surface-muted`}
            >
              마이페이지
            </Link>

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
            href="/login"
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
