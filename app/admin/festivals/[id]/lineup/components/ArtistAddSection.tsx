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
  setSelectedArtist: (artist: ArtistSearchResult | null) => void;
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
  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">라인업 직접 추가</h2>
        <p className="mt-1 text-sm text-slate-500">
          아티스트를 검색한 뒤 출연 날짜를 선택하세요. 같은 팀도 날짜별로 다시 추가할 수 있습니다.
        </p>
      </div>

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
              handleArtistSearch();
            }
          }}
          placeholder="아티스트명 검색"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
              className={`w-full rounded-xl border p-3 text-left ${
                selectedArtist?.id === artist.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="font-semibold text-slate-900">{artist.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                ID {artist.id} · 유사도 {Math.round(artist.similarity_score * 100)}%
              </p>
            </button>
          ))}
        </div>
      )}

      {(
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">
            출연 날짜
            <input type="date" value={newPerformanceDate} onChange={(event) => setNewPerformanceDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            시작 시간
            <input type="time" value={newPerformanceTime} onChange={(event) => setNewPerformanceTime(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            종료 시간
            <input type="time" value={newPerformanceEndTime} onChange={(event) => setNewPerformanceEndTime(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            스테이지
            <input type="text" value={newStageName} onChange={(event) => setNewStageName(event.target.value)} placeholder="미정 가능" className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm" />
          </label>
          <button type="button" onClick={handleAddArtist} disabled={isAddingArtist || !selectedArtist || !newPerformanceDate} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-4">
            {isAddingArtist
              ? "추가 중..."
              : selectedArtist
                ? `${selectedArtist.name} 라인업에 추가`
                : "아티스트 추가"}
          </button>
        </div>
      )}
    </section>
  );
}
