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
  timetable_status: string | null;
};

type FestivalBasicInfoDraft = {
  festivalName: string;
  normalizedName: string;
  searchAliases: string;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  region: string;
  category: string;
  description: string;
  officialUrl: string;
  instagramUrl: string;
  officialUrlUnavailable: boolean;
  instagramUrlUnavailable: boolean;
  priceType: string;
  priceInfo: string;
  programInfo: string;
  festivalStatus: string;
  verificationStatus: string;
};

type FestivalThumbnailDraft = {
  url: string;
  file: File | null;
  preview: string;
  sourceUrl: string;
  note: string;
};

const INITIAL_BASIC_INFO: FestivalBasicInfoDraft = {
  festivalName: "",
  normalizedName: "",
  searchAliases: "",
  startDate: "",
  endDate: "",
  location: "",
  address: "",
  region: "",
  category: "",
  description: "",
  officialUrl: "",
  instagramUrl: "",
  officialUrlUnavailable: false,
  instagramUrlUnavailable: false,
  priceType: "",
  priceInfo: "",
  programInfo: "",
  festivalStatus: "",
  verificationStatus: "pending",
};

const INITIAL_THUMBNAIL: FestivalThumbnailDraft = {
  url: "",
  file: null,
  preview: "",
  sourceUrl: "",
  note: "",
};

