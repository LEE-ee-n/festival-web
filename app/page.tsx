import type { Metadata } from "next";
import { Suspense } from "react";

import Calendar from "@/components/Calendar";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    type: "website",
    url: "/",
  },
};

export default function HomePage() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Festibom",
    url: SITE_URL,
    inLanguage: "ko-KR",
    description: HOME_DESCRIPTION,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(websiteJsonLd),
        }}
      />

      <main className="bg-surface px-3 pt-0 pb-6 sm:px-6 sm:pt-1 sm:pb-10">
        <Suspense
          fallback={
            <div className="mx-auto min-h-[640px] w-full max-w-[1500px] animate-pulse bg-surface-subtle" />
          }
        >
          <Calendar />
        </Suspense>
      </main>
    </>
  );
}
