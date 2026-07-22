import { supabase } from "@/lib/supabase/client";
import type { FestivalBasicInfoInput } from "@/lib/festivals/updateFestivalBasicInfo";
import { toFestivalBasicInfoPayload } from "@/lib/festivals/festivalBasicInfoPayload";
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

  const { data, error } = await supabase.rpc(
    "create_festival_with_audit",
    { p_festival: toFestivalBasicInfoPayload(input, normalizedName) },
  );

  if (error) {
    throw error;
  }

  return data as number;
}
