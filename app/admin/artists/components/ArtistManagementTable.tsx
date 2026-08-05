import ArtistEditFields from "./ArtistEditFields";
import ArtistProfileStatus from "@/components/admin/ArtistProfileStatus";

export type ManagedArtistRow = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string[];
  image_url: string | null;
  instagram_url: string | null;
  featured_playlist_url: string | null;
};

export type ArtistSortKey = "id" | "name" | "normalized_name";
export type SortDirection = "asc" | "desc";

type ArtistManagementTableProps = {
  artists: ManagedArtistRow[];
  selectedArtistId: number | null;
  editName: string;
  editNormalizedName: string;
  editAliases: string;
  editInstagramUrl: string;
  editFeaturedPlaylistUrl: string;
  editImageFile: File | null;
  editImagePreviewUrl: string;
  sortKey: ArtistSortKey;
  sortDirection: SortDirection;
  isSaving: boolean;
  isDeleting: boolean;
  onSort: (key: ArtistSortKey) => void;
  onSelect: (artist: ManagedArtistRow) => void;
  onNameChange: (value: string) => void;
  onNormalizedNameChange: (value: string) => void;
  onAliasesChange: (value: string) => void;
  onInstagramUrlChange: (value: string) => void;
  onFeaturedPlaylistUrlChange: (value: string) => void;
  onImageFileChange: (file: File | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export default function ArtistManagementTable(props: ArtistManagementTableProps) {
  const sortLabel = (label: string, key: ArtistSortKey) =>
    props.sortKey === key
      ? `${label} ${props.sortDirection === "asc" ? "▲" : "▼"}`
      : label;

  if (props.artists.length === 0) {
    return (
      <p className="mt-6 border-y border-line-strong py-8 text-center text-sm text-ink-tertiary">
        검색 결과가 없습니다.
      </p>
    );
  }

  const editProps = {
    artistId: props.selectedArtistId ?? 0,
    name: props.editName,
    normalizedName: props.editNormalizedName,
    aliases: props.editAliases,
    instagramUrl: props.editInstagramUrl,
    featuredPlaylistUrl: props.editFeaturedPlaylistUrl,
    imageFile: props.editImageFile,
    imagePreviewUrl: props.editImagePreviewUrl,
    isSaving: props.isSaving,
    isDeleting: props.isDeleting,
    onNameChange: props.onNameChange,
    onNormalizedNameChange: props.onNormalizedNameChange,
    onAliasesChange: props.onAliasesChange,
    onInstagramUrlChange: props.onInstagramUrlChange,
    onFeaturedPlaylistUrlChange: props.onFeaturedPlaylistUrlChange,
    onImageFileChange: props.onImageFileChange,
    onSave: props.onSave,
    onCancel: props.onCancel,
    onDelete: props.onDelete,
  };

  return (
    <>
      <div className="mt-6 hidden md:block">
        <table className="w-full table-fixed text-center text-sm">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[18%]" />
            <col className="w-[19%]" />
            <col className="w-[28%]" />
            <col className="w-[17%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="border-b border-line-strong text-ink-secondary">
            <tr>
              <th className="px-3 py-3">
                <button type="button" onClick={() => props.onSort("id")} className="font-semibold">
                  {sortLabel("ID", "id")}
                </button>
              </th>
              <th className="px-3 py-3">
                <button type="button" onClick={() => props.onSort("name")} className="font-semibold">
                  {sortLabel("표시 이름", "name")}
                </button>
              </th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => props.onSort("normalized_name")}
                  className="font-semibold"
                >
                  {sortLabel("normalized_name", "normalized_name")}
                </button>
              </th>
              <th className="px-3 py-3 font-semibold">별칭</th>
              <th className="px-3 py-3 font-semibold">프로필</th>
              <th className="px-3 py-3 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {props.artists.map((artist) => {
              const isEditing = props.selectedArtistId === artist.id;
              return (
                <tr
                  key={artist.id}
                  data-artist-id={artist.id}
                  data-artist-view="desktop"
                  className={isEditing ? "border-y-2 border-gray-500 bg-surface-subtle" : "bg-surface"}
                >
                  {isEditing ? (
                    <ArtistEditFields
                      layout="desktop"
                      {...editProps}
                      artistId={artist.id}
                      imageUrl={artist.image_url}
                    />
                  ) : (
                    <>
                      <td className="px-3 py-3 text-ink-tertiary">{artist.id}</td>
                      <td className="px-3 py-3 font-semibold text-ink">{artist.name}</td>
                      <td className="break-all px-3 py-3 font-mono text-ink-secondary">
                        {artist.normalized_name}
                      </td>
                      <td className="break-words px-3 py-3 text-ink-secondary">
                        {artist.aliases.join(", ") || "-"}
                      </td>
                      <td className="px-2 py-3">
                        <ArtistProfileStatus
                          artistName={artist.name}
                          imageUrl={artist.image_url}
                          instagramUrl={artist.instagram_url}
                          featuredPlaylistUrl={artist.featured_playlist_url}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => props.onSelect(artist)}
                          className="whitespace-nowrap rounded-lg border border-line-strong bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-secondary"
                        >
                          수정
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 md:hidden">
        <div className="mb-3 flex flex-wrap gap-2">
          {([
            ["id", "ID"],
            ["name", "이름"],
            ["normalized_name", "normalized_name"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => props.onSort(key)}
              className="rounded-lg border border-line-strong bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-secondary"
            >
              {sortLabel(label, key)}
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          {props.artists.map((artist) => {
            const isEditing = props.selectedArtistId === artist.id;
            return (
              <article
                key={artist.id}
                data-artist-id={artist.id}
                data-artist-view="mobile"
                className={[
                  "rounded-2xl border bg-surface p-4 shadow-sm",
                  isEditing ? "border-gray-500" : "border-line-strong",
                ].join(" ")}
              >
                {isEditing ? (
                  <ArtistEditFields
                    layout="mobile"
                    {...editProps}
                    artistId={artist.id}
                    imageUrl={artist.image_url}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{artist.name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-ink-secondary">
                        {artist.normalized_name}
                      </p>
                      <p className="mt-2 break-words text-sm text-ink-secondary">
                        {artist.aliases.join(", ") || "별칭 없음"}
                      </p>
                      <p className="mt-2 text-xs text-ink-muted">ID {artist.id}</p>
                      <div className="mt-3">
                        <ArtistProfileStatus
                          artistName={artist.name}
                          imageUrl={artist.image_url}
                          instagramUrl={artist.instagram_url}
                          featuredPlaylistUrl={artist.featured_playlist_url}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => props.onSelect(artist)}
                      className="shrink-0 rounded-lg border border-line-strong bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-secondary"
                    >
                      수정
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
