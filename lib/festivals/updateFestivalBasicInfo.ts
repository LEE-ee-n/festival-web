import { supabase } from "@/lib/supabase/client";
import {
  isValidNormalizedName,
  normalizeNormalizedName,
} from "@/lib/normalizedName";
import { validateFestivalThumbnailUrl } from "@/lib/festivals/thumbnailValidation";

export type FestivalBasicInfoInput = {
  name: string;
  normalizedName: string;
  searchAliases: string;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  region: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  officialUrl: string;
  priceType: string;
  priceInfo: string;
  programInfo: string;
  status: string;
  verificationStatus: string;
};

export async function updateFestivalBasicInfo(
  festivalId: string,
  input: FestivalBasicInfoInput,
) {
  validateFestivalThumbnailUrl(input.thumbnailUrl);
  const normalizedName = normalizeNormalizedName(input.normalizedName);

  if (!isValidNormalizedName(normalizedName)) {
    throw new Error(
      "축제 normalized_name은 영문 소문자와 숫자로 입력해 주세요.",
    );
  }

  if (!input.name.trim() || !input.startDate || !input.endDate) {
    throw new Error(
      "축제명, normalized_name, 시작일, 종료일은 필수입니다.",
    );
  }

  if (input.endDate < input.startDate) {
    throw new Error("종료일은 시작일보다 빠를 수 없습니다.");
  }

  const { data, error } = await supabase
    .from("festivals")
    .update({
      name: input.name.trim(),
      normalized_name: normalizedName,
      search_aliases: input.searchAliases.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate,
      location: input.location.trim() || null,
      address: input.address.trim() || null,
      region: input.region.trim() || null,
      category: input.category.trim() || null,
      description: input.description.trim() || null,
      thumbnail_url: input.thumbnailUrl.trim() || null,
      official_url: input.officialUrl.trim() || null,
      price_type: input.priceType || null,
      price_info: input.priceInfo.trim() || null,
      program_info: input.programInfo.trim() || null,
      status: input.status || null,
      verification_status: input.verificationStatus || "pending",
    })
    .eq("id", festivalId)
    .select("id");

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "수정된 데이터가 없습니다. festivals 테이블의 UPDATE 권한을 확인하세요.",
    );
  }
}
