import type { Metadata } from "next";

import PublicInfoPage, {
  PublicInfoSection,
} from "@/components/public/PublicInfoPage";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "이용약관 | Festibom",
  description: "페스티봄 서비스 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      title="페스티봄 이용약관"
      dateLabel="시행일: 2026년 7월 28일"
    >
      <PublicInfoSection title="제1조 목적">
        <p>
          본 약관은 페스티봄이 festibom.com에서 제공하는 페스티벌 정보
          서비스의 이용 조건과 이용자 및 페스티봄의 권리·의무와 책임
          사항을 정하는 것을 목적으로 합니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="제2조 용어의 정의">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            “서비스”란 페스티봄이 제공하는 페스티벌 일정, 장소, 라인업,
            타임테이블, 티켓 정보와 아티스트별 출연 정보를 말합니다.
          </li>
          <li>
            “이용자”란 회원가입 여부와 관계없이 서비스를 이용하는 사람을
            말합니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제3조 약관의 게시와 변경">
        <ol className="list-decimal space-y-2 pl-6">
          <li>페스티봄은 이용자가 확인할 수 있도록 본 약관을 게시합니다.</li>
          <li>
            관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며,
            적용일과 주요 변경 내용을 공지사항을 통해 안내합니다.
          </li>
          <li>
            변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단할 수
            있습니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제4조 서비스의 내용">
        <ul className="list-disc space-y-2 pl-6">
          <li>전국 페스티벌 일정과 개최 장소 정보</li>
          <li>출연 아티스트 및 라인업 정보</li>
          <li>공연 날짜, 무대 및 타임테이블 정보</li>
          <li>티켓 오픈 일정, 판매처 및 예매 관련 정보</li>
          <li>아티스트가 출연했거나 출연할 예정인 페스티벌 정보</li>
        </ul>
        <p>
          서비스의 구체적인 내용과 제공 방식은 운영 상황에 따라 추가,
          변경 또는 중단될 수 있습니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="제5조 페스티벌 정보의 제공과 확인">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            공식 홈페이지, 공식 SNS, 티켓 판매처 및 기타 공개 자료를
            바탕으로 정보를 수집하고 정리합니다.
          </li>
          <li>
            정보의 정확성을 높이기 위해 노력하지만 완전성, 실시간성 및
            정확성을 보장하지는 않습니다.
          </li>
          <li>
            일정, 장소, 라인업, 타임테이블, 티켓 정보는 주최사나 판매처의
            사정에 따라 변경될 수 있습니다.
          </li>
          <li>
            이용자는 방문이나 예매 전에 공식 채널에서 최종 정보를
            확인해야 합니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제6조 외부 사이트와 링크">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            서비스에는 공식 홈페이지, SNS, 티켓 판매처 등 외부 사이트
            링크가 포함될 수 있습니다.
          </li>
          <li>
            외부 사이트의 콘텐츠, 거래, 보안 및 개인정보 처리에는 해당
            사이트의 약관과 정책이 적용됩니다.
          </li>
          <li>
            페스티봄은 고의 또는 중대한 과실이 없는 한 외부 사이트에서
            발생한 문제에 책임을 지지 않습니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제7조 금지행위">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            페스티봄의 사전 허락 없이 자동화 수단으로 데이터를 대량
            수집하는 행위. 다만 robots.txt를 준수하는 일반 검색엔진과
            페스티봄이 허용한 수집은 제외합니다.
          </li>
          <li>
            서비스의 데이터나 콘텐츠를 대량 복제, 재게시, 판매 또는
            상업적으로 재배포하는 행위
          </li>
          <li>서버나 네트워크에 과도한 부하를 발생시키는 행위</li>
          <li>
            보안 기능, 접근 제한 또는 기술적 보호조치를 우회하는 행위
          </li>
          <li>타인을 사칭하거나 관련 법령과 공공질서를 위반하는 행위</li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제8조 데이터와 콘텐츠에 관한 권리">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            페스티봄이 직접 제작한 문구, 디자인, 프로그램 및 데이터의
            선정·배열·분류 방식에 관한 권리는 페스티봄 또는 정당한
            권리자에게 있습니다.
          </li>
          <li>
            행사명, 일정과 같은 사실 자체에 대해 페스티봄이 독점적인
            권리를 주장하지 않습니다.
          </li>
          <li>
            사진, 영상, 로고, 음원과 외부 자료의 권리는 각 주최사,
            아티스트, 제작자 또는 해당 권리자에게 있습니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제9조 정보 제보와 수정">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            이용자는 일정, 장소, 라인업, 타임테이블과 티켓 정보에 대해
            수정 제보를 제출할 수 있습니다.
          </li>
          <li>
            제보는 공식 홈페이지, 공식 SNS와 티켓 판매처 등 확인 가능한
            자료를 기준으로 검토합니다.
          </li>
          <li>
            출처가 불분명한 제보는 반영되지 않을 수 있으며, 검토와
            반영에는 시간이 걸릴 수 있습니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제10조 서비스의 변경과 중단">
        <p>
          페스티봄은 서비스 개선, 유지보수, 장애 대응이나 운영상 필요한
          경우 서비스의 일부 또는 전부를 변경하거나 중단할 수 있습니다.
          예정된 중대한 변경은 가능한 범위에서 사전에 공지합니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="제11조 책임의 제한">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            무료로 제공되는 정보의 완전성, 정확성, 최신성 또는 특정
            목적에 대한 적합성을 보장하지 않습니다.
          </li>
          <li>
            공식 정보를 최종 확인하지 않아 발생한 불이익에 대해 고의 또는
            중대한 과실이 없는 한 책임을 지지 않습니다.
          </li>
          <li>
            행사 취소, 일정·라인업 변경, 티켓 품절, 예매 실패와 외부
            사이트 이용 문제는 해당 주최사 또는 외부 서비스의 정책에
            따릅니다.
          </li>
          <li>
            본 조는 관련 법령상 제한하거나 배제할 수 없는 책임까지
            면제하는 것으로 해석되지 않습니다.
          </li>
        </ol>
      </PublicInfoSection>

      <PublicInfoSection title="제12조 개인정보 보호">
        <p>
          페스티봄은 서비스 과정에서 처리하는 개인정보를 관련 법령과
          개인정보처리방침에 따라 처리합니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="제13조 분쟁 해결과 준거법">
        <p>
          본 약관에는 대한민국 법령을 적용합니다. 서비스와 관련한 분쟁은
          원만한 해결을 위해 협의하며, 해결되지 않는 경우 관련 법령에서
          정한 절차와 관할 법원에 따릅니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="제14조 문의">
        <p>
          서비스 이용, 권리 침해, 데이터 이용 허가 및 약관 관련 문의는{" "}
          <a
            href="mailto:festibom.official@gmail.com"
            className="text-ink underline underline-offset-4"
          >
            festibom.official@gmail.com
          </a>
          으로 접수할 수 있습니다.
        </p>
      </PublicInfoSection>

      <p className={`${typography.meta} border-t border-line pt-6 text-ink-tertiary`}>
        본 약관은 2026년 7월 28일부터 시행합니다.
      </p>
    </PublicInfoPage>
  );
}
