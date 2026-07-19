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

  updateArtistIdentity: (
    lineupId: number,
    field: "name" | "normalized_name" | "aliases",
    value: string,
  ) => void;

  saveRow: (row: FestivalArtist) => void;
  deleteRow: (row: FestivalArtist) => void;

  savingArtistId: number | null;
};


export default function ArtistLineupTable({
  isLoading,
  rows,
  lineupByDateAndStage,
  updateRow,
  updateArtistIdentity,
  saveRow,
  deleteRow,
  savingArtistId,
}: ArtistLineupTableProps) {
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500";

  return <>
  <section className="mt-8">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                불러오는 중...
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                등록된 라인업이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                표시 이름·normalized_name·별칭은 아티스트 공통정보입니다. 수정하면 이 아티스트가 출연하는 모든 축제에 적용됩니다.
              </div>
              {Object.entries(lineupByDateAndStage)
              .sort(([dateA], [dateB]) => {
                if (dateA === "날짜 미정") return 1;
                if (dateB === "날짜 미정") return -1;

                return dateA.localeCompare(dateB);
              })
              .map(([date, stageGroups]) => (
                <div key={date} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-950">
                    {date === "날짜 미정"
                      ? date
                      : new Intl.DateTimeFormat("ko-KR", {
                          timeZone: "Asia/Seoul",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        }).format(
                          new Date(`${date}T00:00:00+09:00`),
                        )}
                  </h2>

                  <div className="space-y-4">
                    {Object.entries(stageGroups)
                      .sort(([stageA], [stageB]) =>
                        stageA.localeCompare(stageB, "ko-KR"),
                      )
                      .map(([stage, stageArtists]) => (
                        <section
                          key={`${date}-${stage}`}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                            <h3 className="font-bold text-slate-900">
                              {stage}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {stageArtists.length}명
                            </p>
                          </div>

                          <div className="space-y-4">
                                {stageArtists.map((row) => {
                                  const artist = Array.isArray(
                                    row.artists,
                                  )
                                    ? row.artists[0]
                                    : row.artists;

                                  return (
                                    <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div>
                                          <p className="text-sm font-bold text-slate-800">기존 아티스트 연결</p>
                                          <p className="mt-1 text-xs text-slate-600">
                                            DB ID {artist?.id ?? row.artist_id} · {artist?.normalized_name || "normalized_name 없음"}
                                          </p>
                                        </div>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">✅ 연결됨</span>
                                      </div>

                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="text-xs font-semibold text-slate-600">
                                          표시 이름
                                          <input
                                            value={artist?.name ?? ""}
                                            onChange={(event) => updateArtistIdentity(row.id, "name", event.target.value)}
                                            className={`mt-1 ${inputClass}`}
                                          />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600">
                                          중복 판별값 (normalized_name)
                                          <input
                                            value={artist?.normalized_name ?? ""}
                                            onChange={(event) => updateArtistIdentity(row.id, "normalized_name", event.target.value)}
                                            placeholder="예: hyukoh, 10cm"
                                            className={`mt-1 ${inputClass}`}
                                          />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                                          별칭 (쉼표로 구분)
                                          <input
                                            value={row.alias_text ?? ""}
                                            onChange={(event) => updateArtistIdentity(row.id, "aliases", event.target.value)}
                                            className={`mt-1 ${inputClass}`}
                                          />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600">
                                          공연 날짜
                                        <input
                                          type="date"
                                          value={
                                            row.performance_date ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.id,
                                              "performance_date",
                                              event.target.value,
                                            )
                                          }
                                          className={`mt-1 ${inputClass}`}
                                        />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600">
                                          무대
                                          <input
                                            type="text"
                                            value={row.stage_name ?? ""}
                                            onChange={(event) => updateRow(row.id, "stage_name", event.target.value)}
                                            className={`mt-1 ${inputClass}`}
                                          />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600">
                                          시작 시간
                                        <input
                                          type="time"
                                          value={
                                            row.performance_time?.slice(
                                              0,
                                              5,
                                            ) ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.id,
                                              "performance_time",
                                              event.target.value,
                                            )
                                          }
                                          className={`mt-1 ${inputClass}`}
                                        />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600">
                                          종료 시간
                                        <input
                                          type="time"
                                          value={
                                            row.performance_end_time?.slice(0, 5) ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.id,
                                              "performance_end_time",
                                              event.target.value,
                                            )
                                          }
                                          className={`mt-1 ${inputClass}`}
                                        />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-600">
                                          상태
                                          <select
                                            value={row.status ?? "confirmed"}
                                            onChange={(event) => updateRow(row.id, "status", event.target.value)}
                                            className={`mt-1 ${inputClass}`}
                                          >
                                            <option value="confirmed">확정</option>
                                            <option value="scheduled">예정</option>
                                            <option value="cancelled">취소</option>
                                          </select>
                                        </label>
                                      </div>

                                        <div className="mt-4 flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              saveRow(row)
                                            }
                                            disabled={
                                              savingArtistId ===
                                              row.id
                                            }
                                            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                          >
                                            {savingArtistId === row.id ? "저장 중..." : "전체 저장"}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteRow(row)
                                            }
                                            disabled={
                                              savingArtistId ===
                                              row.id
                                            }
                                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                    </article>
                                  );
                                })}
                          </div>
                        </section>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </>;
}
