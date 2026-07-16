type FestivalArtist = {
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string;
  artists:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null;
};

type LineupByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

type ArtistLineupTableProps = {
  isLoading: boolean;
  rows: FestivalArtist[];
  lineupByDateAndStage: LineupByDateAndStage;

  updateRow: (
    artistId: number,
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


export default function ArtistLineupTable({
  isLoading,
  rows,
  lineupByDateAndStage,
  updateRow,
  saveRow,
  deleteRow,
  savingArtistId,
}: ArtistLineupTableProps) {
  return <>
  <section className="mt-8 space-y-8">
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
            Object.entries(lineupByDateAndStage)
              .sort(([dateA], [dateB]) => {
                if (dateA === "날짜 미정") return 1;
                if (dateB === "날짜 미정") return -1;

                return dateA.localeCompare(dateB);
              })
              .map(([date, stageGroups]) => (
                <div key={date}>
                  <h2 className="mb-4 text-xl font-bold text-slate-950">
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

                  <div className="space-y-5">
                    {Object.entries(stageGroups)
                      .sort(([stageA], [stageB]) =>
                        stageA.localeCompare(stageB, "ko-KR"),
                      )
                      .map(([stage, stageArtists]) => (
                        <section
                          key={`${date}-${stage}`}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                        >
                          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h3 className="font-bold text-slate-900">
                              {stage}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {stageArtists.length}명
                            </p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-white">
                                <tr>
                                  <th className="px-4 py-4 text-left">
                                    아티스트
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    날짜
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    시작시간
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    종료시간
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    스테이지
                                  </th>

                                  <th className="px-4 py-4 text-right">
                                    관리
                                  </th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-100">
                                {stageArtists.map((row) => {
                                  const artist = Array.isArray(
                                    row.artists,
                                  )
                                    ? row.artists[0]
                                    : row.artists;

                                  return (
                                    <tr key={row.artist_id}>
                                      <td className="px-4 py-4 font-semibold text-slate-900">
                                        {artist?.name ??
                                          "아티스트 정보 없음"}
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="date"
                                          value={
                                            row.performance_date ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "performance_date",
                                              event.target.value,
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
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
                                              row.artist_id,
                                              "performance_time",
                                              event.target.value,
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="time"
                                          value={
                                            row.performance_end_time?.slice(0, 5) ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "performance_end_time",
                                              event.target.value,
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="text"
                                          value={row.stage_name ?? ""}
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "stage_name",
                                              event.target.value,
                                            )
                                          }
                                          className="w-48 rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              saveRow(row)
                                            }
                                            disabled={
                                              savingArtistId ===
                                              row.artist_id
                                            }
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                          >
                                            저장
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteRow(row)
                                            }
                                            disabled={
                                              savingArtistId ===
                                              row.artist_id
                                            }
                                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
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
                          </div>
                        </section>
                      ))}
                  </div>
                </div>
              ))
          )}
        </section>
        </>;
}
