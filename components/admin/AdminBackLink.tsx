import Link from "next/link";

export default function AdminBackLink() {
  return (
    <Link
      href="/admin"
      className="mb-6 inline-block text-sm font-medium text-slate-500 hover:text-slate-900"
    >
      ← 관리자 페이지로 돌아가기
    </Link>
  );
}
