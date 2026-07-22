import type { LineupRound, LineupWorkType } from "@/lib/audit/lineupWork";

type Props = {
  workType: LineupWorkType; setWorkType: (value: LineupWorkType) => void;
  lineupRound: LineupRound; setLineupRound: (value: LineupRound) => void;
  announcementDate: string; setAnnouncementDate: (value: string) => void;
  sourceUrl: string; setSourceUrl: (value: string) => void;
  reason: string; setReason: (value: string) => void;
};

export default function JsonLineupAuditFields(props: Props) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4">
      <h2 className="font-bold text-slate-950">라인업 변경 기록 정보</h2>
      <p className="mt-1 text-xs text-slate-500">선택한 라인업 변경은 같은 JSON 작업 하나로 기록됩니다.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-700">기록 종류
          <select value={props.workType} onChange={(e) => props.setWorkType(e.target.value as LineupWorkType)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm">
            <option value="announcement">발표</option><option value="correction">정정</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">라인업 차수
          <select value={props.lineupRound} onChange={(e) => props.setLineupRound(e.target.value as LineupRound)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm">
            <option value="unspecified">차수 미지정</option><option value="first">1차</option>
            <option value="second">2차</option><option value="third">3차</option><option value="final">최종</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">공식 발표일 {props.workType === "announcement" ? "(필수)" : "(선택)"}
          <input type="date" value={props.announcementDate} onChange={(e) => props.setAnnouncementDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-700">출처 URL {props.workType === "announcement" ? "(필수)" : ""}
          <input type="url" value={props.sourceUrl} onChange={(e) => props.setSourceUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
        </label>
      </div>
      {props.workType === "correction" && (
        <label className="mt-3 block text-xs font-semibold text-slate-700">정정 사유 (출처가 없으면 필수)
          <input value={props.reason} onChange={(e) => props.setReason(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
        </label>
      )}
    </div>
  );
}
