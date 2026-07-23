type ArtistEditFieldsProps = {
  layout: "desktop" | "mobile";
  artistId: number;
  name: string;
  normalizedName: string;
  aliases: string;
  isSaving: boolean;
  isDeleting: boolean;
  onNameChange: (value: string) => void;
  onNormalizedNameChange: (value: string) => void;
  onAliasesChange: (value: string) => void;
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
        className="whitespace-nowrap rounded-lg border border-gray-400 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-900 disabled:opacity-50"
      >
        {isSaving ? "저장 중" : "저장"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isBusy}
        className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 disabled:opacity-50"
      >
        취소
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isBusy}
        className="whitespace-nowrap rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
      >
        {isDeleting ? "삭제 중" : "삭제"}
      </button>
    </div>
  );
}

export default function ArtistEditFields(props: ArtistEditFieldsProps) {
  const inputClassName =
    "w-full min-w-0 border-0 border-b border-gray-400 bg-transparent px-1 py-2 text-center text-sm outline-none focus:border-gray-900";

  if (props.layout === "desktop") {
    return (
      <>
        <td className="px-3 py-3 text-center text-gray-500">{props.artistId}</td>
        <td className="px-3 py-3">
          <input
            value={props.name}
            onChange={(event) => props.onNameChange(event.target.value)}
            aria-label={`아티스트 ${props.artistId} 표시 이름`}
            className={inputClassName}
          />
        </td>
        <td className="px-3 py-3">
          <input
            value={props.normalizedName}
            onChange={(event) => props.onNormalizedNameChange(event.target.value)}
            aria-label={`아티스트 ${props.artistId} normalized_name`}
            className={`${inputClassName} font-mono`}
          />
        </td>
        <td className="px-3 py-3">
          <input
            value={props.aliases}
            onChange={(event) => props.onAliasesChange(event.target.value)}
            aria-label={`아티스트 ${props.artistId} 별칭`}
            placeholder="쉼표로 구분"
            className={inputClassName}
          />
        </td>
        <td className="px-2 py-3">
          <ActionButtons {...props} />
        </td>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500">ID {props.artistId}</p>
      <label className="block text-xs font-semibold text-gray-600">
        표시 이름
        <input
          value={props.name}
          onChange={(event) => props.onNameChange(event.target.value)}
          className={`${inputClassName} mt-1 text-left`}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        normalized_name
        <input
          value={props.normalizedName}
          onChange={(event) => props.onNormalizedNameChange(event.target.value)}
          className={`${inputClassName} mt-1 text-left font-mono`}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        별칭
        <input
          value={props.aliases}
          onChange={(event) => props.onAliasesChange(event.target.value)}
          placeholder="쉼표로 구분"
          className={`${inputClassName} mt-1 text-left`}
        />
      </label>
      <div className="pt-1">
        <ActionButtons {...props} />
      </div>
    </div>
  );
}
