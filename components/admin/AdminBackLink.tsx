import Link from "next/link";

type AdminBackLinkProps = {
  href?: string;
  label?: string;
};

export default function AdminBackLink({
  href = "/admin",
  label = "← 관리자 페이지로 돌아가기",
}: AdminBackLinkProps) {
  return (
    <Link
      href={href}
      className="mb-6 inline-block text-sm font-medium text-ink-tertiary hover:text-ink"
    >
      {label}
    </Link>
  );
}
