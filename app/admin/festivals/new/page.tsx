"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import BasicInfoTab from "@/app/admin/festivals/[id]/lineup/components/BasicInfoTab";
import AdminNotice from "@/components/admin/AdminNotice";
import { createFestival } from "@/lib/festivals/createFestival";

export default function NewFestivalPage() {
  const router = useRouter();
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
  const [thumbnailFile, setThumbnailFile] =
    useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [priceType, setPriceType] = useState("");
  const [festivalStatus, setFestivalStatus] =
    useState("scheduled");
  const [verificationStatus, setVerificationStatus] =
    useState("pending");
  const [priceInfo, setPriceInfo] = useState("");
  const [programInfo, setProgramInfo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  async function saveFestival() {
    if (!festivalName.trim()) {
      setErrorMessage("축제명을 입력하세요.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("시작일과 종료일을 입력하세요.");
      return;
    }

    if (endDate < startDate) {
      setErrorMessage("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const festivalId = await createFestival({
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
        priceType,
        priceInfo,
        programInfo,
        status: festivalStatus,
        verificationStatus,
      });

      router.replace(`/admin/festivals/${festivalId}/lineup`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "축제 등록에 실패했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface-subtle px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/festivals"
          className="text-sm font-semibold text-ink-tertiary hover:text-ink"
        >
          ← 페스티벌 목록으로
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-ink-secondary">관리자</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            새 페스티벌 등록
          </h1>
          <p className="mt-2 text-sm text-ink-tertiary">
            기본정보를 등록한 뒤 썸네일, 라인업, 티켓을 추가할 수 있습니다.
          </p>
        </div>

        <AdminNotice message={errorMessage} className="mt-6" />

        <BasicInfoTab
          title="축제 기본정보"
          saveButtonLabel="축제 등록"
          canManageThumbnail={false}
          festivalName={festivalName}
          setFestivalName={setFestivalName}
          normalizedName={normalizedName}
          setNormalizedName={setNormalizedName}
          searchAliases={searchAliases}
          setSearchAliases={setSearchAliases}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          location={location}
          setLocation={setLocation}
          address={address}
          setAddress={setAddress}
          region={region}
          setRegion={setRegion}
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          thumbnailUrl={thumbnailUrl}
          setThumbnailUrl={setThumbnailUrl}
          thumbnailFile={thumbnailFile}
          setThumbnailFile={setThumbnailFile}
          thumbnailPreview={thumbnailPreview}
          setThumbnailPreview={setThumbnailPreview}
          uploadThumbnail={() => undefined}
          deleteThumbnail={() => undefined}
          isUploadingThumbnail={false}
          officialUrl={officialUrl}
          setOfficialUrl={setOfficialUrl}
          instagramUrl={instagramUrl}
          setInstagramUrl={setInstagramUrl}
          priceType={priceType}
          setPriceType={setPriceType}
          festivalStatus={festivalStatus}
          setFestivalStatus={setFestivalStatus}
          verificationStatus={verificationStatus}
          setVerificationStatus={setVerificationStatus}
          priceInfo={priceInfo}
          setPriceInfo={setPriceInfo}
          programInfo={programInfo}
          setProgramInfo={setProgramInfo}
          saveBasicInfo={saveFestival}
          isSavingBasic={isSaving}
        />
      </div>
    </main>
  );
}
