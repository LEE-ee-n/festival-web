"use client";

import AdminBackLink from "@/components/admin/AdminBackLink";
import AuditHistoryTab from "../festivals/[id]/lineup/components/AuditHistoryTab";

export default function AdminAuditLogsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />
        <AuditHistoryTab scope="all" />
      </div>
    </main>
  );
}
