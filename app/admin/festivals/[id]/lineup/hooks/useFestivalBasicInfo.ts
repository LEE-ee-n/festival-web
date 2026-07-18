import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { deleteFestivalThumbnail } from "@/lib/festivals/deleteFestivalThumbnail";
import { updateFestivalBasicInfo } from "@/lib/festivals/updateFestivalBasicInfo";
import { uploadFestivalThumbnail } from "@/lib/festivals/uploadFestivalThumbnail";

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
  price_type: string | null;
  price_info: string | null;
  program_info: string | null;
  status: string | null;
  verification_status: string | null;
};

export function useFestivalBasicInfo(
  festivalId: string,
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
        festivalId,
        thumbnailFile,
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
      await deleteFestivalThumbnail(festivalId, thumbnailUrl);
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
      isUploadingThumbnail,
      officialUrl,
      setOfficialUrl,
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
