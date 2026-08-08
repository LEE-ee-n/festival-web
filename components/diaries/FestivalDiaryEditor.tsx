"use client";

import { useState } from "react";

import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import { getDefaultAttendedDate } from "@/lib/diaries/diaryDates";
import { useFestivalDiary } from "@/lib/hooks/useFestivalDiary";
import { typography } from "@/lib/typography";

type FestivalDiaryEditorProps = {
  festivalId: number;
  festivalName: string;
  startDate: string;
  endDate: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-ink-muted";

function getTodayInKorea() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

type FestivalDiaryFormProps = {
  diaryState: ReturnType<typeof useFestivalDiary>;
  startDate: string;
  endDate: string;
};

function FestivalDiaryForm({
  diaryState,
  startDate,
  endDate,
}: FestivalDiaryFormProps) {
  const defaultAttendedDate = getDefaultAttendedDate(
    startDate,
    endDate,
    getTodayInKorea(),
  );
  const [attendedDate, setAttendedDate] = useState(
    diaryState.diary?.attendedDate ?? defaultAttendedDate,
  );
  const [title, setTitle] = useState(diaryState.diary?.title ?? "");
  const [content, setContent] = useState(diaryState.diary?.content ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setValidationMessage(null);

    if (!title.trim()) {
      setValidationMessage("기록 제목을 입력해 주세요.");
      return;
    }

    if (!content.trim()) {
      setValidationMessage("남기고 싶은 내용을 입력해 주세요.");
      return;
    }

    const saved = await diaryState.save({ attendedDate, title, content });
    if (saved) setNotice("페스티벌 기록을 저장했습니다.");
  }

  async function handleDelete() {
    if (!window.confirm("이 페스티벌 기록을 삭제하시겠습니까?")) return;

    const removed = await diaryState.remove();
    if (!removed) return;

    setTitle("");
    setContent("");
    setAttendedDate(defaultAttendedDate);
    setNotice("페스티벌 기록을 삭제했습니다.");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-2xl border border-line bg-surface-subtle p-4 sm:p-5">
      <label className={`${typography.metaStrong} block text-ink-secondary`}>
        관람일
        <input
          type="date"
          value={attendedDate}
          min={startDate}
          max={endDate}
          onChange={(event) => setAttendedDate(event.target.value)}
          required
          className={inputClass}
        />
      </label>

      <label className={`${typography.metaStrong} block text-ink-secondary`}>
        제목
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder="가장 기억에 남는 순간"
          className={inputClass}
        />
      </label>

      <label className={`${typography.metaStrong} block text-ink-secondary`}>
        기록
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={10000}
          rows={7}
          placeholder="좋았던 공연과 그날의 분위기를 자유롭게 기록해 보세요."
          className={`${inputClass} resize-y leading-6`}
        />
        <span className={`${typography.meta} mt-1 block text-right text-ink-muted`}>
          {content.length.toLocaleString()} / 10,000
        </span>
      </label>

      {(validationMessage || diaryState.errorMessage) && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {validationMessage || diaryState.errorMessage}
        </p>
      )}
      {notice && (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={diaryState.isSaving}
          className={`${typography.button} rounded-xl bg-surface-dark px-4 py-2.5 text-white disabled:opacity-50`}
        >
          {diaryState.isSaving
            ? "저장 중"
            : diaryState.diary
              ? "기록 수정"
              : "기록 저장"}
        </button>

        {diaryState.diary && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={diaryState.isSaving}
            className={`${typography.button} rounded-xl border border-red-200 bg-surface px-4 py-2.5 text-red-700 disabled:opacity-50`}
          >
            기록 삭제
          </button>
        )}
      </div>
    </form>
  );
}

export default function FestivalDiaryEditor({
  festivalId,
  festivalName,
  startDate,
  endDate,
}: FestivalDiaryEditorProps) {
  const diaryState = useFestivalDiary(festivalId);

  function requestLogin() {
    const returnPath = normalizeAuthReturnPath(
      `/festival/${festivalId}#my-festival-diary`,
    );

    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }

    window.location.href = "/login";
  }

  return (
    <section id="my-festival-diary" className="scroll-mt-24">
      <h2 className={`${typography.sectionTitle} text-ink`}>
        나의 페스티벌 기록
      </h2>
      <p className={`${typography.meta} mt-2 text-ink-tertiary`}>
        {festivalName}에서 좋았던 순간을 나만의 기록으로 남겨보세요.
      </p>

      {diaryState.isLoading ? (
        <p className={`${typography.meta} mt-4 text-ink-muted`}>
          기록을 불러오는 중...
        </p>
      ) : !diaryState.isAuthenticated ? (
        <button
          type="button"
          onClick={requestLogin}
          className={`${typography.button} mt-4 rounded-xl bg-surface-dark px-4 py-2.5 text-white`}
        >
          로그인하고 기록 남기기
        </button>
      ) : (
        <FestivalDiaryForm
          key={diaryState.diary?.id ?? "new-diary"}
          diaryState={diaryState}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </section>
  );
}
