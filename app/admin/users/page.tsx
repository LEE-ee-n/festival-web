import Link from "next/link";

import UserAccessManagement from "@/components/admin/UserAccessManagement";
import { typography } from "@/lib/typography";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/admin" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>
        ← 관리자 페이지
      </Link>
      <div className="mt-6">
        <UserAccessManagement />
      </div>
    </main>
  );
}
