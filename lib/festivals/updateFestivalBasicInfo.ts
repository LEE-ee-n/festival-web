import { supabase } from "@/lib/supabase/client";
import {
  isValidNormalizedName,
  normalizeNormalizedName,
} from "@/lib/normalizedName";
import { validateFestivalThumbnailUrl } from "@/lib/festivals/thumbnailValidation";
import { toFestivalBasicInfoPayload } from "@/lib/festivals/festivalBasicInfoPayload";

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

  const { data, error } = await supabase.rpc(
    "update_festival_basic_info_with_audit",
    {
      p_festival_id: Number(festivalId),
      p_festival: toFestivalBasicInfoPayload(input, normalizedName),
    },
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "수정된 데이터가 없습니다. festivals 테이블의 UPDATE 권한을 확인하세요.",
    );
  }
}
