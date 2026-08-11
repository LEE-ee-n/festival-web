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
      dateLabel="공고일·시행일: 2026년 8월 11일"
    >
      <section className="space-y-4">
        <p>
          페스티봄은 이용자의 개인정보를 중요하게 생각하며 「개인정보
          보호법」 등 관련 법령을 준수합니다.
        </p>
        <p>
          본 방침은 festibom.com의 공개 정보 조회, Google 로그인, 관심
          축제·아티스트, 개인 공연 일정과 페스티벌 기록 기능에 적용됩니다.
          서비스 개선을 위해 방문자 분석 도구를 사용합니다.
        </p>
      </section>

      <PublicInfoSection title="1. 개인정보의 처리 목적">
        <ul className="list-disc space-y-2 pl-6">
          <li>Google 계정 로그인, 회원 식별과 로그인 상태 유지</li>
          <li>관심 축제·아티스트, 개인 공연 일정과 페스티벌 기록 제공</li>
          <li>베타 이용 권한 부여와 회원별 서비스 접근 관리</li>
          <li>문의와 정보 수정 제보의 확인, 답변 및 처리 결과 안내</li>
          <li>공식 자료와 제보 내용의 비교 및 잘못된 정보 수정</li>
          <li>권리 침해 신고 처리와 필요한 분쟁 대응</li>
          <li>서비스 장애 확인, 보안 유지 및 부정 접근 방지</li>
        </ul>
      </PublicInfoSection>

      <PublicInfoSection title="2. 처리하는 개인정보 항목">
        <div>
          <h3 className={`${typography.readingSubheading} text-ink`}>
            Google 로그인과 회원 계정
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>
              필수: 이메일 주소, Supabase 회원 식별자, Google 로그인 제공자
              식별정보, 가입·최근 로그인 일시
            </li>
            <li>
              Google이 제공하는 경우: 이름 또는 표시 이름, 프로필 이미지
            </li>
          </ul>
          <p className="mt-2">
            일반 회원은 Google 로그인을 사용하며 페스티봄이 Google 계정
            비밀번호를 직접 수집하거나 저장하지 않습니다.
          </p>
        </div>
        <div>
          <h3 className={`${typography.readingSubheading} text-ink`}>
            개인 서비스 이용 정보
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>관심 축제·아티스트와 선택한 공연 일정</li>
            <li>
              페스티벌 관람일, 기록 제목·내용·요약, 공연별 평점·메모,
              곡명과 이용자가 등록한 외부 미디어 참조정보
            </li>
            <li>베타 이용권 상태와 부여·회수 일시</li>
          </ul>
        </div>
        <div>
          <h3 className={`${typography.readingSubheading} text-ink`}>이메일 문의·제보</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>필수: 발신 이메일 주소, 문의 또는 제보 내용</li>
            <li>
              선택: 이용자가 직접 포함한 이름, 닉네임, 이미지, 링크와
              첨부자료
            </li>
          </ul>
        </div>
        <div>
          <h3 className={`${typography.readingSubheading} text-ink`}>
            서비스 이용 과정에서 처리될 수 있는 정보
          </h3>
          <p className="mt-2">
            호스팅과 데이터 제공 과정에서 IP 주소, 접속 일시, 브라우저와
            기기 정보, 요청 페이지, 오류 및 보안 로그가 Vercel 또는
            Supabase에서 처리될 수 있습니다. 서비스 개선을 위해 Google
            Analytics와 Microsoft Clarity가 페이지 방문, 유입 경로, 브라우저·기기
            정보, 페이지 이동, 클릭 및 스크롤 정보를 처리할 수 있습니다.
          </p>
        </div>
      </PublicInfoSection>

      <PublicInfoSection title="3. 개인정보의 처리 및 보유 기간">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            회원 계정과 개인 서비스 이용 정보: 회원탈퇴 시까지. 탈퇴가
            완료되면 활성 서비스 데이터에서 지체 없이 삭제
          </li>
          <li>
            이메일 문의와 정보 수정 제보: 답변 또는 처리 완료일부터 최대
            1년
          </li>
          <li>
            페스티봄이 직접 저장하는 접속·오류·보안 로그: 필요한 경우에만
            최대 90일
          </li>
          <li>
            Google Analytics 사용자·이벤트 수준 데이터: 운영 설정에 따라
            최대 14개월
          </li>
          <li>
            Microsoft Clarity 재생 데이터: 최대 30일, 클릭·히트맵 및
            표시된 세션 데이터: 최대 9개월
          </li>
          <li>
            Vercel·Supabase의 접속·오류·인증 로그: 이용 중인 요금제와
            서비스 제공자의 설정·정책에 따른 기간
          </li>
          <li>
            수동 데이터베이스 백업: 최근 4주분. 정상 서비스에서 분리하여
            재해 복구 목적으로만 보관
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
              <tr className="border-y border-line-strong text-ink">
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
                <td className="px-3 py-3">
                  회원 계정·인증정보, 개인 서비스 이용 정보, API 접속 로그
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3">Google LLC</td>
                <td className="px-3 py-3">
                  Google 로그인, Gmail 문의·제보 수신, 방문자 분석
                </td>
                <td className="px-3 py-3">
                  로그인 제공자 정보, 발신 이메일, 본문·첨부자료,
                  방문·유입·기기 정보
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3">Microsoft Corporation</td>
                <td className="px-3 py-3">웹사이트 이용 행태 분석</td>
                <td className="px-3 py-3">페이지 이동, 클릭·스크롤, 브라우저·기기 정보</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PublicInfoSection>

      <PublicInfoSection title="6. 개인정보의 국외 처리">
        <p>
          Vercel, Supabase, Google 및 Microsoft는 해외 법인이 운영하는 서비스이며,
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
          <li>Microsoft Corporation: 미국을 포함한 Microsoft의 서비스 운영 지역</li>
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
            회원탈퇴 시 활성 세션과 회원 계정, 관심 정보, 일정, 페스티벌
            기록과 하위 메모·곡·미디어 참조정보, 이용권 정보를 삭제합니다.
            일반 회원은 마이페이지에서 Google 재인증 후 직접 탈퇴할 수
            있으며, 직접 처리가 어려운 경우 개인정보 보호책임자 이메일로
            요청할 수 있습니다.
          </li>
          <li>
            삭제된 정보가 수동 데이터베이스 백업에 남아 있는 경우 최대
            4주 안에 백업 교체 주기에 따라 삭제되며, 해당 백업은 재해 복구
            외 목적으로 사용하지 않습니다. 백업을 복원하면 이미 탈퇴한
            회원의 정보를 다시 삭제합니다.
          </li>
          <li>
            외부 미디어 참조를 삭제해도 이용자의 Google 계정 등 원본
            제공자에 저장된 파일은 삭제되지 않으며 이용자가 해당
            제공자에서 직접 관리해야 합니다.
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
            className="text-ink underline underline-offset-4"
          >
            festibom.official@gmail.com
          </a>
          으로 접수할 수 있으며, 필요한 경우 최소한의 본인 확인 절차를
          요청할 수 있습니다.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="9. 쿠키 및 유사 기술">
        <p>
          Google Analytics는 방문자 분석을 위해 쿠키 또는 유사 기술을 사용할
          수 있습니다. Microsoft Clarity는 사이트 이용 행태를 분석하기 위한
          기술을 사용할 수 있습니다. 로그인 이용자의 인증 상태 유지를 위해
          Supabase 인증 저장소가 사용됩니다. 페스티봄은 Supabase 회원
          식별자를 Google Analytics 또는 Microsoft Clarity의 사용자 ID로
          별도 전송하지 않습니다.
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
              className="text-ink underline underline-offset-4"
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
          통해 안내합니다. 댓글, 광고나 결제 기능을 도입하거나 수집 항목과
          외부 처리 방식이 바뀌는 경우 실제 처리 방식에 맞추어 방침을
          개정합니다.
        </p>
      </PublicInfoSection>

      <p className={`${typography.meta} border-t border-line pt-6 text-ink-tertiary`}>
        공고일·시행일: 2026년 8월 11일
      </p>
    </PublicInfoPage>
  );
}
