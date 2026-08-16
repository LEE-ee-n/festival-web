"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { getGoogleDriveApiHeaders, parseGoogleDriveApiError } from "@/lib/google-drive/clientAuth";
import type { GoogleDriveConnectionStatus } from "@/lib/google-drive/types";
import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import { typography } from "@/lib/typography";

export default function GoogleDriveConnectionCard() {
  const access = useServiceAccess();
  const [status, setStatus] = useState<GoogleDriveConnectionStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (access.isLoading || !access.hasGoogleDriveAccess) return;

    async function loadStatus() {
      try {
        const response = await fetch("/api/google-drive/status", { headers: await getGoogleDriveApiHeaders(), cache: "no-store" });
        if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));
        setStatus(await response.json() as GoogleDriveConnectionStatus);
        const result = new URLSearchParams(window.location.search).get("drive");
        if (result === "connected") setMessage("Google Drive가 연결되었습니다.");
        if (result === "cancelled") setMessage("Google Drive 연결을 취소했습니다.");
        if (result === "failed") setMessage("Google Drive 연결에 실패했습니다.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "연결 상태를 확인하지 못했습니다.");
      }
    }
    void loadStatus();
  }, [access.hasGoogleDriveAccess, access.isLoading]);

  async function connect() {
    setIsBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/google-drive/connect", { method: "POST", headers: await getGoogleDriveApiHeaders(),
        body: JSON.stringify({ returnTo: "/mypage" }) });
      if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));
      const { authorizationUrl } = await response.json() as { authorizationUrl: string };
      window.location.assign(authorizationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "연결을 시작하지 못했습니다."); setIsBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Google Drive 연결을 해제할까요? 기존 일기에 저장한 파일 링크는 유지됩니다.")) return;
    setIsBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/google-drive/disconnect", { method: "DELETE", headers: await getGoogleDriveApiHeaders() });
      if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));
      setStatus({ connected: false, connectedAt: null, lastUsedAt: null });
      setMessage("Google Drive 연결을 해제했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "연결을 해제하지 못했습니다.");
    } finally { setIsBusy(false); }
  }

  if (access.isLoading || !access.hasGoogleDriveAccess) return null;

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 h-5 w-5 text-ink-secondary" />
          <div>
            <h2 className={`${typography.sectionTitle} text-ink`}>Google Drive</h2>
            <p className={`${typography.meta} mt-1 text-ink-tertiary`}>사진과 영상을 내 Drive에서 선택해 페스티봄 일기에 연결합니다.</p>
          </div>
        </div>
        {status?.connected ? (
          <button type="button" disabled={isBusy} onClick={() => void disconnect()} className={`${typography.button} rounded-xl border border-line-strong px-4 py-2.5 text-ink-secondary disabled:opacity-50`}>연결 해제</button>
        ) : (
          <button type="button" disabled={isBusy || status === null} onClick={() => void connect()} className={`${typography.button} rounded-xl border border-line-strong px-4 py-2.5 text-ink disabled:opacity-50`}>{isBusy ? "연결 중" : "Drive 연결"}</button>
        )}
      </div>
      {status?.connected && <p className="mt-3 text-sm text-green-700">연결됨 · 파일은 Google Drive에 그대로 보관됩니다.</p>}
      {message && <p role="status" className="mt-3 text-sm text-ink-tertiary">{message}</p>}
    </section>
  );
}
