type BasicInfoTabProps = {
  festivalName: string;
  setFestivalName: (value: string) => void;

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

  priceInfo: string;
  setPriceInfo: (value: string) => void;

  programInfo: string;
  setProgramInfo: (value: string) => void;

  saveBasicInfo: () => void;
  isSavingBasic: boolean;
};

export default function BasicInfoTab({
  festivalName,
  setFestivalName,
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
  priceInfo,
  setPriceInfo,
  programInfo,
  setProgramInfo,
  saveBasicInfo,
  isSavingBasic,
}: BasicInfoTabProps) {

  return (

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              기본정보 관리
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

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;

                  setThumbnailFile(file);

                  if (file) {
                    setThumbnailPreview(URL.createObjectURL(file));
                  } else {
                    setThumbnailPreview("");
                  }
                }}
                className="block text-sm text-slate-600"
              />

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
                {isSavingBasic ? "저장 중..." : "기본정보 저장"}
              </button>
            </div>
          </section>       

  );
}
