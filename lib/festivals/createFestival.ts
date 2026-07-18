import { supabase } from "@/lib/supabase/client";
import type { FestivalBasicInfoInput } from "@/lib/festivals/updateFestivalBasicInfo";
import { validateFestivalThumbnailUrl } from "@/lib/festivals/thumbnailValidation";
import {
  isValidNormalizedName,
  normalizeNormalizedName,
} from "@/lib/normalizedName";

export async function createFestival(
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
    .insert({
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
      status: input.status || "scheduled",
      verification_status:
        input.verificationStatus || "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as number;
}
