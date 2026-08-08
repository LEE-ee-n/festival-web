"use client";

import Link from "next/link";

import { typography } from "@/lib/typography";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  getPageHref?: (page: number) => string;
  ariaLabel?: string;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  getPageHref,
  ariaLabel = "페이지 이동",
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const controlClassName = `${typography.metaStrong} px-2 py-2 text-ink-secondary`;

  function renderControl(label: string, targetPage: number, disabled: boolean) {
    if (disabled) {
      return (
        <span className={`${controlClassName} cursor-not-allowed text-ink-tertiary opacity-40`} aria-disabled="true">
          {label}
        </span>
      );
    }

    if (getPageHref) {
      return (
        <Link
          href={getPageHref(targetPage)}
          onClick={() => onPageChange?.(targetPage)}
          className={controlClassName}
        >
          {label}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onPageChange?.(targetPage)}
        className={controlClassName}
      >
        {label}
      </button>
    );
  }

  return (
    <nav
      className={`flex items-center justify-center gap-5 ${className}`}
      aria-label={ariaLabel}
    >
      {renderControl("이전", safePage - 1, safePage === 1)}
      <span className={`${typography.metaStrong} text-ink`} aria-current="page">
        {safePage} / {totalPages}
      </span>
      {renderControl("다음", safePage + 1, safePage === totalPages)}
    </nav>
  );
}
