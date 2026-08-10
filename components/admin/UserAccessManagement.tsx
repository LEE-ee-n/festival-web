"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAdminServiceUsers,
  setAdminBetaAccess,
  type AdminServiceUser,
} from "@/lib/access/serviceAccess";
import { typography } from "@/lib/typography";

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function UserAccessManagement() {
  const [users, setUsers] = useState<AdminServiceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setUsers(await getAdminServiceUsers());
    } catch (error) {
      console.error("Failed to load service users", error);
      setErrorMessage("가입자 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) void reload();
    });

    return () => {
      isCancelled = true;
    };
  }, [reload]);

  const activeCount = useMemo(
    () => users.filter((user) => user.hasBetaAccess).length,
    [users],
  );
  const betaLimit = users[0]?.betaLimit ?? 20;

  async function toggleAccess(user: AdminServiceUser) {
    const nextEnabled = !user.hasBetaAccess;

    if (
      !nextEnabled &&
      !window.confirm(`${user.displayName}님의 베타 이용권을 회수하시겠습니까? 기존 데이터는 삭제되지 않습니다.`)
    ) {
      return;
    }

    setSavingUserId(user.userId);
    setErrorMessage(null);

    try {
      await setAdminBetaAccess(user.userId, nextEnabled);
      await reload();
    } catch (error) {
      console.error("Failed to update beta access", error);
      setErrorMessage(error instanceof Error ? error.message : "베타 이용권을 변경하지 못했습니다.");
    } finally {
      setSavingUserId(null);
    }
  }

  if (isLoading && users.length === 0) {
    return <p className="py-10 text-sm text-ink-tertiary">가입자 목록을 불러오는 중...</p>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`${typography.pageTitle} text-ink`}>가입자·베타 이용권</h1>
          <p className={`${typography.meta} mt-2 text-ink-tertiary`}>
            가입자는 화면을 볼 수 있고, 활성 이용권 회원만 개인 기능을 실행할 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-3 shadow-sm">
          <p className={`${typography.meta} text-ink-tertiary`}>활성 베타 인원</p>
          <p className="mt-1 text-2xl font-bold text-ink">{activeCount} / {betaLimit}명</p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="hidden grid-cols-[90px_minmax(220px,1.5fr)_170px_120px_170px_110px] gap-4 border-b border-line bg-surface-muted px-5 py-3 text-xs font-semibold text-ink-tertiary lg:grid">
          <span>가입 순번</span>
          <span>회원</span>
          <span>가입일</span>
          <span>이용권</span>
          <span>부여 정보</span>
          <span className="text-right">관리</span>
        </div>

        <div className="divide-y divide-line">
          {users.map((user) => {
            const isSaving = savingUserId === user.userId;
            const limitReached = !user.hasBetaAccess && activeCount >= betaLimit;

            return (
              <article
                key={user.userId}
                className="grid gap-3 px-5 py-5 lg:grid-cols-[90px_minmax(220px,1.5fr)_170px_120px_170px_110px] lg:items-center lg:gap-4"
              >
                <div className={`${typography.metaStrong} text-ink-secondary`}>
                  <span className="lg:hidden">가입 </span>#{user.signupNumber}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{user.displayName}</p>
                  {user.isAdmin && <span className="mt-1 inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-festival-purple">관리자</span>}
                  <p className="mt-1 truncate text-xs text-ink-tertiary">{user.email ?? "이메일 없음"}</p>
                </div>
                <p className={`${typography.meta} text-ink-tertiary`}>
                  <span className="lg:hidden">가입일　</span>{formatDate(user.joinedAt)}
                </p>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.hasBetaAccess ? "bg-green-50 text-green-700" : "bg-surface-muted text-ink-tertiary"}`}>
                    {user.hasBetaAccess ? "이용 중" : "미부여"}
                  </span>
                </div>
                <div className={`${typography.meta} text-ink-tertiary`}>
                  {user.betaAccessNumber ? <p>부여 #{user.betaAccessNumber}</p> : <p>-</p>}
                  {user.grantedAt && <p className="mt-1">{formatDate(user.grantedAt)}</p>}
                </div>
                <div className="lg:text-right">
                  <button
                    type="button"
                    onClick={() => void toggleAccess(user)}
                    disabled={isSaving || limitReached || user.isAdmin}
                    title={user.isAdmin ? "운영 관리자 이용권은 회수할 수 없습니다." : limitReached ? `베타 이용 인원 ${betaLimit}명이 모두 찼습니다.` : undefined}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${user.hasBetaAccess ? "border border-red-200 text-red-700" : "bg-surface-dark text-white"}`}
                  >
                    {isSaving ? "처리 중" : user.hasBetaAccess ? "회수" : "권한 부여"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
