"use client";

import Link from "next/link";
import AuditHistoryTab from "../festivals/[id]/lineup/components/AuditHistoryTab";

export default function AdminAuditLogsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          관리자 페이지로 돌아가기
        </Link>
        <AuditHistoryTab scope="all" />
      </div>
    </main>
  );
}
