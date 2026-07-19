import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-600">
          Admin
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          관리자 페이지
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/festival-candidates"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-950">
            신규 등록 작업함
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            직접 작성과 수집자료 검토를 거쳐 새 페스티벌을 등록합니다.
          </p>
        </Link>

        <Link
          href="/admin/festivals"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-950">
            페스티벌 관리
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            등록된 페스티벌의 기본정보·라인업·티켓을 관리합니다.
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
            아티스트 검색·신규등록과 전체 정보를 관리합니다.
          </p>
        </Link>
      </div>
    </main>
  );
}
