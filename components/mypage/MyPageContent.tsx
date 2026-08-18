"use client";

import Link from "next/link";
import AccountDeletionSection from "@/components/mypage/AccountDeletionSection";
import FavoriteArtistList from "@/components/mypage/FavoriteArtistList";
import FavoriteFestivalList from "@/components/mypage/FavoriteFestivalList";
import PersonalFeatureNotice from "@/components/access/PersonalFeatureNotice";
import FestivalRecordSlider from "@/components/festival-records/FestivalRecordSlider";
import ScheduleList from "@/components/mypage/ScheduleList";
import GoogleDriveConnectionCard from "@/components/google-drive/GoogleDriveConnectionCard";
import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import { useFavoriteArtistList } from "@/lib/hooks/useFavoriteArtistList";
import { useFavoriteFestivalList } from "@/lib/hooks/useFavoriteFestivalList";
import { useFestivalDiaryList } from "@/lib/hooks/useFestivalDiaryList";
import { useUserScheduleList } from "@/lib/hooks/useUserScheduleList";
import { typography } from "@/lib/typography";

export default function MyPageContent() {
  const access = useServiceAccess();
  const favoriteArtists = useFavoriteArtistList();
  const favoriteFestivals = useFavoriteFestivalList();
  const festivalDiaries = useFestivalDiaryList();
  const schedule = useUserScheduleList();

  function requestLogin() {
    const returnPath = normalizeAuthReturnPath("/mypage");

    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }

    window.location.href = "/login";
  }

  if (
    favoriteArtists.isLoading ||
    favoriteFestivals.isLoading ||
    festivalDiaries.isLoading ||
    schedule.isLoading
  ) {
    return <p className="text-sm text-ink-muted">내 정보를 불러오는 중...</p>;
  }

  if (
    !favoriteArtists.isAuthenticated ||
    !favoriteFestivals.isAuthenticated ||
    !festivalDiaries.isAuthenticated ||
    !schedule.isAuthenticated
  ) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-8 text-center shadow-sm">
        <h2 className={`${typography.sectionTitle} text-ink`}>
          로그인이 필요합니다
        </h2>
        <p className={`${typography.meta} mt-2 text-ink-tertiary`}>
          Google 로그인 후 좋아하는 아티스트와 개인 일정을 확인할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={requestLogin}
          className={`${typography.button} mt-5 rounded-xl bg-surface-dark px-5 py-3 text-white`}
        >
          Google로 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PersonalFeatureNotice />

      <GoogleDriveConnectionCard />

      {access.isAdmin && (
      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className={`${typography.sectionTitle} text-ink`}>앱 알림</h2>
            <p className={`${typography.meta} mt-1 text-ink-tertiary`}>아티스트 출연, 축제 변경과 티켓 오픈 알림을 관리합니다.</p>
          </div>
          <Link href="/mypage/notifications" className={`${typography.button} shrink-0 rounded-xl border border-line-strong px-4 py-2.5 text-ink-secondary`}>설정</Link>
        </div>
      </section>
      )}

      {festivalDiaries.errorMessage ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p>{festivalDiaries.errorMessage}</p>
            <button
              type="button"
              onClick={() => void festivalDiaries.reload()}
              className="mt-3 font-semibold underline underline-offset-4"
            >
              다시 시도
            </button>
          </section>
        ) : (
          <FestivalRecordSlider items={festivalDiaries.items} />
        )}

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className={`${typography.sectionTitle} text-ink`}>
              내 공연 일정
            </h2>
            <p className={`${typography.meta} mt-1 text-ink-tertiary`}>
              총 {schedule.items.length}개
            </p>
          </div>
        </div>

        {schedule.errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p>{schedule.errorMessage}</p>
            <button
              type="button"
              onClick={() => void schedule.reload()}
              className="mt-3 font-semibold underline underline-offset-4"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <ScheduleList
            items={schedule.items}
            favoriteArtistIds={favoriteArtists.items.map((artist) => artist.id)}
          />
        )}
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className={`${typography.sectionTitle} text-ink`}>
              좋아하는 아티스트
            </h2>
            <p className={`${typography.meta} mt-1 text-ink-tertiary`}>
              총 {favoriteArtists.items.length}명
            </p>
          </div>
        </div>

        {favoriteArtists.errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p>{favoriteArtists.errorMessage}</p>
            <button
              type="button"
              onClick={() => void favoriteArtists.reload()}
              className="mt-3 font-semibold underline underline-offset-4"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <FavoriteArtistList items={favoriteArtists.items} />
        )}
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className={`${typography.sectionTitle} text-ink`}>관심 페스티벌</h2>
            <p className={`${typography.meta} mt-1 text-ink-tertiary`}>
              총 {favoriteFestivals.items.length}개
            </p>
          </div>
        </div>

        {favoriteFestivals.errorMessage ? (
          <div className="rounded-2xl border border-line bg-surface-subtle p-5 text-sm text-danger">
            <p>{favoriteFestivals.errorMessage}</p>
            <button
              type="button"
              onClick={() => void favoriteFestivals.reload()}
              className="mt-3 rounded-xl border border-line bg-surface px-4 py-2 font-semibold text-ink"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <FavoriteFestivalList items={favoriteFestivals.items} />
        )}
      </section>

      <AccountDeletionSection />
    </div>
  );
}
