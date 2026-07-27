import type { Metadata } from "next";
import Link from "next/link";

import PublicInfoPage, {
  PublicInfoSection,
} from "@/components/public/PublicInfoPage";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "공지사항 | Festibom",
  description: "페스티봄 서비스의 새로운 소식과 운영 안내입니다.",
};

export default function NoticesPage() {
  return (
    <PublicInfoPage
      title="페스티봄 베타 서비스 오픈 안내"
      dateLabel="게시일: 2026년 7월 28일"
    >
      <section className="space-y-4">
        <p>안녕하세요.</p>
        <p>
          전국의 페스티벌 정보를 한곳에서 확인할 수 있는 페스티봄을
          시작합니다.
        </p>
      </section>

      <PublicInfoSection title="페스티봄을 만든 이유">
        <p>좋았던 기억은 힘든 시간을 견디게 해주는 힘이 되기도 합니다.</p>
        <p>
          하지만 좋은 기억은 바로 떠오르지 않습니다. 천천히 되짚어봐야
          생각나기도 하고, 시간이 흐르면서 잊히기도 합니다.
        </p>
        <p>
          페스티봄은 페스티벌에서 보낸 즐거운 시간을 꺼내 그 순간을
          떠올리며, 오랫동안 기억에 남기기 위해 만들었습니다.
        </p>
        <p>
          이름에는 페스티벌을 본다는 의미와 함께, 어려운 시간을 지나 다시
          꽃이 피는 계절인 봄의 의미를 담았습니다.
        </p>
        <p>
          페스티봄이 각자의 힘든 시간을 이겨낼 수 있는 신나고 즐거운
          순간을 기억하는 데 작은 도움이 되기를 바랍니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="제공하는 정보">
        <p>페스티봄에서는 다음 정보를 확인할 수 있습니다.</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>전국 페스티벌 일정과 개최 장소</li>
          <li>출연 아티스트 및 라인업</li>
          <li>무대별 타임테이블</li>
          <li>티켓 오픈 일정과 예매 정보</li>
          <li>아티스트가 출연했거나 출연할 예정인 페스티벌 정보</li>
        </ul>
        <p>
          유료·무료 여부와 관계없이 밴드가 출연하는 전국 음악 페스티벌을
          중심으로 정리합니다.
        </p>
        <p>
          지역축제도 밴드 공연이나 관련 라인업이 포함된 경우 검토하여
          등록할 예정입니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="베타 서비스 안내">
        <p>페스티봄은 현재 베타 서비스로 운영되고 있습니다.</p>
        <p>
          정보를 지속해서 추가하고 수정하고 있지만, 공식 발표 이후
          사이트에 반영되기까지 시간이 걸릴 수 있습니다. 일부 행사 정보가
          누락되거나 실제 내용과 다를 수도 있습니다.
        </p>
        <p>
          행사 일정, 장소, 라인업, 타임테이블 및 티켓 정보는 주최 측
          사정에 따라 변경될 수 있으므로, 방문하거나 예매하기 전 반드시
          공식 홈페이지, 공식 SNS 또는 예매처에서 최종 정보를 확인해
          주세요.
        </p>
        <p>
          잘못된 정보나 수정이 필요한 내용을 발견한 경우{" "}
          <Link
            href="/report"
            className={`${typography.readingEmphasis} text-slate-950 underline underline-offset-4`}
          >
            의견 및 정보 수정 제보
          </Link>
          를 통해 알려주시기 바랍니다.
        </p>
      </PublicInfoSection>

      <p>
        문의:{" "}
        <a
          href="mailto:festibom.official@gmail.com"
          className="text-slate-950 underline underline-offset-4"
        >
          festibom.official@gmail.com
        </a>
      </p>
    </PublicInfoPage>
  );
}
