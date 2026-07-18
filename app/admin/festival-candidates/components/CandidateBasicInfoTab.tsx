import type { FestivalDraftJson } from "@/lib/types";

type Props = {
  festival: FestivalDraftJson["festival"];
  onChange: (
    field: keyof FestivalDraftJson["festival"],
    value: string,
  ) => void;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm";

export default function CandidateBasicInfoTab({ festival, onChange }: Props) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900">기본정보 관리</h3>

      <div className="mt-5">
        <label className="text-sm font-semibold text-slate-700">축제명</label>
        <input
          value={festival.name}
          onChange={(event) => onChange("name", event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          시작일
          <input
            type="date"
            value={festival.start_date}
            onChange={(event) => onChange("start_date", event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          종료일
          <input
            type="date"
            value={festival.end_date}
            onChange={(event) => onChange("end_date", event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          행사장명
          <input
            value={festival.location ?? ""}
            onChange={(event) => onChange("location", event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          상세 주소
          <input
            value={festival.address ?? ""}
            onChange={(event) => onChange("address", event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          지역
          <input
            value={festival.region ?? ""}
            onChange={(event) => onChange("region", event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          축제 분류
          <select
            value={festival.category ?? ""}
            onChange={(event) => onChange("category", event.target.value)}
            className={inputClass}
          >
            <option value="">선택</option>
            <option value="music_festival">음악 축제</option>
            <option value="local_festival">지역 축제</option>
            <option value="food_festival">음식 축제</option>
            <option value="culture_festival">문화 축제</option>
            <option value="other">기타</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          검색용 이름
          <input
            value={festival.normalized_name ?? ""}
            onChange={(event) =>
              onChange("normalized_name", event.target.value)
            }
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          검색 별칭
          <input
            value={festival.search_aliases ?? ""}
            onChange={(event) => onChange("search_aliases", event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-slate-700">
        축제 소개
        <textarea
          rows={4}
          value={festival.description ?? ""}
          onChange={(event) => onChange("description", event.target.value)}
          className={inputClass}
        />
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          무료·유료 구분
          <select
            value={festival.price_type ?? "unknown"}
            onChange={(event) => onChange("price_type", event.target.value)}
            className={inputClass}
          >
            <option value="unknown">미정</option>
            <option value="free">무료</option>
            <option value="paid">유료</option>
            <option value="partial_free">무료·유료 혼합</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          진행 상태
          <select
            value={festival.status ?? "scheduled"}
            onChange={(event) => onChange("status", event.target.value)}
            className={inputClass}
          >
            <option value="scheduled">예정</option>
            <option value="ongoing">진행 중</option>
            <option value="ended">종료</option>
            <option value="cancelled">취소</option>
          </select>
        </label>
      </div>

      {[
        ["price_info", "기본 가격 안내"],
        ["program_info", "프로그램 정보"],
      ].map(([field, label]) => (
        <label
          key={field}
          className="mt-5 block text-sm font-semibold text-slate-700"
        >
          {label}
          <textarea
            rows={3}
            value={festival[field as "price_info" | "program_info"] ?? ""}
            onChange={(event) =>
              onChange(
                field as "price_info" | "program_info",
                event.target.value,
              )
            }
            className={inputClass}
          />
        </label>
      ))}

      {[
        ["source_url", "원본 출처 URL"],
        ["official_url", "공식 홈페이지"],
        ["thumbnail_url", "대표 썸네일 URL"],
      ].map(([field, label]) => (
        <label
          key={field}
          className="mt-5 block text-sm font-semibold text-slate-700"
        >
          {label}
          <input
            type="url"
            value={
              festival[
                field as "source_url" | "official_url" | "thumbnail_url"
              ] ?? ""
            }
            onChange={(event) =>
              onChange(
                field as "source_url" | "official_url" | "thumbnail_url",
                event.target.value,
              )
            }
            className={inputClass}
          />
        </label>
      ))}
    </section>
  );
}
