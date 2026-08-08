"use client";

import { Search } from "lucide-react";
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
  const [keyword, setKeyword] = useState("");
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const normalizedKeyword = normalizePublicSearchText(keyword);
  const results = useMemo(() => {
    if (!normalizedKeyword) return [];
    return options
      .filter((option) => normalizePublicSearchText(option.name).includes(normalizedKeyword))
      .slice(0, 8);
  }, [normalizedKeyword, options]);

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
      <label className={`${typography.metaStrong} block text-ink-secondary`}>
        페스티벌 검색
        <span className="relative mt-2 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="페스티벌 이름 검색" className="w-full rounded-xl border border-line-strong bg-surface py-3 pl-10 pr-4 text-sm text-ink outline-none focus:border-ink-muted" />
        </span>
      </label>

      {normalizedKeyword ? (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-tertiary">검색 결과가 없습니다.</p>
          ) : results.map((option) => (
            <button key={option.id} type="button" onClick={() => { onSelect(option.id); setKeyword(""); }} className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 ${option.id === selectedId ? "bg-surface-muted" : "hover:bg-surface-subtle"}`}>
              <strong className="block text-sm text-ink">{option.name}</strong>
              <span className="mt-1 block text-xs text-ink-tertiary">{option.startDate === option.endDate ? option.startDate : `${option.startDate} ~ ${option.endDate}`}</span>
            </button>
          ))}
        </div>
      ) : (
        <select value={selectedId ?? ""} onChange={(event) => onSelect(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-ink-muted">
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      )}

      {selected && <p className="mt-2 text-xs text-ink-tertiary">선택됨 · {selected.name}</p>}
    </div>
  );
}
