"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function CommonHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuthState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);

      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
      setIsLoading(false);
    }

    void loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadAuthState();
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
  <header className="border-b border-white/10 bg-[#0C0C1E] text-white">
    <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between px-4 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-bold tracking-tight"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-festival-coral">
          <span className="inline-block text-xl leading-none text-white animate-[note-bounce_6s_ease-in-out_infinite]">
            ♪
          </span>
        </span>

        <span>Festival Calendar</span>
      </Link>

      <div className="flex items-center gap-3 text-sm">
        {isLoading ? (
          <span className="text-white/50">
            로그인 확인 중
          </span>
        ) : userEmail ? (
          <>
            <span className="hidden text-white/70 sm:inline">
              {isAdmin ? "관리자" : "회원"} · {userEmail}
            </span>

            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-white/20 px-4 py-1.5 font-medium text-white hover:bg-white/10"
              >
                관리자
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/20 px-4 py-1.5 font-medium text-white hover:bg-white/10"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            href="/admin/login"
            className="rounded-full border border-white/20 px-4 py-1.5 font-medium text-white hover:bg-white/10"
          >
            로그인
          </Link>
        )}
      </div>
    </div>
  </header>
);
}