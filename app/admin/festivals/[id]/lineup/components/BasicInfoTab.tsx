import {
  FESTIVAL_THUMBNAIL_ACCEPT,
  validateFestivalThumbnailFile,
} from "@/lib/festivals/thumbnailValidation";
import {
  findYearLikeSequence,
  normalizeNormalizedName,
} from "@/lib/normalizedName";
import { useFestivalDuplicateCheck } from "@/lib/hooks/useFestivalDuplicateCheck";

type BasicInfoTabProps = {
  title?: string;
  saveButtonLabel?: string;
  canManageThumbnail?: boolean;
  festivalId?: string;

  festivalName: string;
  setFestivalName: (value: string) => void;

  normalizedName: string;
  setNormalizedName: (value: string) => void;

  searchAliases: string;
  setSearchAliases: (value: string) => void;

  startDate: string;
  setStartDate: (value: string) => void;

  endDate: string;
  setEndDate: (value: string) => void;

  location: string;
  setLocation: (value: string) => void;

  address: string;
  setAddress: (value: string) => void;

  region: string;
  setRegion: (value: string) => void;

  category: string;
  setCategory: (value: string) => void;

  description: string;
  setDescription: (value: string) => void;

  thumbnailUrl: string;
  setThumbnailUrl: (value: string) => void;

  thumbnailFile: File | null;
  setThumbnailFile: (file: File | null) => void;

  thumbnailPreview: string;
  setThumbnailPreview: (value: string) => void;

  uploadThumbnail: () => void;
  deleteThumbnail: () => void;
  isUploadingThumbnail: boolean;

  officialUrl: string;
  setOfficialUrl: (value: string) => void;

  priceType: string;
  setPriceType: (value: string) => void;

  festivalStatus: string;
  setFestivalStatus: (value: string) => void;

  verificationStatus: string;
  setVerificationStatus: (value: string) => void;

  priceInfo: string;
  setPriceInfo: (value: string) => void;

  programInfo: string;
  setProgramInfo: (value: string) => void;

  saveBasicInfo: () => void;
  isSavingBasic: boolean;
};

export default function BasicInfoTab({
  title = "기본정보 관리",
  saveButtonLabel = "기본정보 저장",
  canManageThumbnail = true,
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
}: BasicInfoTabProps) {
  const normalizedNameYear = findYearLikeSequence(normalizedName);
  const duplicateCheck = useFestivalDuplicateCheck({
    normalizedName,
    startDate,
    endDate,
    excludeFestivalId: festivalId,
  });

  return (

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                축제명
              </label>



              <input
                type="text"
                value={festivalName}
                onChange={(event) =>
                  setFestivalName(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    행사장명
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    상세 주소
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    지역
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    축제 분류
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    중복 판별값 (festivals.normalized_name)
                  </label>
                  <input
                    type="text"
                    value={normalizedName}
                    onChange={(event) =>
                      setNormalizedName(
                        normalizeNormalizedName(event.target.value),
                      )
                    }
                    placeholder="예: gratefulcamp"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                  {normalizedNameYear && (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      ⚠️ 연도로 보이는 {normalizedNameYear}이 포함되어 있습니다.
                      매년 열리는 축제라면 제거했는지 확인하세요.
                    </p>
                  )}
                  {duplicateCheck.status === "checking" && (
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      중복 확인 중...
                    </p>
                  )}
                  {duplicateCheck.status === "available" && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      ✅ 동일한 축제가 없습니다.
                    </p>
                  )}
                  {duplicateCheck.status === "duplicate" && (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      ⚠️ 같은 축제가 이미 있습니다: {duplicateCheck.festival.name}
                    </p>
                  )}
                  {duplicateCheck.status === "error" && (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      중복 확인에 실패했습니다. 저장 전 다시 확인하세요.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    검색 별칭
                  </label>
                  <input
                    type="text"
                    value={searchAliases}
                    onChange={(event) => setSearchAliases(event.target.value)}
                    placeholder="쉼표로 구분"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                축제 소개
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                대표 썸네일 URL
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            {canManageThumbnail ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept={FESTIVAL_THUMBNAIL_ACCEPT}
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (file) {
                      try {
                        await validateFestivalThumbnailFile(file);
                      } catch (error) {
                        setThumbnailFile(null);
                        setThumbnailPreview("");
                        event.target.value = "";
                        window.alert(
                          error instanceof Error
                            ? error.message
                            : "썸네일 파일을 확인할 수 없습니다.",
                        );
                        return;
                      }

                      setThumbnailFile(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                    } else {
                      setThumbnailFile(null);
                      setThumbnailPreview("");
                    }
                  }}
                  className="block text-sm text-slate-600"
                />

                <p className="w-full text-xs text-slate-500">
                  JPG, PNG, WebP · 최대 5MB
                </p>

                <button
                  type="button"
                  onClick={uploadThumbnail}
                  disabled={isUploadingThumbnail || !thumbnailFile}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isUploadingThumbnail
                    ? "업로드 중..."
                    : "썸네일 업로드"}
                </button>

                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={deleteThumbnail}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    썸네일 삭제
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                파일 업로드는 축제를 등록한 뒤 관리 페이지에서 할 수 있습니다.
              </p>
            )}
            
            {(thumbnailPreview || thumbnailUrl) && (
              <div className="mt-4 flex aspect-[4/5] w-full max-w-sm items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {/* Local blob previews are intentionally rendered without Next.js image optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailPreview || thumbnailUrl}
                  alt={`${festivalName} 대표 썸네일`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}


            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                공식 홈페이지
              </label>
              <input
                type="url"
                value={officialUrl}
                onChange={(event) => setOfficialUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  무료·유료 구분
                </label>
                <select
                  value={priceType}
                  onChange={(event) => setPriceType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">선택</option>
                  <option value="free">무료</option>
                  <option value="paid">유료</option>
                  <option value="partial_free">무료·유료 혼합</option>
                  <option value="unknown">미정</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  진행 상태
                </label>
                <select
                  value={festivalStatus}
                  onChange={(event) =>
                    setFestivalStatus(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">선택</option>
                  <option value="scheduled">예정</option>
                  <option value="ongoing">진행 중</option>
                  <option value="ended">종료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  공개 승인 상태
                </label>
                <select
                  value={verificationStatus}
                  onChange={(event) =>
                    setVerificationStatus(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="pending">비공개·검토 중</option>
                  <option value="approved">공개 승인</option>
                  <option value="rejected">공개 제외</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                기본 가격 안내
              </label>
              <textarea
                value={priceInfo}
                onChange={(event) => setPriceInfo(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                프로그램 정보
              </label>
              <textarea
                value={programInfo}
                onChange={(event) => setProgramInfo(event.target.value)}
                rows={5}
                placeholder="굿즈, 체험, 포토존, 불꽃놀이, 부대행사 등"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
              <button
                type="button"
                onClick={saveBasicInfo}
                disabled={isSavingBasic}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSavingBasic ? "저장 중..." : saveButtonLabel}
              </button>
            </div>
          </section>       

  );
}
