import type { Metadata } from "next";

import PublicInfoPage, {
  PublicInfoSection,
} from "@/components/public/PublicInfoPage";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Festibom",
  description: "페스티봄 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      title="페스티봄 개인정보처리방침"
      dateLabel="공고일·시행일: 2026년 7월 28일"
    >
      <section className="space-y-4">
        <p>
          페스티봄은 이용자의 개인정보를 중요하게 생각하며 「개인정보
          보호법」 등 관련 법령을 준수합니다.
        </p>
        <p>
          본 방침은 festibom.com에 적용됩니다. 현재 일반 이용자를 위한
          회원가입, 댓글, 개인 기록, 방문자 분석 및 광고 기능은 제공하지
          않습니다.
        </p>
      </section>

      <PublicInfoSection title="1. 개인정보의 처리 목적">
        <ul className="list-disc space-y-2 pl-6">
          <li>문의와 정보 수정 제보의 확인, 답변 및 처리 결과 안내</li>
          <li>공식 자료와 제보 내용의 비교 및 잘못된 정보 수정</li>
          <li>권리 침해 신고 처리와 필요한 분쟁 대응</li>
          <li>서비스 장애 확인, 보안 유지 및 부정 접근 방지</li>
        </ul>
      </PublicInfoSection>

      <PublicInfoSection title="2. 처리하는 개인정보 항목">
        <div>
          <h3 className={`${typography.readingSubheading} text-slate-950`}>이메일 문의·제보</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>필수: 발신 이메일 주소, 문의 또는 제보 내용</li>
            <li>
              선택: 이용자가 직접 포함한 이름, 닉네임, 이미지, 링크와
              첨부자료
            </li>
          </ul>
        </div>
        <div>
          <h3 className={`${typography.readingSubheading} text-slate-950`}>
            서비스 이용 과정에서 처리될 수 있는 정보
          </h3>
          <p className="mt-2">
            호스팅과 데이터 제공 과정에서 IP 주소, 접속 일시, 브라우저와
            기기 정보, 요청 페이지, 오류 및 보안 로그가 Vercel 또는
            Supabase에서 처리될 수 있습니다. 페스티봄은 별도의 방문자
            분석 도구나 광고 추적 도구를 사용하지 않습니다.
          </p>
        </div>
      </PublicInfoSection>

      <PublicInfoSection title="3. 개인정보의 처리 및 보유 기간">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            이메일 문의와 정보 수정 제보: 답변 또는 처리 완료일부터 최대
            1년
          </li>
          <li>
            페스티봄이 별도로 저장하지 않는 접속·오류 로그: 서비스
            제공자의 설정과 정책에 따른 기간
          </li>
          <li>
            관련 법령에 보존 의무가 있는 경우: 해당 법령에서 정한 기간
          </li>
        </ul>
        <p>
          처리 목적이 달성되거나 보유 기간이 종료되면 지체 없이
          파기합니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="4. 개인정보의 제3자 제공">
        <p>
          페스티봄은 이용자의 개인정보를 원칙적으로 제3자에게 제공하지
          않습니다. 이용자의 사전 동의가 있거나 법령에 따른 적법한 요청이
          있는 경우에만 예외로 합니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="5. 개인정보 처리의 위탁 및 외부 서비스">
        <div className="overflow-x-auto">
          <table className={`${typography.meta} w-full min-w-[560px] border-collapse text-left`}>
            <thead>
              <tr className="border-y border-slate-300 text-slate-950">
                <th className="px-3 py-3">수탁자</th>
                <th className="px-3 py-3">업무 내용</th>
                <th className="px-3 py-3">처리될 수 있는 정보</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-3 py-3">Vercel Inc.</td>
                <td className="px-3 py-3">웹사이트 호스팅·배포·보안</td>
                <td className="px-3 py-3">접속 및 오류 로그, IP·기기 정보</td>
              </tr>
              <tr>
                <td className="px-3 py-3">Supabase Pte. Ltd.</td>
                <td className="px-3 py-3">데이터베이스·API·인증·파일 저장</td>
                <td className="px-3 py-3">API 접속 로그와 운영자 인증정보</td>
              </tr>
              <tr>
                <td className="px-3 py-3">Google LLC</td>
                <td className="px-3 py-3">Gmail을 통한 문의·제보 수신</td>
                <td className="px-3 py-3">발신 이메일, 본문과 첨부자료</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PublicInfoSection>

      <PublicInfoSection title="6. 개인정보의 국외 처리">
        <p>
          Vercel, Supabase 및 Google은 해외 법인이 운영하는 서비스이며,
          서비스 이용 과정에서 정보가 암호화된 네트워크를 통해 해당
          사업자 또는 사업자가 사용하는 데이터센터로 전송·처리될 수
          있습니다.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Vercel Inc.: 미국 및 Vercel이 공개한 하위 처리 사업자 소재지
          </li>
          <li>
            Supabase Pte. Ltd.: 싱가포르 및 프로젝트에서 선택한 클라우드
            리전
          </li>
          <li>Google LLC: 미국을 포함한 Google의 서비스 운영 지역</li>
        </ul>
        <p>
          처리 항목과 목적은 제5조와 같으며, 보유 기간은 제3조 또는 각
          서비스 제공 계약과 정책에 따릅니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="7. 개인정보의 파기 절차 및 방법">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            보유 기간이 끝나거나 처리 목적이 달성된 정보는 파기 대상으로
            분류합니다.
          </li>
          <li>
            전자적 파일과 이메일은 복구하기 어려운 방법으로 삭제합니다.
          </li>
          <li>
            법령에 따라 보존할 정보는 다른 정보와 분리하여 보관한 뒤
            보존기간 종료 후 삭제합니다.
          </li>
        </ul>
      </PublicInfoSection>

      <PublicInfoSection title="8. 이용자의 권리와 행사 방법">
        <p>
          이용자는 자신의 개인정보에 대해 처리 여부 확인, 열람,
          정정·삭제 및 처리 정지를 요청할 수 있습니다. 요청은{" "}
          <a
            href="mailto:festibom.official@gmail.com"
            className="text-slate-950 underline underline-offset-4"
          >
            festibom.official@gmail.com
          </a>
          으로 접수할 수 있으며, 필요한 경우 최소한의 본인 확인 절차를
          요청할 수 있습니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="9. 쿠키 및 유사 기술">
        <p>
          현재 공개 서비스에서는 광고 또는 방문자 분석 목적의 쿠키를
          사용하지 않습니다. 운영자 전용 관리자 화면은 로그인 상태 유지를
          위해 Supabase 인증 저장소를 사용하며 일반 이용자에게는 적용되지
          않습니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="10. 개인정보의 안전성 확보 조치">
        <ul className="list-disc space-y-2 pl-6">
          <li>관리자 접근 권한 최소화와 인증정보 관리</li>
          <li>HTTPS를 이용한 전송 구간 암호화</li>
          <li>데이터베이스 접근 정책과 관리자 권한 분리</li>
          <li>서비스와 사용 라이브러리의 보안 업데이트</li>
        </ul>
      </PublicInfoSection>

      <PublicInfoSection title="11. 개인정보 보호책임자 및 문의처">
        <ul className="space-y-2">
          <li>책임자: 페스티봄 운영자</li>
          <li>웹사이트: https://festibom.com</li>
          <li>
            이메일:{" "}
            <a
              href="mailto:festibom.official@gmail.com"
              className="text-slate-950 underline underline-offset-4"
            >
              festibom.official@gmail.com
            </a>
          </li>
        </ul>
      </PublicInfoSection>

      <PublicInfoSection title="12. 권익침해 구제 방법">
        <p>
          개인정보 침해에 대한 상담이나 구제가 필요한 경우 다음 기관에
          문의할 수 있습니다.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            개인정보침해신고센터: 국번 없이 118, privacy.kisa.or.kr
          </li>
          <li>
            개인정보분쟁조정위원회: 1833-6972, www.kopico.go.kr
          </li>
          <li>경찰청 사이버범죄 신고시스템: 국번 없이 182</li>
        </ul>
      </PublicInfoSection>

      <PublicInfoSection title="13. 개인정보처리방침의 변경">
        <p>
          본 방침이 변경되는 경우 시행일과 주요 변경 내용을 공지사항을
          통해 안내합니다. 회원가입, 댓글, 개인 기록, 방문자 분석, 광고나
          결제 기능을 도입하는 경우 실제 처리 방식에 맞추어 방침을
          개정합니다.
        </p>
      </PublicInfoSection>

      <p className={`${typography.meta} border-t border-slate-200 pt-6 text-slate-500`}>
        공고일·시행일: 2026년 7월 28일
      </p>
    </PublicInfoPage>
  );
}
