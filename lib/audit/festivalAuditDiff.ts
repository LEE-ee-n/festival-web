import type { Json } from "@/lib/supabase/database";

export type AuditSnapshot = { [key: string]: Json | undefined };

export type AuditFieldChange = {
  field: string;
  label: string;
  before: Json | undefined;
  after: Json | undefined;
};

const fieldLabels: Record<string, string> = {
  name: "이름",
  normalized_name: "normalized_name",
  search_aliases: "검색 별칭",
  start_date: "시작일",
  end_date: "종료일",
  location: "행사장명",
  address: "상세 주소",
  region: "지역",
  category: "축제 분류",
  description: "설명",
  thumbnail_url: "썸네일",
  official_url: "공식 URL",
  price_type: "가격 유형",
  price_info: "가격 정보",
  program_info: "프로그램 정보",
  status: "진행 상태",
  verification_status: "공개 승인 상태",
  artist_name: "아티스트",
  artist_normalized_name: "아티스트 normalized_name",
  aliases: "아티스트 별칭",
  performance_date: "공연일",
  performance_time: "시작 시간",
  performance_end_time: "종료 시간",
  stage_name: "무대",
  round_type: "티켓 유형",
  round_name: "티켓명",
  open_at: "예매 오픈",
  ticket_url: "예매 URL",
  ticket_platform: "예매처",
  alias_name: "별칭",
  normalized_alias: "정규화 별칭",
};

export function getFestivalAuditDiff(
  before: AuditSnapshot | null,
  after: AuditSnapshot | null,
): AuditFieldChange[] {
  const fields = Object.keys(fieldLabels);

  return fields.flatMap((field) => {
    const beforeValue = before?.[field] ?? null;
    const afterValue = after?.[field] ?? null;

    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
      return [];
    }

    return [{
      field,
      label: fieldLabels[field],
      before: beforeValue,
      after: afterValue,
    }];
  });
}

export function formatAuditValue(value: Json | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "없음";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
