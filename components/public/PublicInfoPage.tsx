import Link from "next/link";
import type { ReactNode } from "react";

import { typography } from "@/lib/typography";

type PublicInfoPageProps = {
  title: string;
  dateLabel?: string;
  children: ReactNode;
};

export default function PublicInfoPage({
  title,
  dateLabel,
  children,
}: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6 sm:py-14">
      <article className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className={`${typography.meta} text-ink-tertiary hover:text-ink`}
        >
          ← 달력으로 돌아가기
        </Link>

        <header className="mt-5 border-b border-line pb-7">
          <h1 className={`${typography.pageTitle} text-ink`}>
            {title}
          </h1>
          {dateLabel && (
            <p className={`${typography.meta} mt-3 text-ink-tertiary`}>
              {dateLabel}
            </p>
          )}
        </header>

        <div className={`${typography.bodyReading} space-y-10 py-8 text-ink-secondary sm:py-10`}>
          {children}
        </div>
      </article>
    </main>
  );
}

type PublicInfoSectionProps = {
  title: string;
  children: ReactNode;
};

export function PublicInfoSection({
  title,
  children,
}: PublicInfoSectionProps) {
  return (
    <section>
      <h2 className={`${typography.articleSectionTitle} text-ink`}>
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
