"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ACCOUNT_DELETION_CONFIRMATION,
  isRecentAccountSignIn,
} from "@/lib/auth/accountDeletion";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { supabase } from "@/lib/supabase/client";
import { typography } from "@/lib/typography";

type DeleteAccountErrorBody = { error?: string; code?: string };

function readErrorBody(value: unknown): DeleteAccountErrorBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    error: typeof record.error === "string" ? record.error : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
  };
}

export default function AccountDeletionSection() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("accountDeletion") !== "confirm") return;

    queueMicrotask(() => setIsConfirming(true));
    searchParams.delete("accountDeletion");
    const nextSearch = searchParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`,
    );
  }, []);

  function requestReauthentication() {
    const returnPath = normalizeAuthReturnPath(
      "/mypage?accountDeletion=confirm",
    );
    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }
    router.push("/login?reauth=account-deletion");
  }

  async function beginDeletion() {
    setErrorMessage(null);
    try {
      const user = await getCurrentUser();
      if (!user) {
        requestReauthentication();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== "user") {
        setErrorMessage("관리자 계정은 일반 회원 탈퇴 기능을 사용할 수 없습니다.");
        return;
      }

      if (!isRecentAccountSignIn(user.last_sign_in_at)) {
        requestReauthentication();
        return;
      }
      setIsConfirming(true);
    } catch {
      setErrorMessage("로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  async function deleteAccount() {
    if (confirmation !== ACCOUNT_DELETION_CONFIRMATION) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        requestReauthentication();
        return;
      }

      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation }),
      });
      const responseBody = readErrorBody(await response.json());

      if (!response.ok) {
        if (responseBody.code === "REAUTH_REQUIRED") {
          requestReauthentication();
          return;
        }
        throw new Error(
          responseBody.error ?? "회원탈퇴를 완료하지 못했습니다.",
        );
      }

      await supabase.auth.signOut({ scope: "local" });
      router.replace("/login?accountDeleted=1");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "회원탈퇴 처리 중 오류가 발생했습니다.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className={`${typography.sectionTitle} text-ink`}>계정 관리</h2>
      <p className={`${typography.meta} mt-2 text-ink-tertiary`}>
        탈퇴하면 관심 정보, 일정, 페스티벌 기록과 로그인 계정이 삭제되며
        복구할 수 없습니다.
      </p>

      {!isConfirming ? (
        <button
          type="button"
          onClick={() => void beginDeletion()}
          className={`${typography.button} mt-5 rounded-xl border border-red-300 px-5 py-3 text-red-700 hover:bg-red-50`}
        >
          회원탈퇴
        </button>
      ) : (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">
            계속하려면 아래에 {ACCOUNT_DELETION_CONFIRMATION}를 입력하세요.
          </p>
          <input
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={isSubmitting}
            autoComplete="off"
            aria-label="회원탈퇴 확인 문구"
            className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-red-400"
            placeholder={ACCOUNT_DELETION_CONFIRMATION}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void deleteAccount()}
              disabled={
                isSubmitting || confirmation !== ACCOUNT_DELETION_CONFIRMATION
              }
              className={`${typography.button} rounded-xl bg-red-700 px-5 py-3 text-white disabled:opacity-40`}
            >
              {isSubmitting ? "탈퇴 처리 중..." : "계정과 개인 데이터 삭제"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setConfirmation("");
                setErrorMessage(null);
              }}
              disabled={isSubmitting}
              className={`${typography.button} rounded-xl border border-line bg-white px-5 py-3 text-ink-secondary disabled:opacity-40`}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 text-sm font-medium text-red-700">{errorMessage}</p>
      )}
    </section>
  );
}
