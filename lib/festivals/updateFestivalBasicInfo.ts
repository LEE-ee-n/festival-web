import { supabase } from "@/lib/supabase/client";

type FestivalBasicInfoInput = {
  name: string;
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
};

export async function updateFestivalBasicInfo(
  festivalId: string,
  input: FestivalBasicInfoInput,
) {
  const { data, error } = await supabase
    .from("festivals")
    .update({
      name: input.name.trim(),
      start_date: input.startDate || null,
      end_date: input.endDate || null,
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