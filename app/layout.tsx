import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import CommonHeader from "../components/CommonHeader";
import PublicFooter from "../components/PublicFooter";

export const metadata: Metadata = {
  title: "페스티벌 캘린더",
  description: "날짜별 전국 축제 정보를 확인하는 달력",
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
