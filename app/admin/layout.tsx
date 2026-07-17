"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getCurrentAdminAccess } from "@/lib/auth/getCurrentAdminAccess";
import { supabase } from "@/lib/supabase/client";

type AdminLayoutProps = {
  children: ReactNode;
};

type AccessState = "checking" | "authorized" | "error";

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [accessState, setAccessState] =
    useState<AccessState>("checking");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let isCancelled = false;

    async function checkAdminAccess() {
      try {
        const { user, isAdmin } = await getCurrentAdminAccess();

        if (isCancelled) {
          return;
        }

        if (!user) {
          router.replace("/admin/login");
          return;
        }

        if (!isAdmin) {
          router.replace("/");
          return;
        }

        setAccessState("authorized");
      } catch (error) {
        console.error("Failed to verify admin access", error);

        if (!isCancelled) {
          setAccessState("error");
        }
      }
    }

    queueMicrotask(() => {
      if (!isCancelled) {
        setAccessState("checking");
        void checkAdminAccess();
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isLoginPage, retryCount, router]);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/admin/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return children;
  }

  if (accessState === "authorized") {
    return children;
  }

  if (accessState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="font-bold text-slate-900">
            관리자 권한을 확인하지 못했습니다.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            네트워크 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((value) => value + 1)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">관리자 권한 확인 중...</p>
    </main>
  );
}
