import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import "./globals.css";

const ADSENSE_CLIENT_ID = "ca-pub-1898105658764182";
const ADSENSE_SCRIPT_URL =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
import AnalyticsConsentManager from "../components/analytics/AnalyticsConsentManager";
import CommonHeader from "../components/CommonHeader";
import PublicFooter from "../components/PublicFooter";
import ServiceAccessProvider from "@/components/access/ServiceAccessProvider";
import MobileAppBridge from "@/components/mobile/MobileAppBridge";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  verification: {
    other: {
      "google-adsense-account": ADSENSE_CLIENT_ID,
      "naver-site-verification":
        "cc109fb5f84c3e21f46096519e0a97b136946271",
    },
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <Script
          id="google-adsense"
          async
          src={ADSENSE_SCRIPT_URL}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <MobileAppBridge />
        <AnalyticsConsentManager />
        <ServiceAccessProvider>
          <CommonHeader />
          {children}
          <PublicFooter />
        </ServiceAccessProvider>
      </body>
    </html>
  );
}
