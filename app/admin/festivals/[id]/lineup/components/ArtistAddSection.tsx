type ArtistSearchResult = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

type ArtistAddSectionProps = {
  artistSearch: string;
  setArtistSearch: (value: string) => void;

  artistResults: ArtistSearchResult[];

  selectedArtist: ArtistSearchResult | null;
  setSelectedArtist: (
    artist: ArtistSearchResult | null,
  ) => void;

  handleArtistSearch: () => void;
  isSearchingArtists: boolean;

  newPerformanceDate: string;
  setNewPerformanceDate: (value: string) => void;

  newPerformanceTime: string;
  setNewPerformanceTime: (value: string) => void;

  newPerformanceEndTime: string;
  setNewPerformanceEndTime: (value: string) => void;

  newStageName: string;
  setNewStageName: (value: string) => void;

  handleAddArtist: () => void;
  isAddingArtist: boolean;
};

export default function ArtistAddSection({
  artistSearch,
  setArtistSearch,
  artistResults,
  selectedArtist,
  setSelectedArtist,
  handleArtistSearch,
  isSearchingArtists,
  newPerformanceDate,
  setNewPerformanceDate,
  newPerformanceTime,
  setNewPerformanceTime,
  newPerformanceEndTime,
  setNewPerformanceEndTime,
  newStageName,
  setNewStageName,
  handleAddArtist,
  isAddingArtist,
}: ArtistAddSectionProps) {

  return <>
  <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            라인업 아티스트 추가
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={artistSearch}
              onChange={(event) => {
                setArtistSearch(event.target.value);
                setSelectedArtist(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleArtistSearch();
                }
              }}
              placeholder="아티스트명 검색"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <button
              type="button"
              onClick={handleArtistSearch}
              disabled={isSearchingArtists}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSearchingArtists ? "검색 중..." : "검색"}
            </button>
          </div>

          {artistResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {artistResults.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => setSelectedArtist(artist)}
                  className={[
                    "w-full rounded-xl border p-3 text-left",
                    selectedArtist?.id === artist.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200",
                  ].join(" ")}
                >
                  <p className="font-semibold text-slate-900">
                    {artist.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ID {artist.id} · 유사도{" "}
                    {Math.round(artist.similarity_score * 100)}%
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedArtist && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="date"
                value={newPerformanceDate}
                onChange={(event) =>
                  setNewPerformanceDate(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <input
                type="time"
                value={newPerformanceTime}
                onChange={(event) =>
                  setNewPerformanceTime(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <input
                type="time"
                value={newPerformanceEndTime}
                onChange={(event) =>
                  setNewPerformanceEndTime(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <input
                type="text"
                value={newStageName}
                onChange={(event) =>
                  setNewStageName(event.target.value)
                }
                placeholder="스테이지"
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <button
                type="button"
                onClick={handleAddArtist}
                disabled={isAddingArtist}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isAddingArtist ? "추가 중..." : "라인업 추가"}
              </button>
            </div>
          )}
        </section>
        </>;
}