export function useFestivalBasicInfo(
  festivalId: number,
  setErrorMessage: SetErrorMessage,
) {
  const [basicInfo, setBasicInfo] =
    useState<FestivalBasicInfoDraft>(INITIAL_BASIC_INFO);
  const [thumbnail, setThumbnail] =
    useState<FestivalThumbnailDraft>(INITIAL_THUMBNAIL);
  const [timetableStatus, setTimetableStatus] = useState<
    "published" | "unpublished"
  >("published");
  const [isSavingTimetableStatus, setIsSavingTimetableStatus] =
    useState(false);
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] =
    useState(false);
  const [isLoadingRuleThumbnail, setIsLoadingRuleThumbnail] =
    useState(false);
  const {
    festivalName,
    normalizedName,
    searchAliases,
    startDate,
    endDate,
    location,
    address,
    region,
    category,
    description,
    officialUrl,
    instagramUrl,
    officialUrlUnavailable,
    instagramUrlUnavailable,
    priceType,
    priceInfo,
    programInfo,
    festivalStatus,
    verificationStatus,
  } = basicInfo;
  const {
    url: thumbnailUrl,
    file: thumbnailFile,
    preview: thumbnailPreview,
    sourceUrl: thumbnailSourceUrl,
    note: thumbnailNote,
  } = thumbnail;

  function setBasicInfoField<K extends keyof FestivalBasicInfoDraft>(
    field: K,
    value: FestivalBasicInfoDraft[K],
  ) {
    setBasicInfo((current) => ({ ...current, [field]: value }));
  }

  function setThumbnailField<K extends keyof FestivalThumbnailDraft>(
    field: K,
    value: FestivalThumbnailDraft[K],
  ) {
    setThumbnail((current) => ({ ...current, [field]: value }));
  }

  const initializeBasicInfo = useCallback(
    (festival: FestivalBasicInfoRecord) => {
      setBasicInfo({
        festivalName: festival.name,
        normalizedName: festival.normalized_name,
        searchAliases: festival.search_aliases ?? "",
        startDate: festival.start_date ?? "",
        endDate: festival.end_date ?? "",
        location: festival.location ?? "",
        address: festival.address ?? "",
        region: festival.region ?? "",
        category: festival.category ?? "",
        description: festival.description ?? "",
        officialUrl: festival.official_url ?? "",
        instagramUrl: festival.instagram_url ?? "",
        officialUrlUnavailable: festival.official_url_unavailable,
        instagramUrlUnavailable: festival.instagram_url_unavailable,
        priceType: festival.price_type ?? "",
        priceInfo: festival.price_info ?? "",
        programInfo: festival.program_info ?? "",
        festivalStatus: festival.status ?? "",
        verificationStatus: festival.verification_status ?? "pending",
      });
      setThumbnail((current) => ({
        ...current,
        url: festival.thumbnail_url ?? "",
      }));
      setTimetableStatus(
        festival.timetable_status === "unpublished"
          ? "unpublished"
          : "published",
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

      setThumbnail((current) => ({ ...current, url: publicUrl, file: null }));
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
      setThumbnail((current) => ({ ...current, url: "", file: null, preview: "" }));
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

      setThumbnail((current) => ({ ...current, url: publicUrl, file: null, preview: "" }));
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

  async function saveTimetableStatus(
    status: "published" | "unpublished",
  ) {
    if (status === timetableStatus) {
      return;
    }

    if (
      !window.confirm(
        status === "unpublished"
          ? "타임테이블을 미공개로 변경하시겠습니까?"
          : "타임테이블을 공개 상태로 변경하시겠습니까?",
      )
    ) {
      return;
    }

    try {
      setIsSavingTimetableStatus(true);
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
        timetableStatus: status,
      });
      setTimetableStatus(status);
      window.alert("타임테이블 공개 상태가 저장되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "타임테이블 상태 저장에 실패했습니다.",
      );
    } finally {
      setIsSavingTimetableStatus(false);
    }
  }

  return {
    festivalName,
    startDate,
    endDate,
    initializeBasicInfo,
    timetableStatus,
    saveTimetableStatus,
    isSavingTimetableStatus,
    tabProps: {
      festivalId,
      festivalName,
      setFestivalName: (value: string) => setBasicInfoField("festivalName", value),
      normalizedName,
      setNormalizedName: (value: string) => setBasicInfoField("normalizedName", value),
      searchAliases,
      setSearchAliases: (value: string) => setBasicInfoField("searchAliases", value),
      startDate,
      setStartDate: (value: string) => setBasicInfoField("startDate", value),
      endDate,
      setEndDate: (value: string) => setBasicInfoField("endDate", value),
      location,
      setLocation: (value: string) => setBasicInfoField("location", value),
      address,
      setAddress: (value: string) => setBasicInfoField("address", value),
      region,
      setRegion: (value: string) => setBasicInfoField("region", value),
      category,
      setCategory: (value: string) => setBasicInfoField("category", value),
      description,
      setDescription: (value: string) => setBasicInfoField("description", value),
      thumbnailUrl,
      setThumbnailUrl: (value: string) => setThumbnailField("url", value),
      thumbnailFile,
      setThumbnailFile: (file: File | null) => setThumbnailField("file", file),
      thumbnailPreview,
      setThumbnailPreview: (value: string) => setThumbnailField("preview", value),
      uploadThumbnail,
      deleteThumbnail,
      loadRuleThumbnail,
      isUploadingThumbnail,
      isLoadingRuleThumbnail,
      thumbnailSourceUrl,
      setThumbnailSourceUrl: (value: string) => setThumbnailField("sourceUrl", value),
      thumbnailNote,
      setThumbnailNote: (value: string) => setThumbnailField("note", value),
      officialUrl,
      setOfficialUrl: (value: string) => setBasicInfoField("officialUrl", value),
      instagramUrl,
      setInstagramUrl: (value: string) => setBasicInfoField("instagramUrl", value),
      officialUrlUnavailable,
      setOfficialUrlUnavailable: (value: boolean) => setBasicInfoField("officialUrlUnavailable", value),
      instagramUrlUnavailable,
      setInstagramUrlUnavailable: (value: boolean) => setBasicInfoField("instagramUrlUnavailable", value),
      canConfirmLinkUnavailable: true,
      priceType,
      setPriceType: (value: string) => setBasicInfoField("priceType", value),
      festivalStatus,
      setFestivalStatus: (value: string) => setBasicInfoField("festivalStatus", value),
      verificationStatus,
      setVerificationStatus: (value: string) => setBasicInfoField("verificationStatus", value),
      priceInfo,
      setPriceInfo: (value: string) => setBasicInfoField("priceInfo", value),
      programInfo,
      setProgramInfo: (value: string) => setBasicInfoField("programInfo", value),
      saveBasicInfo,
      isSavingBasic,
    },
  };
}
