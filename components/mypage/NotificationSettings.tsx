"use client";

import { useEffect, useState } from "react";

import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  defaultNotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";
import { typography } from "@/lib/typography";

const items: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
  { key: "favorite_artist_appearance", label: "좋아하는 아티스트 신규 출연", description: "좋아하는 아티스트가 새 페스티벌 라인업에 추가되면 알려드립니다." },
  { key: "followed_festival_update", label: "관심 축제 라인업·시간표 변경", description: "관심 축제의 여러 변경은 짧게 모아 한 번만 알려드립니다." },
  { key: "ticket_day_before", label: "티켓 오픈 하루 전", description: "관심 축제의 티켓 오픈 24시간 전에 알려드립니다." },
  { key: "ticket_ten_minutes_before", label: "티켓 오픈 10분 전", description: "관심 축제의 티켓 오픈 직전에 다시 알려드립니다." },
];

export default function NotificationSettings() {
  const access = useServiceAccess();
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(defaultNotificationPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user?.id ?? null);
        if (user) setPreferences(await getNotificationPreferences(user.id));
      } catch (error) {
        console.error("Failed to load notification preferences", error);
        setErrorMessage("알림 설정을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function toggle(key: keyof NotificationPreferences) {
    if (!userId || !access.hasPersonalServiceAccess || savingKey) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setSavingKey(key);
    setErrorMessage(null);
    try {
      await saveNotificationPreferences(userId, next);
      setPreferences(next);
    } catch (error) {
      console.error("Failed to save notification preferences", error);
      setErrorMessage("알림 설정을 저장하지 못했습니다.");
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading) return <p className="text-sm text-ink-muted">알림 설정을 불러오는 중...</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-5 rounded-2xl border border-line p-4">
          <div>
            <h2 className={`${typography.label} text-ink`}>{item.label}</h2>
            <p className={`${typography.caption} mt-1 text-ink-tertiary`}>{item.description}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences[item.key]}
            disabled={!userId || !access.hasPersonalServiceAccess || savingKey !== null}
            onClick={() => void toggle(item.key)}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${preferences[item.key] ? "border-ink bg-ink" : "border-line-strong bg-surface-muted"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${preferences[item.key] ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
      ))}
      {!access.isLoading && !access.hasPersonalServiceAccess && (
        <p className="text-sm font-medium text-amber-700">베타 이용권이 있으면 알림 설정을 변경할 수 있습니다.</p>
      )}
      {errorMessage && <p className="text-sm font-medium text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
