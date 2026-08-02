import type { FestivalBasicInfoInput } from "@/lib/festivals/updateFestivalBasicInfo";
import { normalizeInstagramProfileUrl } from "../../operations/discord-instagram-bot/src/instagramProfile.js";

export function toFestivalBasicInfoPayload(
  input: FestivalBasicInfoInput,
  normalizedName: string,
) {
  return {
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
    instagram_url: normalizeInstagramProfileUrl(input.instagramUrl) || null,
    official_url_unavailable:
      !input.officialUrl.trim() && Boolean(input.officialUrlUnavailable),
    instagram_url_unavailable:
      !input.instagramUrl.trim() && Boolean(input.instagramUrlUnavailable),
    price_type: input.priceType || null,
    price_info: input.priceInfo.trim() || null,
    program_info: input.programInfo.trim() || null,
    status: input.status || "scheduled",
    verification_status: input.verificationStatus || "pending",
  };
}
