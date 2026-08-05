import ArtistProfileFields from "@/components/admin/ArtistProfileFields";

type ArtistEditFieldsProps = {
  layout: "desktop" | "mobile";
  artistId: number;
  name: string;
  normalizedName: string;
  aliases: string;
  imageUrl: string | null;
  imageFile: File | null;
  imagePreviewUrl: string;
  instagramUrl: string;
  featuredPlaylistUrl: string;
  isSaving: boolean;
  isDeleting: boolean;
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

function ActionButtons({
  isSaving,
  isDeleting,
  onSave,
  onCancel,
  onDelete,
}: Pick<
  ArtistEditFieldsProps,
  "isSaving" | "isDeleting" | "onSave" | "onCancel" | "onDelete"
>) {
  const isBusy = isSaving || isDeleting;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      <button
        type="button"
        onClick={onSave}
        disabled={isBusy}
        className="whitespace-nowrap rounded-lg border border-line-strong bg-surface-muted px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50"
      >
        {isSaving ? "저장 중" : "저장"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isBusy}
        className="whitespace-nowrap rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs font-semibold text-ink-secondary disabled:opacity-50"
      >
        취소
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isBusy}
        className="whitespace-nowrap rounded-lg border border-red-300 bg-surface px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
      >
        {isDeleting ? "삭제 중" : "삭제"}
      </button>
    </div>
  );
}

export default function ArtistEditFields(props: ArtistEditFieldsProps) {
  const inputClassName =
    "mt-1 w-full min-w-0 rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-ink";

  const content = (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink-tertiary">ID {props.artistId}</p>
          <h3 className="mt-1 font-bold text-ink">{props.name || "아티스트 수정"}</h3>
        </div>
        <ActionButtons {...props} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 md:grid-cols-3">
        <label className="block text-xs font-semibold text-ink-secondary">
          표시 이름
          <input
            value={props.name}
            onChange={(event) => props.onNameChange(event.target.value)}
            aria-label={`아티스트 ${props.artistId} 표시 이름`}
            className={inputClassName}
          />
        </label>
        <label className="block text-xs font-semibold text-ink-secondary">
          normalized_name
          <input
            value={props.normalizedName}
            onChange={(event) => props.onNormalizedNameChange(event.target.value)}
            aria-label={`아티스트 ${props.artistId} normalized_name`}
            className={`${inputClassName} font-mono`}
          />
        </label>
        <label className="block text-xs font-semibold text-ink-secondary">
          별칭
          <input
            value={props.aliases}
            onChange={(event) => props.onAliasesChange(event.target.value)}
            aria-label={`아티스트 ${props.artistId} 별칭`}
            placeholder="쉼표로 구분"
            className={inputClassName}
          />
        </label>
      </div>

      <ArtistProfileFields
        artistName={props.name}
        imageUrl={props.imageUrl}
        imageFile={props.imageFile}
        imagePreviewUrl={props.imagePreviewUrl}
        instagramUrl={props.instagramUrl}
        featuredPlaylistUrl={props.featuredPlaylistUrl}
        onInstagramUrlChange={props.onInstagramUrlChange}
        onFeaturedPlaylistUrlChange={props.onFeaturedPlaylistUrlChange}
        onImageFileChange={props.onImageFileChange}
      />
    </div>
  );

  if (props.layout === "desktop") {
    return (
      <td colSpan={6} className="p-4 sm:p-5">
        {content}
      </td>
    );
  }

  return content;
}
