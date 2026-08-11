"use client";

import AdminBackLink from "@/components/admin/AdminBackLink";
import AdminNotice from "@/components/admin/AdminNotice";
import { normalizeArtistName } from "@/lib/artists/normalizeArtistName";
import ArtistCandidateTable from "./components/ArtistCandidateTable";
import ArtistManagementTable from "./components/ArtistManagementTable";
import { useAdminArtistsController } from "./hooks/useAdminArtistsController";

export default function AdminArtistsPage() {
  const {
    artistName,
    setArtistName,
    officialEnglishName,
    setOfficialEnglishName,
    candidates,
    hasSearched,
    isSearching,
    isCreating,
    artists,
    isLoadingArtists,
    listFilter,
    setListFilter,
    sortKey,
    sortDirection,
    selectedArtistId,
    editName,
    setEditName,
    editUniqueName,
    setEditUniqueName,
    editAliases,
    setEditAliases,
    editInstagramUrl,
    setEditInstagramUrl,
    editFeaturedPlaylistUrl,
    setEditFeaturedPlaylistUrl,
    editImageFile,
    editImagePreviewUrl,
    isSaving,
    isDeleting,
    errorMessage,
    successMessage,
    filteredArtists,
    handleImageFileChange,
    handleSort,
    selectArtist,
    cancelArtistEdit,
    handleSearch,
    resetSearch,
    handleCreateArtist,
    handleSaveArtist,
    handleDeleteArtist,
  } = useAdminArtistsController();

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />

        <header className="mt-5">
          <p className="text-sm font-semibold text-ink-secondary">관리자</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            아티스트 관리
          </h1>
          <p className="mt-3 text-ink-tertiary">
            신규 아티스트를 등록하기 전에 기존 DB의 유사 아티스트를 검색합니다.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSearch}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-ink-secondary">
                화면 표시 이름
                <input
                  value={artistName}
                  onChange={(event) => setArtistName(event.target.value)}
                  placeholder="예: 강산에"
                  className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 font-normal outline-none focus:border-slate-900"
                />
              </label>

              <label className="text-sm font-semibold text-ink-secondary">
                공식 영문명
                <input
                  value={officialEnglishName}
                  onChange={(event) => setOfficialEnglishName(event.target.value)}
                  placeholder="예: CAR, THE GARDEN"
                  className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 font-normal outline-none focus:border-slate-900"
                />
                <span className="mt-2 block text-xs font-normal text-ink-muted">
                  영문 아티스트는 비워두어도 됩니다.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-xl bg-surface-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSearching ? "검색 중..." : "검색"}
              </button>
              <button
                type="button"
                onClick={resetSearch}
                className="rounded-xl border border-line-strong px-5 py-3 text-sm font-semibold text-ink-secondary"
              >
                초기화
              </button>
            </div>
          </form>
        </section>

        <AdminNotice message={errorMessage} className="mt-4" />
        <AdminNotice message={successMessage} tone="success" className="mt-4" />

        {hasSearched && (
          <section className="mt-6 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">후보</h2>
              <span className="text-sm text-ink-tertiary">{candidates.length}명</span>
            </div>

            {candidates.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-line-strong p-6">
                <p className="font-semibold text-ink">
                  유사한 기존 아티스트가 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => void handleCreateArtist()}
                  disabled={isCreating}
                  className="mt-4 rounded-xl bg-surface-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isCreating ? "등록 중..." : "신규 아티스트 등록"}
                </button>
              </div>
            ) : (
              <ArtistCandidateTable
                candidates={candidates}
                onSelect={(candidate) =>
                  selectArtist(candidate, { revealInList: true })}
              />
            )}
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink">전체 아티스트</h2>
              <p className="mt-1 text-sm text-ink-tertiary">총 {artists.length}명</p>
            </div>
            <input
              type="search"
              value={listFilter}
              onChange={(event) => setListFilter(event.target.value)}
              placeholder="목록 검색"
              className="rounded-xl border border-line-strong px-4 py-2.5 text-sm"
            />
          </div>

          {isLoadingArtists ? (
            <p className="mt-6 text-sm text-ink-tertiary">목록을 불러오는 중입니다.</p>
          ) : (
            <ArtistManagementTable
              artists={filteredArtists}
              selectedArtistId={selectedArtistId}
              editName={editName}
              editNormalizedName={editUniqueName}
              editAliases={editAliases}
              editInstagramUrl={editInstagramUrl}
              editFeaturedPlaylistUrl={editFeaturedPlaylistUrl}
              editImageFile={editImageFile}
              editImagePreviewUrl={editImagePreviewUrl}
              sortKey={sortKey}
              sortDirection={sortDirection}
              isSaving={isSaving}
              isDeleting={isDeleting}
              onSort={handleSort}
              onSelect={selectArtist}
              onNameChange={setEditName}
              onNormalizedNameChange={(value) =>
                setEditUniqueName(normalizeArtistName(value))}
              onAliasesChange={setEditAliases}
              onInstagramUrlChange={setEditInstagramUrl}
              onFeaturedPlaylistUrlChange={setEditFeaturedPlaylistUrl}
              onImageFileChange={handleImageFileChange}
              onSave={() => void handleSaveArtist()}
              onCancel={cancelArtistEdit}
              onDelete={() => void handleDeleteArtist()}
            />
          )}
        </section>
      </div>
    </main>
  );
}
