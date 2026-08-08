"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { FestivalRecordOption } from "@/lib/diaries/festivalDiaries";
import { normalizePublicSearchText } from "@/lib/publicSearchLogic";
import { typography } from "@/lib/typography";

type FestivalRecordFestivalPickerProps = {
  options: FestivalRecordOption[];
  selectedId: number | null;
  disabled?: boolean;
  onSelect: (festivalId: number) => void;
};

export default function FestivalRecordFestivalPicker({ options, selectedId, disabled = false, onSelect }: FestivalRecordFestivalPickerProps) {
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const [keyword, setKeyword] = useState(selected?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedKeyword = normalizePublicSearchText(keyword);
  const normalizedSelectedName = normalizePublicSearchText(selected?.name ?? "");
  const results = useMemo(() => {
    if (!normalizedKeyword || normalizedKeyword === normalizedSelectedName) {
      return options;
    }
    return options.filter((option) =>
      normalizePublicSearchText(option.name).includes(normalizedKeyword),
    );
  }, [normalizedKeyword, normalizedSelectedName, options]);

  if (disabled) {
    return (
      <div>
        <p className={`${typography.metaStrong} text-ink-secondary`}>페스티벌</p>
        <div className="mt-2 rounded-xl border border-line-strong bg-surface-muted px-4 py-3 text-sm text-ink">{selected?.name ?? "페스티벌 정보 없음"}</div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <p className={`${typography.metaStrong} text-ink-secondary`}>페스티벌</p>
        <div className="relative mt-2 flex overflow-hidden rounded-xl border border-line-strong bg-surface focus-within:border-ink-muted">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={keyword}
            onFocus={(event) => {
              event.currentTarget.select();
              setIsOpen(true);
            }}
            onChange={(event) => {
              setKeyword(event.target.value);
              setIsOpen(true);
            }}
            placeholder="페스티벌 이름 검색"
            aria-label="페스티벌 검색"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="festival-record-options"
            className="min-w-0 flex-1 bg-transparent py-3 pl-10 pr-2 text-sm text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label="페스티벌 목록 열기"
            className="flex shrink-0 items-center px-3 text-ink-tertiary hover:text-ink"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="festival-record-options" role="listbox" className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-tertiary">검색 결과가 없습니다.</p>
          ) : results.map((option) => (
            <button key={option.id} type="button" role="option" aria-selected={option.id === selectedId} onClick={() => { onSelect(option.id); setKeyword(option.name); setIsOpen(false); }} className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 ${option.id === selectedId ? "bg-surface-muted" : "hover:bg-surface-subtle"}`}>
              <strong className="block text-sm text-ink">{option.name}</strong>
              <span className="mt-1 block text-xs text-ink-tertiary">{option.startDate === option.endDate ? option.startDate : `${option.startDate} ~ ${option.endDate}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
