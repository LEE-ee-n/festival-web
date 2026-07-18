import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue-600">
          Admin
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          관리자 페이지
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/festivals"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-950">
            페스티벌 관리
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            전체 페스티벌 목록과 기본정보를 관리합니다.
          </p>
        </Link>

        <Link
          href="/admin/artists"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-950">
            아티스트 관리
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            아티스트 이름과 정보를 관리합니다.
          </p>
        </Link>

        <Link
          href="/admin/festivals/new"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-950">
            새 페스티벌 등록
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            새로운 페스티벌을 추가합니다.
          </p>
        </Link>

        <Link
          href="/admin/festival-candidates"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-950">
            수집 후보 검토
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            자동 수집된 초안을 검토하고 JSON으로 내보냅니다.
          </p>
        </Link>
      </div>
    </main>
  );
}
