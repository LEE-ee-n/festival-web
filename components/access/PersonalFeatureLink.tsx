"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useServiceAccess } from "@/components/access/ServiceAccessProvider";

type PersonalFeatureLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
};

export default function PersonalFeatureLink({
  href,
  className,
  children,
}: PersonalFeatureLinkProps) {
  const access = useServiceAccess();

  if (access.isLoading) {
    return (
      <span aria-disabled="true" className={`${className} cursor-wait opacity-40`}>
        {children}
      </span>
    );
  }

  if (
    access.isAuthenticated &&
    !access.hasPersonalServiceAccess
  ) {
    return (
      <span
        aria-disabled="true"
        title="베타 이용권이 필요한 기능입니다."
        className={`${className} cursor-not-allowed opacity-40`}
      >
        {children}
      </span>
    );
  }

  return <Link href={href} className={className}>{children}</Link>;
}
