"use client";

import { useRouter } from "next/navigation";

import FestivalRecordFestivalPicker from "@/components/festival-records/FestivalRecordFestivalPicker";
import { AUTH_RETURN_PATH_KEY, normalizeAuthReturnPath } from "@/lib/auth/authReturnPath";
import { getFestivalDateOptions } from "@/lib/diaries/diaryDates";
import type { FestivalLineupOption } from "@/lib/diaries/festivalDiaries";
import { useFestivalRecordForm } from "@/lib/hooks/useFestivalRecordForm";
import { typography } from "@/lib/typography";

type FestivalRecordFormProps = { recordId?: number | null; initialFestivalId?: number | null };
const fieldClass = "mt-2 w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-ink-muted";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })
    .format(new Date(`${date}T00:00:00+09:00`));
}

function groupLineupByDate(lineup: FestivalLineupOption[]) {
  return lineup.reduce<Array<{ date: string; items: FestivalLineupOption[] }>>((groups, item) => {
    const date = item.performanceDate ?? "날짜 미정";
    const current = groups.at(-1);
    if (current?.date === date) current.items.push(item);
    else groups.push({ date, items: [item] });
    return groups;
  }, []);
}

export default function FestivalRecordForm({ recordId = null, initialFestivalId = null }: FestivalRecordFormProps) {
  const router = useRouter();
  const form = useFestivalRecordForm(recordId, initialFestivalId);
  const festivalDates = form.selectedFestival
    ? getFestivalDateOptions(form.selectedFestival.startDate, form.selectedFestival.endDate)
    : [];
  const lineupGroups = groupLineupByDate(form.lineup);
  const nextBlockedReason = !form.festivalId
    ? "페스티벌을 선택해주세요."
    : form.attendedDates.size === 0
      ? "참여 날짜를 한 개 이상 선택해주세요."
      : !form.summary.trim()
        ? "한줄 기록을 입력해주세요."
        : null;

  function requestLogin() {
    const path = normalizeAuthReturnPath(window.location.pathname + window.location.search);
    if (path) window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, path);
    window.location.href = "/login";
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const savedId = await form.save();
    if (savedId) router.push(`/mypage/festival-records/${savedId}/artists/edit`);
  }

  async function remove() {
    if (!window.confirm("이 페스티벌 기록을 삭제하시겠습니까?")) return;
    if (await form.remove()) router.push("/mypage/festival-records");
  }

  if (form.isLoading) return <p className="text-sm text-ink-muted">기록 정보를 불러오는 중...</p>;
  if (!form.isAuthenticated) return <button type="button" onClick={requestLogin} className={`${typography.button} rounded-xl bg-surface-dark px-4 py-2.5 text-white`}>로그인하고 기록하기</button>;
  if (!recordId && form.options.length === 0) return <p className="rounded-2xl border border-line p-6 text-sm text-ink-tertiary">새로 기록할 수 있는 종료·진행 중 페스티벌이 없습니다.</p>;

  return (
    <form onSubmit={submit} className="space-y-7">
      <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
        <h2 className={`${typography.sectionTitle} text-ink`}>페스티벌과 기억</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FestivalRecordFestivalPicker options={form.options} selectedId={form.festivalId} disabled={Boolean(recordId)} onSelect={(festivalId) => void form.selectFestival(festivalId)} />
          <fieldset>
            <legend className={`${typography.metaStrong} text-ink-secondary`}>참여 날짜</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {festivalDates.map((date) => {
                const selected = form.attendedDates.has(date);
                return (
                  <label key={date} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${selected ? "border-ink bg-surface-dark text-white" : "border-line-strong bg-surface text-ink-secondary"}`}>
                    <input type="checkbox" checked={selected} onChange={() => form.toggleAttendedDate(date)} className="sr-only" />
                    {formatDate(date)}
                  </label>
                );
              })}
            </div>
            {form.attendedDates.size === 0 && <p className="mt-2 text-xs text-red-600">참여 날짜를 한 개 이상 선택해주세요.</p>}
          </fieldset>
        </div>
        <label className={`${typography.metaStrong} mt-5 block text-ink-secondary`}>
          한줄 기록
          <textarea required rows={3} maxLength={200} value={form.summary} onChange={(event) => form.setSummary(event.target.value)} placeholder="진짜 더웠는데 마지막 공연은 아직도 기억난다." className={`${fieldClass} resize-y`} />
          <span className={`${typography.meta} mt-1 block text-right text-ink-muted`}>{form.summary.length} / 200</span>
        </label>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
        <h2 className={`${typography.sectionTitle} text-ink`}>기록하고 싶은 아티스트</h2>
        <p className={`${typography.meta} mt-2 text-ink-tertiary`}>직접 본 공연뿐 아니라 좋았던 순간, 놓쳐서 아쉬웠던 아티스트도 자유롭게 선택하세요.</p>
        {form.lineup.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-line-strong p-5 text-sm text-ink-tertiary">등록된 타임테이블이 없습니다. 페스티벌 기록만 저장할 수 있습니다.</p>
        ) : (
          <div className="mt-5 space-y-5">
            {lineupGroups.map((group) => (
              <section key={group.date} className="overflow-hidden rounded-2xl border border-line">
                <h3 className={`${typography.metaStrong} bg-surface-muted px-4 py-3 text-ink`}>{group.date === "날짜 미정" ? group.date : formatDate(group.date)}</h3>
                <div className="divide-y divide-line">
                  {group.items.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-3 px-4 py-3">
                      <input type="checkbox" checked={form.selectedPerformanceIds.has(item.id)} onChange={() => form.togglePerformance(item.id)} className="h-4 w-4" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-ink">{item.artistName}</strong>
                          {form.recordedPerformanceIds.has(item.id) && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">작성한 기록 있음</span>}
                        </span>
                        <span className="mt-1 block text-xs text-ink-tertiary">{item.performanceTime?.slice(0, 5) || "시간 미정"}{item.performanceEndTime ? ` ~ ${item.performanceEndTime.slice(0, 5)}` : ""} · {item.stageName || "무대 미정"}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {form.errorMessage && <p className="text-sm font-medium text-red-600" role="alert">{form.errorMessage}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={form.isSaving || Boolean(nextBlockedReason)} aria-describedby={nextBlockedReason ? "festival-record-next-reason" : undefined} className={`${typography.button} rounded-xl bg-surface-dark px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50`}>{form.isSaving ? "저장 중" : "다음"}</button>
        {recordId && <button type="button" onClick={() => void remove()} disabled={form.isSaving} className={`${typography.button} rounded-xl border border-red-200 px-5 py-3 text-red-700 disabled:opacity-50`}>기록 삭제</button>}
      </div>
      {nextBlockedReason && <p id="festival-record-next-reason" className="text-sm font-medium text-amber-700">다음으로 이동하려면 {nextBlockedReason}</p>}
    </form>
  );
}
