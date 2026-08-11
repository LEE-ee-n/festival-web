import {
  getFestivalUpdateDisplayStatus,
  type FestivalUpdateItem,
  type FestivalUpdateSection,
} from "@/lib/festivals/festivalUpdatePreview";
import MobileTableLabel from "@/components/admin/MobileTableLabel";

type Props = {
  items: FestivalUpdateItem[];
  selectedIds: Set<string>;
  onToggle: (item: FestivalUpdateItem) => void;
  onSetAll: (items: FestivalUpdateItem[], selected: boolean) => void;
  sameCount: number;
  variant: "information" | "lineup";
};

const STATUS_LABEL = {
  add: "➕ 신규 추가",
  change: "✏️ 변경",
  remove: "❌ 삭제 후보",
  same: "✅ 동일",
} as const;

const SECTION_LABEL: Record<FestivalUpdateSection, string> = {
  basic: "기본정보",
  lineup: "라인업",
  ticket: "티켓",
};

function ComparisonValue({ value }: { value: string }) {
  const text = value || "없음";
  if (text.length <= 120) {
    return <p className="break-words text-sm leading-6 text-ink-secondary">{text}</p>;
  }

  return (
    <details>
      <summary className="cursor-pointer break-words text-sm leading-6 text-ink-secondary">
        {text.slice(0, 110)}…
      </summary>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-secondary">
        {text}
      </p>
    </details>
  );
}

function DecisionButton({
  item,
  selected,
  onToggle,
}: {
  item: FestivalUpdateItem;
  selected: boolean;
  onToggle: (item: FestivalUpdateItem) => void;
}) {
  const status = getFestivalUpdateDisplayStatus(item);
  const label = selected
    ? status === "add"
      ? "추가 선택됨"
      : status === "remove"
        ? "삭제 선택됨"
        : "새 값 반영"
    : status === "add"
      ? "추가하지 않음"
      : status === "remove"
        ? "삭제하지 않음"
        : "현재값 유지";

  return (
    <button
      type="button"
      onClick={() => onToggle(item)}
      className={[
        "whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold",
        selected
          ? "bg-surface-dark text-white"
          : "border border-line-strong bg-surface text-ink-secondary",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function FestivalUpdateComparisonTable({
  items,
  selectedIds,
  onToggle,
  onSetAll,
  sameCount,
  variant,
}: Props) {
  const selectedCount = items.filter((item) => selectedIds.has(item.id)).length;
  const maintainedCount = items.length - selectedCount;

  if (items.length === 0) {
    return (
      <p className="mt-5 border-y border-line py-5 text-sm text-ink-tertiary">
        추가하거나 변경할 항목이 없습니다.
        {sameCount > 0 ? ` 동일 ${sameCount}건은 숨겼습니다.` : ""}
      </p>
    );
  }

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-secondary">
          변경 {items.length}건 · 반영 선택 {selectedCount}건 · 현재 유지{" "}
          {maintainedCount}건
          {sameCount > 0 ? ` · 동일 ${sameCount}건 숨김` : ""}
        </p>
        {variant === "lineup" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSetAll(items, true)}
              className="rounded-lg bg-surface-dark px-3 py-2 text-xs font-bold text-white"
            >
              표시된 변경 전체 반영
            </button>
            <button
              type="button"
              onClick={() => onSetAll(items, false)}
              className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs font-bold text-ink-secondary"
            >
              전체 현재값 유지
            </button>
          </div>
        )}
      </div>

      <div className="border-y border-line-strong">
        <table className="block w-full border-collapse lg:table lg:table-fixed">
          <colgroup className="hidden lg:table-column-group">
            <col className="w-[130px]" />
            <col className="w-[180px]" />
            <col />
            <col />
            <col className="w-[125px]" />
          </colgroup>
          <thead className="hidden lg:table-header-group">
            <tr className="bg-surface-subtle text-left text-xs font-bold text-ink-secondary">
              <th className="border-b border-line-strong px-3 py-3">상태</th>
              <th className="border-b border-line-strong px-3 py-3">
                {variant === "lineup" ? "아티스트" : "항목"}
              </th>
              <th className="border-b border-line-strong px-3 py-3">
                {variant === "lineup" ? "새 일정" : "새 값"}
              </th>
              <th className="border-b border-line-strong px-3 py-3">
                {variant === "lineup" ? "현재 일정" : "현재 값"}
              </th>
              <th className="border-b border-line-strong px-3 py-3 text-center">
                선택
              </th>
            </tr>
          </thead>
          <tbody className="block lg:table-row-group">
            {items.map((item) => {
              const status = getFestivalUpdateDisplayStatus(item);
              const selected = selectedIds.has(item.id);
              return (
                <tr
                  key={item.id}
                  className="block border-b border-line px-3 py-4 align-top last:border-b-0 lg:table-row lg:border-0 lg:px-0 lg:py-0"
                >
                  <td className="block pb-2 text-sm font-semibold text-ink-secondary lg:table-cell lg:border-b lg:border-line lg:px-3 lg:py-3">
                    {STATUS_LABEL[status]}
                  </td>
                  <td className="block pb-3 lg:table-cell lg:border-b lg:border-line lg:px-3 lg:py-3">
                    <p className="break-words text-sm font-bold text-ink">
                      {item.label}
                    </p>
                    {variant === "information" && (
                      <p className="mt-1 text-xs text-ink-muted">
                        {SECTION_LABEL[item.section]}
                      </p>
                    )}
                  </td>
                  <td className="block pb-3 lg:table-cell lg:border-b lg:border-line lg:px-3 lg:py-3">
                    <MobileTableLabel tone="muted">
                      {variant === "lineup" ? "새 일정" : "새 값"}
                    </MobileTableLabel>
                    <ComparisonValue value={item.incoming} />
                  </td>
                  <td className="block pb-3 lg:table-cell lg:border-b lg:border-line lg:px-3 lg:py-3">
                    <MobileTableLabel tone="muted">
                      {variant === "lineup" ? "현재 일정" : "현재 값"}
                    </MobileTableLabel>
                    <ComparisonValue value={item.current} />
                  </td>
                  <td className="block lg:table-cell lg:border-b lg:border-line lg:px-3 lg:py-3 lg:text-center">
                    <MobileTableLabel tone="muted">선택</MobileTableLabel>
                    <DecisionButton
                      item={item}
                      selected={selected}
                      onToggle={onToggle}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
