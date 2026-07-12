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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-bold text-slate-950">
          Festival Calendar
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {isLoading ? (
            <span className="text-slate-400">
              로그인 확인 중
            </span>
          ) : userEmail ? (
            <>
              <span className="text-slate-600">
                {isAdmin ? "관리자" : "회원"} · {userEmail}
              </span>
            
                {isAdmin && (
                    <Link
                        href="/admin"
                        className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700"
                    >
                        관리자 페이지
                    </Link>
                    )}
                    
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-700"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}