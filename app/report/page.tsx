import type { Metadata } from "next";

import PublicInfoPage, {
  PublicInfoSection,
} from "@/components/public/PublicInfoPage";
import { typography } from "@/lib/typography";

const CONTACT_EMAIL = "festibom.official@gmail.com";
const MAIL_SUBJECT = "[Festibom] 의견 및 정보 수정 제보";
const MAIL_BODY = `아래 내용을 작성해 주세요.

1. 페스티벌 또는 아티스트명:
2. 수정이 필요한 페이지 주소:
3. 현재 내용:
4. 수정할 내용:
5. 확인 가능한 공식 출처 URL:

개인정보나 민감한 정보는 필요한 경우를 제외하고 포함하지 말아 주세요.`;
const MAIL_URL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

export const metadata: Metadata = {
  title: "의견 및 정보 수정 제보 | Festibom",
  description: "페스티봄에 의견을 보내거나 잘못된 정보를 제보합니다.",
};

export default function ReportPage() {
  return (
    <PublicInfoPage title="의견 및 정보 수정 제보">
      <section className="space-y-4">
        <p>
          잘못된 페스티벌 정보나 서비스에 관한 의견을 이메일로 보내주세요.
          공식 자료와 비교하여 확인한 뒤 반영합니다.
        </p>
        <a
          href={MAIL_URL}
          className={`${typography.readingButton} inline-flex rounded-xl bg-surface-dark px-5 py-3 text-white hover:bg-surface-dark`}
        >
          이메일로 제보하기
        </a>
        <p className={`${typography.meta} text-ink-tertiary`}>
          메일 프로그램이 열리지 않으면 {CONTACT_EMAIL}으로 직접 보내주세요.
        </p>
      </section>

      <PublicInfoSection title="함께 보내면 좋은 내용">
        <ol className="list-decimal space-y-2 pl-6">
          <li>페스티벌 또는 아티스트명</li>
          <li>수정이 필요한 Festibom 페이지 주소</li>
          <li>현재 표시된 내용과 수정할 내용</li>
          <li>확인 가능한 공식 홈페이지, 공식 SNS 또는 예매처 URL</li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제보 처리 안내">
        <ul className="list-disc space-y-2 pl-6">
          <li>공식적으로 확인할 수 있는 자료를 기준으로 검토합니다.</li>
          <li>출처가 불분명한 내용은 반영되지 않을 수 있습니다.</li>
          <li>제보 접수와 실제 반영 사이에는 시간이 걸릴 수 있습니다.</li>
          <li>
            이메일과 제보 내용은 처리 완료일부터 최대 1년간 보관될 수
            있습니다.
          </li>
        </ul>
      </PublicInfoSection>
    </PublicInfoPage>
  );
}
