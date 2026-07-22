import type { FestivalArtist } from "@/lib/types";

type LineupByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

type ArtistLineupTableProps = {
  isLoading: boolean;
  rows: FestivalArtist[];
  lineupByDateAndStage: LineupByDateAndStage;
  updateRow: (
    lineupId: number,
    field:
      | "performance_date"
      | "performance_time"
      | "performance_end_time"
      | "stage_name"
      | "status",
    value: string,
  ) => void;
  saveRow: (row: FestivalArtist) => void;
  deleteRow: (row: FestivalArtist) => void;
  savingArtistId: number | null;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-gray-500";

function MobileLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-bold text-gray-500 lg:hidden">
      {children}
    </span>
  );
}

function artistOf(row: FestivalArtist) {
  return Array.isArray(row.artists) ? row.artists[0] : row.artists;
}

export default function ArtistLineupTable({
  isLoading,
  rows,
  lineupByDateAndStage,
  updateRow,
  saveRow,
  deleteRow,
  savingArtistId,
}: ArtistLineupTableProps) {
  return (
    <section className="mt-8">
      {isLoading ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-500">불러오는 중...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-500">등록된 라인업이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700">
            표시 이름·normalized_name·별칭은 아티스트 관리 페이지에서만 수정할 수 있습니다.
          </div>

          {Object.entries(lineupByDateAndStage)
            .sort(([dateA], [dateB]) => {
              if (dateA === "날짜 미정") return 1;
              if (dateB === "날짜 미정") return -1;
              return dateA.localeCompare(dateB);
            })
            .map(([date, stageGroups]) => (
              <div key={date} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-950">
                  {date === "날짜 미정"
                    ? date
                    : new Intl.DateTimeFormat("ko-KR", {
                        timeZone: "Asia/Seoul",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      }).format(new Date(`${date}T00:00:00+09:00`))}
                </h2>

                {Object.entries(stageGroups)
                  .sort(([stageA], [stageB]) =>
                    stageA.localeCompare(stageB, "ko-KR"),
                  )
                  .map(([stage, stageArtists]) => (
                    <section key={`${date}-${stage}`} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                        <h3 className="font-bold text-gray-900">{stage}</h3>
                        <p className="text-xs text-gray-500">{stageArtists.length}명</p>
                      </div>

                      <table className="block w-full border-collapse lg:table lg:table-fixed">
                        <colgroup className="hidden lg:table-column-group">
                          <col className="w-[25%]" />
                          <col className="w-[145px]" />
                          <col className="w-[210px]" />
                          <col />
                          <col className="w-[110px]" />
                          <col className="w-[125px]" />
                        </colgroup>
                        <thead className="hidden lg:table-header-group">
                          <tr className="text-sm font-bold text-gray-600">
                            <th className="border-b border-gray-300 px-3 py-2 text-left">아티스트</th>
                            <th className="border-b border-gray-300 px-3 py-2">공연 날짜</th>
                            <th className="border-b border-gray-300 px-3 py-2">공연 시간</th>
                            <th className="border-b border-gray-300 px-3 py-2">무대</th>
                            <th className="border-b border-gray-300 px-3 py-2">상태</th>
                            <th className="border-b border-gray-300 px-2 py-2">작업</th>
                          </tr>
                        </thead>
                        <tbody className="block lg:table-row-group">
                          {stageArtists.map((row) => {
                            const artist = artistOf(row);
                            const isSaving = savingArtistId === row.id;

                            return (
                              <tr
                                key={row.id}
                                className="mb-3 block rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:mb-0 lg:table-row lg:rounded-none lg:border-0 lg:p-0 lg:shadow-none"
                              >
                                <td className="block border-gray-200 pb-4 lg:table-cell lg:border-b lg:px-3 lg:py-3 lg:align-middle">
                                  <MobileLabel>아티스트</MobileLabel>
                                  <p className="break-words text-sm font-bold text-gray-900">
                                    {artist?.name || "이름 없음"}
                                  </p>
                                  <p className="mt-0.5 break-all text-xs text-gray-500">
                                    {artist?.normalized_name || "normalized_name 없음"}
                                  </p>
                                  {row.alias_text && (
                                    <p className="mt-1 break-words text-xs text-gray-500">
                                      별칭: {row.alias_text}
                                    </p>
                                  )}
                                  <p className="mt-1 text-[11px] font-semibold text-gray-400">
                                    DB #{artist?.id ?? row.artist_id} · 연결됨
                                  </p>
                                </td>

                                <td className="block border-gray-200 pb-3 lg:table-cell lg:border-b lg:px-3 lg:py-3 lg:align-middle">
                                  <MobileLabel>공연 날짜</MobileLabel>
                                  <input
                                    type="date"
                                    value={row.performance_date ?? ""}
                                    onChange={(event) =>
                                      updateRow(row.id, "performance_date", event.target.value)}
                                    className={inputClass}
                                  />
                                </td>

                                <td className="block border-gray-200 pb-3 lg:table-cell lg:border-b lg:px-3 lg:py-3 lg:align-middle">
                                  <MobileLabel>공연 시간</MobileLabel>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="time"
                                      aria-label={`${artist?.name ?? "아티스트"} 시작 시간`}
                                      value={row.performance_time?.slice(0, 5) ?? ""}
                                      onChange={(event) =>
                                        updateRow(row.id, "performance_time", event.target.value)}
                                      className={`${inputClass} min-w-0`}
                                    />
                                    <span className="shrink-0 text-xs text-gray-400">~</span>
                                    <input
                                      type="time"
                                      aria-label={`${artist?.name ?? "아티스트"} 종료 시간`}
                                      value={row.performance_end_time?.slice(0, 5) ?? ""}
                                      onChange={(event) =>
                                        updateRow(row.id, "performance_end_time", event.target.value)}
                                      className={`${inputClass} min-w-0`}
                                    />
                                  </div>
                                </td>

                                <td className="block border-gray-200 pb-3 lg:table-cell lg:border-b lg:px-3 lg:py-3 lg:align-middle">
                                  <MobileLabel>무대</MobileLabel>
                                  <input
                                    type="text"
                                    value={row.stage_name ?? ""}
                                    onChange={(event) =>
                                      updateRow(row.id, "stage_name", event.target.value)}
                                    className={inputClass}
                                  />
                                </td>

                                <td className="block border-gray-200 pb-3 lg:table-cell lg:border-b lg:px-3 lg:py-3 lg:align-middle">
                                  <MobileLabel>상태</MobileLabel>
                                  <select
                                    value={row.status ?? "confirmed"}
                                    onChange={(event) =>
                                      updateRow(row.id, "status", event.target.value)}
                                    className={inputClass}
                                  >
                                    <option value="confirmed">확정</option>
                                    <option value="scheduled">예정</option>
                                    <option value="cancelled">취소</option>
                                  </select>
                                </td>

                                <td className="block border-gray-200 lg:table-cell lg:border-b lg:px-2 lg:py-3 lg:align-middle">
                                  <MobileLabel>작업</MobileLabel>
                                  <div className="flex justify-end gap-1.5 lg:justify-center">
                                    {row.id > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => saveRow(row)}
                                        disabled={isSaving}
                                        className="whitespace-nowrap rounded-lg border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                                      >
                                        {isSaving ? "저장 중..." : "일정 저장"}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => deleteRow(row)}
                                      disabled={isSaving}
                                      className="whitespace-nowrap rounded-lg border border-red-200 bg-white px-2.5 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </section>
                  ))}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
