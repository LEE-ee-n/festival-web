import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import CommonHeader from "../components/CommonHeader";
import PublicFooter from "../components/PublicFooter";
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
        <CommonHeader />
        {children}
        <PublicFooter />
      </body>
    </html>
  );
}
