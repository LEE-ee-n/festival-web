import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { deleteFestivalThumbnail } from "@/lib/festivals/deleteFestivalThumbnail";
import { getFestivalThumbnailFileName } from "@/lib/festivals/festivalThumbnailSync";
import { updateFestivalBasicInfo } from "@/lib/festivals/updateFestivalBasicInfo";
import { uploadFestivalThumbnail } from "@/lib/festivals/uploadFestivalThumbnail";
import { supabase } from "@/lib/supabase/client";

type SetErrorMessage = Dispatch<SetStateAction<string | null>>;

export type FestivalBasicInfoRecord = {
  name: string;
  normalized_name: string;
  search_aliases: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  address: string | null;
  region: string | null;
  category: string | null;
  description: string | null;
  thumbnail_url: string | null;
  official_url: string | null;
  official_url_unavailable: boolean;
  instagram_url: string | null;
  instagram_url_unavailable: boolean;
  price_type: string | null;
  price_info: string | null;
  program_info: string | null;
  status: string | null;
  verification_status: string | null;
};

export function useFestivalBasicInfo(
  festivalId: number,
  setErrorMessage: SetErrorMessage,
) {
  const [festivalName, setFestivalName] = useState("");
  const [normalizedName, setNormalizedName] = useState("");
  const [searchAliases, setSearchAliases] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [officialUrlUnavailable, setOfficialUrlUnavailable] =
    useState(false);
  const [instagramUrlUnavailable, setInstagramUrlUnavailable] =
    useState(false);
  const [priceType, setPriceType] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [programInfo, setProgramInfo] = useState("");
  const [festivalStatus, setFestivalStatus] = useState("");
  const [verificationStatus, setVerificationStatus] =
    useState("pending");
  const [thumbnailFile, setThumbnailFile] =
    useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] =
    useState(false);
  const [isLoadingRuleThumbnail, setIsLoadingRuleThumbnail] =
    useState(false);
  const [thumbnailSourceUrl, setThumbnailSourceUrl] = useState("");
  const [thumbnailNote, setThumbnailNote] = useState("");

  const initializeBasicInfo = useCallback(
    (festival: FestivalBasicInfoRecord) => {
      setFestivalName(festival.name);
      setNormalizedName(festival.normalized_name);
      setSearchAliases(festival.search_aliases ?? "");
      setStartDate(festival.start_date ?? "");
      setEndDate(festival.end_date ?? "");
      setLocation(festival.location ?? "");
      setAddress(festival.address ?? "");
      setRegion(festival.region ?? "");
      setCategory(festival.category ?? "");
      setDescription(festival.description ?? "");
      setThumbnailUrl(festival.thumbnail_url ?? "");
      setOfficialUrl(festival.official_url ?? "");
      setInstagramUrl(festival.instagram_url ?? "");
      setOfficialUrlUnavailable(festival.official_url_unavailable);
      setInstagramUrlUnavailable(festival.instagram_url_unavailable);
      setPriceType(festival.price_type ?? "");
      setPriceInfo(festival.price_info ?? "");
      setProgramInfo(festival.program_info ?? "");
      setFestivalStatus(festival.status ?? "");
      setVerificationStatus(
        festival.verification_status ?? "pending",
      );
    },
    [],
  );

  async function uploadThumbnail() {
    if (!thumbnailFile) {
      setErrorMessage("업로드할 이미지를 선택하세요.");
      return;
    }

    try {
      setIsUploadingThumbnail(true);
      setErrorMessage(null);
      const publicUrl = await uploadFestivalThumbnail(
        {
          id: festivalId,
          normalized_name: normalizedName,
          start_date: startDate,
          end_date: endDate,
        },
        thumbnailFile,
        thumbnailUrl,
        { sourceUrl: thumbnailSourceUrl, note: thumbnailNote },
      );

      setThumbnailUrl(publicUrl);
      setThumbnailFile(null);
      window.alert(
        "썸네일이 업로드되었습니다. 기본정보 저장을 눌러 반영하세요.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "썸네일 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  }

  async function deleteThumbnail() {
    if (!thumbnailUrl) {
      return;
    }

    if (!window.confirm("등록된 썸네일을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setErrorMessage(null);
      await deleteFestivalThumbnail(festivalId, thumbnailUrl, {
        sourceUrl: thumbnailSourceUrl,
        note: thumbnailNote,
      });
      setThumbnailUrl("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      window.alert("썸네일이 삭제되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "썸네일 삭제에 실패했습니다.",
      );
    }
  }

  async function loadRuleThumbnail() {
    const expectedFileName = getFestivalThumbnailFileName({
      normalized_name: normalizedName,
      start_date: startDate,
      end_date: endDate,
    });

    if (!expectedFileName) {
      setErrorMessage(
        "normalized_name과 시작일·종료일을 먼저 확인하세요.",
      );
      return;
    }

    try {
      setIsLoadingRuleThumbnail(true);
      setErrorMessage(null);

      const { data: files, error: storageError } =
        await supabase.storage
          .from("festival-thumbnails")
          .list("", {
            limit: 100,
            search: expectedFileName,
          });

      if (storageError) {
        throw storageError;
      }

      const hasExactFile = (files ?? []).some(
        (file) => file.name === expectedFileName,
      );

      if (!hasExactFile) {
        throw new Error(
          `Storage에서 ${expectedFileName} 파일을 찾지 못했습니다.`,
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("festival-thumbnails")
        .getPublicUrl(expectedFileName);
      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.rpc(
        "change_festival_thumbnail_with_audit",
        {
          p_festival_id: festivalId,
          p_new_url: publicUrl,
          p_note: "대표 이미지 파일명 규칙으로 수동 연결",
        },
      );

      if (updateError) {
        throw updateError;
      }

      setThumbnailUrl(publicUrl);
      setThumbnailFile(null);
      setThumbnailPreview("");
      window.alert(`${expectedFileName} 이미지를 연결했습니다.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "규칙 이미지를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingRuleThumbnail(false);
    }
  }

  async function saveBasicInfo() {
    if (!festivalName.trim()) {
      setErrorMessage("축제명을 입력하세요.");
      return;
    }

    if (!window.confirm("축제 기본정보를 저장하시겠습니까?")) {
      return;
    }

    try {
      setIsSavingBasic(true);
      setErrorMessage(null);
      await updateFestivalBasicInfo(festivalId, {
        name: festivalName,
        normalizedName,
        searchAliases,
        startDate,
        endDate,
        location,
        address,
        region,
        category,
        description,
        thumbnailUrl,
        officialUrl,
        instagramUrl,
        officialUrlUnavailable,
        instagramUrlUnavailable,
        priceType,
        priceInfo,
        programInfo,
        status: festivalStatus,
        verificationStatus,
      });
      window.alert("축제 기본정보가 저장되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "기본정보 저장에 실패했습니다.",
      );
    } finally {
      setIsSavingBasic(false);
    }
  }

  return {
    festivalName,
    initializeBasicInfo,
    tabProps: {
      festivalId,
      festivalName,
      setFestivalName,
      normalizedName,
      setNormalizedName,
      searchAliases,
      setSearchAliases,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      location,
      setLocation,
      address,
      setAddress,
      region,
      setRegion,
      category,
      setCategory,
      description,
      setDescription,
      thumbnailUrl,
      setThumbnailUrl,
      thumbnailFile,
      setThumbnailFile,
      thumbnailPreview,
      setThumbnailPreview,
      uploadThumbnail,
      deleteThumbnail,
      loadRuleThumbnail,
      isUploadingThumbnail,
      isLoadingRuleThumbnail,
      thumbnailSourceUrl,
      setThumbnailSourceUrl,
      thumbnailNote,
      setThumbnailNote,
      officialUrl,
      setOfficialUrl,
      instagramUrl,
      setInstagramUrl,
      officialUrlUnavailable,
      setOfficialUrlUnavailable,
      instagramUrlUnavailable,
      setInstagramUrlUnavailable,
      canConfirmLinkUnavailable: true,
      priceType,
      setPriceType,
      festivalStatus,
      setFestivalStatus,
      verificationStatus,
      setVerificationStatus,
      priceInfo,
      setPriceInfo,
      programInfo,
      setProgramInfo,
      saveBasicInfo,
      isSavingBasic,
    },
  };
}
